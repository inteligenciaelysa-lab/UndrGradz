const prisma = require('../database/prisma');
const AppError = require('../errors/appError');
const { calculateDistance } = require('../utils/distance');
const { createChatChannel } = require('../integrations/stream');

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const universityCityMap = {
  'Universidad Tecnológica del Norte de Coahuila': 'Piedras Negras',
  'Universidad Politécnica de Piedras Negras (UPPN)': 'Piedras Negras',
  'UTNC': 'Piedras Negras',
  'UPPN': 'Piedras Negras',
  'Rice University': 'Houston',
  'University of Houston': 'Houston',
  'Southern Methodist University': 'Dallas',
  'SMU': 'Dallas',
  'The University of Texas at Austin': 'Austin',
  'UT Austin': 'Austin',
  'The University of Texas at San Antonio': 'San Antonio',
  'UTSA': 'San Antonio',
  'Texas Tech University': 'Lubbock',
  'Baylor University': 'Waco',
  'Texas A&M University': 'College Station',
  'Instituto Tecnológico de Saltillo': 'Saltillo',
  'Universidad Autónoma de Coahuila': 'Saltillo',
  'UA de C': 'Saltillo',
  'UADEC': 'Saltillo',
  'Universidad La Salle Saltillo': 'Saltillo',
  'Universidad Carolina': 'Saltillo',
  'Universidad Autónoma Agraria Antonio Narro': 'Saltillo',
};

function getUniversityCity(uniName) {
  if (!uniName) return '';
  if (universityCityMap[uniName]) return universityCityMap[uniName];
  for (const [key, val] of Object.entries(universityCityMap)) {
    if (uniName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(uniName.toLowerCase())) {
      return val;
    }
  }
  const atMatch = uniName.match(/at\s+([A-Z][a-zA-Z\s]+)/i);
  if (atMatch) return atMatch[1].trim();
  const campusMatch = uniName.match(/Campus\s+([A-Z][a-zA-Z\s]+)/i);
  if (campusMatch) return campusMatch[1].trim();
  const commaMatch = uniName.match(/,\s*([A-Z][a-zA-Z\s]+)/i);
  if (commaMatch) return commaMatch[1].trim();
  return uniName;
}

class SwipeService {
  async getCrushFeed(userId) {
    // 1. Get current user's profile and preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!currentUser || !currentUser.profile) {
      throw new AppError('Please complete your profile preferences first', 400);
    }

    const { gender, interestedIn, minAge, maxAge, maxDistanceKm, latitude, longitude } = currentUser.profile;
    const currentUserAge = calculateAge(currentUser.birthDate);

    // 2. Fetch list of users already swiped on (to exclude them)
    const swipedSwipes = await prisma.swipe.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
    });
    const excludedUserIds = swipedSwipes.map((s) => s.receiverId);
    excludedUserIds.push(userId); // Exclude self

    // 3. Query all potential candidate users
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: excludedUserIds },
        profile: { isNot: null }, // Must have a profile
      },
      include: {
        profile: true,
        photos: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const getProfileCity = (prof) => {
      if (!prof) return '';
      if (prof.academic && typeof prof.academic === 'object' && prof.academic.campus) {
        return prof.academic.campus;
      }
      return getUniversityCity(prof.university);
    };

    const userCity = getProfileCity(currentUser.profile);

    // 4. Filter candidates based on gender, age, and geodetic distance
    const localFeed = [];
    const globalFeed = [];

    candidates.forEach((candidate) => {
      const candidateProfile = candidate.profile;
      
      // Gender filtering (mutual preference check)
      // A. Does current user's interestedIn match candidate's gender?
      if (interestedIn !== 'EVERYONE' && interestedIn !== candidateProfile.gender) {
        return;
      }
      // B. Does candidate's interestedIn match current user's gender?
      if (candidateProfile.interestedIn !== 'EVERYONE' && candidateProfile.interestedIn !== gender) {
        return;
      }

      // Age filtering (mutual age check)
      const candidateAge = calculateAge(candidate.birthDate);
      // A. Is candidate within current user's age preferences?
      if (candidateAge < minAge || candidateAge > maxAge) {
        return;
      }
      // B. Is current user within candidate's age preferences?
      if (currentUserAge < candidateProfile.minAge || currentUserAge > candidateProfile.maxAge) {
        return;
      }

      // Distance computation
      let distance = null;
      if (latitude !== null && longitude !== null && candidateProfile.latitude !== null && candidateProfile.longitude !== null) {
        distance = calculateDistance(latitude, longitude, candidateProfile.latitude, candidateProfile.longitude);
        candidate.profile.computedDistanceKm = Math.round(distance * 10) / 10;
      } else {
        candidate.profile.computedDistanceKm = 0;
      }

      const candidateUni = candidateProfile.university;
      const candidateCity = getProfileCity(candidateProfile);
      const isSameUni = candidateUni === currentUser.profile.university;
      const isSameCity = userCity && candidateCity && userCity.toLowerCase() === candidateCity.toLowerCase();
      const isLocal = isSameUni || isSameCity;

      if (isLocal) {
        // Distance filtering only applies to local matches
        if (distance !== null && distance > maxDistanceKm && distance > candidateProfile.maxDistanceKm) {
          return;
        }
        localFeed.push(candidate);
      } else {
        // Global matches from other cities
        globalFeed.push(candidate);
      }
    });

    // Randomize and limit the global feed to 30 students to keep feed clean and random
    const shuffledGlobal = globalFeed.sort(() => 0.5 - Math.random()).slice(0, 30);

    const filteredFeed = [...localFeed, ...shuffledGlobal];

    // 5. Sort candidates: active boosts first
    const now = new Date();
    const sortedFeed = filteredFeed.sort((a, b) => {
      const aIsBoosted = a.profile.boostEndsAt && new Date(a.profile.boostEndsAt) > now;
      const bIsBoosted = b.profile.boostEndsAt && new Date(b.profile.boostEndsAt) > now;

      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;
      return 0; // maintain original database ordering
    });

    // 6. Fetch other active students from the same university to populate the spotlight directory
    let uniStudents = [];
    if (currentUser.profile.university) {
      uniStudents = await prisma.user.findMany({
        where: {
          id: { notIn: [userId] },
          profile: {
            university: currentUser.profile.university,
          },
        },
        include: {
          profile: true,
          photos: {
            orderBy: { order: 'asc' },
          },
        },
        take: 40,
      });
      uniStudents.forEach(u => {
        if (u.profile) {
          u.profile.computedDistanceKm = 0;
        }
      });
    }

    const mergedMap = new Map();
    sortedFeed.forEach(u => mergedMap.set(u.id, u));
    uniStudents.forEach(u => {
      if (!mergedMap.has(u.id)) {
        mergedMap.set(u.id, u);
      }
    });

    const userIds = Array.from(mergedMap.keys());
    const receivedLikes = await prisma.swipe.groupBy({
      by: ['receiverId'],
      where: {
        receiverId: { in: userIds },
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] }
      },
      _count: {
        id: true
      }
    });
    const likesMap = {};
    receivedLikes.forEach(item => {
      likesMap[item.receiverId] = item._count.id;
    });

    const finalUsers = Array.from(mergedMap.values()).map(u => {
      const uCopy = Object.assign({}, u);
      if (uCopy.profile) {
        uCopy.profile = Object.assign({}, uCopy.profile, {
          likesCount: likesMap[u.id] || 0
        });
      } else {
        uCopy.profile = { likesCount: likesMap[u.id] || 0 };
      }
      return uCopy;
    });

    return finalUsers;
  }

  async registerSwipe(senderId, targetIdentifier, type) {
    let receiver = await prisma.user.findUnique({
      where: { id: targetIdentifier },
    });

    const cleanName = String(targetIdentifier || '').trim();
    const firstWord = cleanName.split(' ')[0];
    const cleanHandle = cleanName.replace(/^@/, '');

    // 1. Prioritize pending incoming swipe sender matching targetIdentifier
    if (!receiver) {
      const pendingIncoming = await prisma.swipe.findFirst({
        where: {
          receiverId: senderId,
          type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
          sender: {
            OR: [
              { id: targetIdentifier },
              { handle: cleanHandle },
              { handle: `@${cleanHandle}` },
              { firstName: { equals: cleanName, mode: 'insensitive' } },
              { firstName: { equals: firstWord, mode: 'insensitive' } }
            ]
          }
        },
        include: { sender: true }
      });
      if (pendingIncoming && pendingIncoming.sender) {
        receiver = pendingIncoming.sender;
      }
    }

    // 2. Search database by handle, email, or name (preferring most recently created users)
    if (!receiver) {
      receiver = await prisma.user.findFirst({
        where: {
          OR: [
            { handle: cleanHandle },
            { handle: `@${cleanHandle}` },
            { email: cleanName.toLowerCase() },
            { firstName: { equals: cleanName, mode: 'insensitive' } },
            { firstName: { equals: firstWord, mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!receiver) {
      const cleanName = String(targetIdentifier || 'Candidate').trim();
      const first = cleanName.split(' ')[0] || 'User';
      const last = cleanName.split(' ').slice(1).join(' ') || '';
      const handleStr = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${Date.now()}`;
      const emailStr = `${handleStr}_${Date.now().toString().slice(-4)}@campus.edu`;

      try {
        receiver = await prisma.user.create({
          data: {
            email: emailStr,
            handle: handleStr,
            passwordHash: '$2b$10$e8wX7J94zXyQ3v.y8mZ4z.x.x.x.x.x.x.x.x.x.x.x.x',
            firstName: first,
            lastName: last,
            birthDate: new Date('2002-01-01'),
            profile: {
              create: {
                bio: 'Campus student',
                gender: 'WOMAN',
                interestedIn: 'EVERYONE',
                university: 'Campus',
                major: 'Undergrad'
              }
            }
          }
        });
        console.log(`✨ Dynamically provisioned candidate user ${receiver.id} for target "${targetIdentifier}"`);
      } catch (err) {
        receiver = await prisma.user.findFirst();
      }
    }

    if (!receiver) {
      throw new AppError('Target profile not found', 404);
    }

    const receiverId = receiver.id;

    if (senderId === receiverId) {
      throw new AppError('You cannot swipe on yourself', 400);
    }

    // Check if already swiped
    const existingSwipe = await prisma.swipe.findUnique({
      where: {
        senderId_receiverId: { senderId, receiverId },
      },
    });
    if (existingSwipe) {
      throw new AppError('You have already swiped on this profile', 400);
    }

    // Fetch sender profile details to check subscription tier
    const senderProfile = await prisma.userProfile.findUnique({
      where: { userId: senderId },
      include: { user: true },
    });

    const tier = senderProfile?.subscriptionTier || 'FREE';

    // Calculate start of past 24 hours
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count positive swipes in past 24 hours
    const dailyPositiveSwipesCount = await prisma.swipe.count({
      where: {
        senderId,
        createdAt: { gte: past24Hours },
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
      },
    });

    // Check overall limit for FREE tier
    if (tier === 'FREE' && dailyPositiveSwipesCount >= 50 && ['LIKE', 'SUPERLIKE', 'ROSE'].includes(type)) {
      throw new AppError('Daily swipe limit reached. Upgrade to Premium for unlimited likes!', 403);
    }

    // Check specific SUPERLIKE limits
    if (type === 'SUPERLIKE') {
      const superlikesToday = await prisma.swipe.count({
        where: {
          senderId,
          createdAt: { gte: past24Hours },
          type: 'SUPERLIKE',
        },
      });

      const superlikeLimit = tier === 'FREE' ? 1 : tier === 'GOLD' ? 5 : 10;
      if (superlikesToday >= superlikeLimit) {
        throw new AppError(`You have run out of SuperLikes for today! (Limit: ${superlikeLimit})`, 403);
      }
    }

    // Check specific ROSE limits
    if (type === 'ROSE') {
      const rosesToday = await prisma.swipe.count({
        where: {
          senderId,
          createdAt: { gte: past24Hours },
          type: 'ROSE',
        },
      });

      const roseLimit = tier === 'FREE' ? 1 : tier === 'GOLD' ? 3 : 5;
      if (rosesToday >= roseLimit) {
        throw new AppError(`You have run out of Roses for today! (Limit: ${roseLimit})`, 403);
      }
    }

    // Create swipe
    const swipe = await prisma.swipe.create({
      data: {
        senderId,
        receiverId,
        type,
      },
    });

    // Check for mutual match
    const isPositiveSwipe = ['LIKE', 'SUPERLIKE', 'ROSE'].includes(type);
    if (isPositiveSwipe) {
      const oppositeSwipe = await prisma.swipe.findFirst({
        where: {
          senderId: receiverId,
          receiverId: senderId,
          type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
        },
      });

      if (oppositeSwipe) {
        // Create mutual match
        const [userOneId, userTwoId] = [senderId, receiverId].sort();
        const streamChannelId = `match_${userOneId}_${userTwoId}`;

        // Trigger channel creation in Stream
        await createChatChannel(streamChannelId, [senderId, receiverId]);
        
        const match = await prisma.match.upsert({
          where: {
            userOneId_userTwoId: { userOneId, userTwoId },
          },
          update: { isActive: true, streamChannelId },
          create: {
            userOneId,
            userTwoId,
            streamChannelId,
          },
          include: {
            userOne: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: true,
                photos: { orderBy: { order: 'asc' }, take: 1 },
              },
            },
            userTwo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: true,
                photos: { orderBy: { order: 'asc' }, take: 1 },
              },
            },
          },
        });

        // Trigger real-time WebSocket match notification for both users. Built
        // outside the try so payloadForSender.partner is still available below
        // for the HTTP response, even if the socket emit itself fails.
        const partnerForSender = match.userOneId === senderId ? match.userTwo : match.userOne;
        const partnerForReceiver = match.userOneId === receiverId ? match.userTwo : match.userOne;

        const payloadForSender = {
          matchId: match.id,
          partner: {
            id: partnerForSender.id,
            name: `${partnerForSender.firstName} ${partnerForSender.lastName || ''}`.trim(),
            firstName: partnerForSender.firstName,
            handle: partnerForSender.profile?.handle || `@${partnerForSender.firstName.toLowerCase()}`,
            university: partnerForSender.profile?.university || '',
            major: partnerForSender.profile?.major || '',
            photo: partnerForSender.photos?.[0]?.url || partnerForSender.profile?.avatarUrl || ''
          }
        };

        const payloadForReceiver = {
          matchId: match.id,
          partner: {
            id: partnerForReceiver.id,
            name: `${partnerForReceiver.firstName} ${partnerForReceiver.lastName || ''}`.trim(),
            firstName: partnerForReceiver.firstName,
            handle: partnerForReceiver.profile?.handle || `@${partnerForReceiver.firstName.toLowerCase()}`,
            university: partnerForReceiver.profile?.university || '',
            major: partnerForReceiver.profile?.major || '',
            photo: partnerForReceiver.photos?.[0]?.url || partnerForReceiver.profile?.avatarUrl || ''
          }
        };

        try {
          const { notifyMatchCreated } = require('../socket');
          notifyMatchCreated(senderId, receiverId, payloadForSender, payloadForReceiver);
        } catch(e) {
          console.error("❌ Failed to emit live match socket event:", e);
        }

        // Trigger push notifications safely
        try {
          const senderUser = match.userOneId === senderId ? match.userOne : match.userTwo;
          const receiverUser = match.userOneId === receiverId ? match.userOne : match.userTwo;

          const { sendPushToUser } = require('../integrations/firebase');
          await sendPushToUser(senderId, {
            title: '¡Nuevo Match! 🎉',
            body: `¡Hiciste match con ${receiverUser.firstName}! Salúdala ahora mismo.`,
            data: { matchId: match.id, type: 'MATCH' },
          });

          await sendPushToUser(receiverId, {
            title: '¡Nuevo Match! 🎉',
            body: `¡Hiciste match con ${senderUser.firstName}! Salúdalo ahora mismo.`,
            data: { matchId: match.id, type: 'MATCH' },
          });
        } catch(e) {
          console.error("❌ Failed to send match push notifications:", e);
        }

        return {
          isMatch: true,
          match,
          partner: payloadForSender.partner,
        };
      }
    }

    return {
      isMatch: false,
    };
  }

  async getStats(userId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    const totalLikes = await prisma.swipe.count({
      where: {
        receiverId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] }
      }
    });

    const todayLikes = await prisma.swipe.count({
      where: {
        receiverId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
        createdAt: { gte: startOfToday }
      }
    });

    const weekLikes = await prisma.swipe.count({
      where: {
        receiverId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
        createdAt: { gte: sevenDaysAgo }
      }
    });

    const yesterdayLikes = await prisma.swipe.count({
      where: {
        receiverId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
        createdAt: { gte: startOfYesterday, lt: startOfToday }
      }
    });

    const allUsersWithLikes = await prisma.user.findMany({
      select: {
        id: true,
        profile: {
          select: {
            university: true
          }
        },
        receivedSwipes: {
          where: { type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] } },
          select: { id: true }
        }
      }
    });

    const userRankData = allUsersWithLikes.map(u => ({
      id: u.id,
      uni: u.profile?.university || '',
      likesCount: u.receivedSwipes ? u.receivedSwipes.length : 0
    }));

    userRankData.sort((a, b) => b.likesCount - a.likesCount);

    let globalRankIndex = userRankData.findIndex(u => u.id === userId);
    let globalRank = globalRankIndex !== -1 ? globalRankIndex + 1 : userRankData.length;

    const userUni = currentUser.profile?.university || '';
    const sameUniUsers = userRankData.filter(u => u.uni === userUni);
    let uniRankIndex = sameUniUsers.findIndex(u => u.id === userId);
    let uniRank = uniRankIndex !== -1 ? uniRankIndex + 1 : sameUniUsers.length;

    let countryRank = globalRank;

    const calculateChangeText = (today, yesterday) => {
      const diff = today - yesterday;
      if (diff > 0) return `↑ ${diff} hoy`;
      if (diff < 0) return `↓ ${Math.abs(diff)} hoy`;
      return `—`;
    };

    const globalChange = calculateChangeText(todayLikes, yesterdayLikes);
    const uniChange = calculateChangeText(todayLikes, yesterdayLikes);
    const countryChange = calculateChangeText(todayLikes, yesterdayLikes);

    const totalViews = await prisma.profileView.count({
      where: { viewedId: userId }
    });

    const todayViews = await prisma.profileView.count({
      where: {
        viewedId: userId,
        updatedAt: { gte: startOfToday }
      }
    });

    const weekViews = await prisma.profileView.count({
      where: {
        viewedId: userId,
        updatedAt: { gte: sevenDaysAgo }
      }
    });

    const totalSentLikes = await prisma.swipe.count({
      where: {
        senderId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] }
      }
    });

    const todaySentLikes = await prisma.swipe.count({
      where: {
        senderId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
        createdAt: { gte: startOfToday }
      }
    });

    const weekSentLikes = await prisma.swipe.count({
      where: {
        senderId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] },
        createdAt: { gte: sevenDaysAgo }
      }
    });

    return {
      globalRank,
      uniRank,
      countryRank,
      globalChange,
      uniChange,
      countryChange,
      totalLikes,
      todayLikes,
      weekLikes,
      totalViews,
      todayViews,
      weekViews,
      totalSentLikes,
      todaySentLikes,
      weekSentLikes
    };
  }

  async recordView(viewerId, targetIdentifier) {
    if (!viewerId || !targetIdentifier) return null;

    let targetUser = await prisma.user.findUnique({
      where: { id: targetIdentifier }
    });

    if (!targetUser) {
      const cleanName = String(targetIdentifier || '').trim();
      const firstWord = cleanName.split(' ')[0];
      const cleanHandle = cleanName.replace(/^@/, '');

      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { handle: cleanHandle },
            { handle: `@${cleanHandle}` },
            { firstName: firstWord }
          ]
        }
      });
    }

    if (!targetUser || targetUser.id === viewerId) return null;

    const viewedId = targetUser.id;

    const existing = await prisma.profileView.findUnique({
      where: {
        viewerId_viewedId: {
          viewerId,
          viewedId
        }
      }
    });

    const now = new Date();

    if (existing) {
      const diffMs = now.getTime() - new Date(existing.updatedAt).getTime();
      const fifteenMinsMs = 15 * 60 * 1000;
      if (diffMs < fifteenMinsMs) {
        return existing;
      }
      const updated = await prisma.profileView.update({
        where: { id: existing.id },
        data: { updatedAt: now }
      });
      return updated;
    }

    const newView = await prisma.profileView.create({
      data: {
        viewerId,
        viewedId
      }
    });

    return newView;
  }

  async getViews(viewedId) {
    const views = await prisma.profileView.findMany({
      where: { viewedId },
      include: {
        viewer: {
          include: {
            profile: true,
            photos: {
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    const formatTimeAgo = (date) => {
      const diffSecs = Math.floor((new Date() - new Date(date)) / 1000);
      if (diffSecs < 60) return `hace 1m`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `hace ${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `hace ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `hace ${diffDays}d`;
    };

    return views.map(v => {
      const viewer = v.viewer;
      const prof = viewer.profile || {};
      const photos = (viewer.photos || []).map(p => p.url);

      return {
        id: viewer.id,
        name: `${viewer.firstName} ${viewer.lastName}`.trim(),
        handle: viewer.handle || `@${viewer.firstName.toLowerCase()}`,
        photos: photos.length ? photos : [],
        bg: photos.length ? '' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
        uni: prof.university || 'Campus Student',
        major: prof.major || '',
        grad: prof.grad || '',
        bio: prof.bio || '',
        timeAgo: formatTimeAgo(v.updatedAt),
        updatedAt: v.updatedAt
      };
    });
  }

  async getAdmirers(userId) {
    const swipes = await prisma.swipe.findMany({
      where: {
        receiverId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] }
      },
      include: {
        sender: {
          include: {
            profile: true,
            photos: {
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return swipes.map(s => {
      const u = s.sender;
      const prof = u.profile || {};
      const photos = (u.photos || []).map(p => p.url);

      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        handle: u.handle || `@${u.firstName.toLowerCase()}`,
        gender: prof.gender || 'female',
        age: prof.age || (u.birthDate ? Math.floor((new Date() - new Date(u.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)) : 20),
        photos: photos.length ? photos : [],
        bg: photos.length ? '' : 'linear-gradient(135deg,#ec4899,#8b5cf6)',
        uni: prof.university || 'Campus Student',
        major: prof.major || '',
        grad: prof.grad || '',
        bio: prof.bio || '',
        swipeType: s.type,
        createdAt: s.createdAt
      };
    });
  }

  async getSentLikes(userId) {
    const swipes = await prisma.swipe.findMany({
      where: {
        senderId: userId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] }
      },
      include: {
        receiver: {
          include: {
            profile: true,
            photos: {
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return swipes.map(s => {
      const u = s.receiver;
      const prof = u.profile || {};
      const photos = (u.photos || []).map(p => p.url);

      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        handle: u.handle || `@${u.firstName.toLowerCase()}`,
        gender: prof.gender || 'female',
        age: prof.age || (u.birthDate ? Math.floor((new Date() - new Date(u.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)) : 20),
        photos: photos.length ? photos : [],
        bg: photos.length ? '' : 'linear-gradient(135deg,#ec4899,#8b5cf6)',
        uni: prof.university || 'Campus Student',
        major: prof.major || '',
        grad: prof.grad || '',
        bio: prof.bio || '',
        swipeType: s.type,
        createdAt: s.createdAt
      };
    });
  }

  // Retract a like from the "Likes Sent" list. Refuses once the other person
  // liked back: the Match row references neither Swipe by id, so deleting the
  // swipe underneath an active Match would leave a conversation whose origin no
  // longer exists. Unmatching is a separate action.
  async unsendLike(userId, targetId) {
    if (!targetId) {
      throw new AppError('Target user id is required', 400);
    }

    const match = await prisma.match.findFirst({
      where: {
        isActive: true,
        OR: [
          { userOneId: userId, userTwoId: targetId },
          { userOneId: targetId, userTwoId: userId }
        ]
      }
    });

    if (match) {
      throw new AppError('You already matched with this person — the like cannot be retracted', 409);
    }

    const { count } = await prisma.swipe.deleteMany({
      where: {
        senderId: userId,
        receiverId: targetId,
        type: { in: ['LIKE', 'SUPERLIKE', 'ROSE'] }
      }
    });

    if (!count) {
      throw new AppError('No sent like found for this profile', 404);
    }

    return { removed: count };
  }
}

module.exports = new SwipeService();
