const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with events...');

  // Create or find a mock host user
  let host = await prisma.user.findFirst({
    where: { email: 'host@undrgradz.com' }
  });

  if (!host) {
    host = await prisma.user.create({
      data: {
        email: 'host@undrgradz.com',
        phone: '1234567890',
        handle: 'alex_host',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // Dummy hash
        firstName: 'Alex',
        lastName: 'Host',
        birthDate: new Date('2000-01-01'),
        profile: {
          create: {
            gender: 'MAN',
            bio: 'Hey! I host a lot of study sessions and night hangouts.',
            university: 'UA de C',
            major: 'Computer Science',
            grad: 'Senior'
          }
        }
      }
    });
  }

  // Create some default events in the database
  const eventsToSeed = [
    {
      name: 'Algorithm Study Blitz',
      emoji: '📚',
      section: 'study',
      address: 'Central Library, Room 304',
      time: 'Today · 6:00 PM',
      hostHandle: '@alex_host',
      capacity: 12,
      description: 'Prep session for the upcoming data structures & algorithms midterms. Coffee provided!',
      filters: { majors: ['Computer Science'], restriction: 'all' }
    },
    {
      name: 'Friday Sunset Rooftop',
      emoji: '🌙',
      section: 'nightlife',
      address: 'Skyline Terrace',
      time: 'Friday · 9:00 PM',
      hostHandle: '@alex_host',
      capacity: 40,
      description: 'Pre-weekend unwind. Drinks, chill music, and the best sunset view in town.',
      filters: { restriction: '21plus' }
    },
    {
      name: 'Sunset Volleyball Match',
      emoji: '⚽',
      section: 'sports',
      address: 'University Court 2',
      time: 'Saturday · 5:30 PM',
      hostHandle: '@alex_host',
      capacity: 14,
      description: 'Casual volleyball session. Beginners and seasoned players welcome!',
      filters: { restriction: 'all' }
    }
  ];

  for (const ev of eventsToSeed) {
    // Check if event already exists
    const existing = await prisma.event.findFirst({
      where: { name: ev.name }
    });

    if (!existing) {
      await prisma.event.create({
        data: {
          name: ev.name,
          emoji: ev.emoji,
          section: ev.section,
          address: ev.address,
          time: ev.time,
          hostHandle: ev.hostHandle,
          capacity: ev.capacity,
          description: ev.description,
          filters: ev.filters,
          creatorId: host.id,
          attendees: {
            connect: { id: host.id }
          }
        }
      });
      console.log(`Created event: ${ev.name}`);
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
