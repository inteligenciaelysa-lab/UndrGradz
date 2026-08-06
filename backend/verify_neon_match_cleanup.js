// Removes the temporary QA accounts created by verify_neon_match_setup.js.
// Cascade deletes (see prisma/schema.prisma onDelete: Cascade on Swipe/Match/Photo/Profile)
// take care of their swipes, matches, photos and profile automatically.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.deleteMany({
    where: { handle: { startsWith: 'neonqa_' } },
  });
  console.log(`Deleted ${result.count} QA test account(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
