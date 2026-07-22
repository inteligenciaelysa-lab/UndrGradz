const prisma = require('../database/prisma');
const AppError = require('../errors/appError');

class FriendService {
  async sendRequest(senderId, receiverId) {
    if (senderId === receiverId) {
      throw new AppError('You cannot send a friend request to yourself', 400);
    }

    // Check if target user exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      throw new AppError('User not found', 404);
    }

    // Check if friendship already exists (in any direction)
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        throw new AppError('You are already friends with this user', 400);
      }
      if (existingFriendship.status === 'PENDING') {
        throw new AppError('A friend request between you and this user is already pending', 400);
      }
      
      // If it was declined/cancelled, we can update it back to pending and swap sender if needed
      await prisma.friendship.update({
        where: { id: existingFriendship.id },
        data: {
          senderId,
          receiverId,
          status: 'PENDING'
        }
      });
      return { status: 'PENDING', message: 'Friend request sent successfully' };
    }

    // Create new friend request
    await prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING'
      }
    });

    return { status: 'PENDING', message: 'Friend request sent successfully' };
  }

  async respondToRequest(userId, requestSenderId, accept) {
    // Find request where userId is the receiver and requestSenderId is the sender
    const request = await prisma.friendship.findUnique({
      where: {
        senderId_receiverId: {
          senderId: requestSenderId,
          receiverId: userId
        }
      }
    });

    if (!request || request.status !== 'PENDING') {
      throw new AppError('No pending friend request found from this user', 404);
    }

    if (accept) {
      await prisma.friendship.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' }
      });

      // Ensure a Match record exists between these two users so they can chat!
      const userOneId = request.senderId < userId ? request.senderId : userId;
      const userTwoId = request.senderId < userId ? userId : request.senderId;
      
      const existingMatch = await prisma.match.findUnique({
        where: {
          userOneId_userTwoId: { userOneId, userTwoId }
        }
      });
      
      if (!existingMatch) {
        await prisma.match.create({
          data: {
            userOneId,
            userTwoId,
            isActive: true
          }
        });
      }

      // Get the receiver details to personalize the push body
      const receiverUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true }
      });

      // Notify the original sender
      const { sendPushToUser } = require('../integrations/firebase');
      await sendPushToUser(requestSenderId, {
        title: '¡Solicitud de amistad aceptada! 🤝',
        body: `${receiverUser.firstName} aceptó tu solicitud. ¡Salúdalo!`,
        data: { type: 'FRIEND_ACCEPTED', friendId: userId }
      });

      return { status: 'ACCEPTED', message: 'Friend request accepted' };
    } else {
      await prisma.friendship.update({
        where: { id: request.id },
        data: { status: 'DECLINED' }
      });
      return { status: 'DECLINED', message: 'Friend request declined' };
    }
  }

  async getFriends(userId) {
    // Get all accepted friendships (in either direction)
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    // Map friendships to return the friend's profile details
    return friendships.map(f => {
      const isSender = f.senderId === userId;
      const friend = isSender ? f.receiver : f.sender;
      return {
        friendshipId: f.id,
        friend,
        since: f.updatedAt
      };
    });
  }

  async getPendingRequests(userId) {
    // Get pending friend requests where the user is the receiver
    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: true,
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    return requests.map(r => ({
      friendshipId: r.id,
      sender: r.sender,
      sentAt: r.createdAt
    }));
  }

  async getReferralData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referredUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            isEmailVerified: true,
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If for some reason the existing user doesn't have a referralCode yet, generate it on-the-fly
    let code = user.referralCode;
    if (!code) {
      const crypto = require('crypto');
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code }
      });
    }

    // Fetch top recruiters from DB (only users who have referred at least 1 student)
    const topRecruitersQuery = await prisma.user.findMany({
      where: {
        referredUsers: {
          some: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photos: { orderBy: { order: 'asc' }, take: 1 },
        _count: {
          select: { referredUsers: true }
        }
      },
      take: 10
    });

    topRecruitersQuery.sort((a, b) => b._count.referredUsers - a._count.referredUsers);

    const topRecruiters = topRecruitersQuery.slice(0, 5).map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName ? u.lastName[0] + '.' : ''}`,
      photo: u.photos && u.photos[0] ? u.photos[0].url : null,
      count: u._count.referredUsers
    }));

    return {
      referralCode: code,
      referredCount: user.referredUsers.length,
      referredUsers: user.referredUsers.map(ru => ({
        id: ru.id,
        firstName: ru.firstName,
        lastName: ru.lastName,
        photo: ru.photos && ru.photos[0] ? ru.photos[0].url : null,
        joinedAt: ru.createdAt,
        status: ru.isEmailVerified ? 'JOINED' : 'PENDING'
      })),
      topRecruiters
    };
  }

  async redeemReferral(userId, referralCode) {
    if (!referralCode) {
      throw new AppError('Referral code is required', 400);
    }

    const cleanCode = referralCode.trim().toUpperCase();

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.referredById) {
      throw new AppError('You have already redeemed a referral code', 400);
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: cleanCode }
    });

    if (!referrer) {
      throw new AppError('Invalid referral code', 400);
    }

    if (referrer.id === userId) {
      throw new AppError('You cannot use your own referral code', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { referredById: referrer.id }
    });

    return { message: 'Referral code redeemed successfully!' };
  }

  async getFriendsLocations(userId) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                latitude: true,
                longitude: true,
                isGhostMode: true,
                lastActive: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                latitude: true,
                longitude: true,
                isGhostMode: true,
                lastActive: true
              }
            },
            photos: { orderBy: { order: 'asc' }, take: 1 }
          }
        }
      }
    });

    const locations = [];
    friendships.forEach(f => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      if (friend.profile && friend.profile.latitude !== null && friend.profile.longitude !== null && !friend.profile.isGhostMode) {
        locations.push({
          id: friend.id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          photo: friend.photos[0]?.url || null,
          latitude: friend.profile.latitude,
          longitude: friend.profile.longitude,
          lastActive: friend.profile.lastActive
        });
      }
    });

    return locations;
  }
}

module.exports = new FriendService();
