const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting UTSA Verification Tests...');

  // 1. Load universities.json to read the expected UTSA config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const utsaExpected = uniConfig['utsa.edu'];
  
  if (!utsaExpected) {
    console.error('❌ Error: utsa.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found UTSA configuration in universities.json.');

  // 2. Fetch all UTSA users to perform checks
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@utsa.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (users.length !== 50) {
    console.error(`❌ Error: Found ${users.length} UTSA users in the database instead of 50!`);
    process.exit(1);
  }
  console.log(`✅ Found exactly ${users.length} UTSA users in the database.`);

  // 3. Verify each user details
  let passedCount = 0;
  for (const user of users) {
    const dbUniName = user.profile.university;
    if (dbUniName !== utsaExpected.name) {
      console.error(`❌ Error: DB university name "${dbUniName}" for user ${user.handle} does NOT match universities.json "${utsaExpected.name}"!`);
      process.exit(1);
    }

    // Verify Coordinates are in San Antonio area (roughly: lat 29.35 to 29.65, lon -98.65 to -98.4)
    const lat = user.profile.latitude;
    const lon = user.profile.longitude;
    const isAustinLat = lat >= 29.35 && lat <= 29.65;
    const isAustinLon = lon >= -98.70 && lon <= -98.35;
    if (!isAustinLat || !isAustinLon) {
      console.error(`❌ Error: User ${user.handle} coordinates (Lat: ${lat}, Lon: ${lon}) are outside San Antonio, TX bounds!`);
      process.exit(1);
    }

    // Verify exactly 3 photos
    const photoCount = user.photos.length;
    if (photoCount !== 3) {
      console.error(`❌ Error: User ${user.handle} has ${photoCount} photos instead of 3!`);
      process.exit(1);
    }

    // Verify handle is custom/creative (does not end with generic _utsa)
    if (user.handle.endsWith('_utsa')) {
      console.error(`❌ Error: User ${user.handle} has a generic handle!`);
      process.exit(1);
    }

    passedCount++;
  }

  console.log(`✅ Checked all ${passedCount} UTSA users. All fields are perfectly valid.`);
  console.log(`🎨 UTSA Colors - Primary: ${utsaExpected.p}, Secondary: ${utsaExpected.p2}`);
  console.log(`🖼️ UTSA Cover Photos:`, utsaExpected.coverPhotos);

  console.log('🎉 All UTSA checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
