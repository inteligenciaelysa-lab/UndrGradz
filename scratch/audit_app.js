const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..', 'frontend');
const appJsPath = path.join(frontendDir, 'app.js');
const indexHtmlPath = path.join(frontendDir, 'index.html');
const stylesCssPath = path.join(frontendDir, 'styles.css');

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

const appJs = readFile(appJsPath);
const indexHtml = readFile(indexHtmlPath);
const stylesCss = readFile(stylesCssPath);

console.log('=== AUDIT REPORT ===');
console.log('app.js size:', appJs.length, 'lines:', appJs.split('\n').length);
console.log('index.html size:', indexHtml.length, 'lines:', indexHtml.split('\n').length);
console.log('styles.css size:', stylesCss.length, 'lines:', stylesCss.split('\n').length);

// 1. Find screens/views in index.html
const screenMatches = indexHtml.match(/id="([^"]*screen[^"]*)"|id="([^"]*view[^"]*)"|class="([^"]*screen[^"]*)"/gi) || [];
console.log('\n--- SCREENS & MAIN VIEWS ---');
const screens = new Set();
const screenRegex = /id="([^"]+)"/g;
let match;
while ((match = screenRegex.exec(indexHtml)) !== null) {
  if (match[1].includes('screen') || match[1].includes('view') || match[1].includes('tab') || match[1].includes('page') || match[1].includes('sec-')) {
    screens.add(match[1]);
  }
}
console.log('Screen/View/Tab IDs found in HTML:', Array.from(screens));

// 2. Find Modals, Sheets, Overlays, Drawers in HTML
console.log('\n--- MODALS, SHEETS, OVERLAYS ---');
const modalRegex = /id="([^"]*(?:modal|sheet|overlay|drawer|popup|panel|bottom)[^"]*)"/gi;
const modals = new Set();
while ((match = modalRegex.exec(indexHtml)) !== null) {
  modals.add(match[1]);
}
console.log('Modal/Sheet/Overlay IDs in HTML:', Array.from(modals));

// 3. Search app.js for display toggle, active class, modal handlers, sheet handlers, chat handlers
console.log('\n--- NAVIGATION FUNCTIONS & PATTERNS IN APP.JS ---');

function findPatterns(js, regexes) {
  const lines = js.split('\n');
  const results = [];
  lines.forEach((line, idx) => {
    for (const r of regexes) {
      if (r.test(line)) {
        results.push({ lineNum: idx + 1, content: line.trim() });
        break;
      }
    }
  });
  return results;
}

// Function definitions related to navigation/screens/chats/modals
const navFuncPatterns = [
  /function\s+switch/i, /function\s+show/i, /function\s+open/i, /function\s+close/i,
  /function\s+navigate/i, /function\s+goBack/i, /function\s+back/i,
  /const\s+switch/i, /const\s+show/i, /const\s+open/i, /const\s+close/i,
  /switchTab/i, /openChat/i, /closeChat/i, /openModal/i, /closeModal/i,
  /openSheet/i, /closeSheet/i, /bottom-sheet/i, /Capacitor/i, /backButton/i, /popstate/i
];

const foundNavFuncs = findPatterns(appJs, navFuncPatterns);
console.log(`Found ${foundNavFuncs.length} navigation-related lines in app.js. Top examples:`);
foundNavFuncs.slice(0, 50).forEach(item => {
  console.log(`L${item.lineNum}: ${item.content.slice(0, 120)}`);
});
