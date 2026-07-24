const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf-8');

const linesApp = appJs.split('\n');

console.log("--- APP.JS LINES 14070 TO 14200 ---");
for (let i = 14070; i < Math.min(14200, linesApp.length); i++) {
  console.log(`${i+1}: ${linesApp[i]}`);
}

console.log("\n--- INDEX.HTML SEARCH FOR CHAT-LIST OR MOCK CHATS ---");
const linesHtml = indexHtml.split('\n');
linesHtml.forEach((line, index) => {
  if (line.includes('chat-list') || line.includes('citem') || line.includes('Sofia') || line.includes('Mateo') || line.includes('Valeria') || line.includes('Camila')) {
    console.log(`HTML Line ${index+1}: ${line.trim().slice(0, 120)}`);
  }
});
