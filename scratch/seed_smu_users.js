const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const DALLAS_NEIGHBORHOODS = [
  { name: 'University Park (SMU Campus)', lat: 32.8412, lon: -96.7845 },
  { name: 'Lower Greenville', lat: 32.8136, lon: -96.7697 },
  { name: 'Uptown Dallas', lat: 32.8024, lon: -96.8012 },
  { name: 'Deep Ellum', lat: 32.7843, lon: -96.7869 },
  { name: 'Knox-Henderson', lat: 32.8228, lon: -96.7836 }
];

function getRandomOffset(maxOffset = 0.015) {
  return (Math.random() - 0.5) * 2 * maxOffset;
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 150 high quality portrait / lifestyle Unsplash image IDs
const PHOTO_IDS = [
  // Females
  '1534528741775-53994a69daeb', '1517841905240-472988babdf9', '1494790108377-be9c29b29330',
  '1438761681033-6461ffad8d80', '1544005313-94ddf0286df2', '1524504388940-b1c1722653e1',
  '1531746020798-e6953c6e8e04', '1488426862026-3ee34a7d66df', '1554151228-14d9def656e4',
  '1580489944761-15a19d654956', '1508214751196-bcfd4ca60f91', '1529626455594-4ff0802cfb7e',
  '1573496359142-b8d87734a5a2', '1567532939604-b6b5b0db2604', '1531123897727-8f129e1688ce',
  '1506863530036-1efeddceb993', '1485875437342-9b39470b3d95', '1557053910-d9eadeed1c58',
  '1499952127939-9bbf5af6c51c', '1558203728-00f45181dd84', '1548142813-c348350df52b',
  '1499557354967-2b2d8910bcca', '1509967419530-da38b4704bc6', '1508243753427-e4a6a5700a29',
  '1526511589868-d0b21b4de2b5', '1498529605908-f357a9af7bf5', '1518577915332-c2a19f149a75',
  '1525357816819-392d24801722', '1502327817258-0a6a4e77d319', '1544717277-ac3e229c9e83',
  '1544005313-94ddf0286df2', '1517841905240-472988babdf9', '1534528741775-53994a69daeb',
  
  // Males
  '1507003211169-0a1dd7228f2d', '1539571696357-5a69c17a67c6', '1501196354995-cbb51c65aaea',
  '1506794778202-cad84cf45f1d', '1522075469751-3a6694fb2f61', '1519085360753-af0119f7cbe7',
  '1500648767791-00dcc994a43e', '1534308983496-4fabb1a015ee', '1552058544-f2b08422138a',
  '1542206395-9feb3edaa68d', '1504257404291-170c8942e248', '1519345182560-3f2917c472ef',
  '1492562080023-ab3db95bfbce', '1527983359383-4758693f760c', '1560250097-0b93528c311a',
  '1517256064527-09c53b2d0bc6', '1528892951291-009c663ce843', '1531427186611-ecfd6d936c79',
  '1503023345310-bd7c1de61c7d', '1566492031773-4f4e44671857', '1513956589380-bad6acb9b9d4',
  '1532910404247-7ee9488d7293', '1543132220-3ec99c6094ec', '1516257984-b1b4d707412e',
  '1516422231744-8da033994c5d', '1530268729831-4b0b9e170218', '1541823709867-1b206113e597',
  '1506794778202-cad84cf45f1d', '1507003211169-0a1dd7228f2d', '1539571696357-5a69c17a67c6',
  
  // Mixed lifestyle
  '1463483952402-dd9d214a4c52', '1475669696071-7f90e9ff264a', '1488161628813-f5485f87b8e8',
  '1490578474883-7d4056221c90', '1495079839536-4cc32c9d1a33', '1501196354995-cbb51c65aaea',
  '1516257984-b1b4d707412e', '1518156677180-95a2893f3e9f', '1518577915332-c2a19f149a75',
  '1520155707862-5b32817385d3', '1520853507302-624a7a6c91d8', '1522075469751-3a6694fb2f61',
  '1523464862210-9114f87a5551', '1524504388940-b1c1722653e1', '1526511589868-d0b21b4de2b5',
  '1528228377309-ab19f7276537', '1529626455594-4ff0802cfb7e', '1531746020798-e6953c6e8e04',
  '1534308983496-4fabb1a015ee', '1534528741775-53994a69daeb', '1535931737517-3e8c71657c6b',
  '1542206395-9feb3edaa68d', '1544005313-94ddf0286df2', '1544717277-ac3e229c9e83',
  '1548142813-c348350df52b', '1552058544-f2b08422138a', '1554151228-14d9def656e4',
  '1557053910-d9eadeed1c58', '1558203728-00f45181dd84', '1560250097-0b93528c311a',
  '1566492031773-4f4e44671857', '1567532939604-b6b5b0db2604', '1573496359142-b8d87734a5a2',
  '1580489944761-15a19d654956', '1506863530036-1efeddceb993', '1528892951291-009c663ce843',
  
  // More portraits
  '1508214751196-bcfd4ca60f91', '1519345182560-3f2917c472ef', '1492562080023-ab3db95bfbce',
  '1527983359383-4758693f760c', '1517256064527-09c53b2d0bc6', '1531427186611-ecfd6d936c79',
  '1485875437342-9b39470b3d95', '1499952127939-9bbf5af6c51c', '1503023345310-bd7c1de61c7d',
  '1513956589380-bad6acb9b9d4', '1499557354967-2b2d8910bcca', '1509967419530-da38b4704bc6',
  '1508243753427-e4a6a5700a29', '1520155707862-5b32817385d3', '1498529605908-f357a9af7bf5',
  '1532910404247-7ee9488d7293', '1543132220-3ec99c6094ec', '1525357816819-392d24801722',
  '1516257984-b1b4d707412e', '1516422231744-8da033994c5d', '1530268729831-4b0b9e170218',
  '1544717277-ac3e229c9e83', '1541823709867-1b206113e597', '1506794778202-cad84cf45f1d',
  
  // Extra fill
  '1507003211169-0a1dd7228f2d', '1539571696357-5a69c17a67c6', '1501196354995-cbb51c65aaea',
  '1438761681033-6461ffad8d80', '1544005313-94ddf0286df2', '1524504388940-b1c1722653e1',
  '1531746020798-e6953c6e8e04', '1488426862026-3ee34a7d66df', '1554151228-14d9def656e4',
  '1580489944761-15a19d654956', '1508214751196-bcfd4ca60f91', '1529626455594-4ff0802cfb7e',
  '1573496359142-b8d87734a5a2', '1567532939604-b6b5b0db2604', '1531123897727-8f129e1688ce',
  '1506863530036-1efeddceb993', '1485875437342-9b39470b3d95', '1557053910-d9eadeed1c58',
  '1499952127939-9bbf5af6c51c', '1558203728-00f45181dd84', '1548142813-c348350df52b',
  '1499557354967-2b2d8910bcca', '1509967419530-da38b4704bc6', '1508243753427-e4a6a5700a29'
];

const SMU_MAJORS = [
  'Finance', 'Marketing', 'Real Estate', 'Advertising', 'Journalism', 
  'Film & Media Arts', 'Mechanical Engineering', 'Computer Science', 
  'Economics', 'Psychology', 'Political Science', 'Biological Sciences'
];

const FIRST_NAMES = [
  'Emily', 'Jacob', 'Madison', 'Joshua', 'Olivia', 'Michael', 'Sophia', 'Andrew', 'Ashley', 'Matthew',
  'Jessica', 'Daniel', 'Sarah', 'Christopher', 'Elizabeth', 'Joseph', 'Samantha', 'William', 'Lauren', 'David',
  'Megan', 'John', 'Grace', 'Ryan', 'Chloe', 'Nicholas', 'Victoria', 'Tyler', 'Alexis', 'Alexander',
  'Alyssa', 'James', 'Hannah', 'John', 'Taylor', 'Brandon', 'Abigail', 'Zachary', 'Brianna', 'Christian',
  'Katherine', 'Dylan', 'Destiny', 'Benjamin', 'Natalie', 'Samuel', 'Hailey', 'Gabriel', 'Julia', 'Anthony'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Thomas',
  'Anderson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
  'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
  'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts',
  'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris'
];

const BIOS = [
  'SMU Cox. Coffee addict, dog lover, and aspiring financial analyst. ☕📈',
  'Meadows School of the Arts. Film & Media major. Let\'s make a movie. 🎥✨',
  'Computer Science at SMU Lyle. Building apps and playing basketball. 💻🏀',
  'SMU Dedman College. Studying Economics and enjoying Dallas life. 📊',
  'Advertising major in SMU Meadows. Creative writer and music lover. 🎵🎨',
  'Marketing student in SMU Cox. Always looking for new food spots in Dallas. 🍕',
  'Psychology major. Understanding the human mind and drinking matcha. 🍵',
  'Mechanical Engineering in SMU Lyle. Designing stuff and working out. 🛠️🏋️',
  'Political Science at SMU Dedman. History nerd and coffee lover. ☕📚',
  'SMU Finance. Focused on investment banking and playing golf. 🏌️‍♂️📈'
];

const LIFESTYLES = [
  { sports: ['Golf'], zodiac: 'Aries', zodiacEmoji: '♈', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Basketball'], zodiac: 'Taurus', zodiacEmoji: '♉', zodiacShow: true, drinking: 'No', smoking: 'No', workout: 'Often' },
  { sports: ['Soccer'], zodiac: 'Gemini', zodiacEmoji: '♊', zodiacShow: true, drinking: 'Socially', smoking: 'Sometimes', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Cancer', zodiacEmoji: '♋', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Calisthenics'], zodiac: 'Leo', zodiacEmoji: '♌', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' }
];

async function run() {
  console.log('🏁 Starting seeder for 50 SMU students in Dallas...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[i];
    const lastName = LAST_NAMES[i];
    
    // Normalize to generate email and handle
    const emailPrefix = firstName.toLowerCase() + '.' + lastName.toLowerCase();
    const email = `${emailPrefix}@smu.edu`;
    const handle = `@${firstName.toLowerCase()}_${lastName.toLowerCase()}_smu`;
    const phone = `2147${String(i).padStart(6, '0')}`;

    // Genders mixed
    const gender = i % 2 === 0 ? 'WOMAN' : 'MAN';
    
    // Check if user exists
    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { handle }
        ]
      }
    });

    if (exists) {
      console.log(`User ${handle} (${email}) already exists. Skipping.`);
      continue;
    }

    // Dallas neighborhoods
    const neighbor = DALLAS_NEIGHBORHOODS[i % DALLAS_NEIGHBORHOODS.length];
    const finalLat = neighbor.lat + getRandomOffset();
    const finalLon = neighbor.lon + getRandomOffset();

    // 3 distinct photos
    const photoIndex = (i * 3) % PHOTO_IDS.length;
    const photo1 = `https://images.unsplash.com/photo-${PHOTO_IDS[photoIndex]}?w=600&q=80`;
    const photo2 = `https://images.unsplash.com/photo-${PHOTO_IDS[(photoIndex + 1) % PHOTO_IDS.length]}?w=600&q=80`;
    const photo3 = `https://images.unsplash.com/photo-${PHOTO_IDS[(photoIndex + 2) % PHOTO_IDS.length]}?w=600&q=80`;

    const major = SMU_MAJORS[i % SMU_MAJORS.length];
    const bio = BIOS[i % BIOS.length];
    const lifestyle = LIFESTYLES[i % LIFESTYLES.length];

    const createdUser = await prisma.user.create({
      data: {
        email,
        phone,
        handle,
        passwordHash,
        firstName,
        lastName,
        birthDate: new Date('2004-05-15T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio,
            gender,
            interestedIn: gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'Southern Methodist University',
            major,
            grad: '2028',
            latitude: finalLat,
            longitude: finalLon,
            interests: ['☕ Coffee', '🍿 Movies', '🍕 Pizza', '🎵 Music', '🏋️ Gym'],
            prompts: [{ q: 'A dream date would be…', a: 'Ir por un café y platicar por horas.' }],
            lifestyle,
            academic: { minor: '', degree: 'Bachelor', company: '', clubs: [], involved: ['None'] }
          }
        },
        photos: {
          create: [
            { url: photo1, order: 0 },
            { url: photo2, order: 1 },
            { url: photo3, order: 2 }
          ]
        }
      }
    });

    console.log(`✅ Created SMU student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name}`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} SMU students.`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('Seeding failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
