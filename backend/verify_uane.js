const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    },
    include: {
      profile: true,
      photos: true
    }
  });

  console.log(`Total UANE users in DB: ${users.length}`);
  users.forEach((u, i) => {
    console.log(`${i+1}. ${u.firstName} ${u.lastName}`);
    console.log(`   Handle: ${u.handle}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Campus: ${u.profile.academic ? u.profile.academic.campus : 'N/A'}`);
    console.log(`   Photos count: ${u.photos.length}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
