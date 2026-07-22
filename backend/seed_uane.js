const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = new PrismaClient();

const femaleNames = [
  { first: 'Sofía', last: 'Garza', handle: 'sofia_garza' },
  { first: 'Camila', last: 'Rodríguez', handle: 'camila_rod' },
  { first: 'Valentina', last: 'Galindo', handle: 'vale_galindo' },
  { first: 'Isabella', last: 'Cantú', handle: 'isa_cantu' },
  { first: 'Regina', last: 'Treviño', handle: 'regi_trev' },
  { first: 'Natalia', last: 'Elizondo', handle: 'nat_elizondo' },
  { first: 'Ximena', last: 'Cavazos', handle: 'xime_c' },
  { first: 'Renata', last: 'Guajardo', handle: 'reny_g' },
  { first: 'Andrea', last: 'Longoria', handle: 'andy_l' },
  { first: 'Paulina', last: 'Ramos', handle: 'pau_ramos' }
];

const maleNames = [
  { first: 'Mateo', last: 'Martínez', handle: 'mateo_mtz' },
  { first: 'Diego', last: 'Fuentes', handle: 'diego_f' },
  { first: 'Sebastián', last: 'Hinojosa', handle: 'sebas_h' },
  { first: 'Emiliano', last: 'Salazar', handle: 'emi_salazar' },
  { first: 'Leonardo', last: 'Villarreal', handle: 'leo_villa' },
  { first: 'Alejandro', last: 'Guerra', handle: 'ale_guerra' },
  { first: 'Daniel', last: 'Farías', handle: 'dani_f' },
  { first: 'Rodrigo', last: 'Maldonado', handle: 'rod_maldonado' },
  { first: 'Mauricio', last: 'Cepeda', handle: 'mau_cepeda' },
  { first: 'Gerardo', last: 'de la Cruz', handle: 'gera_dlc' }
];

// Unsplash photo IDs for female students (10 sets of 4 unique photo IDs)
const femalePhotoSets = [
  ['photo-1494790108377-be9c29b29330', 'photo-1524504388940-b1c1722653e1', 'photo-1488426862026-3ee34a7d66df', 'photo-1544005313-94ddf0286df2'],
  ['photo-1534528741775-53994a69daeb', 'photo-1531746020798-e6953c6e8e04', 'photo-1554151228-14d9def656e4', 'photo-1508214751196-bcfd4ca60f91'],
  ['photo-1567532939604-b6b5b0db2604', 'photo-1580489944761-15a19d654956', 'photo-1573496359142-b8d87734a5a2', 'photo-1548142813-c348350df52b'],
  ['photo-1551836022-d5d88e9218df', 'photo-1594744803329-e58b31de215f', 'photo-1502823403499-6ccfcf4fb453', 'photo-1492562080023-ab3db95bfbce'],
  ['photo-1481214110143-ed630391e914', 'photo-1521119989659-a83eee488004', 'photo-1542206395-9feb3edaa68d', 'photo-1509967419530-da38b4704bc6'],
  ['photo-1531123897727-8f129e1688ce', 'photo-1500048993953-d23a436266cf', 'photo-1520155707862-5b32817385d3', 'photo-1557555187-23d685287bc3'],
  ['photo-1579038773867-044c48829161', 'photo-1589156280159-27698a70f29e', 'photo-1598550874175-4d0ef436c909', 'photo-1601412436009-d964bd02edbc'],
  ['photo-1614283233556-f35b0c801ef1', 'photo-1619380061814-58f03707f082', 'photo-1607746882042-944635dfe10e', 'photo-1619895862022-09114b41f16f'],
  ['photo-1598550880863-4e8ae3e0ec3e', 'photo-1609081219090-a6d81d3085bf', 'photo-1610030469983-98e550d6193c', 'photo-1611042553975-08733608b2db'],
  ['photo-1611608822650-925c227ef4d2', 'photo-1621605815971-fbc98d665033', 'photo-1519699047748-de8e457a634e', 'photo-1494790108377-be9c29b29330']
];

// Unsplash photo IDs for male students (10 sets of 4 unique photo IDs)
const malePhotoSets = [
  ['photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e', 'photo-1539571696357-5a69c17a67c6', 'photo-1506794778202-cad84cf45f1d'],
  ['photo-1519085360753-af0119f7cbe7', 'photo-1522075469751-3a6694fb2f61', 'photo-1566492031773-4f4e44671857', 'photo-1542909168-82c3e7fdca5c'],
  ['photo-1513956589380-bad6acb9b9d4', 'photo-1531427186611-ecfd6d936c79', 'photo-1504257400765-1888925f7b85', 'photo-1506794778202-cad84cf45f1d'],
  ['photo-1519345182560-3f2917c472ef', 'photo-1492562080023-ab3db95bfbce', 'photo-1500048993953-d23a436266cf', 'photo-1531427186611-ecfd6d936c79'],
  ['photo-1539571696357-5a69c17a67c6', 'photo-1507003211169-0a1dd7228f2d', 'photo-1519085360753-af0119f7cbe7', 'photo-1522075469751-3a6694fb2f61'],
  ['photo-1489980508314-941910ded1f4', 'photo-1506794778202-cad84cf45f1d', 'photo-1519085360753-af0119f7cbe7', 'photo-1500648767791-00dcc994a43e'],
  ['photo-1500648767791-00dcc994a43e', 'photo-1539571696357-5a69c17a67c6', 'photo-1507003211169-0a1dd7228f2d', 'photo-1519085360753-af0119f7cbe7'],
  ['photo-1522075469751-3a6694fb2f61', 'photo-1566492031773-4f4e44671857', 'photo-1542909168-82c3e7fdca5c', 'photo-1513956589380-bad6acb9b9d4'],
  ['photo-1513956589380-bad6acb9b9d4', 'photo-1531427186611-ecfd6d936c79', 'photo-1504257400765-1888925f7b85', 'photo-1492562080023-ab3db95bfbce'],
  ['photo-1519345182560-3f2917c472ef', 'photo-1507003211169-0a1dd7228f2d', 'photo-1539571696357-5a69c17a67c6', 'photo-1522075469751-3a6694fb2f61']
];

const majors = ['Derecho', 'Psicología', 'Administración de Empresas', 'Sistemas', 'Diseño Gráfico', 'Comercio Internacional'];
const gradYears = ["May '26", "Dec '26", "May '27", "Dec '27"];
const bios = [
  'Buscando conocer gente chida de UANE.',
  'Estudio leyes. Apasionada de la lectura y el café.',
  'Sistemas en UANE, me gusta programar y los videojuegos.',
  'Administración. Fan del gimnasio y los viajes.',
  'Siempre alegre. Me encanta ir a conciertos y salir los fines.',
  'Psicología. Amante de la música y pláticas profundas.',
  'Diseño gráfico. Me encanta pintar y la fotografía.',
  'Comercio internacional. Me gusta el deporte y conocer nuevos lugares.',
  'Tranquilo. Me gusta el cine, los tacos y buena compañía.',
  'Sistemas computacionales. Melómano y cinéfilo.'
];

async function main() {
  console.log('🌱 Starting seed of 20 UANE students in Piedras Negras...');
  const passwordHash = bcrypt.hashSync('Uane2026!', 10);

  const students = [];
  
  // Create 10 Female profiles
  for (let i = 0; i < 10; i++) {
    const info = femaleNames[i];
    const email = `${info.handle}@uane.edu.mx`;
    students.push({
      email,
      handle: `@${info.handle}`,
      firstName: info.first,
      lastName: info.last,
      gender: 'WOMAN',
      interestedIn: 'MAN',
      bio: bios[i % bios.length],
      major: majors[i % majors.length],
      grad: gradYears[i % gradYears.length],
      photoIds: femalePhotoSets[i]
    });
  }

  // Create 10 Male profiles
  for (let i = 0; i < 10; i++) {
    const info = maleNames[i];
    const email = `${info.handle}@uane.edu.mx`;
    students.push({
      email,
      handle: `@${info.handle}`,
      firstName: info.first,
      lastName: info.last,
      gender: 'MAN',
      interestedIn: 'WOMAN',
      bio: bios[(i + 5) % bios.length],
      major: majors[(i + 2) % majors.length],
      grad: gradYears[(i + 1) % gradYears.length],
      photoIds: malePhotoSets[i]
    });
  }

  for (const s of students) {
    // Generate slight random offset for coordinates around Piedras Negras
    const latitude = 28.7001 + (Math.random() - 0.5) * 0.015;
    const longitude = -100.5235 + (Math.random() - 0.5) * 0.015;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: s.email }
    });

    if (existing) {
      console.log(`User ${s.email} already exists. Skipping.`);
      continue;
    }

    const birthYear = 2000 + Math.floor(Math.random() * 6); // 2000 to 2005 (ages 21 to 26)
    const birthDate = new Date(`${birthYear}-05-15`);

    // Create user and profile
    const createdUser = await prisma.user.create({
      data: {
        email: s.email,
        handle: s.handle,
        passwordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: `+52878${1000000 + i}`,
        referralCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
        birthDate,
        isEmailVerified: true,
        isPhoneVerified: true,
        profile: {
          create: {
            gender: s.gender,
            interestedIn: s.interestedIn,
            bio: s.bio,
            university: 'Universidad Americana del Noreste',
            major: s.major,
            grad: s.grad,
            latitude,
            longitude,
            minAge: 18,
            maxAge: 26,
            maxDistanceKm: 30,
            academic: {
              campus: 'Piedras Negras',
              minor: '',
              degree: '',
              advDegrees: [],
              backOnCampus: true,
              helpClasses: [],
              clubs: [],
              involved: []
            },
            interests: ['Música', 'Café', 'Cine', 'Tacos', 'Viajes'],
            lifestyle: {
              diet: 'None',
              drinking: 'Socially',
              smoking: 'No',
              sports: ['Running'],
              workout: 'Sometimes',
              loveLanguage: 'Quality Time',
              zodiac: 'Scorpio'
            }
          }
        }
      }
    });

    // Create 4 Photo records
    for (let order = 0; order < 4; order++) {
      const photoId = s.photoIds[order];
      const url = photoId.startsWith('photo-') ? `https://images.unsplash.com/${photoId}?q=80&w=400&auto=format&fit=crop` : `https://images.unsplash.com/photo-${photoId}?q=80&w=400&auto=format&fit=crop`;
      await prisma.photo.create({
        data: {
          userId: createdUser.id,
          url,
          order
        }
      });
    }

    console.log(`Created student: ${s.firstName} ${s.lastName} (${s.email}) with 4 photos and Piedras Negras coordinates.`);
  }

  // Verification query
  const count = await prisma.user.count({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    }
  });

  const sample = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    },
    include: {
      profile: true,
      photos: true
    },
    take: 3
  });

  console.log('\n--- VERIFICATION ---');
  console.log(`Total registered UANE students: ${count}`);
  console.log('Sample profiles created:');
  sample.forEach(user => {
    console.log(`- ${user.firstName} ${user.lastName} (@${user.handle})`);
    console.log(`  University: ${user.profile.university}`);
    console.log(`  Campus: ${user.profile.academic ? user.profile.academic.campus : 'N/A'}`);
    console.log(`  Coords: (${user.profile.latitude}, ${user.profile.longitude})`);
    console.log(`  Photos count: ${user.photos.length}`);
  });

  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
