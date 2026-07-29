const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

const lines = appJs.split('\n');

console.log('=== openNotifications ===');
for (let i = 21440; i < 21510; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}

console.log('\n=== openChatSettings ===');
for (let i = 21568; i < 21625; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
