const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const LUBBOCK_NEIGHBORHOODS = [
  { name: 'TTU Campus / University Ave', lat: 33.5843, lon: -101.8745 },
  { name: 'North Overton', lat: 33.5830, lon: -101.8601 },
  { name: 'Tech Terrace', lat: 33.5683, lon: -101.8845 },
  { name: 'Maxey Park / 34th St', lat: 33.5658, lon: -101.8967 },
  { name: 'South Lubbock / Loop 289', lat: 33.5283, lon: -101.8889 }
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

const TTU_MAJORS = [
  'Mechanical Engineering', 'Kinesiology', 'Finance', 'Psychology', 'Computer Science',
  'Animal Science', 'General Business', 'Civil Engineering', 'Marketing',
  'Agricultural Communications', 'Biology', 'Nursing'
];

const STUDENT_PROFILES = [
  { first: 'Emily', last: 'Smith', gender: 'WOMAN', handle: 'emilyreadstech', bio: 'Texas Tech University 🔴⚫. Kinesiology major. Coffee lover, fitness enthusiast, and future physical therapist. ☕🏃‍♀️' },
  { first: 'Jacob', last: 'Johnson', gender: 'MAN', handle: 'jakecodestech', bio: 'Computer Science at Texas Tech. Software developer, gamer, and tech enthusiast. 💻🎮' },
  { first: 'Madison', last: 'Williams', gender: 'WOMAN', handle: 'maddieadtech', bio: 'Marketing student. Creative design, social media, and exploring Lubbock cafes. 🎨☕' },
  { first: 'Joshua', last: 'Brown', gender: 'MAN', handle: 'csjoshtech', bio: 'Texas Tech CS. Coding projects, hackathons, and playing guitar. 🎸💻' },
  { first: 'Olivia', last: 'Jones', gender: 'WOMAN', handle: 'itsoliviatech', bio: 'Psychology major. Interested in human mind, reading, and hiking. 📚🌳' },
  { first: 'Michael', last: 'Miller', gender: 'MAN', handle: 'mikemtech', bio: 'Tech General Business major. Investment banking and golf fan. Wreck \'em Tech! 🔫🏈' },
  { first: 'Sophia', last: 'Davis', gender: 'WOMAN', handle: 'sophdavistech', bio: 'Nursing major at Texas Tech. Future nurse, runner, and healthy lifestyle. 🩺🏃‍♀️' },
  { first: 'Andrew', last: 'Wilson', gender: 'MAN', handle: 'andywfilmstech', bio: 'Agricultural Communications. Video editing, classic rock, and concerts. 🎬🎸' },
  { first: 'Ashley', last: 'Taylor', gender: 'WOMAN', handle: 'ashleyttech', bio: 'Marketing student. Graphic design, photography, and thrift shopping. 📷🛍️' },
  { first: 'Matthew', last: 'Thomas', gender: 'MAN', handle: 'mattttech', bio: 'Texas Tech Animal Science. Vet in the making, outdoor runner, and BBQ lover. 🍖🐶' },
  { first: 'Jessica', last: 'Anderson', gender: 'WOMAN', handle: 'jessandersontech', bio: 'Texas Tech CS. Machine learning, early morning runs, and cats. 🏃‍♀️🐱' },
  { first: 'Daniel', last: 'White', gender: 'MAN', handle: 'danwrobotech', bio: 'Mechanical Engineering major. Robot designer, gym enthusiast, and tennis. ⚙️🎾' },
  { first: 'Sarah', last: 'Harris', gender: 'WOMAN', handle: 'sarahharristech', bio: 'Texas Tech Biology. Science nerd, plant mom, and tea collector. 🔬🍵' },
  { first: 'Christopher', last: 'Martin', gender: 'MAN', handle: 'chrismartintech', bio: 'Texas Tech Business. Finance and real estate enthusiast. 📈🏢' },
  { first: 'Elizabeth', last: 'Thompson', gender: 'WOMAN', handle: 'lizttech', bio: 'Nursing major. Pre-med student, research assistant, and indie music. 🩺🎧' },
  { first: 'Joseph', last: 'Garcia', gender: 'MAN', handle: 'josephgtech', bio: 'Texas Tech Accounting. Auditing, spreadsheets, and basketball player. 🏀📊' },
  { first: 'Samantha', last: 'Martinez', gender: 'WOMAN', handle: 'sammartineztech', bio: 'Kinesiology student. Sports medicine, soccer, and gym workouts. ⚽🏋️‍♀️' },
  { first: 'William', last: 'Robinson', gender: 'MAN', handle: 'willrobinsontech', bio: 'Mechanical Engineering. Aerospace fan, building drones, and chess. 🚀♟️' },
  { first: 'Lauren', last: 'Clark', gender: 'WOMAN', handle: 'laurenctech', bio: 'Agricultural Communications. Social media creator, coffee, and travel. ☕✈️' },
  { first: 'David', last: 'Rodriguez', gender: 'MAN', handle: 'davidrfilmstech', bio: 'Texas Tech student. Video editing, indie films, and vinyl collector. 🎬📻' },
  { first: 'Megan', last: 'Lewis', gender: 'WOMAN', handle: 'meglewistech', bio: 'Animal Science major. Horse rider, veterinary volunteer, and hiking. 🐎⛰️' },
  { first: 'John', last: 'Lee', gender: 'MAN', handle: 'johnlcode', bio: 'Texas Tech CS. Coding, playing piano, and boba lover. 🎹🧋' },
  { first: 'Grace', last: 'Walker', gender: 'WOMAN', handle: 'gracewyogatech', bio: 'Psychology student. Yoga, meditation, plant collector, and watercolor. 🧘‍♀️🎨' },
  { first: 'Ryan', last: 'Hall', gender: 'MAN', handle: 'ryanhtech', bio: 'Civil Engineering. Structural design, outdoor hiking, and music. 🌉🎵' },
  { first: 'Chloe', last: 'Allen', gender: 'WOMAN', handle: 'chloearchtech', bio: 'Mechanical Engineering major. CAD modeler, robotics, and hot tea. 🍵⚙️' },
  { first: 'Nicholas', last: 'Young', gender: 'MAN', handle: 'nicybiztech', bio: 'Tech Finance. Investment strategies, networking, and playing tennis. 🎾📊' },
  { first: 'Victoria', last: 'King', gender: 'WOMAN', handle: 'vickingtech', bio: 'Agricultural Communications. Creative writer, books, and coffee. 📚☕' },
  { first: 'Tyler', last: 'Wright', gender: 'MAN', handle: 'tylerwmusictech', bio: 'Texas Tech student. Songwriter, guitar player, and running. 🎸🏃‍♂️' },
  { first: 'Alexis', last: 'Lopez', gender: 'WOMAN', handle: 'alexisllabstech', bio: 'Texas Tech Biology. Research work, baking cakes, and cat owner. 🔬🍰' },
  { first: 'Alexander', last: 'Hill', gender: 'MAN', handle: 'alexhmechtech', bio: 'Mechanical Engineering student. Automotive engineering, CAD, and gym. 🚗🏋️‍♂️' },
  { first: 'Alyssa', last: 'Scott', gender: 'WOMAN', handle: 'alyssaswimtech', bio: 'Nursing major. Swimmer, fitness coach, and healthy eating. 🏊‍♀️🥗' },
  { first: 'James', last: 'Green', gender: 'MAN', handle: 'jamesgfitnesstech', bio: 'Kinesiology student. Personal trainer in progress, gym, and soccer. 🏋️‍♂️⚽' },
  { first: 'Hannah', last: 'Adams', gender: 'WOMAN', handle: 'hannahadamstech', bio: 'Psychology major. Love hiking at Caprock Canyons, yoga, and nature. 🧘‍♀️🌳' },
  { first: 'John', last: 'Baker', gender: 'MAN', handle: 'johnbakermedtech', bio: 'Biology major. Pre-med student, swimming, and reading journals. 🏊‍♂️🩺' },
  { first: 'Taylor', last: 'Gonzalez', gender: 'WOMAN', handle: 'taylorgsocialtech', bio: 'Marketing student. Playlist curator, coffee lover, and graphic design. ☕🎨' },
  { first: 'Brandon', last: 'Nelson', gender: 'MAN', handle: 'brandonncodetech', bio: 'Texas Tech CS. Full stack coding, gaming, and boba enthusiast. 🎮💻' },
  { first: 'Abigail', last: 'Carter', gender: 'WOMAN', handle: 'abigailctech', bio: 'General Business. Marketing, startup networking, and restaurants. 💼🍽️' },
  { first: 'Zachary', last: 'Mitchell', gender: 'MAN', handle: 'zachmphototech', bio: 'Agricultural Communications. Outdoor photography, hiking, and camping. 📷🥾' },
  { first: 'Brianna', last: 'Perez', gender: 'WOMAN', handle: 'briperezbakestech', bio: 'Texas Tech Biology. Future dentist, baking cupcakes, and cookies. 🔬🍪' },
  { first: 'Christian', last: 'Roberts', gender: 'MAN', handle: 'christianrtennistech', bio: 'General Business. Tennis player, fitness enthusiast, and reading. 🎾📖' },
  { first: 'Katherine', last: 'Turner', gender: 'WOMAN', handle: 'kattstudiostech', bio: 'Texas Tech Biology. Wildlife enthusiast, painting, and museum trips. 🎨🏛️' },
  { first: 'Dylan', last: 'Phillips', gender: 'MAN', handle: 'dylanppianotech', bio: 'Texas Tech CS. Coding, playing piano, and coffee addict. ☕🎹' },
  { first: 'Destiny', last: 'Campbell', gender: 'WOMAN', handle: 'destinycvoicetech', bio: 'Kinesiology major. Singer, fitness coach, and live music. 🎙️🎵' },
  { first: 'Benjamin', last: 'Parker', gender: 'MAN', handle: 'benpchesstech', bio: 'Mechanical Engineering. Chess player, science fiction, and space. ♟️🚀' },
  { first: 'Natalie', last: 'Evans', gender: 'WOMAN', handle: 'natalieewildtech', bio: 'Animal Science major. Veterinary volunteer, horse rider, and hiking. 🐎⛰️' },
  { first: 'Samuel', last: 'Edwards', gender: 'MAN', handle: 'samedesignstech', bio: 'Marketing major. Graphic designer, video production, and tacos. 🎬🌮' },
  { first: 'Hailey', last: 'Collins', gender: 'WOMAN', handle: 'haileyccircuitstech', bio: 'Civil Engineering. CAD design, structural modeling, and hot tea. 🍵🌉' },
  { first: 'Gabriel', last: 'Stewart', gender: 'MAN', handle: 'gabesgolftech', bio: 'General Business. Golf player, stock analysis, and burgers. 🏌️‍♂️🍔' },
  { first: 'Julia', last: 'Sanchez', gender: 'WOMAN', handle: 'juliasspringstech', bio: 'Texas Tech Psychology. Hiking, lake swimming, and indie acoustic. 🏊‍♀️🎵' },
  { first: 'Anthony', last: 'Morris', gender: 'MAN', handle: 'tonymclimbtech', bio: 'Kinesiology major. Rock climbing, outdoor gym, and design. 🧗‍♂️📐' }
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
  { q: 'Most spontaneous thing I’ve done…', a: 'Driving to Caprock Canyons at midnight for star watching.' },
  { q: 'I wind down by…', a: 'Running around Urbanovsky Park with my favorite album playing.' },
  { q: 'A dream date would be…', a: 'Grabbing a coffee at J&B Coffee and walking around Tech Terrace.' },
  { q: 'The way to my heart is…', a: 'Bring me a box of donuts and talk about automotive engineering.' }
];

const LIFESTYLES = [
  { sports: ['Running'], zodiac: 'Aries', zodiacEmoji: '♈', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Basketball'], zodiac: 'Taurus', zodiacEmoji: '♉', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Libra', zodiacEmoji: '♎', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Golf'], zodiac: 'Scorpio', zodiacEmoji: '♏', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' }
];

async function run() {
  console.log('🏁 Starting seeder for 50 TTU students...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const s = STUDENT_PROFILES[i];
    
    // Normalize to generate email
    const emailPrefix = s.first.toLowerCase() + '.' + s.last.toLowerCase();
    const email = `${emailPrefix}@ttu.edu`;
    const handle = `@${s.handle}`;
    const phone = `8067${String(i).padStart(6, '0')}`;

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

    // Lubbock neighborhoods
    const neighbor = LUBBOCK_NEIGHBORHOODS[i % LUBBOCK_NEIGHBORHOODS.length];
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

    const major = TTU_MAJORS[i % TTU_MAJORS.length];
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
        birthDate: new Date('2004-10-15T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio: s.bio,
            gender: s.gender,
            interestedIn: s.gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'Texas Tech University',
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

    console.log(`✅ Created TTU student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name} with ${s.gender === 'WOMAN' ? 'Female' : 'Male'} photos`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} TTU students.`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
