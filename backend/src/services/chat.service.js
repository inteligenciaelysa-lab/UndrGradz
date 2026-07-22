const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { generateUserChatToken, upsertChatUser } = require('../integrations/stream');

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

  async getMessages(userId, matchId, limit = 50) {
    // 1. Verify user belongs to this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new AppError('Not authorized to view this conversation', 403);
    }

    // Mark partner's messages as read
    const partnerId = match.userOneId === userId ? match.userTwoId : match.userOneId;
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: partnerId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // 2. Query messages
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      take: limit,
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

  async getOrCreateConversation(userId, partnerId) {
    if (userId === partnerId) {
      throw new AppError('Cannot create conversation with yourself', 400);
    }

    // Verify friendship status or match status (to ensure authorization)
    const isFriend = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId }
        ]
      }
    });

    const isMatched = await prisma.match.findFirst({
      where: {
        OR: [
          { userOneId: userId, userTwoId: partnerId },
          { userOneId: partnerId, userTwoId: userId }
        ]
      }
    });

    if (!isFriend && !isMatched) {
      throw new AppError('You are not authorized to start a conversation with this user', 403);
    }

    // Find or create Match (ensure userOneId < userTwoId for @@unique constraint consistency)
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
}

module.exports = new ChatService();
