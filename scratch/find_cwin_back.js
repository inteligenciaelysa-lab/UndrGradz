const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const pos = html.indexOf('cwin-back');
if (pos !== -1) {
  console.log(html.slice(pos - 100, pos + 400));
} else {
  const chdrPos = html.indexOf('class="chdr"');
  if (chdrPos !== -1) {
    console.log(html.slice(chdrPos - 50, chdrPos + 600));
  } else {
    console.log('chdr not found');
  }
}
