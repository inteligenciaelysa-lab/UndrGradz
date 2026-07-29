const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '../frontend/styles.css'), 'utf8');

console.log('--- 1. Bottom Nav & View Switching ---');
// Search for nav bar clicking or section switching in JS
const navMatches = [];
const lines = appJs.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('sec-') || line.includes('nav-item') || line.includes('switchTab') || line.includes('switchSection') || line.includes('showSection')) {
    if (line.includes('display') || line.includes('active') || line.includes('classList') || line.includes('style')) {
      navMatches.push(`L${idx+1}: ${line.trim()}`);
    }
  }
});
console.log('Nav matches sample (total ' + navMatches.length + '):');
navMatches.slice(0, 30).forEach(m => console.log(m));

console.log('\n--- 2. openChat implementation ---');
const openChatStart = lines.findIndex(l => l.includes('function openChat('));
if (openChatStart !== -1) {
  console.log('openChat defined around line', openChatStart + 1);
  console.log(lines.slice(openChatStart, openChatStart + 40).join('\n'));
}

console.log('\n--- 3. Modal open/close patterns ---');
const modalOps = [];
lines.forEach((line, idx) => {
  if ((line.includes('.open') || line.includes('modal') || line.includes('sheet')) && (line.includes('classList.add') || line.includes('classList.remove') || line.includes('style.display'))) {
    modalOps.push(`L${idx+1}: ${line.trim()}`);
  }
});
console.log('Modal operations sample (total ' + modalOps.length + '):');
modalOps.slice(0, 25).forEach(m => console.log(m));

console.log('\n--- 4. Capacitor or Back Button listeners ---');
const capListeners = [];
lines.forEach((line, idx) => {
  if (line.includes('backbutton') || line.includes('backButton') || line.includes('Capacitor') || line.includes('App.') || line.includes('popstate')) {
    capListeners.push(`L${idx+1}: ${line.trim()}`);
  }
});
console.log('Capacitor / Back Button lines (total ' + capListeners.length + '):');
capListeners.forEach(m => console.log(m));

console.log('\n--- 5. Touch / Swipe Event Listeners ---');
const touchEvents = [];
lines.forEach((line, idx) => {
  if (line.includes('touchstart') || line.includes('touchmove') || line.includes('touchend') || line.includes('pointerdown') || line.includes('pointermove')) {
    touchEvents.push(`L${idx+1}: ${line.trim()}`);
  }
});
console.log('Touch event listeners sample (total ' + touchEvents.length + '):');
touchEvents.slice(0, 30).forEach(m => console.log(m));
