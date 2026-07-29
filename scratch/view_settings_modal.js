const fs = require('fs');
const path = require('path');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

const lines = indexHtml.split('\n');
console.log(lines.slice(1400, 1430).join('\n'));
