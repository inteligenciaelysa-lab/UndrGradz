const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

const pos = html.indexOf('bot-nav') !== -1 ? html.indexOf('bot-nav') : html.indexOf('bnav');
if (pos !== -1) {
  console.log(html.slice(pos - 100, pos + 2000));
} else {
  console.log('bot-nav not found');
}
