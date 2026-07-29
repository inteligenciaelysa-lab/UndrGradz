const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../frontend/styles.css'), 'utf8');

const matches = ['.mov', '.msheet', '#settings-modal'];
matches.forEach(m => {
  const pos = css.indexOf(m);
  if (pos !== -1) {
    console.log(`=== ${m} at ${pos} ===`);
    console.log(css.slice(pos, pos + 300));
  }
});
