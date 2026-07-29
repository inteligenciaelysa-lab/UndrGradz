const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const lines = appJs.split('\n');

lines.forEach((l, i) => {
  if (l.includes('bot-inner')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
