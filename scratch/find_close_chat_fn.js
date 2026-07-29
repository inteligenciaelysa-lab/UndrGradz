const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const lines = appJs.split('\n');
const idx = lines.findIndex(l => l.includes('function closeChat(') || l.includes('closeChat ='));
if (idx !== -1) {
  console.log('closeChat at line', idx + 1);
  console.log(lines.slice(idx, idx + 25).join('\n'));
} else {
  console.log('closeChat function declaration not found directly');
}
