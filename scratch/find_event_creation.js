const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

const lines = appJs.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ev-panel') || l.includes('evp-') || l.includes('hangouts-fab') || l.includes('openCreateHangout') || l.includes('openCreateEvent')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
