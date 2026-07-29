const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

console.log('=== SEARCHING HTML FOR PICK 1 TO 15 ===');
html.split('\n').forEach((l, i) => {
  if (l.includes('15') || l.includes('friends') || l.includes('Create Chat')) {
    if (l.includes('Pick') || l.includes('selected') || l.includes('Create')) {
      console.log(`HTML L${i+1}: ${l.trim().slice(0, 140)}`);
    }
  }
});

console.log('\n=== SEARCHING APP.JS FOR PICK 1 TO 15 ===');
appJs.split('\n').forEach((l, i) => {
  if (l.includes('Pick') || l.includes('15 friends') || l.includes('selected') || l.includes('Create Chat')) {
    if (l.includes('Pick') || l.includes('friends') || l.includes('selected') || l.includes('Create')) {
      console.log(`JS L${i+1}: ${l.trim().slice(0, 140)}`);
    }
  }
});
