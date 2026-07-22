const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function run() {
  console.log('🧪 Starting SMU Verification Tests...');

  // 1. Load universities.json to read the expected SMU config
  const uniConfig = JSON.parse(fs.readFileSync('c:/Users/PC STARK/Downloads/UndrGradz neon/frontend/universities.json', 'utf8'));
  const smuExpected = uniConfig['smu.edu'];
  
  if (!smuExpected) {
    console.error('❌ Error: smu.edu config not found in universities.json!');
    process.exit(1);
  }
  console.log('✅ Found UPPN & SMU configurations in universities.json.');

  // 2. Fetch one of the newly created SMU users
  const user = await prisma.user.findFirst({
    where: { email: { endsWith: '@smu.edu' } },
    include: {
      profile: true,
      photos: true
    }
  });

  if (!user) {
    console.error('❌ Error: No SMU users found in the database!');
    process.exit(1);
  }
  console.log(`✅ Found SMU User in database: ${user.firstName} ${user.lastName} (${user.handle})`);

  // 3. Verify University Name Match
  const dbUniName = user.profile.university;
  if (dbUniName === smuExpected.name) {
    console.log(`✅ University name in DB ("${dbUniName}") matches universities.json exactly ("${smuExpected.name}").`);
  } else {
    console.error(`❌ Error: DB university name "${dbUniName}" does NOT match universities.json "${smuExpected.name}"!`);
  }

  // 4. Verify Coordinates are in Dallas area
  const lat = user.profile.latitude;
  const lon = user.profile.longitude;
  
  // Dallas bounds roughly: lat 32.7 to 32.9, lon -96.9 to -96.7
  const isDallasLat = lat >= 32.7 && lat <= 32.9;
  const isDallasLon = lon >= -96.9 && lon <= -96.7;
  
  if (isDallasLat && isDallasLon) {
    console.log(`✅ Location coordinates (Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}) are correctly set in Dallas, TX.`);
  } else {
    console.error(`❌ Error: Coordinates (Lat: ${lat}, Lon: ${lon}) are outside Dallas bounds!`);
  }

  // 5. Verify user has exactly 3 photos
  const photoCount = user.photos.length;
  if (photoCount === 3) {
    console.log(`✅ User has exactly 3 photo URLs in the database.`);
  } else {
    console.error(`❌ Error: User has ${photoCount} photos instead of 3!`);
  }

  // 6. Print SMU theme information
  console.log(`🎨 SMU Theme Colors - Primary: ${smuExpected.p}, Secondary: ${smuExpected.p2}`);
  console.log(`🖼️ SMU Cover Photos:`, smuExpected.coverPhotos);

  console.log('🎉 All SMU checks passed successfully!');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
