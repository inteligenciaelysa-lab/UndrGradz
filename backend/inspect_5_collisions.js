const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../frontend/universities.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function normalizeDomain(rawDomain) {
  if (!rawDomain) return '';
  let d = rawDomain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, '');
  d = d.replace(/^www\./i, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

const map = new Map();
const collisions = [];

Object.entries(rawData).forEach(([key, val]) => {
  const norm = normalizeDomain(key);
  if (map.has(norm)) {
    collisions.push({
      normDomain: norm,
      entry1: { key: map.get(norm).key, data: map.get(norm).data },
      entry2: { key, data: val },
    });
  } else {
    map.set(norm, { key, data: val });
  }
});

console.log('=== ANALYSIS OF 5 NORMALIZED DOMAIN COLLISIONS ===\n');
collisions.forEach((c, idx) => {
  console.log(`COLLISION #${idx + 1} [Normalized: "${c.normDomain}"]`);
  console.log('  Record A:', c.entry1.key, JSON.stringify(c.entry1.data));
  console.log('  Record B:', c.entry2.key, JSON.stringify(c.entry2.data));
  console.log('--------------------------------------------------');
});
