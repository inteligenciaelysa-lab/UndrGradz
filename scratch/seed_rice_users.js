const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const HOUSTON_NEIGHBORHOODS = [
  { name: 'Rice Campus / University Boulevard', lat: 29.7185, lon: -95.4012 },
  { name: 'Museum District / Montrose', lat: 29.7314, lon: -95.3967 },
  { name: 'Rice Village / West University Place', lat: 29.7165, lon: -95.4189 },
  { name: 'Medical Center', lat: 29.7083, lon: -95.4005 },
  { name: 'Midtown Houston', lat: 29.7429, lon: -95.3794 }
];

function getRandomOffset(maxOffset = 0.012) {
  return (Math.random() - 0.5) * 2 * maxOffset;
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 75 high-quality Unsplash image IDs of female students / young women
const FEMALE_PHOTO_IDS = [
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
  '1494790108377-be9c29b29330', '1517841905240-472988babdf9', '1534528741775-53994a69daeb',
  '1524504388940-b1c1722653e1', '1531746020798-e6953c6e8e04', '1554151228-14d9def656e4',
  '1508214751196-bcfd4ca60f91', '1529626455594-4ff0802cfb7e', '1573496359142-b8d87734a5a2',
  '1506863530036-1efeddceb993', '1557053910-d9eadeed1c58', '1548142813-c348350df52b',
  '1526511589868-d0b21b4de2b5', '1518577915332-c2a19f149a75', '1525357816819-392d24801722',
  '1502327817258-0a6a4e77d319', '1534528741775-53994a69daeb', '1517841905240-472988babdf9',
  '1494790108377-be9c29b29330', '1438761681033-6461ffad8d80', '1544005313-94ddf0286df2',
  '1524504388940-b1c1722653e1', '1531746020798-e6953c6e8e04', '1554151228-14d9def656e4',
  '1580489944761-15a19d654956', '1508214751196-bcfd4ca60f91', '1529626455594-4ff0802cfb7e',
  '1573496359142-b8d87734a5a2', '1567532939604-b6b5b0db2604', '1531123897727-8f129e1688ce',
  '1506863530036-1efeddceb993', '1485875437342-9b39470b3d95', '1557053910-d9eadeed1c58',
  '1499952127939-9bbf5af6c51c', '1558203728-00f45181dd84', '1548142813-c348350df52b',
  '1499557354967-2b2d8910bcca', '1509967419530-da38b4704bc6', '1508243753427-e4a6a5700a29'
];

// 75 high-quality Unsplash image IDs of male students / young men
const MALE_PHOTO_IDS = [
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
  '1501196354995-cbb51c65aaea', '1438761681033-6461ffad8d80', '1544005313-94ddf0286df2'
];

const RICE_MAJORS = [
  'Computer Science', 'Cognitive Sciences', 'Bioengineering', 'Mechanical Engineering',
  'Architecture', 'Economics', 'Psychology', 'Visual and Dramatic Arts', 'Statistics',
  'History', 'Mathematical Economic Analysis', 'Kinesiology'
];

const STUDENT_PROFILES = [
  { first: 'Emily', last: 'Smith', gender: 'WOMAN', handle: 'emilyreadsrice', bio: 'Rice University 🦉. Cognitive Sciences major. Passionate about AI, art, and exploring Houston cafes. 🧠☕' },
  { first: 'Jacob', last: 'Johnson', gender: 'MAN', handle: 'jakecodesrice', bio: 'Computer Science at Rice. Hackathons, coding, and weightlifting. 💻🏋️‍♂️' },
  { first: 'Madison', last: 'Williams', gender: 'WOMAN', handle: 'maddieadrice', bio: 'Bioengineering major. Lab researcher, plant lover, and coffee enthusiast. 🔬🌿' },
  { first: 'Joshua', last: 'Brown', gender: 'MAN', handle: 'csjoshrice', bio: 'Rice CS. Developing applications, playing chess, and running. ♟️🏃‍♂️' },
  { first: 'Olivia', last: 'Jones', gender: 'WOMAN', handle: 'itsoliviarice', bio: 'Rice Architecture. Design enthusiast, model builder, and matcha lover. 📐🍵' },
  { first: 'Michael', last: 'Miller', gender: 'MAN', handle: 'mikemrice', bio: 'Economics student at Rice. Financial modeling, tennis player, and history nerd. 📊🎾' },
  { first: 'Sophia', last: 'Davis', gender: 'WOMAN', handle: 'sophdavisrice', bio: 'Visual Arts major. Painting, photography, and exploring Montrose galleries. 🎨📷' },
  { first: 'Andrew', last: 'Wilson', gender: 'MAN', handle: 'andywfilmsrice', bio: 'Rice Bioengineering. Robot builder, classic rock fan, and concert enthusiast. 🤖🎸' },
  { first: 'Ashley', last: 'Taylor', gender: 'WOMAN', handle: 'ashleytrice', bio: 'Psychology student. Mental health advocate, yoga, and thrift shopping. 🧘‍♀️🛍️' },
  { first: 'Matthew', last: 'Thomas', gender: 'MAN', handle: 'matttrice', bio: 'Rice Statistics. Sports analysis, running, and BBQ critic. 🍖📊' },
  { first: 'Jessica', last: 'Anderson', gender: 'WOMAN', handle: 'jessandersonrice', bio: 'Rice CS. Machine learning, early runs, and cat lover. 🏃‍♀️🐱' },
  { first: 'Daniel', last: 'White', gender: 'MAN', handle: 'danwrobotrice', bio: 'Mechanical Engineering. CAD modeling, robotics, and soccer. ⚙️⚽' },
  { first: 'Sarah', last: 'Harris', gender: 'WOMAN', handle: 'sarahharrisrice', bio: 'Rice History. Classical books, writing, and museums. 📚🏛️' },
  { first: 'Christopher', last: 'Martin', gender: 'MAN', handle: 'chrismartinrice', bio: 'Mathematical Economics at Rice. Future entrepreneur, hiking, and tacos. 🌮⛰️' },
  { first: 'Elizabeth', last: 'Thompson', gender: 'WOMAN', handle: 'liztrice', bio: 'Bioengineering major. Pre-med student, tea collector, and indie music. 🔬🎧' },
  { first: 'Joseph', last: 'Garcia', gender: 'MAN', handle: 'josephgrice', bio: 'Rice Economics. Financial analysis, stock markets, and basketball. 🏀📈' },
  { first: 'Samantha', last: 'Martinez', gender: 'WOMAN', handle: 'sammartinezrice', bio: 'Kinesiology student. Personal trainer in progress, running, and yoga. 🏃‍♀️🧘‍♀️' },
  { first: 'William', last: 'Robinson', gender: 'MAN', handle: 'willrobinsonrice', bio: 'Mechanical Engineering. Building drones, aerospace fan, and chess. 🚀♟️' },
  { first: 'Lauren', last: 'Clark', gender: 'WOMAN', handle: 'laurencrice', bio: 'Psychology major. Creative design, boba lover, and travel. 🧋✈️' },
  { first: 'David', last: 'Rodriguez', gender: 'MAN', handle: 'davidrfilmsrice', bio: 'Visual Arts student at Rice. Filmmaker, scriptwriter, and vinyl collector. 🎬📻' }
];

const INTERESTS_POOL = [
  '☕ Coffee', '🏋️ Gym', '⚙️ Tech', '🎵 Music', '🤖 Robotics', '🎨 Art', '✈️ Travel', '🍿 Movies',
  '🍕 Pizza', '🎮 Gaming', '🍜 Ramen', '📷 Photography', '🤸 Calisthenics', '🏊 Swimming', '📖 Reading'
];

function getRandomInterests(count = 4) {
  const shuffled = [...INTERESTS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const PROMPTS_POOL = [
  { q: 'Most spontaneous thing I’ve done…', a: 'Driving to Galveston beach at midnight for star watching.' },
  { q: 'I wind down by…', a: 'Walking around the outer loop path of Rice campus with my favorite playlist.' },
  { q: 'A dream date would be…', a: 'Grabbing boba in Chinatown and then checking out the James Turrell Skyspace.' },
  { q: 'The way to my heart is…', a: 'Bring me a hot matcha latte and let\'s talk about AI neural networks.' }
];

const LIFESTYLES = [
  { sports: ['Running'], zodiac: 'Aries', zodiacEmoji: '♈', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Basketball'], zodiac: 'Taurus', zodiacEmoji: '♉', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Libra', zodiacEmoji: '♎', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Golf'], zodiac: 'Scorpio', zodiacEmoji: '♏', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' }
];

async function run() {
  console.log('🏁 Starting seeder for 20 Rice students...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const s = STUDENT_PROFILES[i];
    
    // Normalize to generate email
    const emailPrefix = s.first.toLowerCase() + '.' + s.last.toLowerCase();
    const email = `${emailPrefix}@rice.edu`;
    const handle = `@${s.handle}`;
    const phone = `7137${String(i).padStart(6, '0')}`;

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

    // Houston neighborhoods
    const neighbor = HOUSTON_NEIGHBORHOODS[i % HOUSTON_NEIGHBORHOODS.length];
    const finalLat = neighbor.lat + getRandomOffset();
    const finalLon = neighbor.lon + getRandomOffset();

    // 3 gender-matched photos
    let photo1, photo2, photo3;
    if (s.gender === 'WOMAN') {
      const idx = (i * 3) % FEMALE_PHOTO_IDS.length;
      photo1 = `https://images.unsplash.com/photo-${FEMALE_PHOTO_IDS[idx]}?w=600&q=80`;
      photo2 = `https://images.unsplash.com/photo-${FEMALE_PHOTO_IDS[(idx + 1) % FEMALE_PHOTO_IDS.length]}?w=600&q=80`;
      photo3 = `https://images.unsplash.com/photo-${FEMALE_PHOTO_IDS[(idx + 2) % FEMALE_PHOTO_IDS.length]}?w=600&q=80`;
    } else {
      const idx = (i * 3) % MALE_PHOTO_IDS.length;
      photo1 = `https://images.unsplash.com/photo-${MALE_PHOTO_IDS[idx]}?w=600&q=80`;
      photo2 = `https://images.unsplash.com/photo-${MALE_PHOTO_IDS[(idx + 1) % MALE_PHOTO_IDS.length]}?w=600&q=80`;
      photo3 = `https://images.unsplash.com/photo-${MALE_PHOTO_IDS[(idx + 2) % MALE_PHOTO_IDS.length]}?w=600&q=80`;
    }

    const major = RICE_MAJORS[i % RICE_MAJORS.length];
    const promptObj = PROMPTS_POOL[i % PROMPTS_POOL.length];
    const lifestyle = LIFESTYLES[i % LIFESTYLES.length];

    const createdUser = await prisma.user.create({
      data: {
        email,
        phone,
        handle,
        passwordHash,
        firstName: s.first,
        lastName: s.last,
        birthDate: new Date('2004-08-15T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio: s.bio,
            gender: s.gender,
            interestedIn: s.gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'Rice University',
            major,
            grad: '2028',
            latitude: finalLat,
            longitude: finalLon,
            interests: getRandomInterests(4),
            prompts: [promptObj],
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

    console.log(`✅ Created Rice student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name} with ${s.gender === 'WOMAN' ? 'Female' : 'Male'} photos`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} Rice students.`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
