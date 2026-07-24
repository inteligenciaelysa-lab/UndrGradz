const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { generateUploadSignedUrl } = require('../integrations/gcs');

class UserService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        handle: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        profile: true,
        photos: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Parallel database counts
    const [friendsCount, matchesCount, eventsJoinedCount] = await Promise.all([
      prisma.friendship.count({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      }),
      prisma.match.count({
        where: {
          OR: [
            { userOneId: userId },
            { userTwoId: userId }
          ]
        }
      }),
      prisma.event.count({
        where: {
          attendees: {
            some: {
              id: userId
            }
          }
        }
      })
    ]);

    user.friendsCount = friendsCount;
    user.matchesCount = matchesCount;
    user.eventsJoinedCount = eventsJoinedCount;

    return user;
  }

  async updateProfile(userId, profileData) {
    const { firstName, lastName, handle, ...profileFields } = profileData;

    // Update User table if firstName, lastName, or handle are provided
    if (firstName !== undefined || lastName !== undefined || handle !== undefined) {
      const userUpdateData = {};
      if (firstName !== undefined) userUpdateData.firstName = firstName.trim();
      if (lastName !== undefined) userUpdateData.lastName = lastName.trim();
      if (handle !== undefined) {
        const cleanHandle = handle.trim().replace(/^@/, '');
        if (cleanHandle) {
          const existingUserWithHandle = await prisma.user.findFirst({
            where: {
              handle: cleanHandle,
              id: { not: userId }
            }
          });
          if (existingUserWithHandle) {
            throw new AppError('Username already taken', 400);
          }
          userUpdateData.handle = cleanHandle;
        }
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }
    }

    // Upsert UserProfile (create if not exists, update if exists)
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...profileFields,
        lastActive: new Date(),
      },
      create: {
        userId,
        ...profileFields,
        lastActive: new Date(),
      },
    });

    return profile;
  }

  async updateLocation(userId, latitude, longitude) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        latitude,
        longitude,
        lastActive: new Date(),
      },
      create: {
        userId,
        latitude,
        longitude,
        lastActive: new Date(),
      },
    });

    return profile;
  }

  async updateGhostMode(userId, isGhostMode) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        isGhostMode,
        lastActive: new Date(),
      },
      create: {
        userId,
        isGhostMode,
        lastActive: new Date(),
      },
    });

    return profile;
  }

  async addPhoto(userId, contentType) {
    // 1. Get current number of photos to determine sequential order
    const photoCount = await prisma.photo.count({
      where: { userId },
    });

    if (photoCount >= 6) {
      throw new AppError('You can only upload up to 6 photos', 400);
    }

    // 2. Generate signed upload URL and public CDN URL
    const { uploadUrl, publicUrl } = await generateUploadSignedUrl(userId, contentType);

    // 3. Register the photo in database
    const photo = await prisma.photo.create({
      data: {
        userId,
        url: publicUrl,
        order: photoCount, // 0-indexed order
      },
    });

    return {
      uploadUrl,
      publicUrl,
      photo,
    };
  }

  async deletePhoto(userId, photoId) {
    // Find the photo
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new AppError('Photo not found', 404);
    }

    if (photo.userId !== userId) {
      throw new AppError('Not authorized to delete this photo', 403);
    }

    // Delete photo
    await prisma.photo.delete({
      where: { id: photoId },
    });

    // Re-index remaining photos order (0-indexed without gaps)
    const remainingPhotos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < remainingPhotos.length; i++) {
      await prisma.photo.update({
        where: { id: remainingPhotos[i].id },
        data: { order: i },
      });
    }

    return { success: true };
  }

  async searchUsers(currentUserId, query) {
    let searchVal = query.trim();
    if (searchVal.startsWith('@')) {
      searchVal = searchVal.substring(1);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { profile: true }
    });

    const isFree = !currentUser || !currentUser.profile || currentUser.profile.subscriptionTier === 'FREE';
    const userUni = currentUser?.profile?.university;

    return await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        handle: { contains: searchVal, mode: 'insensitive' },
        ...(isFree && userUni ? {
          profile: {
            university: userUni
          }
        } : {})
      },
      select: {
        id: true,
        handle: true,
        firstName: true,
        lastName: true,
        profile: {
          select: {
            major: true,
            university: true,
            customization: true,
          }
        },
        photos: {
          orderBy: {
            order: 'asc',
          },
          take: 1,
        },
      },
      take: 20,
    });
  }
}

module.exports = new UserService();
