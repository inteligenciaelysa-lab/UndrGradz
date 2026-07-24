const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Starting pre-admin DB data backup...');
  const users = await prisma.user.findMany({ include: { profile: true, photos: true } });
  const events = await prisma.event.findMany({ include: { attendees: true } });
  const matches = await prisma.match.findMany({ include: { messages: true } });
  const swipes = await prisma.swipe.findMany();
  const friendships = await prisma.friendship.findMany();

  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      users: users.length,
      events: events.length,
      matches: matches.length,
      swipes: swipes.length,
      friendships: friendships.length
    },
    users,
    events,
    matches,
    swipes,
    friendships
  };

  const backupPath = path.join(__dirname, 'backup_pre_admin.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`✅ Pre-admin database backup saved to ${backupPath}`);
  console.log(`Summary: ${users.length} users, ${events.length} events, ${matches.length} matches, ${swipes.length} swipes.`);
}

main()
  .catch(err => {
    console.error('❌ Backup error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
