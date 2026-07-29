const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const pos = html.indexOf('id="cwin"');
console.log(html.slice(pos + 500, pos + 2500));
