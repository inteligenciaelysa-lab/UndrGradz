const { PrismaClient } = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/@prisma/client');
const bcrypt = require('c:/Users/PC STARK/Downloads/UndrGradz neon/backend/node_modules/bcrypt');

const prisma = new PrismaClient();

const AUSTIN_NEIGHBORHOODS = [
  { name: 'West Campus', lat: 30.2885, lon: -97.7444 },
  { name: 'East Campus / Manor Road', lat: 30.2838, lon: -97.7225 },
  { name: 'Hyde Park / North Loop', lat: 30.3023, lon: -97.7298 },
  { name: 'East Riverside', lat: 30.2378, lon: -97.7123 },
  { name: 'Downtown Austin', lat: 30.2729, lon: -97.7394 }
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

const UT_MAJORS = [
  'Computer Science', 'Business Administration', 'Electrical Engineering',
  'Aerospace Engineering', 'Radio-Television-Film', 'Advertising',
  'Psychology', 'Economics', 'Biology', 'Architecture', 'Mechanical Engineering'
];

const STUDENT_PROFILES = [
  { first: 'Emily', last: 'Smith', gender: 'WOMAN', handle: '@emily.readss', bio: 'UT Austin. Radio-Television-Film. Always behind the camera or reading a good script. 🎥📖' },
  { first: 'Jacob', last: 'Johnson', gender: 'MAN', handle: '@jake.codes', bio: 'Computer Science at UT Austin. Hackathons, caffeine, and gym. 💻🏋️‍♂️' },
  { first: 'Madison', last: 'Williams', gender: 'WOMAN', handle: '@maddie_adver', bio: 'Advertising major at Moody College. Love creating content and exploring Austin food trucks. 🌮✨' },
  { first: 'Joshua', last: 'Brown', gender: 'MAN', handle: '@cs_josh', bio: 'UT Austin CS. Let\'s build the next big thing. Also playing guitar. 🎸💻' },
  { first: 'Olivia', last: 'Jones', gender: 'WOMAN', handle: '@its_oliv_ia', bio: 'UT Austin Psychology. Deep conversations, matcha lattes, and sunsets at Mount Bonnell. 🌅🍵' },
  { first: 'Michael', last: 'Miller', gender: 'MAN', handle: '@mike_miller.atx', bio: 'McCombs School of Business. Finance and golf enthusiast. Hook \'em! 🤘🏌️‍♂️' },
  { first: 'Sophia', last: 'Davis', gender: 'WOMAN', handle: '@davis_sophia', bio: 'Architecture at UT Austin. Designing spaces and drawing cityscapes. 🏛️📐' },
  { first: 'Andrew', last: 'Wilson', gender: 'MAN', handle: '@andy_wilson_films', bio: 'RTF major in Moody. Filmmaker, classic rock fan, and concert-goer. 🎥🎸' },
  { first: 'Ashley', last: 'Taylor', gender: 'WOMAN', handle: '@ashley_t_designs', bio: 'Advertising at UT Austin. Visual arts, design, and vintage clothing. 🎨👗' },
  { first: 'Matthew', last: 'Thomas', gender: 'MAN', handle: '@matt.thomas.atx', bio: 'Economics major. Fan of statistics, tacos, and paddleboarding on Lady Bird Lake. 🏄‍♂️🌮' },
  { first: 'Jessica', last: 'Anderson', gender: 'WOMAN', handle: '@jess_anderson_cs', bio: 'UT CS. Machine learning, cat videos, and early morning runs. 🏃‍♀️🐱' },
  { first: 'Daniel', last: 'White', gender: 'MAN', handle: '@dan_white_sports', bio: 'UT Austin Electrical Engineering. Robot builder and soccer player. ⚽🤖' },
  { first: 'Sarah', last: 'Harris', gender: 'WOMAN', handle: '@sarah.harris.arts', bio: 'Studio Art at UT. Acrylic painting, museums, and exploring East Austin. 🎨🌸' },
  { first: 'Christopher', last: 'Martin', gender: 'MAN', handle: '@chris_martin_atx', bio: 'McCombs Business. Future entrepreneur, hiking fan, and taco critic. 🌮⛰️' },
  { first: 'Elizabeth', last: 'Thompson', gender: 'WOMAN', handle: '@liz_thompson_chem', bio: 'Biochemistry major. Lab researcher, tea enthusiast, and fan of indie music. 🧪🎧' },
  { first: 'Joseph', last: 'Garcia', gender: 'MAN', handle: '@joseph.garcia.biz', bio: 'UT McCombs Finance. Focused on markets and playing basketball. 🏀📈' },
  { first: 'Samantha', last: 'Martinez', gender: 'WOMAN', handle: '@sam_martinez_vibe', bio: 'Advertising major. Social media, pop culture, and exploring coffee shops in Austin. ☕📱' },
  { first: 'William', last: 'Robinson', gender: 'MAN', handle: '@will_robinson_real', bio: 'UT Austin Aerospace Engineering. Rocket scientist in the making. 🚀✨' },
  { first: 'Lauren', last: 'Clark', gender: 'WOMAN', handle: '@lauren_clark_ad', bio: 'Moody Advertising. Creative thinker, photographer, and thrift store lover. 📷🛍️' },
  { first: 'David', last: 'Rodriguez', gender: 'MAN', handle: '@david_rod_films', bio: 'RTF student. Scriptwriting, indie cinema, and vinyl record collector. 📻🎬' },
  { first: 'Megan', last: 'Lewis', gender: 'WOMAN', handle: '@meg_lewis_bio', bio: 'Biology major at UT. Future vet, volunteer, and dog lover. 🐶🏥' },
  { first: 'John', last: 'Lee', gender: 'MAN', handle: '@john_lee_tech', bio: 'UT CS. Full-stack developer, gamer, and boba tea lover. 🧋🎮' },
  { first: 'Grace', last: 'Walker', gender: 'WOMAN', handle: '@grace_walker_art', bio: 'Meadows fine arts transfer. Watercolor artist, plant mom, and yoga. 🧘‍♀️🌱' },
  { first: 'Ryan', last: 'Hall', gender: 'MAN', handle: '@ryan_hall_atx', bio: 'Economics at UT. Outdoor enthusiast, runner, and live music fan. 🏃‍♂️🎵' },
  { first: 'Chloe', last: 'Allen', gender: 'WOMAN', handle: '@chloe_allen_real', bio: 'UT Austin Architecture. Creating models and exploring Austin cafes. 📐☕' },
  { first: 'Nicholas', last: 'Young', gender: 'MAN', handle: '@nic_young_finance', bio: 'UT McCombs. Finance major. Love investments and playing soccer. ⚽📊' },
  { first: 'Victoria', last: 'King', gender: 'WOMAN', handle: '@vic_king_journ', bio: 'UT Journalism. Writing stories, coffee, and reading classical literature. ✒️📚' },
  { first: 'Tyler', last: 'Wright', gender: 'MAN', handle: '@tyler_wright_film', bio: 'RTF major. Post-production editor and guitar player. 🎬🎸' },
  { first: 'Alexis', last: 'Lopez', gender: 'WOMAN', handle: '@alexis_lopez_chem', bio: 'UT Biochemistry. Science nerd, baker, and cat owner. 🔬🍰' },
  { first: 'Alexander', last: 'Hill', gender: 'MAN', handle: '@alex_hill_mech', bio: 'Mechanical Engineering student. Fast cars, robotics, and weightlifting. 🚗🏋️‍♂️' },
  { first: 'Alyssa', last: 'Scott', gender: 'WOMAN', handle: '@alyssa_scott_art', bio: 'Advertising student. Creative design and exploring Barton Springs. 🏊‍♀️🎨' },
  { first: 'James', last: 'Green', gender: 'MAN', handle: '@james_green_sports', bio: 'UT Economics. Running, soccer, and exploring Texas BBQ spots. 🍖⚽' },
  { first: 'Hannah', last: 'Adams', gender: 'WOMAN', handle: '@hannah_adams_atx', bio: 'UT Psychology. Mental health advocate, yoga fan, and nature lover. 🧘‍♀️🌳' },
  { first: 'John', last: 'Baker', gender: 'MAN', handle: '@john_baker_bio', bio: 'Biology major. Future medical student and swimming enthusiast. 🏊‍♂️🩺' },
  { first: 'Taylor', last: 'Gonzalez', gender: 'WOMAN', handle: '@taylor_gonzalez_ad', bio: 'UT Austin Advertising. Social media manager, playlist curator, and coffee. ☕🎧' },
  { first: 'Brandon', last: 'Nelson', gender: 'MAN', handle: '@brandon_nel_tech', bio: 'UT Computer Science. Tech nerd, anime fan, and gaming. 🎮💻' },
  { first: 'Abigail', last: 'Carter', gender: 'WOMAN', handle: '@abigail_carter_biz', bio: 'McCombs Marketing. Networking, business, and exploring Austin restaurants. 🍽️💼' },
  { first: 'Zachary', last: 'Mitchell', gender: 'MAN', handle: '@zach_mitch_films', bio: 'RTF Moody College. Cinema lover, photographer, and hiking. 📷🥾' },
  { first: 'Brianna', last: 'Perez', gender: 'WOMAN', handle: '@bri_perez_chem', bio: 'UT Chemistry. Lab work, science enthusiast, and baking cookies. 🍪🔬' },
  { first: 'Christian', last: 'Roberts', gender: 'MAN', handle: '@christian_rob_sports', bio: 'UT Economics. Football fan, fitness, and playing tennis. 🎾🏈' },
  { first: 'Katherine', last: 'Turner', gender: 'WOMAN', handle: '@kat_turner_art', bio: 'Fine Arts UT Austin. Oil painting, sculpture, and museum visits. 🎨🏛️' },
  { first: 'Dylan', last: 'Phillips', gender: 'MAN', handle: '@dylan_phil_cs', bio: 'UT Computer Science. Coding, playing piano, and coffee lover. ☕🎹' },
  { first: 'Destiny', last: 'Campbell', gender: 'WOMAN', handle: '@destiny_camp_journ', bio: 'Journalism at UT. Podcasting, writing, and live music fan. 🎙️🎵' },
  { first: 'Benjamin', last: 'Parker', gender: 'MAN', handle: '@ben_parker_real', bio: 'Aerospace Engineering UT. Space fan, reading, and chess. 🚀♟️' },
  { first: 'Natalie', last: 'Evans', gender: 'WOMAN', handle: '@natalie_ev_bio', bio: 'UT Biology. Future veterinarian, animal volunteer, and hiking. 🐶⛰️' },
  { first: 'Samuel', last: 'Edwards', gender: 'MAN', handle: '@sam_edwards_ad', bio: 'Moody Advertising. Creative designer, live music, and tacos. 🌮🎵' },
  { first: 'Hailey', last: 'Collins', gender: 'WOMAN', handle: '@hailey_coll_tech', bio: 'UT Electrical Engineering. Coding, circuits, and drinking chai lattes. 🍵🔌' },
  { first: 'Gabriel', last: 'Stewart', gender: 'MAN', handle: '@gabe_stewart_biz', bio: 'McCombs Business. Future CEO, golf enthusiast, and foodie. 🏌️‍♂️🍔' },
  { first: 'Julia', last: 'Sanchez', gender: 'WOMAN', handle: '@julia_sanchez_atx', bio: 'UT Psychology. Love hiking, Barton Springs, and indie pop. 🏊‍♀️🎧' },
  { first: 'Anthony', last: 'Morris', gender: 'MAN', handle: '@tony_morris_films', bio: 'RTF student UT Austin. Filmmaker, scriptwriter, and rock climbing. 🧗‍♂️🎬' }
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
  { q: 'Most spontaneous thing I’ve done…', a: 'Driving to Barton Springs at midnight for a night swim.' },
  { q: 'I wind down by…', a: 'Paddleboarding on Lady Bird Lake with a good playlist.' },
  { q: 'A dream date would be…', a: 'Tacos on South Congress and then walking to a live music show.' },
  { q: 'The way to my heart is…', a: 'Bring me a coffee from Mozart\'s and let\'s talk about scripts.' }
];

const LIFESTYLES = [
  { sports: ['Swimming'], zodiac: 'Pisces', zodiacEmoji: '♓', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' },
  { sports: ['Running'], zodiac: 'Scorpio', zodiacEmoji: '♏', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Sometimes' },
  { sports: ['Tennis'], zodiac: 'Libra', zodiacEmoji: '♎', zodiacShow: true, drinking: 'Socially', smoking: 'Sometimes', workout: 'Often' },
  { sports: ['Soccer'], zodiac: 'Sagittarius', zodiacEmoji: '♐', zodiacShow: true, drinking: 'Socially', smoking: 'No', workout: 'Often' }
];

async function run() {
  console.log('🏁 Starting seeder for 50 UT Austin students...');
  const passwordHash = await bcrypt.hash('123456', 10);

  let createdCount = 0;
  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const s = STUDENT_PROFILES[i];
    
    // Normalize to generate email
    const emailPrefix = s.first.toLowerCase() + '.' + s.last.toLowerCase();
    const email = `${emailPrefix}@utexas.edu`;
    const handle = s.handle;
    const phone = `5127${String(i).padStart(6, '0')}`;

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

    // Austin neighborhoods
    const neighbor = AUSTIN_NEIGHBORHOODS[i % AUSTIN_NEIGHBORHOODS.length];
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

    const major = UT_MAJORS[i % UT_MAJORS.length];
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
        birthDate: new Date('2004-09-20T00:00:00Z'),
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: generateReferralCode(),
        profile: {
          create: {
            bio: s.bio,
            gender: s.gender,
            interestedIn: s.gender === 'MAN' ? 'WOMAN' : 'MAN',
            university: 'The University of Texas at Austin',
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

    console.log(`✅ Created UT Austin student: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.handle}) in ${neighbor.name} with ${s.gender === 'WOMAN' ? 'Female' : 'Male'} photos`);
    createdCount++;
  }

  console.log(`🎉 Finished seeding. Successfully registered ${createdCount} UT Austin students.`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
