const fs = require('fs');
const path = require('path');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

const pos = indexHtml.indexOf('id="settings-modal"');
console.log(indexHtml.slice(pos, pos + 1200));
