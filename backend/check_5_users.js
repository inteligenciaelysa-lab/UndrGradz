const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const handles = ['joelinjr', 'mariago', 'anagar', 'sofi', 'reginamtz'];
  
  const users = await prisma.user.findMany({
    where: {
      OR: handles.map(h => ({ handle: { in: [h, `@${h}`] } }))
    },
    include: {
      profile: true
    }
  });

  console.log("5 Target Users Details:", users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    handle: u.handle,
    university: u.profile?.university,
    major: u.profile?.major,
    tier: u.profile?.subscriptionTier
  })));
}

main().finally(() => prisma.$disconnect());
