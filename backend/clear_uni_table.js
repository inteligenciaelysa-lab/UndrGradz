const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "University" CASCADE;');
  console.log('✅ Temporary University sample records cleared.');
}

main().finally(() => prisma.$disconnect());
