const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const SAN_ANTONIO_NEIGHBORHOODS = [
  { name: 'UTSA Main Campus / University Heights', lat: 29.5843, lon: -98.6189 },
  { name: 'La Cantera / Leon Valley', lat: 29.5932, lon: -98.6012 },
  { name: 'Medical Center', lat: 29.5083, lon: -98.5794 },
  { name: 'UTSA Downtown Campus / Downtown', lat: 29.4241, lon: -98.4936 },
  { name: 'Stone Oak', lat: 29.6105, lon: -98.4489 }
];

function getRandomOffset(maxOffset = 0.015) {
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

const UTSA_MAJORS = [
  'Cyber Security', 'Computer Science', 'Marketing', 'Mechanical Engineering',
  'Civil Engineering', 'Psychology', 'Accounting', 'Communication', 'Biology',
  'Kinesiology', 'Public Health', 'Criminology & Criminal Justice'
];

const STUDENT_PROFILES = [
  { first: 'Emily', last: 'Smith', gender: 'WOMAN', handle: '@emily_vibes', bio: 'UTSA student. Studying Kinesiology. Passionate about health, running, and coffee. ☕🏃‍♀️' },
  { first: 'Jacob', last: 'Johnson', gender: 'MAN', handle: '@jake.builds', bio: 'Mechanical Engineering at UTSA. Designing structures, playing basketball, and working out. 🛠️🏀' },
  { first: 'Madison', last: 'Williams', gender: 'WOMAN', handle: '@maddie_ad', bio: 'Marketing major. Creative thinker, photography lover, and exploring San Antonio cafes. 📷☕' },
  { first: 'Joshua', last: 'Brown', gender: 'MAN', handle: '@cs.josh', bio: 'Computer Science student. Coding in Python/JS, gaming, and coffee enthusiast. 💻🎮' },
  { first: 'Olivia', last: 'Jones', gender: 'WOMAN', handle: '@its_custom_oliv', bio: 'UTSA Psychology. Interested in human behavior, reading, and hiking at Government Canyon. 🌳📖' },
  { first: 'Michael', last: 'Miller', gender: 'MAN', handle: '@mike_m_satx', bio: 'Accounting student. Numbers, investments, and soccer fan. Go Roadrunners! 🤘⚽' },
  { first: 'Sophia', last: 'Davis', gender: 'WOMAN', handle: '@soph_davis', bio: 'Communication major at UTSA. Passionate about media, PR, and writing stories. ✒️🎙️' },
  { first: 'Andrew', last: 'Wilson', gender: 'MAN', handle: '@andy_w_films', bio: 'Cyber Security major. Focus on network safety, classic rock, and concerts. 🎸💻' },
  { first: 'Ashley', last: 'Taylor', gender: 'WOMAN', handle: '@ashley_t_creatives', bio: 'UTSA Marketing. Social media, creative writing, and painting. 🎨📱' },
  { first: 'Matthew', last: 'Thomas', gender: 'MAN', handle: '@matt.t.satx', bio: 'UTSA Criminology. History fan, outdoor runner, and taco lover. 🌮🏃‍♂️' },
  { first: 'Jessica', last: 'Anderson', gender: 'WOMAN', handle: '@jess.anderson.dev', bio: 'UTSA Computer Science. Full stack developer in progress, cat lover, and boba. 🧋🐱' },
  { first: 'Daniel', last: 'White', gender: 'MAN', handle: '@dan_w_tech', bio: 'UTSA Mechanical Engineering. Tech enthusiast, gym, and rock climbing. 🧗‍♂️⚙️' },
  { first: 'Sarah', last: 'Harris', gender: 'WOMAN', handle: '@sarah_harris_paint', bio: 'UTSA Communication. Art lover, museum crawler, and local coffee shops. ☕🎨' },
  { first: 'Christopher', last: 'Martin', gender: 'MAN', handle: '@chris_martin_satx', bio: 'Cyber Security student at UTSA. Love coding, networking, and Texas BBQ. 🍖💻' },
  { first: 'Elizabeth', last: 'Thompson', gender: 'WOMAN', handle: '@liz_t_science', bio: 'UTSA Biology major. Lab researcher, plant collector, and indie music. 🌱🎧' },
  { first: 'Joseph', last: 'Garcia', gender: 'MAN', handle: '@joseph.g.finance', bio: 'Accounting major. Love financial modeling, running, and playing tennis. 🎾📊' },
  { first: 'Samantha', last: 'Martinez', gender: 'WOMAN', handle: '@sam_martinez_satx', bio: 'UTSA Public Health. Health educator in progress, cooking, and fitness. 🥗🏋️‍♀️' },
  { first: 'William', last: 'Robinson', gender: 'MAN', handle: '@will_robinson_space', bio: 'Mechanical Engineering major. Building robots and stargazing. 🌌🤖' },
  { first: 'Lauren', last: 'Clark', gender: 'WOMAN', handle: '@lauren_c_ad', bio: 'Marketing student. Creative marketing, photography, and thrift shopping. 📷🛍️' },
  { first: 'David', last: 'Rodriguez', gender: 'MAN', handle: '@david_r_films', bio: 'UTSA Communication. Video editing, indie cinema, and record collector. 📻🎬' },
  { first: 'Megan', last: 'Lewis', gender: 'WOMAN', handle: '@meg_lewis_vet', bio: 'UTSA Biology. Future veterinarian, animal rescue volunteer, and hiking. 🐶⛰' },
  { first: 'John', last: 'Lee', gender: 'MAN', handle: '@john_l_tech', bio: 'UTSA Computer Science. Cyber security enthusiast, gamer, and boba. 🎮🧋' },
  { first: 'Grace', last: 'Walker', gender: 'WOMAN', handle: '@grace_w_yoga', bio: 'UTSA Psychology major. Yoga, meditation, plants, and watercolor painting. 🧘‍♀️🎨' },
  { first: 'Ryan', last: 'Hall', gender: 'MAN', handle: '@ryan_h_satx', bio: 'UTSA Criminology. Running, soccer, and exploring San Antonio parks. 🏃‍♂️⚽' },
  { first: 'Chloe', last: 'Allen', gender: 'WOMAN', handle: '@chloe_a_arch', bio: 'Civil Engineering student. Designing bridges and drinking matcha. 🍵🌉' },
  { first: 'Nicholas', last: 'Young', gender: 'MAN', handle: '@nic_y_biz', bio: 'UTSA Marketing. Business strategy, networking, and playing tennis. 🎾💼' },
  { first: 'Victoria', last: 'King', gender: 'WOMAN', handle: '@vic_king_words', bio: 'Communication major. Writing blogs, reading classic novels, and coffee. ☕📚' },
  { first: 'Tyler', last: 'Wright', gender: 'MAN', handle: '@tyler_w_music', bio: 'UTSA student. Guitarist, live music fan, and outdoor running. 🎸🏃‍♂️' },
  { first: 'Alexis', last: 'Lopez', gender: 'WOMAN', handle: '@alexis_l_labs', bio: 'UTSA Public Health. Science enthusiast, baker, and cat lover. 🔬🧁' },
  { first: 'Alexander', last: 'Hill', gender: 'MAN', handle: '@alex_h_mech', bio: 'Mechanical Engineering major. Car enthusiast, robotics, and gym. 🚗🏋️‍♂️' },
  { first: 'Alyssa', last: 'Scott', gender: 'WOMAN', handle: '@alyssa_s_swim', bio: 'UTSA Kinesiology. Swimming coach in progress, yoga, and Barton Springs visits. 🏊‍♀️🧘‍♀️' },
  { first: 'James', last: 'Green', gender: 'MAN', handle: '@james_g_fitness', bio: 'UTSA Accounting. Weightlifting, fitness coaching, and running. 🏋️‍♂️🏃‍♂️' },
  { first: 'Hannah', last: 'Adams', gender: 'WOMAN', handle: '@hannah_adams_satx', bio: 'UTSA Psychology. Mental health advocate, hiking, and nature. 🌳⛰️' },
  { first: 'John', last: 'Baker', gender: 'MAN', handle: '@john_baker_med', bio: 'Biology major. Future doctor, swimming, and reading medical journals. 🏊‍♂️🩺' },
  { first: 'Taylor', last: 'Gonzalez', gender: 'WOMAN', handle: '@taylor_g_social', bio: 'UTSA Marketing. Social media coordinator, music curator, and coffee. ☕🎧' },
  { first: 'Brandon', last: 'Nelson', gender: 'MAN', handle: '@brandon_n_code', bio: 'UTSA CS. Software development, playing retro video games, and boba. 🎮🧋' },
  { first: 'Abigail', last: 'Carter', gender: 'WOMAN', handle: '@abigail_c_marketing', bio: 'Marketing student. Business consulting, networking, and fine dining. 💼🍷' },
  { first: 'Zachary', last: 'Mitchell', gender: 'MAN', handle: '@zach_m_photo', bio: 'UTSA Communication. Professional photography, film, and hiking. 📷🥾' },
  { first: 'Brianna', last: 'Perez', gender: 'WOMAN', handle: '@bri_perez_bakes', bio: 'UTSA Chemistry. Science lover, baking custom cakes, and cookies. 🔬🍪' },
  { first: 'Christian', last: 'Roberts', gender: 'MAN', handle: '@christian_r_tennis', bio: 'UTSA Criminology. Playing tennis, outdoor activities, and reading. 🎾📖' },
  { first: 'Katherine', last: 'Turner', gender: 'WOMAN', handle: '@kat_t_studios', bio: 'Fine Arts student. Oil painting, sculpture, and gallery curation. 🎨🏛️' },
  { first: 'Dylan', last: 'Phillips', gender: 'MAN', handle: '@dylan_p_piano', bio: 'UTSA CS. Coding projects, playing piano, and coffee addict. ☕🎹' },
  { first: 'Destiny', last: 'Campbell', gender: 'WOMAN', handle: '@destiny_c_voice', bio: 'UTSA Communication. Singing, public speaking, and concert-goer. 🎙️🎵' },
  { first: 'Benjamin', last: 'Parker', gender: 'MAN', handle: '@ben_p_chess', bio: 'UTSA Mechanical Engineering. Chess master, science fiction novels, and space. ♟️🚀' },
  { first: 'Natalie', last: 'Evans', gender: 'WOMAN', handle: '@natalie_e_wild', bio: 'UTSA Biology. Wildlife research, volunteer at animal shelters, and hiking. ⛰️🦊' },
  { first: 'Samuel', last: 'Edwards', gender: 'MAN', handle: '@sam_e_designs', bio: 'UTSA Marketing. Graphic design, video creator, and music. 🎬🎧' },
  { first: 'Hailey', last: 'Collins', gender: 'WOMAN', handle: '@hailey_c_circuits', bio: 'UTSA Electrical Engineering. Circuits, robotics, and hot tea. 🍵🤖' },
  { first: 'Gabriel', last: 'Stewart', gender: 'MAN', handle: '@gabe_s_golf', bio: 'UTSA Accounting. Playing golf, business startup planning, and tacos. 🏌️‍♂️🌮' },
  { first: 'Julia', last: 'Sanchez', gender: 'WOMAN', handle: '@julia_s_springs', bio: 'UTSA Psychology. Hiking in parks, swimming, and acoustic playlists. 🏊‍♀️🎵' },
  { first: 'Anthony', last: 'Morris', gender: 'MAN', handle: '@tony_m_climb', bio: 'UTSA Civil Engineering. Rock climbing, backpacking, and design. 🧗‍♂️📐' }
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
  { q: 'Most spontaneous thing I’ve done…', a: 'Driving to downtown San Antonio at midnight for churros.' },
  { q: 'I wind down by…', a: 'Running in the Leon Creek Greenway after a heavy exam day.' },
  { q: 'A dream date would be…', a: 'Going to La Cantera for dinner and then talking under the stars.' },
  { q: 'The way to my heart is…', a: 'Share a playlist of classic rock and bring me some tacos.' }
];

const LIFESTYLES = [
  { sports: ['Running'], zodiac: 'Capricorn', zodiacEmoji: '♑', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Basketball'], zodiac: 'Aquarius', zodiacEmoji: '♒', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Libra', zodiacEmoji: '♎', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Golf'], zodiac: 'Leo', zodiacEmoji: '♌', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' }
];

async function run() {
  console.log('🏁 Starting seeder for 50 UTSA students...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const s = STUDENT_PROFILES[i];
    
    // Normalize to generate email
    const emailPrefix = s.first.toLowerCase() + '.' + s.last.toLowerCase();
    const email = `${emailPrefix}@utsa.edu`;
    const handle = s.handle;
    const phone = `2107${String(i).padStart(6, '0')}`;

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

    // San Antonio neighborhoods
    const neighbor = SAN_ANTONIO_NEIGHBORHOODS[i % SAN_ANTONIO_NEIGHBORHOODS.length];
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

    const major = UTSA_MAJORS[i % UTSA_MAJORS.length];
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
        birthDate: new Date('2004-11-20T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio: s.bio,
            gender: s.gender,
            interestedIn: s.gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'The University of Texas at San Antonio',
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

    console.log(`✅ Created UTSA student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name} with ${s.gender === 'WOMAN' ? 'Female' : 'Male'} photos`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} UTSA students.`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
