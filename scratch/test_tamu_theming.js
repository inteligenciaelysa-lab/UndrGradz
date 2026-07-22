const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting Texas A&M University Verification Tests...');

  // 1. Load universities.json to read the expected TAMU config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const tamuExpected = uniConfig['tamu.edu'];
  
  if (!tamuExpected) {
    console.error('❌ Error: tamu.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found TAMU configuration in universities.json.');

  // 2. Fetch all TAMU users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@tamu.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 30) {
    console.error(`❌ Error: Found ${users.length} TAMU users in the database instead of 30!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} TAMU users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== tamuExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${tamuExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in College Station area (roughly: lat 30.55 to 30.65, lon -96.40 to -96.25)
    const lat = user.profile.latitude;
    const lon = user.profile.longitude;
    const isCStationLat = lat >= 30.55 && lat <= 30.65;
    const isCStationLon = lon >= -96.40 && lon <= -96.25;
    if (!isCStationLat || !isCStationLon) {
      console.error(`❌ Error: User ${user.handle} coordinates (Lat: ${lat}, Lon: ${lon}) are outside College Station bounds!`);
      process.exit(1);
    }

    // Verify exactly 3 photos
    const photoCount = user.photos.length;
    if (photoCount !== 3) {
      console.error(`❌ Error: User ${user.handle} has ${photoCount} photos instead of 3!`);
      process.exit(1);
    }

    // Verify handle is alphanumeric, no dots, no underscores (excluding the prefix @)
    const handleWithoutAt = user.handle.startsWith('@') ? user.handle.substring(1) : user.handle;
    const isPureAlphanumeric = /^[a-zA-Z0-9]+$/.test(handleWithoutAt);
    if (!isPureAlphanumeric) {
      console.error(`❌ Error: User ${user.handle} has a handle that contains dots, underscores, or other punctuation!`);
      process.exit(1);
    }

    passedCount++;
  }

  console.log(`✅ Checked all ${passedCount} TAMU users. All fields are perfectly valid.`);
  console.log(`🎨 TAMU Colors - Primary: ${tamuExpected.p}, Secondary: ${tamuExpected.p2}`);
  console.log(`🖼️ TAMU Cover Photos:`, tamuExpected.coverPhotos);

  console.log('🎉 All Texas A&M checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
