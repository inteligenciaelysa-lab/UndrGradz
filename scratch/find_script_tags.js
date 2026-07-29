const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

const matches = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Script tags in index.html:');
matches.forEach(m => console.log(m));
