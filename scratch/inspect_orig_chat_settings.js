const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const lines = appJs.split('\n');

for (let i = 19375; i < 19470; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
