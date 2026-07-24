const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "AdminSession" CASCADE;');
  console.log('✅ AdminSession table cleared.');
}

main().finally(() => prisma.$disconnect());
