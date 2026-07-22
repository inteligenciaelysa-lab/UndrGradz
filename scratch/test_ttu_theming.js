const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting TTU Verification Tests...');

  // 1. Load universities.json to read the expected TTU config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const ttuExpected = uniConfig['ttu.edu'];
  
  if (!ttuExpected) {
    console.error('❌ Error: ttu.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found TTU configuration in universities.json.');

  // 2. Fetch all TTU users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@ttu.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 50) {
    console.error(`❌ Error: Found ${users.length} TTU users in the database instead of 50!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} TTU users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== ttuExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${ttuExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in Lubbock area (roughly: lat 33.45 to 33.65, lon -101.95 to -101.8)
    const lat = user.profile.latitude;
    const lon = user.profile.longitude;
    const isLubbockLat = lat >= 33.45 && lat <= 33.65;
    const isLubbockLon = lon >= -101.95 && lon <= -101.80;
    if (!isLubbockLat || !isLubbockLon) {
      console.error(`❌ Error: User ${user.handle} coordinates (Lat: ${lat}, Lon: ${lon}) are outside Lubbock, TX bounds!`);
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

  console.log(`✅ Checked all ${passedCount} TTU users. All fields are perfectly valid.`);
  console.log(`🎨 TTU Colors - Primary: ${ttuExpected.p}, Secondary: ${ttuExpected.p2}`);
  console.log(`🖼️ TTU Cover Photos:`, ttuExpected.coverPhotos);

  console.log('🎉 All TTU checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
