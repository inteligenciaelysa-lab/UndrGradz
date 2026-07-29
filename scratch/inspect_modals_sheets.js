const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

console.log('=== SEARCHING NOTIFICATIONS DOM IN INDEX.HTML ===');
const htmlLines = html.split('\n');
htmlLines.forEach((l, i) => {
  if (l.includes('Notifications') || l.includes('notif-') || l.includes('openNotif') || l.includes('id="notif')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});

console.log('\n=== SEARCHING CHAT SETTINGS DOM & FUNCTIONS IN APP.JS ===');
const appLines = appJs.split('\n');
appLines.forEach((l, i) => {
  if (l.includes('openChatSettings') || l.includes('chat-settings-modal') || l.includes('openNotifications') || l.includes('toggleNotif')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
