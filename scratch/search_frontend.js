const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../frontend/app.js');
const indexHtmlPath = path.join(__dirname, '../frontend/index.html');

console.log("Reading app.js...");
const appJs = fs.readFileSync(appJsPath, 'utf-8');
console.log(`app.js size: ${appJs.length} bytes`);

const searchTerms = [
  'conversations',
  'getConversations',
  'chats',
  'renderChat',
  'chatList',
  'messages',
  'mock',
  'fake',
  'demo',
  'seed',
  'localStorage',
  'renderConversations',
  'fetchAndRenderChats'
];

searchTerms.forEach(term => {
  let count = 0;
  let pos = appJs.indexOf(term);
  while (pos !== -1) {
    count++;
    pos = appJs.indexOf(term, pos + 1);
  }
  console.log(`Term "${term}": ${count} occurrences in app.js`);
});

// Let's find lines around chat rendering in app.js
const lines = appJs.split('\n');
console.log(`Total lines in app.js: ${lines.length}`);

lines.forEach((line, index) => {
  if (
    line.includes('conversations') ||
    line.includes('chat-list') ||
    line.includes('chatList') ||
    line.includes('renderChats') ||
    line.includes('getConversations') ||
    line.includes('chats-list')
  ) {
    console.log(`Line ${index + 1}: ${line.trim().slice(0, 120)}`);
  }
});
