const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting UT Austin Verification Tests...');

  // 1. Load universities.json to read the expected UT Austin config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const utExpected = uniConfig['utexas.edu'];
  
  if (!utExpected) {
    console.error('❌ Error: utexas.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found UT Austin configuration in universities.json.');

  // 2. Fetch all UT Austin users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@utexas.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 50) {
    console.error(`❌ Error: Found ${users.length} UT Austin users in the database instead of 50!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} UT Austin users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== utExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${utExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in Austin area (roughly: lat 30.2 to 30.4, lon -97.8 to -97.6)
    const lat = user.profile.latitude;
    const lon = user.profile.longitude;
    const isAustinLat = lat >= 30.15 && lat <= 30.35;
    const isAustinLon = lon >= -97.85 && lon <= -97.65;
    if (!isAustinLat || !isAustinLon) {
      console.error(`❌ Error: User ${user.handle} coordinates (Lat: ${lat}, Lon: ${lon}) are outside Austin, TX bounds!`);
      process.exit(1);
    }

    // Verify exactly 3 photos
    const photoCount = user.photos.length;
    if (photoCount !== 3) {
      console.error(`❌ Error: User ${user.handle} has ${photoCount} photos instead of 3!`);
      process.exit(1);
    }

    // Verify handle is custom/creative (does not end with generic _ut)
    if (user.handle.endsWith('_ut')) {
      console.error(`❌ Error: User ${user.handle} has a generic handle!`);
      process.exit(1);
    }

    passedCount++;
  }

  console.log(`✅ Checked all ${passedCount} UT Austin users. All fields are perfectly valid.`);
  console.log(`🎨 UT Austin Colors - Primary: ${utExpected.p}, Secondary: ${utExpected.p2}`);
  console.log(`🖼️ UT Austin Cover Photos:`, utExpected.coverPhotos);

  console.log('🎉 All UT Austin checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
