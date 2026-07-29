const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

console.log('=== ALL MODALS IN INDEX.HTML ===');
html.split('\n').forEach((l, i) => {
  if (l.includes('class="mov"') || l.includes('class="mov ') || l.includes('class="modal"') || l.includes('class="modal ')) {
    console.log(`HTML L${i+1}: ${l.trim().slice(0, 140)}`);
  }
});

console.log('\n=== ALL DYNAMIC MODALS CREATED IN APP.JS ===');
appJs.split('\n').forEach((l, i) => {
  if (l.includes('.className=') && (l.includes('mov') || l.includes('modal'))) {
    console.log(`JS L${i+1}: ${l.trim().slice(0, 140)}`);
  }
  if (l.includes('modal.id=') || l.includes('id =') || l.includes("id='")) {
    if (l.includes('modal')) {
      console.log(`JS ID L${i+1}: ${l.trim().slice(0, 140)}`);
    }
  }
});
