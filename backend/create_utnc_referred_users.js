const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createUTNCReferredUsers() {
  const targetCode = '3997ABA5';
  console.log(`Searching for referrer with referral code: ${targetCode}...`);

  const referrer = await prisma.user.findUnique({
    where: { referralCode: targetCode },
    include: { profile: true }
  });

  if (!referrer) {
    console.error(`Referrer with code ${targetCode} not found!`);
    process.exit(1);
  }

  console.log(`Found referrer: ${referrer.firstName} ${referrer.lastName} (ID: ${referrer.id})`);

  const passwordHash = await bcrypt.hash('123456', 10);
  const uniName = "Universidad Tecnológica del Norte de Coahuila";
  const campusName = "Piedras Negras";

  // Coordinates for UTNC area
  const baseLat = 28.5200;
  const baseLng = -100.5500;

  const mockUsers = [
    {
      email: 'carla.salazar@utnc.edu.mx',
      handle: 'carlasala',
      firstName: 'Carla',
      lastName: 'Salazar',
      phone: '+528787000041',
      birthDate: new Date('2004-03-18'),
      gender: 'WOMAN',
      interestedIn: 'MAN',
      photos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800'
      ],
      major: 'Ingeniería en Tecnologías de la Información',
      gradYear: "May '26",
      bio: 'Estudiante de TI en la UTNC 💻✨ Apasionada del desarrollo web, el diseño UI/UX y la música indie. Café y código siempre.',
      interests: ['Programación', 'Tecnología', 'Café', 'Música Indie', 'UI/UX', 'Fotografía', 'Cine', 'Viajes', 'Gym', 'Lectura'],
      lifestyle: { diet: 'None', drinking: 'Socially', smoking: 'No', sports: ['Running'], workout: 'Often', loveLanguage: 'Quality Time', zodiac: 'Pisces' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'she/her' },
      lat: baseLat + 0.0010,
      lng: baseLng - 0.0012
    },
    {
      email: 'santiago.mendoza@utnc.edu.mx',
      handle: 'santi_mendoza',
      firstName: 'Santiago',
      lastName: 'Mendoza',
      phone: '+528787000042',
      birthDate: new Date('2003-08-11'),
      gender: 'MAN',
      interestedIn: 'WOMAN',
      photos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800'
      ],
      major: 'Ingeniería Mecatrónica',
      gradYear: "May '25",
      bio: 'Mecatrónica en UTNC 🤖⚙️ Robótica, automatización y partidos de fútbol. Siempre listo para aprender algo nuevo.',
      interests: ['Robótica', 'Mecatrónica', 'Fútbol', 'Gym', 'Tecnología', 'Videojuegos', 'Cine', 'Asados', 'Autos', 'Música'],
      lifestyle: { diet: 'High Protein', drinking: 'Socially', smoking: 'No', sports: ['Soccer', 'Gym'], workout: 'Daily', loveLanguage: 'Physical Touch', zodiac: 'Leo' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'he/him' },
      lat: baseLat - 0.0015,
      lng: baseLng + 0.0018
    },
    {
      email: 'renata.trevino@utnc.edu.mx',
      handle: 'renata_trv',
      firstName: 'Renata',
      lastName: 'Treviño',
      phone: '+528787000043',
      birthDate: new Date('2004-11-25'),
      gender: 'WOMAN',
      interestedIn: 'MAN',
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800'
      ],
      major: 'Licenciatura en Gestión de Negocios y Proyectos',
      gradYear: "May '26",
      bio: 'Gestión de Negocios UTNC 📊💼 Emprendimiento, eventos y marketing digital. Amante del té verde y el yoga.',
      interests: ['Negocios', 'Marketing', 'Yoga', 'Viajes', 'Fotografía', 'Lectura', 'Moda', 'Café', 'Música', 'Postres'],
      lifestyle: { diet: 'Vegetarian', drinking: 'Socially', smoking: 'No', sports: ['Yoga', 'Pilates'], workout: 'Often', loveLanguage: 'Words of Affirmation', zodiac: 'Sagittarius' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Spiritual', pronouns: 'she/her' },
      lat: baseLat + 0.0022,
      lng: baseLng + 0.0011
    },
    {
      email: 'diego.castaneda@utnc.edu.mx',
      handle: 'diegocast',
      firstName: 'Diego',
      lastName: 'Castañeda',
      phone: '+528787000044',
      birthDate: new Date('2003-04-05'),
      gender: 'MAN',
      interestedIn: 'WOMAN',
      photos: [
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800'
      ],
      major: 'Ingeniería en Mantenimiento Industrial',
      gradYear: "May '25",
      bio: 'Mantenimiento Industrial UTNC 🛠️⚡ Fan del básquetbol, la música rock y las rutas al aire libre. ¡Buena vibra!',
      interests: ['Básquetbol', 'Rock', 'Senderismo', 'Mantenimiento', 'Gym', 'Videojuegos', 'Autos', 'Tacos', 'Cine', 'Amigos'],
      lifestyle: { diet: 'None', drinking: 'Socially', smoking: 'No', sports: ['Basketball'], workout: 'Often', loveLanguage: 'Quality Time', zodiac: 'Aries' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'he/him' },
      lat: baseLat - 0.0020,
      lng: baseLng - 0.0016
    },
    {
      email: 'mariana.morales@utnc.edu.mx',
      handle: 'marianamrls',
      firstName: 'Mariana',
      lastName: 'Morales',
      phone: '+528787000045',
      birthDate: new Date('2004-07-29'),
      gender: 'WOMAN',
      interestedIn: 'MAN',
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800'
      ],
      major: 'Licenciatura en Logística Internacional',
      gradYear: "May '27",
      bio: 'Logística Internacional UTNC ✈️📦 Me encanta bailar, viajar y conocer lugares nuevos. Siempre sonriendo!',
      interests: ['Logística', 'Baile', 'Viajes', 'Idiomas', 'Gastronomía', 'Música', 'Playa', 'Fotografía', 'Arte', 'Café'],
      lifestyle: { diet: 'None', drinking: 'Socially', smoking: 'No', sports: ['Dance'], workout: 'Sometimes', loveLanguage: 'Receiving Gifts', zodiac: 'Leo' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'she/her' },
      lat: baseLat + 0.0018,
      lng: baseLng + 0.0020
    }
  ];

  for (const uData of mockUsers) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: uData.email }, { handle: uData.handle }]
      }
    });

    if (existing) {
      console.log(`Skipping existing user: ${uData.email}`);
      continue;
    }

    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const createdUser = await prisma.user.create({
      data: {
        email: uData.email,
        phone: uData.phone,
        handle: uData.handle,
        passwordHash,
        firstName: uData.firstName,
        lastName: uData.lastName,
        birthDate: uData.birthDate,
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode,
        referredById: referrer.id, // Linked to referral code 3997ABA5 owner!
        photos: {
          create: uData.photos.map((url, idx) => ({
            url,
            order: idx
          }))
        },
        profile: {
          create: {
            gender: uData.gender,
            interestedIn: uData.interestedIn,
            bio: uData.bio,
            university: uniName,
            major: uData.major,
            grad: uData.gradYear,
            latitude: uData.lat,
            longitude: uData.lng,
            minAge: 18,
            maxAge: 26,
            maxDistanceKm: 30,
            academic: {
              campus: campusName,
              minor: '',
              degree: "Bachelor's",
              advDegrees: [],
              backOnCampus: true,
              helpClasses: [],
              clubs: [],
              involved: []
            },
            interests: uData.interests,
            lifestyle: uData.lifestyle,
            background: uData.background
          }
        }
      }
    });

    console.log(`✓ Successfully created referred UTNC student: ${createdUser.firstName} ${createdUser.lastName} (@${createdUser.handle}) - Phone: ${createdUser.phone}`);
  }

  console.log('\nAll 5 UTNC users created and linked via referral code 3997ABA5 successfully!');
}

createUTNCReferredUsers()
  .catch(e => {
    console.error("Error creating UTNC referred users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
