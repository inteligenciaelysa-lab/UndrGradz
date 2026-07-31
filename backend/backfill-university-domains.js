/**
 * One-time, idempotent backfill: ensures every existing University row has at
 * least one corresponding UniversityDomain row seeded from its current
 * `.domain` column. Safe to re-run any number of times — universities that
 * already have a matching row are skipped.
 *
 * Covers universities regardless of how they were originally created (via the
 * admin API or a raw seed script like import_universities.js), since it
 * operates on the current state of the University table, not on provenance.
 *
 * Usage: node backend/backfill-university-domains.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const universities = await prisma.university.findMany({
    select: { id: true, name: true, domain: true },
  });

  let created = 0;
  let skipped = 0;
  let errored = 0;

  for (const uni of universities) {
    try {
      const existing = await prisma.universityDomain.findUnique({ where: { domain: uni.domain } });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.universityDomain.create({
        data: { universityId: uni.id, domain: uni.domain },
      });
      created++;
    } catch (err) {
      errored++;
      console.error(`  ✗ ${uni.name} (${uni.domain}): ${err.message}`);
    }
  }

  console.log(`\nBackfill complete — universities: ${universities.length}, created: ${created}, skipped (already present): ${skipped}, errors: ${errored}`);
}

main()
  .catch(err => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
