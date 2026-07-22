const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting Rice University Verification Tests...');

  // 1. Load universities.json to read the expected Rice config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const riceExpected = uniConfig['rice.edu'];
  
  if (!riceExpected) {
    console.error('❌ Error: rice.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found Rice configuration in universities.json.');

  // 2. Fetch all Rice users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@rice.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 20) {
    console.error(`❌ Error: Found ${users.length} Rice users in the database instead of 20!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} Rice users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== riceExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${riceExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in Houston area (roughly: lat 29.65 to 29.8, lon -95.5 to -95.3)
    const lat = user.profile.latitude;
    const lon = user.profile.longitude;
    const isHoustonLat = lat >= 29.60 && lat <= 29.85;
    const isHoustonLon = lon >= -95.50 && lon <= -95.30;
    if (!isHoustonLat || !isHoustonLon) {
      console.error(`❌ Error: User ${user.handle} coordinates (Lat: ${lat}, Lon: ${lon}) are outside Houston, TX bounds!`);
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

  console.log(`✅ Checked all ${passedCount} Rice users. All fields are perfectly valid.`);
  console.log(`🎨 Rice Colors - Primary: ${riceExpected.p}, Secondary: ${riceExpected.p2}`);
  console.log(`🖼️ Rice Cover Photos:`, riceExpected.coverPhotos);

  console.log('🎉 All Rice checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
