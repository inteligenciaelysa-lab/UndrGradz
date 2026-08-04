const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { verifyAccessToken } = require('./utils/jwt');
const prisma = require('./database/prisma');
const { validateAudioFile } = require('./utils/audioValidator');
const { pubClient, subClient, isRedisEnabled } = require('./config/redis');
const { corsOriginCallback } = require('./config/cors');

let ioInstance;

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: corsOriginCallback,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  if (isRedisEnabled) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('🔗 Socket.io using Redis adapter (multi-instance ready)');
  } else {
    console.log('⚠️ REDIS_URL not set — Socket.io using in-memory adapter (single-instance only)');
  }

  ioInstance = io;

  // Socket.io JWT authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded; // Attach user payload { userId, email } to socket
      next();
    } catch (err) {
      console.error('🔑 Socket Auth Error:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    socket.data.userId = userId; // Exposed on RemoteSocket objects via fetchSockets(), incl. across instances with the Redis adapter
    socket.join(`user_${userId}`);
    socket.join(userId);
    console.log(`🔌 Socket connected: User ${userId} (Socket ID: ${socket.id})`);

    // Join a specific match chat room
    socket.on('joinRoom', ({ matchId }) => {
      socket.join(`room_${matchId}`);
      console.log(`👥 User ${userId} joined room_${matchId}`);
    });

    // Leave a specific match chat room
    socket.on('leaveRoom', ({ matchId }) => {
      socket.leave(`room_${matchId}`);
      console.log(`👥 User ${userId} left room_${matchId}`);
    });

    // Listen for incoming message sends
    socket.on('sendMessage', async ({ matchId, content, type = 'TEXT', mediaUrl, duration }) => {
      try {
        const msgType = (type || 'TEXT').toUpperCase();

        if (msgType === 'TEXT' && (!content || content.trim() === '')) return;

        // Verify if user is part of the match
        const match = await prisma.match.findUnique({
          where: { id: matchId },
        });

        if (!match || (match.userOneId !== userId && match.userTwoId !== userId)) {
          return socket.emit('error', { message: 'Unauthorized match room' });
        }

        // Strict Backend Audio & Binary Duration Validation
        let durSecs = null;
        if (msgType === 'AUDIO') {
          const audioVal = await validateAudioFile(mediaUrl, duration);
          if (!audioVal.valid) {
            console.warn(`[AUDIO SECURITY] Audio validation rejected for user ${userId}: ${audioVal.reason}`);
            return socket.emit('error', { message: audioVal.reason || 'El archivo de audio no es válido o excede 60 segundos.' });
          }
          durSecs = audioVal.duration;
        }

        // Find recipient ID
        const receiverId = match.userOneId === userId ? match.userTwoId : match.userOneId;

        // Is the receiver currently viewing this match's chat room? Checked via the
        // adapter's fetchSockets(), which works across instances (not just locally).
        const socketsInRoom = await io.in(`room_${matchId}`).fetchSockets();
        const isRead = socketsInRoom.some((s) => s.data.userId === receiverId);

        // Save message to Postgres database
        const message = await prisma.message.create({
          data: {
            matchId,
            senderId: userId,
            content: content || (msgType === 'AUDIO' ? '🎤 Mensaje de voz' : ''),
            type: msgType || 'TEXT',
            mediaUrl: mediaUrl || null,
            duration: msgType === 'AUDIO' ? durSecs : null,
            isRead,
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Broadcast message to everyone in the room (including sender)
        io.to(`room_${matchId}`).emit('messageReceived', message);
        console.log(`✉️ Message sent in room_${matchId} by ${userId}`);

        // If the receiver is online but not in the room, send the message to their socket directly so they get real-time badge updates
        if (!isRead) {
          io.to(`user_${receiverId}`).emit('messageReceived', message);
        }

        // If receiver is offline (no active socket on any instance), send a Push Notification!
        const receiverSockets = await io.in(`user_${receiverId}`).fetchSockets();
        const isOnline = receiverSockets.length > 0;
        if (!isOnline) {
          const { sendPushToUser } = require('./integrations/firebase');
          await sendPushToUser(receiverId, {
            title: `Mensaje nuevo de ${message.sender.firstName} ✉️`,
            body: content.length > 50 ? `${content.substring(0, 50)}...` : content,
            data: { matchId, type: 'CHAT_MESSAGE' },
          });
        }
      } catch (error) {
        console.error('❌ Failed to save/send message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Listen for typing events
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(`room_${matchId}`).emit('typingStatus', {
        matchId,
        userId,
        isTyping,
      });
    });

    // Listen for live location updates
    socket.on('updateLocation', async ({ latitude, longitude }) => {
      try {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          return socket.emit('error', { message: 'Invalid coordinates' });
        }

        // Verify if user is in ghost mode before broadcasting
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true }
        });

        const isGhost = user?.profile?.isGhostMode || false;

        // 1. Update location in database
        const userService = require('./services/user.service');
        await userService.updateLocation(userId, latitude, longitude);

        // 2. If in ghost mode, do NOT broadcast location to friends!
        if (isGhost) return;

        // 3. Fetch friends to notify them
        const friendService = require('./services/friend.service');
        const friendsList = await friendService.getFriends(userId);

        // 4. Notify friends (a no-op for friends who have no active socket, on this or any other instance)
        friendsList.forEach(f => {
          io.to(`user_${f.friend.id}`).emit('friendLocationUpdated', {
            friendId: userId,
            latitude,
            longitude,
            lastActive: new Date()
          });
        });

        console.log(`📍 Live location update from ${userId}: ${latitude}, ${longitude}`);
      } catch (error) {
        console.error('❌ Failed to update live location via socket:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: User ${userId}`);
    });
  });

  return io;
};

/**
 * Emits an arbitrary event to every tab/device a user has open, without
 * disconnecting them (unlike forceLogoutUser). Returns true if the user was
 * actually online (on this or any other instance) and the event was delivered,
 * false otherwise, so callers can decide whether a fallback (e.g. an unread
 * Notification row) is needed.
 */
const forceNotify = async (userId, event, payload) => {
  if (!ioInstance) return false;
  try {
    const room = `user_${userId}`;
    const sockets = await ioInstance.in(room).fetchSockets();
    if (sockets.length === 0) return false;
    ioInstance.to(room).emit(event, payload);
    return true;
  } catch (error) {
    console.error(`❌ Failed to notify user via socket (${event}):`, error);
    return false;
  }
};

const notifyGhostModeChanged = async (userId, isGhostMode) => {
  if (!ioInstance) return;
  try {
    const friendService = require('./services/friend.service');
    const friendsList = await friendService.getFriends(userId);

    let profileData = null;
    if (!isGhostMode) {
      const userService = require('./services/user.service');
      profileData = await userService.getProfile(userId);
    }

    friendsList.forEach(f => {
      const friendRoom = `user_${f.friend.id}`;
      if (isGhostMode) {
        ioInstance.to(friendRoom).emit('friendLocationRemoved', { friendId: userId });
      } else if (profileData?.profile?.latitude !== null && profileData?.profile?.longitude !== null) {
        ioInstance.to(friendRoom).emit('friendLocationUpdated', {
          friendId: userId,
          latitude: profileData.profile.latitude,
          longitude: profileData.profile.longitude,
          lastActive: profileData.profile.lastActive
        });
      }
    });
  } catch (error) {
    console.error('❌ Failed to broadcast ghost mode change:', error);
  }
};

const notifyMatchCreated = (userAId, userBId, payloadA, payloadB) => {
  if (!ioInstance) return;
  try {
    // Target User A room (covers all active sockets/tabs for User A)
    ioInstance.to(`user_${userAId}`).emit('newMatch', payloadA);
    console.log(`⚡ Broadcasted live newMatch event to User A (${userAId})`);

    // Target User B room (covers all active sockets/tabs for User B)
    ioInstance.to(`user_${userBId}`).emit('newMatch', payloadB);
    console.log(`⚡ Broadcasted live newMatch event to User B (${userBId})`);

    // Global multi-cast fallback for all active sockets
    ioInstance.emit('newMatch_broadcast', { userAId, userBId, payloadA, payloadB });
  } catch (error) {
    console.error('❌ Failed to emit live match event:', error);
  }
};

/**
 * Immediately expels a user who has just been suspended/banned by an admin:
 * pushes a 'forceLogout' event to every tab/device they have open, then
 * disconnects those sockets. Uses the adapter's room-aware emit/disconnectSockets
 * so it also reaches sockets connected to other instances, not just this one.
 */
const forceLogoutUser = (userId, payload) => {
  if (!ioInstance) return;
  try {
    const room = `user_${userId}`;
    ioInstance.to(room).emit('forceLogout', payload);
    ioInstance.in(room).disconnectSockets(true);
  } catch (error) {
    console.error('❌ Failed to force logout user:', error);
  }
};

const notifyUniversityCatalogUpdated = (uniData) => {
  if (!ioInstance) return;
  try {
    ioInstance.emit('universityCatalogUpdated', uniData);
    console.log(`⚡ Broadcasted live universityCatalogUpdated event`);
  } catch (error) {
    console.error('❌ Failed to emit live universityCatalogUpdated event:', error);
  }
};

const getIO = () => ioInstance;

module.exports = { setupSocket, getIO, notifyGhostModeChanged, notifyMatchCreated, notifyUniversityCatalogUpdated, forceLogoutUser, forceNotify };
