const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../frontend/universities.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function normalizeDomain(rawDomain) {
  if (!rawDomain) return '';
  let d = rawDomain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, ''); // remove http:// or https://
  d = d.replace(/^www\./i, '');        // remove www.
  d = d.replace(/\/.*$/, '');          // remove trailing slash & paths
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

async function runAudit() {
  console.log('--- AUDIT 3 & 4: Deep JSON Audit of 17,670 Records ---');
  
  const totalEntries = Object.keys(rawData).length;
  
  const rawDomains = new Set();
  const normalizedDomains = new Set();
  
  let duplicateRawDomains = 0;
  let duplicateNormalizedDomains = 0;
  let emptyDomains = 0;
  let emptyNames = 0;
  let emptyAcronyms = 0;
  
  const typesSet = new Set();
  let invalidPrimaryColors = 0;
  let invalidSecondaryColors = 0;
  let invalidWebsiteUrls = 0;
  
  let missingCoverPhotosField = 0;
  let emptyCoverPhotosArray = 0;
  let nonArrayCoverPhotos = 0;
  let invalidPhotoUrlsInArray = 0;
  
  const extraFieldsFound = new Set();

  Object.entries(rawData).forEach(([key, val]) => {
    // Check raw domain
    if (rawDomains.has(key)) duplicateRawDomains++;
    else rawDomains.add(key);

    const norm = normalizeDomain(key);
    if (!norm) emptyDomains++;
    if (normalizedDomains.has(norm)) duplicateNormalizedDomains++;
    else normalizedDomains.add(norm);

    // Check fields
    Object.keys(val).forEach(f => {
      if (!['t', 'name', 'acronym', 'p', 'p2', 'ig', 'coverPhotos'].includes(f)) {
        extraFieldsFound.add(f);
      }
    });

    if (!val.name || !val.name.trim()) emptyNames++;
    if (!val.acronym || !val.acronym.trim()) emptyAcronyms++;

    if (val.t) typesSet.add(val.t);

    if (val.p && !hexRegex.test(val.p.trim())) invalidPrimaryColors++;
    if (val.p2 && !hexRegex.test(val.p2.trim())) invalidSecondaryColors++;

    if (val.ig && !isValidUrl(val.ig.trim())) invalidWebsiteUrls++;

    if (!('coverPhotos' in val)) {
      missingCoverPhotosField++;
    } else if (!Array.isArray(val.coverPhotos)) {
      nonArrayCoverPhotos++;
    } else {
      if (val.coverPhotos.length === 0) emptyCoverPhotosArray++;
      val.coverPhotos.forEach(url => {
        if (!isValidUrl(url)) invalidPhotoUrlsInArray++;
      });
    }
  });

  console.log(`Total Records: ${totalEntries}`);
  console.log(`Unique Raw Keys: ${rawDomains.size} (Duplicates: ${duplicateRawDomains})`);
  console.log(`Unique Normalized Domains: ${normalizedDomains.size} (Duplicates after normalization: ${duplicateNormalizedDomains})`);
  console.log(`Empty Domains: ${emptyDomains}`);
  console.log(`Empty Names: ${emptyNames}`);
  console.log(`Empty Acronyms: ${emptyAcronyms}`);
  console.log(`Types Found (t values):`, Array.from(typesSet));
  console.log(`Invalid Primary Colors (p): ${invalidPrimaryColors}`);
  console.log(`Invalid Secondary Colors (p2): ${invalidSecondaryColors}`);
  console.log(`Invalid Website URLs (ig): ${invalidWebsiteUrls}`);
  console.log(`Missing coverPhotos field: ${missingCoverPhotosField}`);
  console.log(`Non-Array coverPhotos field: ${nonArrayCoverPhotos}`);
  console.log(`Empty coverPhotos Arrays: ${emptyCoverPhotosArray}`);
  console.log(`Invalid Photo URLs in coverPhotos: ${invalidPhotoUrlsInArray}`);
  console.log(`Extra fields found beyond standard 7:`, Array.from(extraFieldsFound));
}

runAudit();
