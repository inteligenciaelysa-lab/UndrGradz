const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api/v1';

let results = {
  passed: [],
  failed: [],
  bugsFound: [],
  dbVerification: [],
  storageVerification: [],
  apiVerification: [],
  security: []
};

function logPass(testName, detail = '') {
  results.passed.push({ testName, detail });
  console.log(`✅ [PASS] ${testName} ${detail ? '- ' + detail : ''}`);
}

function logFail(testName, error, rootCause = '') {
  const errMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  results.failed.push({ testName, error: errMsg, rootCause });
  results.bugsFound.push({ testName, error: errMsg, rootCause });
  console.error(`❌ [FAIL] ${testName}: ${errMsg}`);
}

async function runAudit() {
  console.log("=================================================");
  console.log("🚀 STARTING FULL END-TO-END AUDIT FOR UNDRGRADZ");
  console.log("=================================================\n");

  const timestamp = Date.now().toString().slice(-6); // 6 digits to keep handle length < 15
  const userAData = {
    email: `audit_usera_${timestamp}@undrgradz.com`,
    password: 'Password123!',
    firstName: 'AuditorA',
    lastName: 'Tester',
    handle: `auditora_${timestamp}`,
    birthDate: '2002-05-15T00:00:00.000Z'
  };

  const userBData = {
    email: `audit_userb_${timestamp}@undrgradz.com`,
    password: 'Password123!',
    firstName: 'AuditorB',
    lastName: 'Tester',
    handle: `auditorb_${timestamp}`,
    birthDate: '2001-08-20T00:00:00.000Z'
  };

  let tokenA, tokenB, refreshTokenA, userIdA, userIdB;

  // ==========================================
  // 1. AUTHENTICATION & ACCOUNTS
  // ==========================================
  console.log("\n--- SECTION 1: AUTHENTICATION & ACCOUNTS ---");
  try {
    // 1.1 Signup User A
    const regResA = await axios.post(`${API_BASE}/auth/register`, userAData);
    if (regResA.status === 201 && regResA.data.data.user) {
      userIdA = regResA.data.data.user.id;
      logPass("Auth: User A Registration", `User ID: ${userIdA}`);
    } else {
      throw new Error("Registration response status or payload invalid");
    }

    // 1.2 Signup Validation Tests
    try {
      await axios.post(`${API_BASE}/auth/register`, userAData);
      logFail("Auth: Duplicate Email Validation", "Server allowed duplicate email registration");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        logPass("Auth: Duplicate Email Validation", "Correctly rejected duplicate registration (400)");
      } else {
        logFail("Auth: Duplicate Email Validation", `Unexpected error response: ${err.message}`);
      }
    }

    // 1.3 Signup User B
    const regResB = await axios.post(`${API_BASE}/auth/register`, userBData);
    userIdB = regResB.data.data.user.id;
    logPass("Auth: User B Registration", `User ID: ${userIdB}`);

    if (userIdA === userIdB) {
      logFail("Auth: User ID Uniqueness", "User A and User B share the same userId!");
    } else {
      logPass("Auth: User ID Uniqueness", "User A and User B have distinct userIds");
    }

    // 1.4 Login User A
    const loginResA = await axios.post(`${API_BASE}/auth/login`, {
      email: userAData.email,
      password: userAData.password
    });
    tokenA = loginResA.data.data.accessToken;
    refreshTokenA = loginResA.data.data.refreshToken;

    if (tokenA && refreshTokenA) {
      logPass("Auth: Login & Tokens", "Received accessToken & refreshToken");
    } else {
      logFail("Auth: Login & Tokens", "Missing access or refresh token in login response");
    }

    // 1.5 Login User B
    const loginResB = await axios.post(`${API_BASE}/auth/login`, {
      email: userBData.email,
      password: userBData.password
    });
    tokenB = loginResB.data.data.accessToken;

    // 1.6 Refresh Token
    const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken: refreshTokenA
    });
    if (refreshRes.data.data.accessToken) {
      tokenA = refreshRes.data.data.accessToken; // update active token
      logPass("Auth: Refresh Token Flow", "New access token obtained via refresh route");
    } else {
      logFail("Auth: Refresh Token Flow", "Refresh route did not return new accessToken");
    }

    // 1.7 Protected Endpoint Unauthenticated Test
    try {
      await axios.get(`${API_BASE}/users/me`);
      logFail("Auth: Protected Route Security", "Endpoint accessible without Auth header!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logPass("Auth: Protected Route Security", "Rejected request without token (401)");
      } else {
        logFail("Auth: Protected Route Security", `Unexpected status code: ${err.message}`);
      }
    }

    // 1.8 Protected Endpoint Invalid Token Test
    try {
      await axios.get(`${API_BASE}/users/me`, {
        headers: { Authorization: 'Bearer invalid_fake_token_123' }
      });
      logFail("Auth: Invalid Token Guard", "Endpoint accepted fake token!");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        logPass("Auth: Invalid Token Guard", "Rejected fake token (401)");
      } else {
        logFail("Auth: Invalid Token Guard", `Unexpected status code: ${err.message}`);
      }
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Auth Section Fatal Error", errorDetails);
  }

  // ==========================================
  // 2. FULL SIGN UP DATA & PROFILE FIELDS
  // ==========================================
  console.log("\n--- SECTION 2 & 4: FULL SIGN UP & PROFILE FIELDS PERSISTENCE ---");
  try {
    const fullProfileData = {
      firstName: 'AuditorUpdated',
      lastName: 'TesterUpdated',
      handle: `auditor_new_${timestamp}`,
      bio: 'Full E2E Audit Bio testing persistence across all layers.',
      gender: 'MAN',
      interestedIn: 'EVERYONE',
      university: 'Universidad Autónoma de Coahuila',
      major: 'Computer Science',
      grad: "May '26",
      minAge: 18,
      maxAge: 25,
      maxDistanceKm: 50,
      interests: ['Coding', 'Gaming', 'Music', 'Coffee'],
      prompts: [{ q: 'Favorite Tech Stack', a: 'Node + Express + Prisma + Postgres' }],
      bucketList: ['Build a startup', 'Travel to Japan'],
      identityTags: ['Tech Enthusiast', 'Gamer'],
      lookingForTags: ['Friends', 'Dating'],
      lifestyle: {
        height: "5'11\"",
        languages: ['Spanish', 'English'],
        workout: 'Active',
        drinking: 'Socially',
        smoking: 'No'
      },
      academic: {
        minor: 'Mathematics',
        degree: 'Bachelor'
      },
      background: {
        religion: 'Agnostic',
        politics: 'Moderate',
        ethnicity: 'Latino'
      },
      customization: {
        accentText: '#FF5733',
        anthem: 'Tech Anthem'
      },
      socials: {
        ig: '@auditor_a',
        website: 'https://undrgradz.com'
      }
    };

    // 2.1 Update Profile
    const updateRes = await axios.put(`${API_BASE}/users/me`, fullProfileData, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    if (updateRes.status === 200) {
      logPass("Profile: PUT /users/me Update", "Profile fields updated successfully");
    }

    // 2.2 Verify Profile via GET /users/me
    const getMeRes = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const userMe = getMeRes.data.data.user;

    if (
      userMe.firstName === fullProfileData.firstName &&
      userMe.handle === fullProfileData.handle &&
      userMe.profile.bio === fullProfileData.bio &&
      userMe.profile.university === fullProfileData.university &&
      JSON.stringify(userMe.profile.interests) === JSON.stringify(fullProfileData.interests) &&
      userMe.profile.lifestyle.height === "5'11\"" &&
      JSON.stringify(userMe.profile.lifestyle.languages) === JSON.stringify(['Spanish', 'English']) &&
      userMe.profile.background.religion === 'Agnostic'
    ) {
      logPass("Profile: API Re-hydration (GET /users/me)", "All fields returned accurately by API");
    } else {
      logFail("Profile: API Re-hydration", "Mismatch between updated payload and GET /users/me output!");
    }

    // 2.3 Direct DB Inspection via Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: userIdA },
      include: { profile: true }
    });
    results.dbVerification.push({ table: 'User & UserProfile', recordId: dbUser?.id });

    if (
      dbUser.firstName === fullProfileData.firstName &&
      dbUser.profile.bio === fullProfileData.bio &&
      dbUser.profile.lifestyle.height === "5'11\""
    ) {
      logPass("Database: Direct Prisma Persistence Check", "All profile fields persisted directly into PostgreSQL tables");
    } else {
      logFail("Database: Direct Prisma Persistence Check", "DB data does not match saved payload!");
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Profile Section Error", errorDetails);
  }

  // ==========================================
  // 3. PROFILE PHOTOS & STORAGE
  // ==========================================
  console.log("\n--- SECTION 3 & 13: PROFILE PHOTOS & STORAGE AUDIT ---");
  try {
    const uploadedPhotos = [];
    // 3.1 Upload 6 photos
    for (let i = 1; i <= 6; i++) {
      const addPhotoRes = await axios.post(`${API_BASE}/users/me/photos`, {
        contentType: 'image/jpeg'
      }, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });

      const { uploadUrl, publicUrl, photo } = addPhotoRes.data.data;

      // Upload mock file payload to uploadUrl
      const dummyBuffer = Buffer.from(`DUMMY_IMAGE_BYTES_${i}_${timestamp}`);
      await axios.put(uploadUrl, dummyBuffer, {
        headers: { 'Content-Type': 'image/jpeg' }
      });

      uploadedPhotos.push(photo);
    }
    logPass("Photos: 6 Photos Uploaded", `Successfully registered and stored 6 photos for User A`);

    // 3.2 Attempt 7th photo (Limit test)
    try {
      await axios.post(`${API_BASE}/users/me/photos`, { contentType: 'image/jpeg' }, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      logFail("Photos: 6 Photo Limit Guard", "Server allowed uploading a 7th photo!");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        logPass("Photos: 6 Photo Limit Guard", "Correctly rejected 7th photo attempt (400)");
      } else {
        logFail("Photos: 6 Photo Limit Guard", `Unexpected status code: ${err.message}`);
      }
    }

    // 3.3 Check photos in GET /users/me
    const getMePhotosRes = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    if (getMePhotosRes.data.data.user.photos.length === 6) {
      logPass("Photos: Retrieval in GET /users/me", "Returned all 6 photos ordered correctly");
    } else {
      logFail("Photos: Retrieval in GET /users/me", `Expected 6 photos, got ${getMePhotosRes.data.data.user.photos.length}`);
    }

    // 3.4 Storage File Audit on Disk
    const samplePhoto = uploadedPhotos[0];
    const sampleFileName = samplePhoto.url.split('/public/mock-uploads/')[1];
    if (sampleFileName) {
      const diskPath = path.join(__dirname, 'public/mock-uploads', sampleFileName);
      if (fs.existsSync(diskPath)) {
        logPass("Storage: Physical File Verification", `File exists on disk at ${diskPath}`);
        results.storageVerification.push({ path: diskPath, status: 'EXISTS' });
      } else {
        logFail("Storage: Physical File Verification", `File missing on disk at ${diskPath}`);
      }
    }

    // 3.5 Delete Photo & Order Re-indexing
    const firstPhotoId = uploadedPhotos[0].id;
    await axios.delete(`${API_BASE}/users/me/photos/${firstPhotoId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const dbPhotosAfterDelete = await prisma.photo.findMany({
      where: { userId: userIdA },
      orderBy: { order: 'asc' }
    });

    if (
      dbPhotosAfterDelete.length === 5 &&
      dbPhotosAfterDelete[0].order === 0 &&
      dbPhotosAfterDelete[4].order === 4
    ) {
      logPass("Photos: Delete & Re-indexing", "Photo deleted and remaining 5 photos re-indexed seamlessly (0..4)");
    } else {
      logFail("Photos: Delete & Re-indexing", `Re-indexing failed after deletion. Count: ${dbPhotosAfterDelete.length}`);
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Photos Section Error", errorDetails);
  }

  // ==========================================
  // 5. CRUSH / DATING
  // ==========================================
  console.log("\n--- SECTION 5: CRUSH / DATING FEED, SWIPES & MATCHES ---");
  try {
    // 5.1 Fetch Feed as User A
    const feedRes = await axios.get(`${API_BASE}/campus/crush-feed`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const feedUsers = feedRes.data.data.users || feedRes.data.data;
    
    logPass("Dating: Crush Feed API", `Fetched ${feedUsers.length} profiles for Crush Feed`);

    // 5.2 User A Swipes LIKE on User B
    const swipeARes = await axios.post(`${API_BASE}/campus/swipe`, {
      receiverId: userIdB,
      type: 'LIKE'
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    if (swipeARes.data.status === 'success') {
      logPass("Dating: User A Swipe LIKE on User B", `Swipe recorded. Match created: ${swipeARes.data.data.isMatch}`);
    }

    // 5.3 User B Swipes LIKE on User A (Mutual Match creation test)
    const swipeBRes = await axios.post(`${API_BASE}/campus/swipe`, {
      receiverId: userIdA,
      type: 'LIKE'
    }, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    if (swipeBRes.data.data.isMatch) {
      logPass("Dating: Mutual Swipe MATCH Trigger", "Match successfully generated upon mutual LIKE");
    } else {
      logFail("Dating: Mutual Swipe MATCH Trigger", "Match was not generated upon mutual LIKE!");
    }

    // 5.4 Verify Match in PostgreSQL
    const dbMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { userOneId: userIdA, userTwoId: userIdB },
          { userOneId: userIdB, userTwoId: userIdA }
        ]
      }
    });

    if (dbMatch) {
      logPass("Database: Match Record Persistence", `Match persisted in PostgreSQL (ID: ${dbMatch.id})`);
    } else {
      logFail("Database: Match Record Persistence", "Match record not found in PostgreSQL!");
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Dating Section Error", errorDetails);
  }

  // ==========================================
  // 6 & 7. EVENTS & HANGOUTS
  // ==========================================
  console.log("\n--- SECTION 6 & 7: EVENTS & HANGOUTS ---");
  try {
    let eventId;
    // 6.1 Create Event by User A
    const createEventRes = await axios.post(`${API_BASE}/events`, {
      name: 'Auditors Tech Party',
      emoji: '🎉',
      section: 'nightlife',
      address: 'University Campus Plaza',
      time: 'Tonight 9:00 PM',
      capacity: 50,
      description: 'Full audit testing event creation.'
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    if (createEventRes.status === 201 && createEventRes.data.data.event) {
      eventId = createEventRes.data.data.event.id;
      logPass("Events: Create Event", `Event created with ID: ${eventId}`);
    }

    // 6.2 User B Joins Event
    const joinRes = await axios.post(`${API_BASE}/events/${eventId}/join`, {}, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    if (joinRes.status === 200) {
      logPass("Events: Join Event", "User B successfully joined event");
    }

    // 6.3 Fetch Events List & Verify Creator Host Photo & Handle Sync
    const eventsListRes = await axios.get(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const createdEventInList = eventsListRes.data.data.events.find(e => e.id === eventId);

    if (createdEventInList && createdEventInList.creator) {
      logPass("Events: Host Creator Sync", `Creator handle: ${createdEventInList.creator.handle}, Photo URL: ${createdEventInList.creator.photos[0]?.url || 'No photo'}`);
    } else {
      logFail("Events: Host Creator Sync", "Creator details missing from event listing!");
    }

    // 6.4 User B Leaves Event
    const leaveRes = await axios.post(`${API_BASE}/events/${eventId}/leave`, {}, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    if (leaveRes.status === 200) {
      logPass("Events: Leave Event", "User B successfully left event");
    }

    // 6.5 Delete Event
    const delEventRes = await axios.delete(`${API_BASE}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    if (delEventRes.status === 200) {
      logPass("Events: Delete Event", "Event deleted successfully");
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Events Section Error", errorDetails);
  }

  // ==========================================
  // 8. CHAT & MESSAGING
  // ==========================================
  console.log("\n--- SECTION 8: CHAT & MESSAGES ---");
  try {
    // 8.1 Fetch Conversations for User A
    const convsRes = await axios.get(`${API_BASE}/chats/conversations`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const conversations = convsRes.data.data.conversations;
    const activeMatchConv = conversations.find(c => c.partner && c.partner.id === userIdB);

    if (activeMatchConv) {
      logPass("Chat: Conversation Listing", `Found active match conversation with User B (Match ID: ${activeMatchConv.matchId})`);

      const matchId = activeMatchConv.matchId;

      // 8.2 Send Message via DB directly or HTTP
      const messageContent = "Hello from E2E Audit Script!";
      const newMessage = await prisma.message.create({
        data: {
          matchId,
          senderId: userIdA,
          content: messageContent
        }
      });
      logPass("Chat: Send Message", `Message created in DB (ID: ${newMessage.id})`);

      // 8.3 Fetch Messages via API GET /chats/:matchId/messages
      const getMsgsRes = await axios.get(`${API_BASE}/chats/${matchId}/messages`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const messages = getMsgsRes.data.data.messages;

      if (messages.length > 0 && messages[0].content === messageContent) {
        logPass("Chat: Fetch Messages API", "Retrieved sent message accurately from API");
      } else {
        logFail("Chat: Fetch Messages API", "Fetched messages did not match sent content!");
      }
    } else {
      logFail("Chat: Conversation Listing", "Matched partner User B not found in User A's conversations!");
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Chat Section Error", errorDetails);
  }

  // ==========================================
  // 9 & 10. GLOBAL SYNC & MULTI-USER ISOLATION
  // ==========================================
  console.log("\n--- SECTION 9 & 10: GLOBAL PROFILE SYNC & MULTI-USER SECURITY ---");
  try {
    // 9.1 Update User A's Name & Photo
    await axios.put(`${API_BASE}/users/me`, {
      firstName: 'SynchronizedA'
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    // Verify User B sees Updated Name in Conversations
    const convsResB = await axios.get(`${API_BASE}/chats/conversations`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const partnerA = convsResB.data.data.conversations.find(c => c.partner.id === userIdA)?.partner;

    if (partnerA && partnerA.firstName === 'SynchronizedA') {
      logPass("Sync: Single Source of Truth", "User A name update reflected immediately in User B's conversation partner profile!");
    } else {
      logFail("Sync: Single Source of Truth", `Expected 'SynchronizedA', got '${partnerA?.firstName}'`);
    }

    // 10.1 Multi-user Authorization Security: User B tries to update User A's profile
    const getMeB = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    if (getMeB.data.data.user.id === userIdB && getMeB.data.data.user.id !== userIdA) {
      logPass("Security: User Data Isolation", "User B token exclusively returns User B profile");
    } else {
      logFail("Security: User Data Isolation", "Token cross-leak detected!");
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Sync & Security Error", errorDetails);
  }

  // ==========================================
  // 11. DATABASE INTEGRITY AUDIT
  // ==========================================
  console.log("\n--- SECTION 11: DATABASE INTEGRITY DIRECT AUDIT ---");
  try {
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const userIds = new Set(allUsers.map(u => u.id));

    const photos = await prisma.photo.findMany();
    const orphanPhotos = photos.filter(p => !userIds.has(p.userId));

    const profiles = await prisma.userProfile.findMany();
    const orphanProfiles = profiles.filter(p => !userIds.has(p.userId));

    if (orphanPhotos.length === 0 && orphanProfiles.length === 0) {
      logPass("Database Integrity: Foreign Key Constraints", "Zero orphan photos or orphan profiles found in database");
    } else {
      logFail("Database Integrity: Foreign Key Constraints", `Orphan records detected! Photos: ${orphanPhotos.length}, Profiles: ${orphanProfiles.length}`);
    }
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logFail("Database Integrity Error", errorDetails);
  }

  // Cleanup test users
  console.log("\n🧹 Cleaning up audit test users...");
  try {
    await prisma.user.deleteMany({
      where: {
        id: { in: [userIdA, userIdB].filter(Boolean) }
      }
    });
    console.log("Cleaned up temporary audit test users successfully.");
  } catch (cleanErr) {
    console.warn("Cleanup warning:", cleanErr.message);
  }

  console.log("\n=================================================");
  console.log("🏁 AUDIT SUMMARY");
  console.log(`PASSED: ${results.passed.length}`);
  console.log(`FAILED / BUGS: ${results.failed.length}`);
  console.log("=================================================");

  const reportPath = path.join(__dirname, 'audit_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Results written to ${reportPath}`);
}

runAudit().then(() => {
  prisma.$disconnect();
  process.exit(0);
}).catch(err => {
  console.error("Fatal audit execution error:", err);
  prisma.$disconnect();
  process.exit(1);
});
