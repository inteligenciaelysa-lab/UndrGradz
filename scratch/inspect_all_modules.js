const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf-8');

console.log("=== INSPECTING RENDER FUNCTIONS IN APP.JS ===");

const functionsToFind = [
  'fetchAndRenderHangouts',
  'renderHangouts',
  'loadCrushFeed',
  'renderCrush',
  'loadAdmirers',
  'loadSentLikes',
  'loadFriends',
  'loadEvents',
  'renderEvents',
  'fetchAndRenderChats'
];

functionsToFind.forEach(fnName => {
  const idx = appJs.indexOf(`function ${fnName}`);
  if (idx !== -1) {
    console.log(`\nFound function ${fnName}:`);
    console.log(appJs.slice(idx, idx + 600));
  } else {
    console.log(`Function ${fnName} not found as standard declaration.`);
  }
});
