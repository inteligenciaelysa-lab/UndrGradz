const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

console.log('=== SEARCHING HTML FOR CHAT MODALS ===');
html.split('\n').forEach((l, i) => {
  if (l.includes('mov') || l.includes('modal')) {
    if (l.includes('chat') || l.includes('Chat') || l.includes('group') || l.includes('Group')) {
      console.log(`HTML L${i+1}: ${l.trim().slice(0, 140)}`);
    }
  }
});

console.log('\n=== SEARCHING APP.JS FOR CREATE CHAT MODAL FUNCTIONS ===');
appJs.split('\n').forEach((l, i) => {
  if (l.includes('open') && (l.includes('Group') || l.includes('NewChat') || l.includes('CreateChat') || l.includes('StartChat') || l.includes('ChatModal'))) {
    console.log(`JS L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
