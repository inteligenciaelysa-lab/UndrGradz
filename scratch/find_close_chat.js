const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const matches = html.match(/<button[^>]*onclick="[^"]*cwin[^"]*"[^>]*>.*?<\/button>/gi) || [];
console.log('cwin buttons in html:', matches);

// Search for any button inside cwin element
const pos = html.indexOf('id="cwin"');
const cwinChunk = html.slice(pos, pos + 10000);
const cwinButtons = cwinChunk.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
console.log('Buttons inside #cwin:');
cwinButtons.slice(0, 10).forEach(b => console.log(b));
