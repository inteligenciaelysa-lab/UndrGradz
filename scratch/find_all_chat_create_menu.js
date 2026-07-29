const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

appJs.split('\n').forEach((l, i) => {
  if (l.includes('chat-create-menu')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
