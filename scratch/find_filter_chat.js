const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf-8');
const lines = appJs.split('\n');

lines.forEach((line, index) => {
  if (line.includes('filterChatBySection') || line.includes('chat-empty-section') || line.includes('chat-hdr-dm')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
