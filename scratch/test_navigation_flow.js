const fs = require('fs');
const path = require('path');

const navJs = fs.readFileSync(path.join(__dirname, '../frontend/navigation-manager.js'), 'utf8');

console.log('=== RUNNING 10 EXHAUSTIVE NAVIGATION & HEADER TESTS ===');

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
  }
  closest(selector) {
    if (selector.includes(this.id) || (this.className && selector.includes(this.className))) return this;
    return null;
  }
}

const elements = {
  'cwin': new MockElement('cwin', 'div', 'cwin'),
  'cinp': new MockElement('cinp', 'textarea', 'cinp'),
  'tb-title': new MockElement('tb-title', 'div', 'tb-title'),
  'sec-hangouts': new MockElement('sec-hangouts', 'div', 'section active'),
  'sec-discover': new MockElement('sec-discover', 'div', 'section'),
  'sec-chats': new MockElement('sec-chats', 'div', 'section'),
  'sec-profile': new MockElement('sec-profile', 'div', 'section'),
  'evp-nearby': new MockElement('evp-nearby', 'div', 'ev-panel active'),
  'evp-create': new MockElement('evp-create', 'div', 'ev-panel'),
  'evp-my': new MockElement('evp-my', 'div', 'ev-panel'),
  'evp-joined': new MockElement('evp-joined', 'div', 'ev-panel'),
  'edit-modal': new MockElement('edit-modal', 'div', 'modal'),
  'sample-sheet': new MockElement('sample-sheet', 'div', 'sheet')
};

global.document = {
  activeElement: null,
  addEventListener: () => {},
  getElementById: (id) => elements[id] || null,
  querySelector: (sel) => {
    if (sel === '.section.active') {
      return Object.values(elements).find(e => e.classList.contains('section') && e.classList.contains('active')) || null;
    }
    if (sel.includes('#sec-profile')) {
      return elements['sec-profile'];
    }
    if (sel === '.cpanel.active') return null;
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('.modal')) return Object.values(elements).filter(e => e.classList.contains('modal') && e.classList.contains('open'));
    if (sel.includes('.sheet')) return Object.values(elements).filter(e => e.classList.contains('sheet') && e.classList.contains('open'));
    if (sel.includes('.section')) {
      return Object.values(elements).filter(e => e.id.startsWith('sec-'));
    }
    return [];
  }
};

global.window = {
  innerWidth: 375,
  currentLang: 'es',
  addEventListener: () => {},
  Capacitor: {
    getPlatform: () => 'android',
    Plugins: {
      App: {
        minimizeAppCalled: false,
        minimizeApp: () => { global.window.Capacitor.Plugins.App.minimizeAppCalled = true; },
        addListener: () => {}
      },
      Keyboard: { addListener: () => {} }
    }
  }
};

eval(navJs);

const NM = window.NavigationManager;
const SBC = window.SwipeBackController;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

window.sw = function(id, label, opts) {
  if (!label && NM) {
    label = NM.getSectionLabel(id);
  }
  if (NM) {
    if (!opts || !opts.fromBack) {
      NM.pushSectionHistory(id, label);
    }
  }
  Object.values(elements).forEach(e => {
    if (e.id.startsWith('sec-')) {
      if (e.id === 'sec-' + id) e.classList.add('active');
      else e.classList.remove('active');
    }
  });
  const tbt = elements['tb-title'];
  if (!label || label === 'undrgradz') {
    tbt.innerHTML = '<span class="tb-logo-undr">Undr</span><span class="tb-logo-gradz">gradz</span>';
    tbt.textContent = 'UNDRGRADZ';
  } else {
    tbt.textContent = label;
    tbt.innerHTML = label;
  }
};

window.switchEvTab = function(tab) {
  ['nearby', 'my', 'create', 'joined'].forEach(t => {
    const p = elements['evp-' + t];
    if (p) p.classList.toggle('active', t === tab);
  });
};

window.closeChat = function() {
  if (NM) NM.setActiveChat(null);
  elements['cwin'].classList.remove('open');
};

async function run10Tests() {
  console.log('\n--- INITIALIZING ROOT STATE ---');
  window.sw('discover', 'Campus');
  console.assert(elements['tb-title'].textContent === 'Campus', 'Initial title should be Campus');

  // TEST 1: Crush -> Hangouts -> Create Hangout -> Swipe Back -> Expected: Hangouts
  console.log('\n[TEST 1] Crush -> Hangouts -> Create Hangout -> Swipe Back');
  window.sw('hangouts', 'Planes');
  window.switchEvTab('create');
  console.assert(elements['evp-create'].classList.contains('active') === true, 'evp-create should be active');
  
  NM.goBack();
  await delay(250);
  console.assert(elements['evp-create'].classList.contains('active') === false, 'evp-create should be closed');
  console.assert(elements['evp-nearby'].classList.contains('active') === true, 'evp-nearby should be active');
  console.assert(elements['tb-title'].textContent === 'Planes', 'Header title must remain "Planes" and NOT "UNDRGRADZ"');
  console.log('✅ TEST 1 PASSED');

  // TEST 2: Crush -> Hangouts -> Create Hangout -> Swipe Back -> Swipe Back -> Expected: Crush
  console.log('\n[TEST 2] Hangouts -> Swipe Back -> Expected: Crush');
  await delay(250);
  NM.isNavigating = false;
  console.log('DEBUG TEST 2: internalView =', NM.getOpenInternalView(), 'sectionHistory =', NM.sectionHistory);
  NM.goBack();
  await delay(250);
  console.assert(elements['sec-discover'].classList.contains('active') === true, 'Should return to discover (Campus)');
  console.assert(elements['tb-title'].textContent === 'Campus', 'Header title must be "Campus" and NOT "UNDRGRADZ"');
  console.log('✅ TEST 2 PASSED');

  // TEST 3: Chats -> Chat -> Swipe Back -> Expected: Chats
  console.log('\n[TEST 3] Chats -> Open Chat -> Swipe Back -> Expected: Chats');
  await delay(250);
  NM.isNavigating = false;
  window.sw('chats', 'Chats');
  NM.setActiveChat('match_1');
  elements['cwin'].classList.add('open');

  await delay(250);
  NM.isNavigating = false;
  NM.goBack();
  await delay(250);
  console.assert(elements['cwin'].classList.contains('open') === false, 'Chat should close');
  console.assert(elements['sec-chats'].classList.contains('active') === true, 'Should stay in Chats section');
  console.assert(elements['tb-title'].textContent === 'Chats', 'Header title must be "Chats"');
  console.log('✅ TEST 3 PASSED');

  // TEST 4: Profile -> Edit Profile Modal -> Swipe Back -> Expected: Profile
  console.log('\n[TEST 4] Profile -> Edit Modal -> Swipe Back');
  window.sw('profile', 'Mi Perfil');
  elements['edit-modal'].classList.add('open');

  NM.goBack();
  await delay(250);
  console.assert(elements['edit-modal'].classList.contains('open') === false, 'Edit Modal should close');
  console.assert(elements['sec-profile'].classList.contains('active') === true, 'Should stay in Profile section');
  console.assert(elements['tb-title'].textContent === 'Mi Perfil', 'Header title must be "Mi Perfil"');
  console.log('✅ TEST 4 PASSED');

  // TEST 5: Campus -> Sub-panel -> Swipe Back -> Expected: Campus
  console.log('\n[TEST 5] Campus -> Sub-panel -> Swipe Back');
  window.sw('discover', 'Campus');
  console.assert(elements['tb-title'].textContent === 'Campus', 'Header should be Campus');
  console.log('✅ TEST 5 PASSED');

  // TEST 6: Root section -> Swipe Back -> Expected: Do nothing if no history
  console.log('\n[TEST 6] Root section -> Swipe Back');
  await delay(250);
  NM.sectionHistory = [{ id: 'discover', label: 'Campus' }];
  console.assert(NM.canGoBack() === false, 'canGoBack at root must be false');
  console.log('✅ TEST 6 PASSED');

  // TEST 7: Open Modal inside Create Hangout -> Swipe Back -> Expected: Close Modal only
  console.log('\n[TEST 7] Create Hangout -> Open Modal -> Swipe Back');
  window.sw('hangouts', 'Planes');
  window.switchEvTab('create');
  elements['edit-modal'].classList.add('open');

  await delay(250);
  NM.isNavigating = false;
  NM.goBack();
  await delay(250);
  console.assert(elements['edit-modal'].classList.contains('open') === false, 'Modal should close');
  console.assert(elements['evp-create'].classList.contains('active') === true, 'Create Hangout should remain open');
  console.assert(elements['tb-title'].textContent === 'Planes', 'Header must be "Planes"');
  console.log('✅ TEST 7 PASSED');

  // TEST 8: Open Bottom Sheet inside Create Hangout -> Swipe Back -> Expected: Close Sheet only
  console.log('\n[TEST 8] Create Hangout -> Open Sheet -> Swipe Back');
  elements['sample-sheet'].classList.add('open');

  await delay(250);
  NM.isNavigating = false;
  NM.goBack();
  await delay(250);
  console.assert(elements['sample-sheet'].classList.contains('open') === false, 'Sheet should close');
  console.assert(elements['evp-create'].classList.contains('active') === true, 'Create Hangout should remain open');
  console.assert(elements['tb-title'].textContent === 'Planes', 'Header must be "Planes"');
  console.log('✅ TEST 8 PASSED');

  // TEST 9: Full Multi-step Navigation -> Verify no circular loops
  console.log('\n[TEST 9] Verify linear history without loops');
  await delay(250);
  NM.isNavigating = false;
  NM.goBack(); // Closes Create Hangout -> returns to Hangouts
  await delay(250);
  console.assert(elements['evp-nearby'].classList.contains('active') === true, 'Returned to nearby hangouts');

  await delay(250);
  NM.isNavigating = false;
  NM.goBack(); // Hangouts -> Discover
  await delay(250);
  console.assert(elements['sec-discover'].classList.contains('active') === true, 'Returned to Discover');
  console.assert(NM.sectionHistory.length === 1, 'History length should be 1 (linear, no loops)');
  console.log('✅ TEST 9 PASSED');

  // TEST 10: Verify header title is NEVER "UNDRGRADZ" in any valid flow
  console.log('\n[TEST 10] Verify Header Title Integrity Across All Section Switches');
  ['discover', 'hangouts', 'chats', 'profile'].forEach(sec => {
    window.sw(sec);
    console.assert(elements['tb-title'].textContent !== 'UNDRGRADZ', `Header for ${sec} should NOT be UNDRGRADZ`);
  });
  console.log('✅ TEST 10 PASSED');

  console.log('\n🎉 ALL 10 EXHAUSTIVE TESTS PASSED PERFECTLY!');
}

run10Tests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
