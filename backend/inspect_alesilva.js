const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      handle: {
        contains: 'alesilva',
        mode: 'insensitive'
      }
    },
    include: {
      profile: true,
      photos: true
    }
  });

  if (!user) {
    console.log("User @alesilva not found");
    return;
  }

  console.log("User details:");
  console.log("Name:", user.firstName, user.lastName);
  console.log("Email:", user.email);
  console.log("University:", user.profile ? user.profile.university : "No profile");
  console.log("Photos:");
  user.photos.forEach(p => {
    console.log(`- ID: ${p.id}, Order: ${p.order}, URL: ${p.url}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
