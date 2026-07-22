const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = new PrismaClient();

const extraFemales = [
  { first: 'Valeria', last: 'Orozco', handle: 'valeriaorozco' },
  { first: 'Daniela', last: 'Castro', handle: 'danielacastro' },
  { first: 'Mariana', last: 'Méndez', handle: 'marianamendez' },
  { first: 'Gabriela', last: 'Ortiz', handle: 'gabrielaortiz' },
  { first: 'Alejandra', last: 'Silva', handle: 'alesilva' }
];

const extraMales = [
  { first: 'Fernando', last: 'Pineda', handle: 'fernandopineda' },
  { first: 'Ricardo', last: 'Soto', handle: 'ricardosoto' },
  { first: 'Javier', last: 'Luna', handle: 'javierluna' },
  { first: 'Carlos', last: 'Huerta', handle: 'carloshuerta' },
  { first: 'Juan Pablo', last: 'Ruiz', handle: 'juanpabloruiz' }
];

const femalePhotoSets = [
  ['photo-1544005313-94ddf0286df2', 'photo-1524504388940-b1c1722653e1', 'photo-1494790108377-be9c29b29330', 'photo-1534528741775-53994a69daeb'],
  ['photo-1488426862026-3ee34a7d66df', 'photo-1531746020798-e6953c6e8e04', 'photo-1554151228-14d9def656e4', 'photo-1508214751196-bcfd4ca60f91'],
  ['photo-1567532939604-b6b5b0db2604', 'photo-1580489944761-15a19d654956', 'photo-1573496359142-b8d87734a5a2', 'photo-1548142813-c348350df52b'],
  ['photo-1551836022-d5d88e9218df', 'photo-1594744803329-e58b31de215f', 'photo-1502823403499-6ccfcf4fb453', 'photo-1492562080023-ab3db95bfbce'],
  ['photo-1481214110143-ed630391e914', 'photo-1521119989659-a83eee488004', 'photo-1542206395-9feb3edaa68d', 'photo-1509967419530-da38b4704bc6']
];

const malePhotoSets = [
  ['photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e', 'photo-1539571696357-5a69c17a67c6', 'photo-1506794778202-cad84cf45f1d'],
  ['photo-1519085360753-af0119f7cbe7', 'photo-1522075469751-3a6694fb2f61', 'photo-1566492031773-4f4e44671857', 'photo-1542909168-82c3e7fdca5c'],
  ['photo-1513956589380-bad6acb9b9d4', 'photo-1531427186611-ecfd6d936c79', 'photo-1504257400765-1888925f7b85', 'photo-1506794778202-cad84cf45f1d'],
  ['photo-1519345182560-3f2917c472ef', 'photo-1492562080023-ab3db95bfbce', 'photo-1500048993953-d23a436266cf', 'photo-1531427186611-ecfd6d936c79'],
  ['photo-1539571696357-5a69c17a67c6', 'photo-1507003211169-0a1dd7228f2d', 'photo-1519085360753-af0119f7cbe7', 'photo-1522075469751-3a6694fb2f61']
];

const majors = ['Administración de Empresas', 'Psicología', 'Derecho', 'Sistemas', 'Diseño Gráfico'];
const gradYears = ["May '27", "Dec '26", "May '26", "Dec '27"];
const bios = [
  'Me encanta ir por café y platicar.',
  'Estudiante de psicología. Amante de la música indie.',
  'Derecho en UANE. Siempre buscando aprender cosas nuevas.',
  'Sistemas computacionales. Apasionado de la inteligencia artificial.',
  'Diseño gráfico. Dibujo digital y fotografía en mi tiempo libre.'
];

async function main() {
  console.log('🌱 Starting seed of 10 EXTRA UANE students in Piedras Negras (Password: 123456)...');
  const passwordHash = bcrypt.hashSync('123456', 10);

  const students = [];

  // 5 Females
  for (let i = 0; i < 5; i++) {
    const info = extraFemales[i];
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

  // 5 Males
  for (let i = 0; i < 5; i++) {
    const info = extraMales[i];
    const email = `${info.handle}@uane.edu.mx`;
    students.push({
      email,
      handle: `@${info.handle}`,
      firstName: info.first,
      lastName: info.last,
      gender: 'MAN',
      interestedIn: 'WOMAN',
      bio: bios[(i + 2) % bios.length],
      major: majors[(i + 3) % majors.length],
      grad: gradYears[(i + 2) % gradYears.length],
      photoIds: malePhotoSets[i]
    });
  }

  let i = 0;
  for (const s of students) {
    // Generate random coordinates around Piedras Negras center
    const latitude = 28.7001 + (Math.random() - 0.5) * 0.015;
    const longitude = -100.5235 + (Math.random() - 0.5) * 0.015;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: s.email }
    });

    if (existing) {
      console.log(`User ${s.email} already exists. Skipping.`);
      i++;
      continue;
    }

    const birthYear = 2001 + Math.floor(Math.random() * 5); // 2001 to 2005
    const birthDate = new Date(`${birthYear}-08-20`);

    // Create user and profile
    const createdUser = await prisma.user.create({
      data: {
        email: s.email,
        handle: s.handle,
        passwordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: `+528782${1000000 + i}`,
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
            interests: ['Música', 'Café', 'Deportes', 'Tacos', 'Cine'],
            lifestyle: {
              diet: 'None',
              drinking: 'Socially',
              smoking: 'No',
              sports: ['Workout'],
              workout: 'Sometimes',
              loveLanguage: 'Quality Time',
              zodiac: 'Leo'
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

    console.log(`Created extra student: ${s.firstName} ${s.lastName} (${s.handle}) - Password: 123456`);
    i++;
  }

  // Count check
  const totalUane = await prisma.user.count({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      }
    }
  });

  console.log('\n--- VERIFICATION ---');
  console.log(`Total UANE students in database now: ${totalUane}`);
  
  const allExtra = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@uane.edu.mx'
      },
      handle: {
        not: {
          contains: '_'
        }
      }
    },
    include: {
      profile: true,
      photos: true
    }
  });

  console.log(`Verified alphanumeric username profiles count: ${allExtra.length}`);
  allExtra.slice(0, 3).forEach(user => {
    console.log(`- ${user.firstName} ${user.lastName} (${user.handle})`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Campus: ${user.profile.academic.campus}`);
    console.log(`  Photos count: ${user.photos.length}`);
  });

  console.log('🌱 Extra seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
