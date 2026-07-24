const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:3000/api/v1';

async function runThreeUserIsolationTest() {
  console.log("=================================================");
  console.log("🧪 RUNNING 3-USER CONTROLLED ISOLATION TEST");
  console.log("=================================================\n");

  const ts = Date.now().toString().slice(-6);
  const password = 'Password123!';

  const userAData = { email: `user_a_${ts}@test.com`, password, firstName: 'UserA', lastName: 'Test', handle: `usera_${ts}`, birthDate: '2002-01-01T00:00:00.000Z' };
  const userBData = { email: `user_b_${ts}@test.com`, password, firstName: 'UserB', lastName: 'Test', handle: `userb_${ts}`, birthDate: '2001-02-02T00:00:00.000Z' };
  const userCData = { email: `user_c_${ts}@test.com`, password, firstName: 'UserC', lastName: 'Test', handle: `userc_${ts}`, birthDate: '2003-03-03T00:00:00.000Z' };

  let tokenA, tokenB, tokenC, idA, idB, idC;

  try {
    // 1. REGISTER USERS
    console.log("Step 1: Registering User A, User B, and User C...");
    const regA = await axios.post(`${API_BASE}/auth/register`, userAData);
    const regB = await axios.post(`${API_BASE}/auth/register`, userBData);
    const regC = await axios.post(`${API_BASE}/auth/register`, userCData);

    idA = regA.data.data.user.id;
    idB = regB.data.data.user.id;
    idC = regC.data.data.user.id;

    console.log(`Registered: A (${idA}), B (${idB}), C (${idC})`);

    // 2. LOGIN USERS
    const loginA = await axios.post(`${API_BASE}/auth/login`, { email: userAData.email, password });
    const loginB = await axios.post(`${API_BASE}/auth/login`, { email: userBData.email, password });
    const loginC = await axios.post(`${API_BASE}/auth/login`, { email: userCData.email, password });

    tokenA = loginA.data.data.accessToken;
    tokenB = loginB.data.data.accessToken;
    tokenC = loginC.data.data.accessToken;

    // 3. INITIAL CLEAN STATE VERIFICATION
    console.log("\nStep 2: Verifying INITIAL CLEAN STATE for new users...");

    async function checkCleanState(token, userId, userName) {
      const convs = (await axios.get(`${API_BASE}/chats/conversations`, { headers: { Authorization: `Bearer ${token}` } })).data.data.conversations;
      const stats = (await axios.get(`${API_BASE}/campus/stats`, { headers: { Authorization: `Bearer ${token}` } })).data.data;
      const admirersRes = (await axios.get(`${API_BASE}/campus/admirers`, { headers: { Authorization: `Bearer ${token}` } })).data.data;
      const admirers = admirersRes.admirers || admirersRes.likes || [];
      const sentLikesRes = (await axios.get(`${API_BASE}/campus/sent-likes`, { headers: { Authorization: `Bearer ${token}` } })).data.data;
      const sentLikes = sentLikesRes.sentLikes || sentLikesRes.likes || [];
      const events = (await axios.get(`${API_BASE}/events`, { headers: { Authorization: `Bearer ${token}` } })).data.data.events;
      const myEvents = events.filter(e => e.creatorId === userId);
      const joinedEvents = events.filter(e => e.attendees && e.attendees.some(a => a.id === userId));

      console.log(`Checking ${userName}:`);
      console.log(`  Conversations: ${convs.length} (Expected: 0)`);
      console.log(`  Total Likes Received: ${stats.totalLikes} (Expected: 0)`);
      console.log(`  Total Sent Likes: ${stats.totalSentLikes} (Expected: 0)`);
      console.log(`  Admirers Count: ${admirers.length} (Expected: 0)`);
      console.log(`  Events Created: ${myEvents.length} (Expected: 0)`);
      console.log(`  Events Joined: ${joinedEvents.length} (Expected: 0)`);

      if (convs.length !== 0 || stats.totalLikes !== 0 || stats.totalSentLikes !== 0 || admirers.length !== 0 || myEvents.length !== 0 || joinedEvents.length !== 0) {
        throw new Error(`Initial state for ${userName} is NOT CLEAN!`);
      }
      console.log(`✅ ${userName} INITIAL STATE IS 100% CLEAN.`);
    }

    await checkCleanState(tokenA, idA, 'User A');
    await checkCleanState(tokenB, idB, 'User B');
    await checkCleanState(tokenC, idC, 'User C');

    // 4. CONTROLLED INTERACTION PHASE 1: User A likes User B
    console.log("\nStep 3: User A swipes LIKE on User B...");
    const swipe1 = await axios.post(`${API_BASE}/campus/swipe`, { receiverId: idB, type: 'LIKE' }, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log(`Swipe response: isMatch=${swipe1.data.data.isMatch}`);

    // Verify after A -> B swipe
    console.log("\nVerifying states after User A -> User B swipe:");

    const statsA1 = (await axios.get(`${API_BASE}/campus/stats`, { headers: { Authorization: `Bearer ${tokenA}` } })).data.data;
    const statsB1 = (await axios.get(`${API_BASE}/campus/stats`, { headers: { Authorization: `Bearer ${tokenB}` } })).data.data;
    const statsC1 = (await axios.get(`${API_BASE}/campus/stats`, { headers: { Authorization: `Bearer ${tokenC}` } })).data.data;

    const admirersB1Res = (await axios.get(`${API_BASE}/campus/admirers`, { headers: { Authorization: `Bearer ${tokenB}` } })).data.data;
    const admirersB1 = admirersB1Res.admirers || admirersB1Res.likes || [];
    const convsA1 = (await axios.get(`${API_BASE}/chats/conversations`, { headers: { Authorization: `Bearer ${tokenA}` } })).data.data.conversations;

    console.log(`User A: Sent Likes = ${statsA1.totalSentLikes} (Exp: 1), Matches/Conversations = ${convsA1.length} (Exp: 0)`);
    console.log(`User B: Received Likes = ${statsB1.totalLikes} (Exp: 1), Admirers = ${admirersB1.length} (Exp: 1), Matches = 0`);
    console.log(`User C: Received Likes = ${statsC1.totalLikes} (Exp: 0), Sent Likes = ${statsC1.totalSentLikes} (Exp: 0)`);

    if (statsA1.totalSentLikes !== 1 || convsA1.length !== 0 || statsB1.totalLikes !== 1 || admirersB1.length !== 1 || statsC1.totalLikes !== 0) {
      throw new Error("State verification failed after User A -> User B swipe!");
    }
    console.log("✅ Phase 1 swipe states verified perfectly.");

    // 5. CONTROLLED INTERACTION PHASE 2: User B likes User A (MUTUAL MATCH)
    console.log("\nStep 4: User B swipes LIKE on User A (Mutual Match)...");
    const swipe2 = await axios.post(`${API_BASE}/campus/swipe`, { receiverId: idA, type: 'LIKE' }, { headers: { Authorization: `Bearer ${tokenB}` } });
    console.log(`Swipe response: isMatch=${swipe2.data.data.isMatch}`);

    if (!swipe2.data.data.isMatch) {
      throw new Error("Expected mutual swipe to generate a MATCH!");
    }

    // Verify after A <-> B Match
    console.log("\nVerifying states after Mutual Match (User A <-> User B):");

    const convsA2 = (await axios.get(`${API_BASE}/chats/conversations`, { headers: { Authorization: `Bearer ${tokenA}` } })).data.data.conversations;
    const convsB2 = (await axios.get(`${API_BASE}/chats/conversations`, { headers: { Authorization: `Bearer ${tokenB}` } })).data.data.conversations;
    const convsC2 = (await axios.get(`${API_BASE}/chats/conversations`, { headers: { Authorization: `Bearer ${tokenC}` } })).data.data.conversations;

    console.log(`User A Conversations: ${convsA2.length} (Exp: 1 with User B)`);
    console.log(`User B Conversations: ${convsB2.length} (Exp: 1 with User A)`);
    console.log(`User C Conversations: ${convsC2.length} (Exp: 0)`);

    if (convsA2.length !== 1 || convsA2[0].partner.id !== idB) throw new Error("User A conversation missing or partner incorrect!");
    if (convsB2.length !== 1 || convsB2[0].partner.id !== idA) throw new Error("User B conversation missing or partner incorrect!");
    if (convsC2.length !== 0) throw new Error("User C illegally received conversations!");

    console.log("✅ Phase 2 mutual match and conversation isolation verified perfectly!");

    // 6. DB DIRECT AUDIT
    const dbMatch = await prisma.match.findFirst({
      where: { OR: [{ userOneId: idA, userTwoId: idB }, { userOneId: idB, userTwoId: idA }] }
    });
    console.log(`PostgreSQL Direct Check: Match record ID = ${dbMatch?.id}`);
    if (!dbMatch) throw new Error("Match missing in PostgreSQL database!");

    console.log("\n=================================================");
    console.log("🎉 ALL 3-USER ISOLATION TESTS PASSED 100%");
    console.log("=================================================");

  } catch (err) {
    console.error("❌ ISOLATION TEST FAILED:", err.response?.data || err.message);
  } finally {
    console.log("\nCleaning up test users A, B, C...");
    await prisma.user.deleteMany({
      where: { id: { in: [idA, idB, idC].filter(Boolean) } }
    });
    await prisma.$disconnect();
  }
}

runThreeUserIsolationTest();
