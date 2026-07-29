const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

const pos = html.indexOf('id="settings-modal"');
if (pos !== -1) {
  console.log(html.slice(pos - 100, pos + 800));
} else {
  console.log('id="settings-modal" not found');
}
