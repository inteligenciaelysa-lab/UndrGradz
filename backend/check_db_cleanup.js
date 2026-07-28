const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCleanup() {
  const testUnis = await prisma.university.count({ where: { domain: { contains: 'qa-' } } });
  const testAdmins = await prisma.user.count({ where: { email: { contains: 'qa-admin' } } });
  const testUsers = await prisma.user.count({ where: { email: { contains: 'test-qa' } } });
  const totalEvents = await prisma.event.count();
  const totalReports = await prisma.report.count();

  console.log('📊 POSTGRESQL CLEANUP VERIFICATION:');
  console.log(`  └─ Test Universities in DB: ${testUnis}`);
  console.log(`  └─ Test Admin Accounts in DB: ${testAdmins}`);
  console.log(`  └─ Test Users in DB: ${testUsers}`);
  console.log(`  └─ Total Events in DB: ${totalEvents}`);
  console.log(`  └─ Total Reports in DB: ${totalReports}`);
}

checkCleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
