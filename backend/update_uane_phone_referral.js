const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
  console.log("Adding phone and referralCode to all UANE users...");

  const uaneUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    }
  });

  console.log(`Found ${uaneUsers.length} UANE users.`);

  let updatedCount = 0;

  for (let i = 0; i < uaneUsers.length; i++) {
    const user = uaneUsers[i];
    
    // Generate a unique phone number if not present
    let phone = user.phone;
    if (!phone) {
      // 878 is Piedras Negras area code. Let's make a sequential/random unique number
      const suffix = String(1000000 + i); // Ensures 7 digits
      phone = `+52878${suffix}`;
    }

    // Generate a unique referral code if not present
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        referralCode,
        isPhoneVerified: true
      }
    });

    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} UANE users with phones and referral codes!`);

  // Verify the updates
  const sampleUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      referralCode: true,
      isPhoneVerified: true
    },
    take: 5
  });

  console.log("\nSample verification:");
  sampleUsers.forEach(u => {
    console.log(`- ${u.firstName} ${u.lastName}: Phone: ${u.phone}, Referral: ${u.referralCode}, Verified: ${u.isPhoneVerified}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
