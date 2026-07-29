const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

const lines = appJs.split('\n');
console.log('=== openClassGroupModal ===');
for (let i = 20745; i < 20810; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
