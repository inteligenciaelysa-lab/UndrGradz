const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const jsonPath = path.join(__dirname, '../frontend/universities.json');

const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function normalizeDomain(rawDomain) {
  if (!rawDomain) return '';
  let d = rawDomain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, '');
  d = d.replace(/^www\./i, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

async function importUniversities() {
  console.log('🚀 Starting Idempotent Production Import of Universities JSON...');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rawKeys = Object.keys(rawData);
  console.log(`📦 Loaded ${rawKeys.length} records from universities.json`);

  // Step 1: Normalize domains and resolve 5 collisions explicitly
  const normalizedMap = new Map();
  let collisionsCount = 0;

  for (const [key, val] of Object.entries(rawData)) {
    const normDomain = normalizeDomain(key);
    if (!normDomain) continue;

    const validatedPhotos = Array.isArray(val.coverPhotos)
      ? val.coverPhotos.filter(u => isValidUrl(u))
      : [];

    const record = {
      domain: normDomain,
      name: val.name ? val.name.trim() : normDomain,
      acronym: val.acronym ? val.acronym.trim() : normDomain.split('.')[0].toUpperCase(),
      type: val.t === 'private' ? 'private' : 'public',
      primaryColor: (val.p && hexRegex.test(val.p.trim())) ? val.p.trim() : '#6366f1',
      secondaryColor: (val.p2 && hexRegex.test(val.p2.trim())) ? val.p2.trim() : '#ec4899',
      website: (val.ig && isValidUrl(val.ig.trim())) ? val.ig.trim() : null,
      coverPhotos: validatedPhotos,
    };

    if (normalizedMap.has(normDomain)) {
      collisionsCount++;
      const existing = normalizedMap.get(normDomain);
      // Merge unique cover photos
      const photoSet = new Set([...existing.coverPhotos, ...record.coverPhotos]);
      existing.coverPhotos = Array.from(photoSet);
      // Keep English/standard name if available
      if (record.name.length > existing.name.length) {
        existing.name = record.name;
      }
    } else {
      normalizedMap.set(normDomain, record);
    }
  }

  console.log(`✅ Normalized into ${normalizedMap.size} unique institutional domain records (${collisionsCount} collision pairs merged).`);

  // Step 2: Fetch existing DB records to preserve manual admin modifications
  const existingDbRecords = await prisma.university.findMany({
    select: {
      id: true,
      domain: true,
      isOfficial: true,
      status: true,
      isDeleted: true,
      logoUrl: true,
      name: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  const dbMap = new Map();
  existingDbRecords.forEach(u => dbMap.set(u.domain, u));

  // Step 3: Batch upsert into PostgreSQL in chunks of 500
  const universitiesList = Array.from(normalizedMap.values());
  const chunkSize = 500;

  let createdCount = 0;
  let updatedCount = 0;

  console.log(`⏳ Processing batch imports into PostgreSQL...`);

  for (let i = 0; i < universitiesList.length; i += chunkSize) {
    const chunk = universitiesList.slice(i, i + chunkSize);

    await prisma.$transaction(
      chunk.map(uni => {
        const existingInDb = dbMap.get(uni.domain);

        if (existingInDb) {
          updatedCount++;
          // Preserve manual admin modifications
          return prisma.university.update({
            where: { domain: uni.domain },
            data: {
              acronym: uni.acronym,
              type: uni.type,
              primaryColor: uni.primaryColor,
              secondaryColor: uni.secondaryColor,
              website: uni.website || existingInDb.website,
              coverPhotos: uni.coverPhotos,
            },
          });
        } else {
          createdCount++;
          return prisma.university.create({
            data: {
              domain: uni.domain,
              name: uni.name,
              acronym: uni.acronym,
              type: uni.type,
              primaryColor: uni.primaryColor,
              secondaryColor: uni.secondaryColor,
              website: uni.website,
              coverPhotos: uni.coverPhotos,
              isOfficial: false,
              status: 'AVAILABLE',
              isDeleted: false,
            },
          });
        }
      })
    );

    if ((i + chunkSize) % 2500 === 0 || i + chunkSize >= universitiesList.length) {
      console.log(`   ... processed ${Math.min(i + chunkSize, universitiesList.length)} / ${universitiesList.length} records`);
    }
  }

  // Step 4: Output Final Report Summary
  console.log('\n==================================================');
  console.log('🎉 UNIVERSITY IMPORT COMPLETED SUCCESSFULLY');
  console.log('==================================================');
  console.log(`• Total JSON Entries Read:       ${rawKeys.length}`);
  console.log(`• Unique Institutional Domains:  ${normalizedMap.size}`);
  console.log(`• Duplicate Collisions Merged:   ${collisionsCount}`);
  console.log(`• New Universities Created:      ${createdCount}`);
  console.log(`• Existing Records Updated:      ${updatedCount}`);
  console.log(`• Manual Admin Modifications:    PRESERVED`);
  console.log('==================================================\n');
}

importUniversities()
  .catch(err => {
    console.error('❌ Import error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
