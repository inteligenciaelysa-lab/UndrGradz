const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Querying UANE photos in database...');

  const uaneUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    },
    include: {
      photos: true
    }
  });

  console.log(`Found ${uaneUsers.length} UANE users.`);
  
  let fixedCount = 0;

  for (const user of uaneUsers) {
    for (const photo of user.photos) {
      if (photo.url.includes('photo-photo-')) {
        const correctedUrl = photo.url.replace('photo-photo-', 'photo-');
        
        await prisma.photo.update({
          where: { id: photo.id },
          data: { url: correctedUrl }
        });
        
        fixedCount++;
      }
    }
  }

  console.log(`✅ Fixed ${fixedCount} broken photo URLs in the database!`);
  
  // Print some samples to verify
  const sampleUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    },
    include: {
      photos: {
        orderBy: { order: 'asc' }
      }
    },
    take: 3
  });

  console.log('\n--- VERIFICATION OF SAMPLE URLS ---');
  sampleUsers.forEach(u => {
    console.log(`User: ${u.firstName} ${u.lastName} (${u.gender})`);
    u.photos.forEach(p => {
      console.log(`  Photo ${p.order}: ${p.url}`);
    });
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
