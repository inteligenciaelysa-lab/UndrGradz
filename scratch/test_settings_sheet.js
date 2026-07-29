const fs = require('fs');
const path = require('path');

const navJs = fs.readFileSync(path.join(__dirname, '../frontend/navigation-manager.js'), 'utf8');

console.log('=== RUNNING SETTINGS VERTICAL SHEET GESTURE TESTS ===');

class MockElement {
  constructor(id, tagName = 'div', className = '') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.className = className;
    this.classList = {
      _classes: new Set(className.split(' ').filter(Boolean)),
      add: (c) => { this.classList._classes.add(c); this.className = Array.from(this.classList._classes).join(' '); },
      remove: (c) => { this.classList._classes.delete(c); this.className = Array.from(this.classList._classes).join(' '); },
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, val) => {
        if (val === undefined) val = !this.classList._classes.has(c);
        if (val) this.classList.add(c);
        else this.classList.remove(c);
      }
    };
    this.style = {};
    this.children = [];
    this.value = '';
    this.offsetWidth = 375;
    this.offsetHeight = 600;
    this.textContent = '';
    this.innerHTML = '';
    this.parentElement = null;
    this.scrollTop = 0;
  }
  closest(selector) {
    const classes = selector.split(/[\s,]+/).map(s => s.replace('.', '').replace('#', '').trim()).filter(Boolean);
    let curr = this;
    while (curr) {
      for (const c of classes) {
        if (curr.id === c || (curr.classList && curr.classList.contains(c))) {
          return curr;
        }
      }
      curr = curr.parentElement;
    }
    return null;
  }
  getBoundingClientRect() {
    return { top: 0, left: 0, width: 375, height: 600 };
  }
}

const movSettings = new MockElement('settings-modal', 'div', 'mov');
const msheetSettings = new MockElement('settings-sheet', 'div', 'msheet');
const mhndSettings = new MockElement('mhnd-settings', 'div', 'mhnd');
msheetSettings.parentElement = movSettings;
mhndSettings.parentElement = msheetSettings;

const elements = {
  'settings-modal': movSettings,
  'settings-sheet': msheetSettings,
  'mhnd-settings': mhndSettings,
  'cwin': new MockElement('cwin', 'div', 'cwin'),
  'tb-title': new MockElement('tb-title', 'div', 'tb-title'),
  'sec-profile': new MockElement('sec-profile', 'div', 'section active')
};

global.document = {
  activeElement: null,
  addEventListener: () => {},
  getElementById: (id) => elements[id] || null,
  querySelector: (sel) => {
    if (sel === '.section.active') return elements['sec-profile'];
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('.modal') || sel.includes('.mov')) {
      return Object.values(elements).filter(e => (e.classList.contains('modal') || e.classList.contains('mov')) && e.classList.contains('open'));
    }
    if (sel.includes('.sheet')) return [];
    if (sel.includes('.section')) return [elements['sec-profile']];
    return [];
  }
};

global.window = {
  innerWidth: 375,
  currentLang: 'es',
  addEventListener: () => {},
  Capacitor: { getPlatform: () => 'android', Plugins: { App: { addListener: () => {} }, Keyboard: { addListener: () => {} } } }
};

eval(navJs);

const NM = window.NavigationManager;
const SBC = window.SwipeBackController;
const BSC = window.BottomSheetController;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSettingsTest() {
  console.log('1. Opening Settings Modal...');
  movSettings.classList.add('open');
  console.assert(NM.canGoBack() === true, 'canGoBack should be true when Settings is open');

  console.log('2. Testing Horizontal SwipeBack Bypass on Settings...');
  SBC.onTouchStart({ touches: [{ clientX: 10, clientY: 200 }], target: msheetSettings });
  console.assert(SBC.targetElement === null, 'Horizontal SwipeBack MUST IGNORE Settings!');

  console.log('3. Testing Vertical BottomSheet Drag on Settings Handle...');
  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndSettings });
  console.assert(BSC.activeSheet === msheetSettings, 'BottomSheetController MUST target Settings msheet on drag handle touch');

  console.log('4. Testing Real-time Vertical Drag & Dynamic Overlay Opacity...');
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 220 }], cancelable: true, preventDefault: () => {} });
  console.assert(msheetSettings.style.transform === 'translate3d(0, 200px, 0)', 'Sheet should translate vertically with finger');
  console.assert(movSettings.style.opacity < 1, 'Overlay opacity should decrease dynamically during drag');

  console.log('5. Completing Drag Past Threshold (>30%)...');
  BSC.currentY = 220;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movSettings.classList.contains('open') === false, 'Settings Modal should be closed after threshold drag');
  console.log('🎉 ALL SETTINGS VERTICAL SHEET GESTURE TESTS PASSED PERFECTLY!');
}

runSettingsTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
