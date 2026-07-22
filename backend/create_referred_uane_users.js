const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createReferredUsers() {
  const targetCode = '72F481BC';
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
  const uniName = "Universidad Americana del Noreste";
  const campusName = "Piedras Negras";

  // Coordinates for UANE Piedras Negras area
  const baseLat = 28.7000;
  const baseLng = -100.5200;

  const mockUsers = [
    {
      email: 'valeria.medina@uane.edu.mx',
      handle: 'valeriamedina',
      firstName: 'Valeria',
      lastName: 'Medina',
      phone: '+528787000031',
      birthDate: new Date('2003-05-14'),
      gender: 'WOMAN',
      interestedIn: 'MAN',
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800'
      ],
      major: 'Licenciatura en Psicología',
      gradYear: "May '26",
      bio: 'Estudiante de Psicología en UANE Piedras Negras 🧠✨ Me encanta el café, leer y salir a caminar por las tardes.',
      interests: ['Lectura', 'Café', 'Fotografía', 'Música', 'Cine', 'Viajes', 'Gym', 'Arte', 'Meditación', 'Naturaleza'],
      lifestyle: { diet: 'None', drinking: 'Socially', smoking: 'No', sports: ['Running'], workout: 'Often', loveLanguage: 'Quality Time', zodiac: 'Taurus' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'she/her' },
      lat: baseLat + 0.0012,
      lng: baseLng - 0.0015
    },
    {
      email: 'leonardo.torres@uane.edu.mx',
      handle: 'leotorres',
      firstName: 'Leonardo',
      lastName: 'Torres',
      phone: '+528787000032',
      birthDate: new Date('2002-09-22'),
      gender: 'MAN',
      interestedIn: 'WOMAN',
      photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800'
      ],
      major: 'Ingeniería Industrial y de Sistemas',
      gradYear: "May '25",
      bio: 'Futuro Ingeniero Industrial ⚙️ Amante de la tecnología, el gimnasio y las carnitas asadas los fines de semana.',
      interests: ['Gym', 'Fútbol', 'Tecnología', 'Videojuegos', 'Música', 'Asados', 'Cine', 'Autos', 'Emprendimiento', 'Fotografía'],
      lifestyle: { diet: 'High Protein', drinking: 'Socially', smoking: 'No', sports: ['Soccer', 'Gym'], workout: 'Daily', loveLanguage: 'Physical Touch', zodiac: 'Virgo' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'he/him' },
      lat: baseLat - 0.0018,
      lng: baseLng + 0.0021
    },
    {
      email: 'camila.hernandez@uane.edu.mx',
      handle: 'camila_hndz',
      firstName: 'Camila',
      lastName: 'Hernández',
      phone: '+528787000033',
      birthDate: new Date('2004-01-30'),
      gender: 'WOMAN',
      interestedIn: 'MAN',
      photos: [
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800'
      ],
      major: 'Licenciatura en Negocios Internacionales',
      gradYear: "May '27",
      bio: 'Negocios Internacionales UANE ✈️💼 Fan de viajar, aprender idiomas y probar comida nueva. Siempre buena vibra!',
      interests: ['Viajes', 'Idiomas', 'Moda', 'Música', 'Gastronomía', 'Baile', 'Café', 'Lectura', 'Playa', 'Fotografía'],
      lifestyle: { diet: 'None', drinking: 'Socially', smoking: 'No', sports: ['Dance', 'Tennis'], workout: 'Sometimes', loveLanguage: 'Words of Affirmation', zodiac: 'Aquarius' },
      background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: 'Catholic', pronouns: 'she/her' },
      lat: baseLat + 0.0025,
      lng: baseLng + 0.0008
    }
  ];

  for (const uData of mockUsers) {
    // Check if email or handle exists
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
        referredById: referrer.id, // Linked to target referral code 72F481BC owner!
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

    console.log(`✓ Successfully created referred student: ${createdUser.firstName} ${createdUser.lastName} (@${createdUser.handle}) - Phone: ${createdUser.phone}`);
  }

  console.log('\nAll 3 users created and linked via referral code 72F481BC successfully!');
}

createReferredUsers()
  .catch(e => {
    console.error("Error creating referred users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
