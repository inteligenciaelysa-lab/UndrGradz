const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../frontend/styles.css'), 'utf8');

const selectors = ['.tbar', '.bot-nav', '.cbar', '.cwin', '.chdr'];
selectors.forEach(sel => {
  const idx = css.indexOf(sel);
  if (idx !== -1) {
    console.log(`Found ${sel} at pos ${idx}:`);
    console.log(css.slice(idx, idx + 250));
    console.log('-------------------');
  }
});
