const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

console.log('=== openSettings in app.js ===');
const lines = appJs.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function openSettings') || l.includes('openSettings =')) {
    console.log(`L${i+1}:`);
    console.log(lines.slice(i, i + 30).join('\n'));
  }
});

console.log('\n=== settings-modal in index.html ===');
const idxLines = indexHtml.split('\n');
idxLines.forEach((l, i) => {
  if (l.includes('settings-modal')) {
    console.log(`L${i+1}:`);
    console.log(idxLines.slice(i - 1, i + 25).join('\n'));
  }
});
