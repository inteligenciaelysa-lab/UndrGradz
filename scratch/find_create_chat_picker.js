const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

const lines = appJs.split('\n');
console.log('=== SEARCHING APP.JS FOR CREATE CHAT MODAL OR FRIEND PICKER ===');
lines.forEach((l, i) => {
  if (l.includes('Create Chat') || l.includes('create-chat') || l.includes('Create chat') || l.includes('Pick 1 to 15') || l.includes('15 friends')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
