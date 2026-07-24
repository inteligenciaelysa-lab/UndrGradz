require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Administrative Accounts, Universities & Settings...');

  // 1. Environment-driven Super Admin Credentials
  const adminEmail = (process.env.ADMIN_EMAIL || 'superadmin@undrgradz.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminUndrGradz2026!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  // Upsert Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      passwordHash,
    },
    create: {
      email: adminEmail,
      handle: 'superadmin',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      birthDate: new Date('1995-01-01'),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  console.log(`✅ Super Admin account ready: ${superAdmin.email} (Role: ${superAdmin.role})`);

  // Create test accounts for other administrative roles if they don't exist
  const roleAccounts = [
    { email: 'admin@undrgradz.com', handle: 'admin', firstName: 'System', lastName: 'Admin', role: 'ADMIN' },
    { email: 'moderator@undrgradz.com', handle: 'moderator', firstName: 'Content', lastName: 'Moderator', role: 'MODERATOR' },
    { email: 'support@undrgradz.com', handle: 'support', firstName: 'User', lastName: 'Support', role: 'SUPPORT' },
  ];

  for (const acc of roleAccounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { role: acc.role, status: 'ACTIVE' },
      create: {
        email: acc.email,
        handle: acc.handle,
        passwordHash,
        firstName: acc.firstName,
        lastName: acc.lastName,
        birthDate: new Date('1998-05-15'),
        role: acc.role,
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`  └─ Administrative Role account created/updated: ${acc.email} (${acc.role})`);
  }

  // 2. Seed University Catalog (Seeded universities are marked as AVAILABLE & isOfficial: false per guidelines)
  const initialUniversities = [
    { name: 'UANE - Universidad Autónoma del Noreste', code: 'UANE', city: 'Piedras Negras', state: 'Coahuila', isOfficial: true, status: 'INTEGRATED' },
    { name: 'UTNC - Universidad Tecnológica del Norte de Coahuila', code: 'UTNC', city: 'Nava', state: 'Coahuila', isOfficial: true, status: 'INTEGRATED' },
    { name: 'Instituto Tecnológico de Piedras Negras', code: 'ITPN', city: 'Piedras Negras', state: 'Coahuila', isOfficial: false, status: 'AVAILABLE' },
    { name: 'Universidad Autónoma de Coahuila', code: 'UAdeC', city: 'Saltillo', state: 'Coahuila', isOfficial: false, status: 'AVAILABLE' },
    { name: 'Tecnológico de Monterrey', code: 'ITESM', city: 'Monterrey', state: 'Nuevo León', isOfficial: false, status: 'AVAILABLE' },
    { name: 'Universidad Nacional Autónoma de México', code: 'UNAM', city: 'Ciudad de México', state: 'CDMX', isOfficial: false, status: 'AVAILABLE' },
    { name: 'Universidad Autónoma de Nuevo León', code: 'UANL', city: 'Monterrey', state: 'Nuevo León', isOfficial: false, status: 'AVAILABLE' },
    { name: 'Texas A&M International University', code: 'TAMIU', city: 'Laredo', state: 'Texas', country: 'USA', isOfficial: false, status: 'AVAILABLE' },
  ];

  for (const uni of initialUniversities) {
    await prisma.university.upsert({
      where: { name: uni.name },
      update: {
        code: uni.code,
        city: uni.city,
        state: uni.state,
        country: uni.country || 'Mexico',
      },
      create: {
        name: uni.name,
        code: uni.code,
        city: uni.city,
        state: uni.state,
        country: uni.country || 'Mexico',
        isOfficial: uni.isOfficial,
        status: uni.status,
      },
    });
  }
  console.log(`✅ Seeded ${initialUniversities.length} universities into master catalog.`);

  // 3. Seed Platform Default Settings
  const defaultSettings = [
    { key: 'min_match_age', value: 18, description: 'Minimum age allowed for dating/social matches' },
    { key: 'max_match_age', value: 26, description: 'Maximum age allowed for dating/social matches' },
    { key: 'max_distance_km', value: 50, description: 'Maximum search radius in kilometers' },
    { key: 'free_swipes_daily_limit', value: 50, description: 'Daily swipe limit for FREE tier accounts' },
    { key: 'ghost_mode_enabled', value: true, description: 'Allow users to toggle ghost mode visibility' },
    { key: 'require_student_email_verification', value: true, description: 'Enforce university email domain validation' },
  ];

  for (const setting of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description },
    });
  }
  console.log(`✅ Seeded default platform configuration settings.`);

  // 4. Seed initial sample Moderation Report for verification
  const studentUser = await prisma.user.findFirst({ where: { role: 'STUDENT', isDeleted: false } });
  if (studentUser) {
    const existingReport = await prisma.report.findFirst({ where: { reporterId: studentUser.id } });
    if (!existingReport) {
      await prisma.report.create({
        data: {
          reporterId: studentUser.id,
          targetType: 'USER',
          targetId: studentUser.id,
          targetUserId: studentUser.id,
          reason: 'SPAM',
          details: 'Automated seed verification report for moderation system inspection.',
          status: 'PENDING',
        },
      });
      console.log(`✅ Created sample moderation report for testing.`);
    }
  }

  console.log('🎉 Admin initialization completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Admin seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
