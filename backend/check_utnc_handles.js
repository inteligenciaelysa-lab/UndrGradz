const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      profile: {
        university: {
          contains: 'Universidad Tecnológica del Norte de Coahuila'
        }
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      handle: true
    }
  });

  console.log("Found UTNC Users:", JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
