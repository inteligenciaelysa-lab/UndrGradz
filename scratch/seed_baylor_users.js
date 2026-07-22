const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const WACO_NEIGHBORHOODS = [
  { name: 'Baylor Campus / University Parks Drive', lat: 31.5458, lon: -97.1189 },
  { name: 'Downtown Waco / Franklin Ave', lat: 31.5542, lon: -97.1350 },
  { name: 'East Waco / Brazos River', lat: 31.5645, lon: -97.1089 },
  { name: 'Speight Ave / Woodall', lat: 31.5367, lon: -97.1215 },
  { name: 'Waco Creek / La Salle Ave', lat: 31.5303, lon: -97.1394 }
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

const BAYLOR_MAJORS = [
  'Biology', 'Nursing', 'Finance', 'Psychology', 'Communication',
  'Mechanical Engineering', 'Accounting', 'Computer Science', 
  'Marketing', 'Political Science', 'Elementary Education', 'Kinesiology'
];

const STUDENT_PROFILES = [
  { first: 'Emily', last: 'Smith', gender: 'WOMAN', handle: 'emilyreads', bio: 'Baylor University 🐻. Nursing major. Coffee enthusiast, bookworm, and future healthcare hero. 🩺☕' },
  { first: 'Jacob', last: 'Johnson', gender: 'MAN', handle: 'jakecodes', bio: 'Computer Science at Baylor. Building iOS apps, drinking energy drinks, and soccer. 💻⚽' },
  { first: 'Madison', last: 'Williams', gender: 'WOMAN', handle: 'maddiead', bio: 'Marketing student. Creative marketing, photography, and exploring Waco coffee shops. 📷☕' },
  { first: 'Joshua', last: 'Brown', gender: 'MAN', handle: 'csjosh', bio: 'Baylor CS. Love programming, guitar, and hiking around Cameron Park. 🎸💻' },
  { first: 'Olivia', last: 'Jones', gender: 'WOMAN', handle: 'itsoliviaj', bio: 'Baylor Psychology major. Mental health advocate, matcha lattes, and sunsets. 🍵🌅' },
  { first: 'Michael', last: 'Miller', gender: 'MAN', handle: 'mikemwaco', bio: 'Baylor Business. Finance enthusiast and golf player. Sic \'em Bears! 🐻📈' },
  { first: 'Sophia', last: 'Davis', gender: 'WOMAN', handle: 'sophdavis', bio: 'Nursing major at Baylor. Passionate about care, fitness, and running. 🏃‍♀️🩺' },
  { first: 'Andrew', last: 'Wilson', gender: 'MAN', handle: 'andywfilms', bio: 'Communication major. Film editor, music fan, and concert enthusiast. 🎬🎸' },
  { first: 'Ashley', last: 'Taylor', gender: 'WOMAN', handle: 'ashleytcreatives', bio: 'Marketing student. Design, photography, and thrift shopping. 📷🛍️' },
  { first: 'Matthew', last: 'Thomas', gender: 'MAN', handle: 'matttwaco', bio: 'Political Science at Baylor. History fan, outdoor runner, and taco critic. 🌮🏃‍♂️' },
  { first: 'Jessica', last: 'Anderson', gender: 'WOMAN', handle: 'jessandersondev', bio: 'Baylor CS student. Coding in Java/C++, cats, and boba tea lover. 🧋🐱' },
  { first: 'Daniel', last: 'White', gender: 'MAN', handle: 'danwtech', bio: 'Mechanical Engineering major. Robot builder, fitness coaching, and gym. ⚙️🏋️‍♂️' },
  { first: 'Sarah', last: 'Harris', gender: 'WOMAN', handle: 'sarahharrispaint', bio: 'Elementary Education at Baylor. Love kids, arts & crafts, and teaching. 🎨🏫' },
  { first: 'Christopher', last: 'Martin', gender: 'MAN', handle: 'chrismartinwaco', bio: 'Baylor Business student. Accounting major, finance fan, and Texas BBQ. 🍖📊' },
  { first: 'Elizabeth', last: 'Thompson', gender: 'WOMAN', handle: 'liztscience', bio: 'Biology major at Baylor. Future doctor, lab researcher, and tea enthusiast. 🔬🍵' },
  { first: 'Joseph', last: 'Garcia', gender: 'MAN', handle: 'josephgfinance', bio: 'Baylor Business. Investment analysis and playing basketball. 🏀📈' },
  { first: 'Samantha', last: 'Martinez', gender: 'WOMAN', handle: 'sammartinez', bio: 'Kinesiology student. Sports medicine, soccer, and gym workouts. ⚽🏋️‍♀️' },
  { first: 'William', last: 'Robinson', gender: 'MAN', handle: 'willrobinsonspace', bio: 'Mechanical Engineering at Baylor. Drone pilot, engineering projects, and chess. ♟️🤖' },
  { first: 'Lauren', last: 'Clark', gender: 'WOMAN', handle: 'laurencad', bio: 'Communication student. Public relations, social media, and coffee lover. ☕📱' },
  { first: 'David', last: 'Rodriguez', gender: 'MAN', handle: 'davidrfilms', bio: 'Baylor student. Video production, scriptwriting, and vinyl collector. 📻🎬' },
  { first: 'Megan', last: 'Lewis', gender: 'WOMAN', handle: 'meglewisvet', bio: 'Biology major. Future vet, animal shelter volunteer, and hiking. 🐶⛰️' },
  { first: 'John', last: 'Lee', gender: 'MAN', handle: 'johnltech', bio: 'Baylor CS. Full stack developer in progress, gamer, and boba. 🎮💻' },
  { first: 'Grace', last: 'Walker', gender: 'WOMAN', handle: 'gracewyoga', bio: 'Baylor Psychology. Yoga teacher, plant enthusiast, and watercolor painting. 🧘‍♀️🎨' },
  { first: 'Ryan', last: 'Hall', gender: 'MAN', handle: 'ryanhwaco', bio: 'Political Science at Baylor. Runner, hiker, and live music lover. 🏃‍♂️🎵' },
  { first: 'Chloe', last: 'Allen', gender: 'WOMAN', handle: 'chloeaarch', bio: 'Mechanical Engineering major. CAD modeling, robotics, and matcha. 🍵⚙️' },
  { first: 'Nicholas', last: 'Young', gender: 'MAN', handle: 'nicybiz', bio: 'Baylor Accounting. Future CPA, business networking, and playing tennis. 🎾💼' },
  { first: 'Victoria', last: 'King', gender: 'WOMAN', handle: 'vickingwords', bio: 'Communication student. Creative writing, classic books, and tea. 📚🍵' },
  { first: 'Tyler', last: 'Wright', gender: 'MAN', handle: 'tylerwmusic', bio: 'Baylor student. Guitarist, songwriter, and running. 🎸🏃‍♂️' },
  { first: 'Alexis', last: 'Lopez', gender: 'WOMAN', handle: 'alexisllabs', bio: 'Baylor Biology. Research assistant, baker, and cat owner. 🔬🍰' },
  { first: 'Alexander', last: 'Hill', gender: 'MAN', handle: 'alexhmech', bio: 'Mechanical Engineering major. Car tuning, CAD design, and weightlifting. 🚗🏋️‍♂️' },
  { first: 'Alyssa', last: 'Scott', gender: 'WOMAN', handle: 'alyssaswim', bio: 'Nursing major. Swimmer, fitness enthusiast, and healthy cooking. 🏊‍♀️🥗' },
  { first: 'James', last: 'Green', gender: 'MAN', handle: 'jamesgfitness', bio: 'Kinesiology student. Personal trainer in making, running, and tennis. 🎾🏃‍♂️' },
  { first: 'Hannah', last: 'Adams', gender: 'WOMAN', handle: 'hannahadamswaco', bio: 'Baylor Psychology. Love hiking at Cameron Park, yoga, and nature. 🧘‍♀️🌳' },
  { first: 'John', last: 'Baker', gender: 'MAN', handle: 'johnbakermed', bio: 'Biology major. Pre-med student, swimming, and science fiction. 🏊‍♂️📚' },
  { first: 'Taylor', last: 'Gonzalez', gender: 'WOMAN', handle: 'taylorgsocial', bio: 'Marketing student. Playlist curator, coffee lover, and graphic design. ☕🎨' },
  { first: 'Brandon', last: 'Nelson', gender: 'MAN', handle: 'brandonncode', bio: 'Baylor CS. Web developer, retro gamer, and boba enthusiast. 🎮💻' },
  { first: 'Abigail', last: 'Carter', gender: 'WOMAN', handle: 'abigailcmarketing', bio: 'Baylor Business. Marketing strategy, networking, and restaurants. 💼🍽️' },
  { first: 'Zachary', last: 'Mitchell', gender: 'MAN', handle: 'zachmphoto', bio: 'Communication student. Landscape photographer, hiking, and camping. 📷🥾' },
  { first: 'Brianna', last: 'Perez', gender: 'WOMAN', handle: 'briperezbakes', bio: 'Biology major. Future dentist, baking cupcakes, and cookies. 🔬🧁' },
  { first: 'Christian', last: 'Roberts', gender: 'MAN', handle: 'christianrtennis', bio: 'Political Science. Tennis player, fitness enthusiast, and reading. 🎾📖' },
  { first: 'Katherine', last: 'Turner', gender: 'WOMAN', handle: 'kattstudios', bio: 'Elementary Education. Painting, classroom crafting, and museum trips. 🎨🏫' },
  { first: 'Dylan', last: 'Phillips', gender: 'MAN', handle: 'dylanppiano', bio: 'Baylor CS. Piano player, jazz lover, and code. 🎹💻' },
  { first: 'Destiny', last: 'Campbell', gender: 'WOMAN', handle: 'destinycvoice', bio: 'Communication major. Choir singer, public speaking, and live music. 🎙️🎵' },
  { first: 'Benjamin', last: 'Parker', gender: 'MAN', handle: 'benpchess', bio: 'Mechanical Engineering. Chess player, science fiction, and space. ♟️🚀' },
  { first: 'Natalie', last: 'Evans', gender: 'WOMAN', handle: 'natalieewild', bio: 'Biology student. Wildlife rehabilitation volunteer and hiking. ⛰️🦊' },
  { first: 'Samuel', last: 'Edwards', gender: 'MAN', handle: 'samedesigns', bio: 'Marketing major. Graphic designer, video production, and tacos. 🎬🌮' },
  { first: 'Hailey', last: 'Collins', gender: 'WOMAN', handle: 'haileyccircuits', bio: 'Mechanical Engineering. Circuits, CAD modeling, and hot tea. 🍵⚙️' },
  { first: 'Gabriel', last: 'Stewart', gender: 'MAN', handle: 'gabesgolf', bio: 'Baylor Accounting. Golf player, entrepreneurship, and burgers. 🏌️‍♂️🍔' },
  { first: 'Julia', last: 'Sanchez', gender: 'WOMAN', handle: 'juliassprings', bio: 'Baylor Psychology. Hiking, lake swimming, and indie acoustic playlists. 🏊‍♀️🎵' },
  { first: 'Anthony', last: 'Morris', gender: 'MAN', handle: 'tonymclimb', bio: 'Kinesiology student. Rock climbing, outdoor workout, and design. 🧗‍♂️📐' }
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
  { q: 'Most spontaneous thing I’ve done…', a: 'Driving to Cameron Park at midnight for star watching.' },
  { q: 'I wind down by…', a: 'Running next to the Brazos River with my favorite album playing.' },
  { q: 'A dream date would be…', a: 'Grabbing a coffee at Common Grounds and walking around Waco Suspension Bridge.' },
  { q: 'The way to my heart is…', a: 'Bring me a box of pastries and talk about rocket science.' }
];

const LIFESTYLES = [
  { sports: ['Running'], zodiac: 'Aries', zodiacEmoji: '♈', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Basketball'], zodiac: 'Taurus', zodiacEmoji: '♉', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Libra', zodiacEmoji: '♎', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Golf'], zodiac: 'Scorpio', zodiacEmoji: '♏', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' }
];

async function run() {
  console.log('🏁 Starting seeder for 50 Baylor students...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const s = STUDENT_PROFILES[i];
    
    // Normalize to generate email
    const emailPrefix = s.first.toLowerCase() + '.' + s.last.toLowerCase();
    const email = `${emailPrefix}@baylor.edu`;
    const handle = `@${s.handle}`;
    const phone = `2547${String(i).padStart(6, '0')}`;

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

    // Waco neighborhoods
    const neighbor = WACO_NEIGHBORHOODS[i % WACO_NEIGHBORHOODS.length];
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

    const major = BAYLOR_MAJORS[i % BAYLOR_MAJORS.length];
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
        birthDate: new Date('2004-12-15T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio: s.bio,
            gender: s.gender,
            interestedIn: s.gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'Baylor University',
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

    console.log(`✅ Created Baylor student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name} with ${s.gender === 'WOMAN' ? 'Female' : 'Male'} photos`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} Baylor students.`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
