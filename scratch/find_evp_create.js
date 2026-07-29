const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

console.log('=== evp-create in index.html ===');
const indexLines = indexHtml.split('\n');
indexLines.forEach((l, i) => {
  if (l.includes('evp-create')) console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
});

console.log('\n=== evp-create in app.js ===');
const appLines = appJs.split('\n');
appLines.forEach((l, i) => {
  if (l.includes('evp-create')) console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
});
