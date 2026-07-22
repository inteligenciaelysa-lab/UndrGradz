const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      profile: true
    }
  });

  const uniCounts = {};
  users.forEach(u => {
    const uniName = u.profile ? u.profile.university : 'No Profile';
    uniCounts[uniName] = (uniCounts[uniName] || 0) + 1;
  });

  console.log("Total users in DB:", users.length);
  console.log("University distribution:", uniCounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
