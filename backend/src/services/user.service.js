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
        isVerified: true,
        isCreatorVerified: true,
        isAthleteVerified: true,
        isGovtVerified: true,
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

    if (user.profile) {
      const domain = user.email ? user.email.split('@')[1] : '';
      if (domain) {
        // Match against ANY accepted domain, not just the legacy primary
        // column — a university may accept several (tec.mx, alumni.tec.mx...).
        // Still purely opportunistic/non-blocking: no match simply skips this.
        const uniDomain = await prisma.universityDomain.findUnique({
          where: { domain: domain.toLowerCase() },
          include: { university: true },
        });
        const dbUni = uniDomain ? uniDomain.university : null;
        if (dbUni) {
          const oldName = user.profile.university;
          const oldUniId = user.profile.universityId;
          user.profile.university = dbUni.name;
          user.profile.universityDomain = dbUni.domain;
          user.profile.universityId = dbUni.id;

          if (oldName !== dbUni.name || oldUniId !== dbUni.id) {
            await prisma.userProfile.update({
              where: { id: user.profile.id },
              data: {
                university: dbUni.name,
                universityId: dbUni.id,
              }
            }).catch(() => {});
          }
        }
      }
    }

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
          orderBy: { order: 'asc' },
          take: 1
        }
      },
      take: 20
    });
  }

  /**
   * Verification Request submission.
   * Handles Student ID (Blue Badge), Content Creator, Athlete and Student
   * Government. ATHLETE requests carry a `sport` so each sport is reviewed
   * independently.
   */
  async submitVerificationRequest(userId, {
    type = 'STUDENT_ID',
    documentUrl,
    credentialUrl,
    notes,
    sport,
    socialLinks,
    creatorCategory,
    metadata,
    documentName,
    documentMime,
  } = {}) {
    const credUrl = credentialUrl || documentUrl;
    if (!credUrl) {
      throw new AppError('Se requiere la foto o archivo de la credencial', 400);
    }

    // The pending request is identified by (user, type) — plus the sport for
    // athletes, otherwise a second sport would overwrite the first one's document.
    const existing = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        type,
        status: 'PENDING',
        ...(type === 'ATHLETE' ? { sport: sport || null } : {}),
      }
    });

    // Only overwrite optional columns when a value was actually supplied, so a
    // resubmission never wipes data captured on the first attempt.
    const optionalData = {};
    if (sport !== undefined && sport !== null) optionalData.sport = sport;
    if (socialLinks !== undefined && socialLinks !== null) optionalData.socialLinks = socialLinks;
    if (creatorCategory !== undefined && creatorCategory !== null) optionalData.creatorCategory = creatorCategory;
    if (metadata !== undefined && metadata !== null) optionalData.metadata = metadata;
    if (documentName !== undefined && documentName !== null) optionalData.documentName = documentName;
    if (documentMime !== undefined && documentMime !== null) optionalData.documentMime = documentMime;

    let requestRecord;
    if (existing) {
      requestRecord = await prisma.verificationRequest.update({
        where: { id: existing.id },
        data: {
          credentialUrl: credUrl,
          notes: notes || existing.notes || 'Subido por el estudiante',
          createdAt: new Date(),
          ...optionalData,
        }
      });
    } else {
      requestRecord = await prisma.verificationRequest.create({
        data: {
          userId,
          type,
          status: 'PENDING',
          credentialUrl: credUrl,
          notes: notes || 'Solicitud enviada por el estudiante',
          ...optionalData,
        }
      });
    }

    return requestRecord;
  }

  async getNotifications(userId) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, title: true, message: true, type: true,
        isRead: true, createdAt: true,
      },
    });
  }

  async markNotificationRead(userId, notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllNotificationsRead(userId) {
    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async getVerificationStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isVerified: true,
        isCreatorVerified: true,
        isAthleteVerified: true,
        isGovtVerified: true,
        profile: { select: { verifiedSports: true } },
      }
    });

    const latestRequest = await prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Per-category summary so the app can render the state of each request
    // without ever exposing the stored document.
    const allRequests = await prisma.verificationRequest.findMany({
      where: { userId },
      select: {
        id: true, type: true, status: true, sport: true,
        adminNotes: true, createdAt: true, reviewedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestOfType = (type) => allRequests.find(r => r.type === type) || null;
    const summarize = (type) => {
      const r = latestOfType(type);
      return r ? { status: r.status, adminNotes: r.adminNotes, createdAt: r.createdAt } : { status: null };
    };

    const badges = user
      ? {
          isVerified: user.isVerified,
          isCreatorVerified: user.isCreatorVerified,
          isAthleteVerified: user.isAthleteVerified,
          isGovtVerified: user.isGovtVerified,
        }
      : null;

    return {
      isVerified: !!user?.isVerified,
      badges,
      latestRequest,
      verifiedSports: user?.profile?.verifiedSports || [],
      verifications: {
        STUDENT_ID: summarize('STUDENT_ID'),
        STUDENT_GOVT: summarize('STUDENT_GOVT'),
        CREATOR_BADGE: summarize('CREATOR_BADGE'),
        ATHLETE: {
          sports: allRequests
            .filter(r => r.type === 'ATHLETE')
            .map(r => ({ sport: r.sport, status: r.status, adminNotes: r.adminNotes })),
        },
      },
    };
  }
}

module.exports = new UserService();
