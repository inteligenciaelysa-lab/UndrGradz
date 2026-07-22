const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating university name for UANE users in database to 'Universidad Americana del Noreste'...");
  
  const updatedProfiles = await prisma.userProfile.updateMany({
    where: {
      university: "Universidad Autónoma del Noreste"
    },
    data: {
      university: "Universidad Americana del Noreste"
    }
  });

  console.log(`Updated ${updatedProfiles.count} profiles in database.`);

  // Verify updates
  const uaneProfiles = await prisma.userProfile.findMany({
    where: {
      user: {
        email: {
          endsWith: '@uane.edu.mx'
        }
      }
    },
    select: {
      university: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  console.log("\nSample verification after update:");
  uaneProfiles.slice(0, 3).forEach(p => {
    console.log(`- User: ${p.user.firstName} ${p.user.lastName}`);
    console.log(`  Email: ${p.user.email}`);
    console.log(`  University in DB: ${p.university}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
