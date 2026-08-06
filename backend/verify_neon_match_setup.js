// One-off script for manually verifying the "Neon Energy" match animation redesign.
// Creates two mutually-compatible, boosted (feed-front) test accounts at the same
// university so a real UI swipe between them reliably produces a real match.
// Mirrors the existing create_utnc_referred_users.js pattern. Run verify_neon_match_cleanup.js
// afterwards to remove them (cascade deletes their swipes/matches/photos/profile).
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const STAMP = Date.now();
const PASSWORD = 'NeonTest123!';
const uniName = 'Universidad Tecnológica del Norte de Coahuila';
const campusName = 'Piedras Negras';
const baseLat = 28.5200;
const baseLng = -100.5500;
const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

const users = [
  {
    email: `neonqa.ana.${STAMP}@utnc.edu.mx`,
    handle: `neonqa_ana_${STAMP}`,
    firstName: 'Ana',
    lastName: 'NeonQA',
    phone: `+5287870${String(STAMP).slice(-5)}1`,
    birthDate: new Date('2004-03-18'),
    gender: 'WOMAN',
    interestedIn: 'MAN',
    photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800'],
    lat: baseLat + 0.001,
    lng: baseLng - 0.001,
  },
  {
    email: `neonqa.beto.${STAMP}@utnc.edu.mx`,
    handle: `neonqa_beto_${STAMP}`,
    firstName: 'Beto',
    lastName: 'NeonQA',
    phone: `+5287870${String(STAMP).slice(-5)}2`,
    birthDate: new Date('2003-08-11'),
    gender: 'MAN',
    interestedIn: 'WOMAN',
    photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800'],
    lat: baseLat - 0.001,
    lng: baseLng + 0.001,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const created = [];
  for (const u of users) {
    const rec = await prisma.user.create({
      data: {
        email: u.email,
        phone: u.phone,
        handle: u.handle,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        birthDate: u.birthDate,
        isEmailVerified: true,
        isPhoneVerified: true,
        photos: { create: u.photos.map((url, idx) => ({ url, order: idx })) },
        profile: {
          create: {
            gender: u.gender,
            interestedIn: u.interestedIn,
            bio: 'Cuenta de prueba QA — animación de match Neon Energy.',
            university: uniName,
            major: 'QA Testing',
            grad: "May '26",
            latitude: u.lat,
            longitude: u.lng,
            minAge: 18,
            maxAge: 30,
            maxDistanceKm: 50,
            boostEndsAt: farFuture,
            academic: { campus: campusName, minor: '', degree: "Bachelor's", advDegrees: [], backOnCampus: true, helpClasses: [], clubs: [], involved: [] },
            interests: ['Testing'],
            lifestyle: { diet: 'None', drinking: 'Socially', smoking: 'No', sports: [], workout: 'Sometimes', loveLanguage: 'Quality Time', zodiac: 'Pisces' },
            background: { hometown: 'Piedras Negras', state: 'Coahuila', country: 'Mexico', religion: '', pronouns: '' },
          },
        },
      },
    });
    created.push({ email: u.email, password: PASSWORD, firstName: u.firstName, id: rec.id });
    console.log(`Created ${u.firstName} (${u.email}) id=${rec.id}`);
  }
  console.log('\n--- Login credentials for manual verification ---');
  created.forEach(c => console.log(`${c.firstName}: email=${c.email} password=${c.password}`));
  console.log('\nRun `node verify_neon_match_cleanup.js` when done to remove these accounts.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
