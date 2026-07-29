const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

const lines = appJs.split('\n');
console.log(lines.slice(5052, 5075).join('\n'));
