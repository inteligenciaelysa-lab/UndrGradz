const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf-8');
const lines = html.split('\n');

let currentSection = null;

console.log("=== HARDCODED HTML ELEMENT INSPECTION IN INDEX.HTML ===\n");

lines.forEach((line, index) => {
  const l = line.trim();
  if (l.startsWith('<div class="screen"') || l.includes('id="chat') || l.includes('id="event') || l.includes('id="hangout') || l.includes('id="network') || l.includes('id="profile')) {
    console.log(`\n--- Line ${index + 1}: ${l.slice(0, 100)} ---`);
  }
  
  if (l.includes('class="citem"') || l.includes('class="evc"') || l.includes('class="hng-card"') || l.includes('class="frr"') || l.includes('class="admirer-card"')) {
    console.log(`Line ${index + 1} [HARDCODED ITEM]: ${l.slice(0, 120)}`);
  }
});
