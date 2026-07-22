const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting Baylor University Verification Tests...');

  // 1. Load universities.json to read the expected Baylor config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const buExpected = uniConfig['baylor.edu'];
  
  if (!buExpected) {
    console.error('❌ Error: baylor.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found Baylor configuration in universities.json.');

  // 2. Fetch all Baylor users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@baylor.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 50) {
    console.error(`❌ Error: Found ${users.length} Baylor users in the database instead of 50!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} Baylor users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== buExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${buExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in Waco area (roughly: lat 31.45 to 31.65, lon -97.2 to -97.05)
    const lat = user.profile.latitude;
    const lon = user.profile.longitude;
    const isWacoLat = lat >= 31.45 && lat <= 31.65;
    const isWacoLon = lon >= -97.25 && lon <= -97.05;
    if (!isWacoLat || !isWacoLon) {
      console.error(`❌ Error: User ${user.handle} coordinates (Lat: ${lat}, Lon: ${lon}) are outside Waco, TX bounds!`);
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

  console.log(`✅ Checked all ${passedCount} Baylor users. All fields are perfectly valid.`);
  console.log(`🎨 Baylor Colors - Primary: ${buExpected.p}, Secondary: ${buExpected.p2}`);
  console.log(`🖼️ Baylor Cover Photos:`, buExpected.coverPhotos);

  console.log('🎉 All Baylor checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
