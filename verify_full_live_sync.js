const adminService = require('./backend/src/services/admin.service');
const userService = require('./backend/src/services/user.service');
const prisma = require('./backend/src/database/prisma');

async function testFullLiveSync() {
  console.log('🧪 Starting Full E2E Verification for University Live Sync...');

  // 1. Fetch UTNC university from database
  const utnc = await prisma.university.findFirst({ where: { domain: 'utnc.edu.mx' } });
  if (!utnc) {
    console.error('❌ UTNC University not found in database');
    process.exit(1);
  }
  console.log('📌 Current UTNC DB Record Name:', utnc.name);

  // 2. Fetch student user profile for @miiguelean
  const user = await prisma.user.findFirst({ where: { handle: 'miiguelean' } });
  if (!user) {
    console.error('❌ User @miiguelean not found in database');
    process.exit(1);
  }

  const profileBefore = await userService.getProfile(user.id);
  console.log('👤 Profile University name returned by userService:', profileBefore.profile.university);

  // 3. Perform live update via adminService (simulating Admin Panel edit)
  const testNewName = 'Iversidad Tecnológica del Norte de Coahuila';
  console.log(`✏️ Updating UTNC name via adminService to: "${testNewName}"...`);
  
  // Find super admin or admin user to pass valid adminId
  const adminUser = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
  const adminId = adminUser ? adminUser.id : user.id;

  const updatedUni = await adminService.updateUniversity(adminId, utnc.id, { name: testNewName }, '127.0.0.1');
  console.log('✅ AdminService update completed. DB name is now:', updatedUni.name);

  // 4. Verify userService.getProfile returns the updated DB name
  const profileAfter = await userService.getProfile(user.id);
  console.log('👤 Profile University name AFTER admin update:', profileAfter.profile.university);

  if (profileAfter.profile.university !== testNewName) {
    console.error(`❌ FAILURE: Expected "${testNewName}", got "${profileAfter.profile.university}"`);
    process.exit(1);
  }

  // 5. Verify public API returns the updated name
  const publicUnis = await adminService.getPublicUniversities({ q: 'utnc', limit: 5 });
  const matchedUni = publicUnis.find(u => u.domain === 'utnc.edu.mx');
  console.log('🌐 Public API returned name:', matchedUni.name);

  if (matchedUni.name !== testNewName) {
    console.error(`❌ FAILURE: Public API did not return "${testNewName}"`);
    process.exit(1);
  }

  console.log('🎉 SUCCESS: Full E2E Verification passed! All layers reflect the live Admin Panel updates.');
  process.exit(0);
}

testFullLiveSync().catch(err => {
  console.error('❌ E2E Error:', err);
  process.exit(1);
});
