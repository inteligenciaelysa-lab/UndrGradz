const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { generateUserChatToken, upsertChatUser } = require('../integrations/stream');
const { generateChatAudioSignedUrl } = require('../integrations/gcs');

class ChatService {
  async getChatToken(userId) {
    // 1. Get user profile details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        photos: { orderBy: { order: 'asc' }, take: 1 },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 2. Synchronize user profile into Stream Chat
    const fullName = `${user.firstName} ${user.lastName}`;
    const mainPhotoUrl = user.photos[0]?.url || '';
    await upsertChatUser(userId, fullName, mainPhotoUrl);

    // 3. Generate Stream JWT token
    const token = generateUserChatToken(userId);

    return {
      streamToken: token,
      streamAppKey: process.env.STREAM_APP_KEY || 'mock-stream-app-key',
    };
  }

  async getConversations(userId) {
    // Fetch matches associated with this user
    const matches = await prisma.match.findMany({
      where: {
        isActive: true,
        OR: [
          { userOneId: userId },
          { userTwoId: userId },
        ],
      },
      include: {
        userOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
        userTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Map matches to return only the partner user details
    return Promise.all(matches.map(async (m) => {
      const isUserOne = m.userOneId === userId;
      const partner = isUserOne ? m.userTwo : m.userOne;
      const lastMessage = m.messages[0] || null;

      // Count unread messages sent by the partner
      const unreadCount = await prisma.message.count({
        where: {
          matchId: m.id,
          senderId: partner.id,
          isRead: false,
        },
      });

      return {
        matchId: m.id,
        streamChannelId: m.streamChannelId,
        partner,
        lastMessage,
        unreadCount,
        matchedAt: m.createdAt,
      };
    }));
  }

  async resolveMatch(userId, matchIdOrHandle) {
    if (!matchIdOrHandle) {
      throw new AppError('Match ID, user ID or handle is required', 400);
    }

    // 1. Direct Match ID lookup
    let match = await prisma.match.findUnique({
      where: { id: matchIdOrHandle },
    });

    if (match) {
      if (match.userOneId !== userId && match.userTwoId !== userId) {
        throw new AppError('Not authorized to access this conversation', 403);
      }
      return match;
    }

    // 2. Partner lookup by handle or user ID
    const cleanHandle = matchIdOrHandle.replace(/^@/, '');
    const partnerUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: matchIdOrHandle },
          { handle: cleanHandle },
          { handle: '@' + cleanHandle }
        ]
      }
    });

    if (partnerUser) {
      const partnerId = partnerUser.id;
      if (partnerId === userId) {
        throw new AppError('Cannot converse with yourself', 400);
      }

      const userOneId = userId < partnerId ? userId : partnerId;
      const userTwoId = userId < partnerId ? partnerId : userId;

      let matchByUsers = await prisma.match.findUnique({
        where: { userOneId_userTwoId: { userOneId, userTwoId } }
      });

      if (!matchByUsers) {
        matchByUsers = await prisma.match.create({
          data: { userOneId, userTwoId, isActive: true }
        });
      }

      return matchByUsers;
    }

    throw new AppError('Match not found', 404);
  }

  async getMessages(userId, matchIdInput) {
    const match = await this.resolveMatch(userId, matchIdInput);
    const realMatchId = match.id;

    // Mark partner's messages as read
    const partnerId = match.userOneId === userId ? match.userTwoId : match.userOneId;
    await prisma.message.updateMany({
      where: {
        matchId: realMatchId,
        senderId: partnerId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Query ALL messages associated with the match ordered chronologically
    const messages = await prisma.message.findMany({
      where: { matchId: realMatchId },
      orderBy: { createdAt: 'asc' },
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

    return messages;
  }

  async createMessage(userId, matchIdInput, content, type = 'TEXT', mediaUrl = null, duration = null) {
    const match = await this.resolveMatch(userId, matchIdInput);
    const realMatchId = match.id;
    const receiverId = match.userOneId === userId ? match.userTwoId : match.userOneId;

    const durSecs = duration ? parseInt(duration, 10) : null;
    const msgType = (type || 'TEXT').toUpperCase();

    const message = await prisma.message.create({
      data: {
        matchId: realMatchId,
        senderId: userId,
        content: content || (msgType === 'AUDIO' ? '🎤 Mensaje de voz' : ''),
        type: msgType,
        mediaUrl: mediaUrl || null,
        duration: msgType === 'AUDIO' ? durSecs : null,
        isRead: false,
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

    return { message, receiverId };
  }

  async getOrCreateConversation(userId, partnerInput) {
    const partnerUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: partnerInput },
          { handle: partnerInput ? partnerInput.replace(/^@/, '') : '' },
          { handle: partnerInput ? '@' + partnerInput.replace(/^@/, '') : '' }
        ]
      }
    });

    const partnerId = partnerUser ? partnerUser.id : partnerInput;
    if (userId === partnerId) {
      throw new AppError('Cannot create conversation with yourself', 400);
    }

    const userOneId = userId < partnerId ? userId : partnerId;
    const userTwoId = userId < partnerId ? partnerId : userId;

    let match = await prisma.match.findUnique({
      where: {
        userOneId_userTwoId: { userOneId, userTwoId }
      },
      include: {
        userOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        },
        userTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handle: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    if (!match) {
      match = await prisma.match.create({
        data: {
          userOneId,
          userTwoId,
          isActive: true
        },
        include: {
          userOne: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              handle: true,
              profile: true,
              photos: { orderBy: { order: 'asc' }, take: 1 }
            }
          },
          userTwo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              handle: true,
              profile: true,
              photos: { orderBy: { order: 'asc' }, take: 1 }
            }
          }
        }
      });
    }

    const partner = match.userOneId === userId ? match.userTwo : match.userOne;

    return {
      matchId: match.id,
      partner
    };
  }

  async getAudioUploadUrl(userId, matchId, contentType = 'audio/webm', req = null) {
    // 1. Verify match exists and user belongs to match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Match conversation not found', 404);
    }

    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new AppError('Not authorized to send audio in this conversation', 403);
    }

    // 2. Validate MIME type
    if (!contentType || typeof contentType !== 'string' || !contentType.toLowerCase().startsWith('audio/')) {
      throw new AppError('Invalid audio MIME type', 400);
    }

    // 3. Generate signed upload URL
    return await generateChatAudioSignedUrl(userId, matchId, contentType, req);
  }
}

module.exports = new ChatService();
