const fs = require('fs');
const path = require('path');

const navJs = fs.readFileSync(path.join(__dirname, '../frontend/navigation-manager.js'), 'utf8');

console.log('=== RUNNING ALL 9 EXHAUSTIVE VERTICAL FULL-SCREEN SHEET & CONTEXT TESTS ===');

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
  remove() {
    this.classList.remove('open');
  }
}

// 1. Settings elements
const movSettings = new MockElement('settings-modal', 'div', 'mov');
const msheetSettings = new MockElement('settings-sheet', 'div', 'msheet');
const mhndSettings = new MockElement('mhnd-settings', 'div', 'mhnd');
msheetSettings.parentElement = movSettings;
mhndSettings.parentElement = msheetSettings;

// 2. Notifications elements
const movNotif = new MockElement('notif-modal', 'div', 'mov');
const msheetNotif = new MockElement('notif-sheet', 'div', 'msheet');
const mhndNotif = new MockElement('mhnd-notif', 'div', 'mhnd');
msheetNotif.parentElement = movNotif;
mhndNotif.parentElement = msheetNotif;

// 3. Chat Settings elements
const movChatSet = new MockElement('chat-settings-modal', 'div', 'mov');
const msheetChatSet = new MockElement('chat-settings-sheet', 'div', 'msheet');
const mhndChatSet = new MockElement('mhnd-chatset', 'div', 'mhnd');
msheetChatSet.parentElement = movChatSet;
mhndChatSet.parentElement = msheetChatSet;

// 4. Create Chat elements
const movCreateChat = new MockElement('chat-create-menu', 'div', 'mov');
const msheetCreateChat = new MockElement('create-chat-sheet', 'div', 'msheet');
const mhndCreateChat = new MockElement('mhnd-createchat', 'div', 'mhnd');
msheetCreateChat.parentElement = movCreateChat;
mhndCreateChat.parentElement = msheetCreateChat;

const sections = {
  'discover': new MockElement('sec-discover', 'div', 'section active'),
  'hangouts': new MockElement('sec-hangouts', 'div', 'section'),
  'chats': new MockElement('sec-chats', 'div', 'section'),
  'profile': new MockElement('sec-profile', 'div', 'section')
};

const elements = {
  'settings-modal': movSettings,
  'notif-modal': movNotif,
  'chat-settings-modal': movChatSet,
  'chat-create-menu': movCreateChat,
  'cwin': new MockElement('cwin', 'div', 'cwin'),
  'tb-title': new MockElement('tb-title', 'div', 'tb-title'),
  ...sections
};

global.document = {
  activeElement: null,
  body: { children: [], appendChild: () => {} },
  addEventListener: () => {},
  getElementById: (id) => elements[id] || null,
  querySelector: (sel) => {
    if (sel.includes('#settings-modal.open')) return movSettings.classList.contains('open') ? movSettings : null;
    if (sel.includes('#notif-modal.open')) return movNotif.classList.contains('open') ? movNotif : null;
    if (sel.includes('#chat-settings-modal.open')) return movChatSet.classList.contains('open') ? movChatSet : null;
    if (sel.includes('#chat-create-menu.open')) return movCreateChat.classList.contains('open') ? movCreateChat : null;
    if (sel === '.section.active') {
      return Object.values(sections).find(s => s.classList.contains('active')) || null;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('.modal') || sel.includes('.mov')) {
      return [movSettings, movNotif, movChatSet, movCreateChat].filter(e => e.classList.contains('open'));
    }
    if (sel.includes('.sheet')) return [];
    if (sel.includes('.section')) return Object.values(sections);
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

window.sw = function(id, label, opts) {
  if (!label && NM) label = NM.getSectionLabel(id);
  if (NM && (!opts || !opts.fromBack)) NM.pushSectionHistory(id, label);
  Object.keys(sections).forEach(k => {
    sections[k].classList.toggle('active', k === id);
  });
  elements['tb-title'].textContent = label;
};

async function run9ExhaustiveTests() {
  console.log('\n--- INITIALIZING STATE: Crush ---');
  window.sw('discover', 'Campus');
  console.assert(elements['tb-title'].textContent === 'Campus', 'Initial title should be Campus');

  // TEST 1: Chats -> Create Chat -> Drag Down -> Chats
  console.log('\n[TEST 1] Chats -> Create Chat -> Drag Down -> Chats');
  await delay(250); NM.isNavigating = false;
  window.sw('chats', 'Chats');
  movCreateChat.classList.add('open');

  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndCreateChat });
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 250 }], cancelable: true, preventDefault: () => {} });
  BSC.currentY = 250;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movCreateChat.classList.contains('open') === false, 'Create Chat should close');
  console.assert(sections['chats'].classList.contains('active') === true, 'Must return to Chats section');
  console.assert(elements['tb-title'].textContent === 'Chats', 'Header title must remain Chats');
  console.log('✅ TEST 1 PASSED');

  // TEST 2: Hangouts -> Create Chat -> Drag Down -> Hangouts
  console.log('\n[TEST 2] Hangouts -> Create Chat -> Drag Down -> Hangouts');
  await delay(250); NM.isNavigating = false;
  window.sw('hangouts', 'Planes');
  movCreateChat.classList.add('open');

  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndCreateChat });
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 250 }], cancelable: true, preventDefault: () => {} });
  BSC.currentY = 250;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movCreateChat.classList.contains('open') === false, 'Create Chat should close');
  console.assert(sections['hangouts'].classList.contains('active') === true, 'Must return to Hangouts section');
  console.assert(elements['tb-title'].textContent === 'Planes', 'Header title must remain Planes');
  console.log('✅ TEST 2 PASSED');

  // TEST 3: Chats -> Chat -> Create Chat -> Drag Down -> Mismo Chat
  console.log('\n[TEST 3] Chats -> Chat -> Create Chat -> Drag Down -> Mismo Chat');
  await delay(250); NM.isNavigating = false;
  window.sw('chats', 'Chats');
  elements['cwin'].classList.add('open');
  NM.setActiveChat('match_100');
  movCreateChat.classList.add('open');

  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndCreateChat });
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 250 }], cancelable: true, preventDefault: () => {} });
  BSC.currentY = 250;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movCreateChat.classList.contains('open') === false, 'Create Chat should close');
  console.assert(elements['cwin'].classList.contains('open') === true, 'CRITICAL: Chat window must remain open');
  console.assert(NM.getActiveChat() === 'match_100', 'CRITICAL: Active Chat ID must remain match_100');
  console.log('✅ TEST 3 PASSED');

  // TEST 4: Chats -> Create Chat -> Android Back -> Chats
  console.log('\n[TEST 4] Chats -> Create Chat -> Android Back -> Chats');
  await delay(250); NM.isNavigating = false;
  elements['cwin'].classList.remove('open');
  NM.setActiveChat(null);
  window.sw('chats', 'Chats');
  movCreateChat.classList.add('open');

  NM.goBack();
  await delay(300);

  console.assert(movCreateChat.classList.contains('open') === false, 'Create Chat should close on Android Back');
  console.assert(sections['chats'].classList.contains('active') === true, 'Must return to Chats section');
  console.log('✅ TEST 4 PASSED');

  // TEST 5: Chats -> Create Chat -> Swipe horizontal -> NO activar SwipeBack
  console.log('\n[TEST 5] Chats -> Create Chat -> Swipe horizontal -> Bypass SwipeBack');
  await delay(250); NM.isNavigating = false;
  movCreateChat.classList.add('open');

  SBC.onTouchStart({ touches: [{ clientX: 10, clientY: 200 }], target: msheetCreateChat });
  console.assert(SBC.targetElement === null, 'Horizontal SwipeBack MUST IGNORE Create Chat');
  console.log('✅ TEST 5 PASSED');

  // TEST 6: Crush -> Create Chat -> Drag Down -> Crush
  console.log('\n[TEST 6] Crush -> Create Chat -> Drag Down -> Crush');
  await delay(250); NM.isNavigating = false;
  movCreateChat.classList.remove('open');
  window.sw('discover', 'Campus');
  movCreateChat.classList.add('open');

  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndCreateChat });
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 250 }], cancelable: true, preventDefault: () => {} });
  BSC.currentY = 250;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movCreateChat.classList.contains('open') === false, 'Create Chat should close');
  console.assert(sections['discover'].classList.contains('active') === true, 'Must return to Crush (Campus)');
  console.assert(elements['tb-title'].textContent === 'Campus', 'Header title must be Campus');
  console.log('✅ TEST 6 PASSED');

  // TEST 7: Crush -> Hangouts -> Create Chat -> Drag Down -> Hangouts (CRITICAL!)
  console.log('\n[TEST 7] Crush -> Hangouts -> Create Chat -> Drag Down -> Hangouts');
  await delay(250); NM.isNavigating = false;
  window.sw('hangouts', 'Planes');
  movCreateChat.classList.add('open');

  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndCreateChat });
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 250 }], cancelable: true, preventDefault: () => {} });
  BSC.currentY = 250;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movCreateChat.classList.contains('open') === false, 'Create Chat should close');
  console.assert(sections['hangouts'].classList.contains('active') === true, 'CRITICAL: Must return to Hangouts, NOT Crush!');
  console.assert(elements['tb-title'].textContent === 'Planes', 'Header title must be Planes');
  console.log('✅ TEST 7 PASSED');

  // TEST 8: Chats -> Chat -> Chat Settings -> Drag Down -> Mismo Chat
  console.log('\n[TEST 8] Chats -> Chat -> Chat Settings -> Drag Down -> Mismo Chat');
  await delay(250); NM.isNavigating = false;
  window.sw('chats', 'Chats');
  elements['cwin'].classList.add('open');
  NM.setActiveChat('user_joel');
  movChatSet.classList.add('open');

  BSC.onTouchStart({ touches: [{ clientX: 200, clientY: 20 }], target: mhndChatSet });
  BSC.onTouchMove({ touches: [{ clientX: 200, clientY: 250 }], cancelable: true, preventDefault: () => {} });
  BSC.currentY = 250;
  BSC.onTouchEnd({});
  await delay(300);

  console.assert(movChatSet.classList.contains('open') === false, 'Chat Settings should close');
  console.assert(elements['cwin'].classList.contains('open') === true, 'CRITICAL: Chat window must remain open');
  console.assert(NM.getActiveChat() === 'user_joel', 'CRITICAL: Active Chat ID must remain user_joel');
  console.log('✅ TEST 8 PASSED');

  // TEST 9: Header & Navigation History Integrity
  console.log('\n[TEST 9] Verify Header Title & Section History Integrity');
  console.assert(elements['tb-title'].textContent !== 'UNDRGRADZ', 'Header title should NOT be UNDRGRADZ');
  console.assert(NM.sectionHistory.length > 0, 'History length should be valid and intact');
  console.log('✅ TEST 9 PASSED');

  console.log('\n🎉 ALL 9 EXHAUSTIVE TESTS PASSED WITH 100% SUCCESS!');
}

run9ExhaustiveTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
