const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const HOUSTON_NEIGHBORHOODS = [
  { name: 'UH Campus / University Drive', lat: 29.7212, lon: -95.3418 },
  { name: 'EaDo / East Downtown', lat: 29.7465, lon: -95.3523 },
  { name: 'Third Ward / Adjacent', lat: 29.7128, lon: -95.3589 },
  { name: 'Midtown Houston', lat: 29.7429, lon: -95.3794 },
  { name: 'Greater Eastwood', lat: 29.7345, lon: -95.3289 }
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

const UH_MAJORS = [
  'Computer Science', 'Marketing', 'Finance', 'Architecture', 'Kinesiology',
  'Biology', 'Communication', 'History', 'Animal Science', 'Mechanical Engineering',
  'Nursing', 'Psychology'
];

const STUDENT_PROFILES = [
  { first: 'Oliver', last: 'Vance', gender: 'MAN', handle: 'olivervancecodes', bio: 'University of Houston 🔴. Computer Science major. Coding, weightlifting, and exploring EaDo coffee spots. 💻🏋️‍♂️' },
  { first: 'Zoey', last: 'Patel', gender: 'WOMAN', handle: 'zoeypatelad', bio: 'Marketing student at UH. Creative direction, social media curation, and boba addict. 🧋🎨' },
  { first: 'Leo', last: 'Mercer', gender: 'MAN', handle: 'leomercerbiz', bio: 'Bauer College of Business. Studying Finance and playing basketball. Go Coogs! 🏀📈' },
  { first: 'Stella', last: 'Chen', gender: 'WOMAN', handle: 'stellachenart', bio: 'UH Architecture student. Modeling spaces, sketching cityscapes, and matcha lattes. 📐🍵' },
  { first: 'Carter', last: 'Hicks', gender: 'MAN', handle: 'carterhicksfit', bio: 'Kinesiology student at UH. Personal trainer in progress, gym, and outdoor running. 🏋️‍♂️🏃‍♂️' },
  { first: 'Ruby', last: 'Finch', gender: 'WOMAN', handle: 'rubyfinchlab', bio: 'Biology major. Pre-med student, lab research, and plant collector. 🔬🌿' },
  { first: 'Eli', last: 'Thornton', gender: 'MAN', handle: 'elithorntoncs', bio: 'UH CS. Web development, video games, and exploring Houston food trucks. 🎮🍕' },
  { first: 'Violet', last: 'Sharpe', gender: 'WOMAN', handle: 'violetsharpedesign', bio: 'UH Architecture. Creative design, vintage fashion, and sunset watcher. 👗🌅' },
  { first: 'Ezra', last: 'Sterling', gender: 'MAN', handle: 'ezrasterlingcode', bio: 'University of Houston CS. Software design, hackathons, and coffee. ☕💻' },
  { first: 'Hazel', last: 'Boone', gender: 'WOMAN', handle: 'hazelboonereads', bio: 'History major. Book collector, classical literature fan, and museum visits. 📚🏛️' },
  { first: 'Miles', last: 'Fletcher', gender: 'MAN', handle: 'milesfletcherfinance', bio: 'Bauer Finance student. Corporate strategy, markets, and playing tennis. 🎾📊' },
  { first: 'Aurora', last: 'Vane', gender: 'WOMAN', handle: 'auroravaneplants', bio: 'Biology major. Plant collector, nature photography, and hiking. 🌱📷' },
  { first: 'Silas', last: 'Briggs', gender: 'MAN', handle: 'silasbriggsvids', bio: 'Communication major. Video production, vinyl collector, and concert enthusiast. 📻🎬' },
  { first: 'Nova', last: 'Sparks', gender: 'WOMAN', handle: 'novasparkschem', bio: 'UH Biology student. Biochemistry, laboratory research, and baking. 🔬🍪' },
  { first: 'Jasper', last: 'Wolfe', gender: 'MAN', handle: 'jasperwolfegame', bio: 'CS major. Game programming, technology nerd, and coffee lover. ☕👾' },
  { first: 'Sadie', last: 'Mercer', gender: 'WOMAN', handle: 'sadiemercerbrush', bio: 'Visual Arts student. Painting, gallery visits, and acoustic playlists. 🎨🎧' },
  { first: 'Asher', last: 'Kane', gender: 'MAN', handle: 'asherkanegolf', bio: 'Bauer Business Finance. Investment banker in progress and playing golf. 🏌️‍♂️📈' },
  { first: 'Penelope', last: 'Cruz', gender: 'WOMAN', handle: 'penelopecruzbooks', bio: 'Psychology student. Mental health advocate, yoga, and book club. 🧘‍♀️📖' },
  { first: 'Jude', last: 'Cross', gender: 'MAN', handle: 'judecrosstech', bio: 'Mechanical Engineering major. Robotics builder, drone pilot, and chess. 🚀♟️' },
  { first: 'Ivy', last: 'Thorne', gender: 'WOMAN', handle: 'ivythornerun', bio: 'Nursing major. Future nurse practitioner, runner, and tea enthusiast. 🩺🍵' }
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
  { q: 'Most spontaneous thing I’ve done…', a: 'Taking the METRORail at midnight to grab tacos in Downtown.' },
  { q: 'I wind down by…', a: 'Jogging around Lynn Eusan Park with my favorite playlist.' },
  { q: 'A dream date would be…', a: 'Tacos in EaDo and then going to see live music in Midtown.' },
  { q: 'The way to my heart is…', a: 'Bring me a hot coffee from Nook Cafe and talk about algorithms.' }
];

const LIFESTYLES = [
  { sports: ['Running'], zodiac: 'Aries', zodiacEmoji: '♈', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Basketball'], zodiac: 'Taurus', zodiacEmoji: '♉', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Libra', zodiacEmoji: '♎', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Golf'], zodiac: 'Scorpio', zodiacEmoji: '♏', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' }
];

async function run() {
  console.log('🏁 Starting seeder for 20 UH students...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const s = STUDENT_PROFILES[i];
    
    // Normalize to generate email
    const emailPrefix = s.first.toLowerCase() + '.' + s.last.toLowerCase();
    const email = `${emailPrefix}@uh.edu`;
    const handle = `@${s.handle}`;
    const phone = `8327${String(i).padStart(6, '0')}`;

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

    const major = UH_MAJORS[i % UH_MAJORS.length];
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
        birthDate: new Date('2004-07-15T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio: s.bio,
            gender: s.gender,
            interestedIn: s.gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'University of Houston',
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

    console.log(`✅ Created UH student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name} with ${s.gender === 'WOMAN' ? 'Female' : 'Male'} photos`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} UH students.`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
