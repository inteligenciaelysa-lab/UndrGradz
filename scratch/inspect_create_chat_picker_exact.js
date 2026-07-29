const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

const lines = appJs.split('\n');
console.log('=== Lines 6150 to 6290 in app.js ===');
for (let i = 6149; i < 6290; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
