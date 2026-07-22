const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting UH Verification Tests...');

  // 1. Load universities.json to read the expected UH config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const uhExpected = uniConfig['uh.edu'];
  
  if (!uhExpected) {
    console.error('❌ Error: uh.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found UH configuration in universities.json.');

  // 2. Fetch all UH users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@uh.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 20) {
    console.error(`❌ Error: Found ${users.length} UH users in the database instead of 20!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} UH users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== uhExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${uhExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in Houston area (roughly: lat 29.60 to 29.85, lon -95.50 to -95.30)
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

  console.log(`✅ Checked all ${passedCount} UH users. All fields are perfectly valid.`);
  console.log(`🎨 UH Colors - Primary: ${uhExpected.p}, Secondary: ${uhExpected.p2}`);
  console.log(`🖼️ UH Cover Photos:`, uhExpected.coverPhotos);

  console.log('🎉 All UH checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
