const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- AUDIT 1: Existing DB Records ---');
  const unis = await prisma.university.findMany();
  console.log(`Existing University records count: ${unis.length}`);
  if (unis.length > 0) {
    console.log('Sample University records:', unis);
  }

  const profilesWithUni = await prisma.userProfile.findMany({
    where: { university: { not: null } },
    select: { id: true, userId: true, university: true },
  });
  console.log(`UserProfiles with university string: ${profilesWithUni.length}`);
  if (profilesWithUni.length > 0) {
    console.log('Sample UserProfile university strings:', profilesWithUni.slice(0, 10));
  }

  // Check unique values of UserProfile.university
  const uniStrings = new Set(profilesWithUni.map(p => p.university));
  console.log(`Distinct university string values in UserProfile: ${uniStrings.size}`);
  console.log('Distinct values list:', Array.from(uniStrings));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
