const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

console.log('=== SEARCHING CREATE CHAT IN INDEX.HTML ===');
const htmlLines = html.split('\n');
htmlLines.forEach((l, i) => {
  if (l.includes('Create Chat') || l.includes('create-chat') || l.includes('new-chat') || l.includes('gc-modal') || l.includes('id="gc-')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});

console.log('\n=== SEARCHING CREATE CHAT FUNCTIONS IN APP.JS ===');
const appLines = appJs.split('\n');
appLines.forEach((l, i) => {
  if (l.includes('openCreateChat') || l.includes('openGroupChat') || l.includes('gc-modal') || l.includes('openNewChat') || l.includes('openGroupModal')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
