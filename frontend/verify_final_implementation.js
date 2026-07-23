const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const filePath = 'file://' + path.join(__dirname, 'index.html');
  console.log('Opening file:', filePath);
  await page.goto(filePath, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  // Bypass screens and show main app, mock session
  await page.evaluate(() => {
    window.ugzAlert = function(msg) { return Promise.resolve(); };
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const app = document.getElementById('app');
    if (app) app.classList.add('active');
    
    // Set global variables to ensure cards are rendered
    window.curPlan = 'aplus';
    if (typeof renderHangouts === 'function') {
      renderHangouts();
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // 1. Check Settings modal
  console.log('Opening Settings Modal...');
  await page.evaluate(() => {
    const sm = document.getElementById('settings-modal');
    if (sm) {
      sm.classList.add('open');
      const sheet = sm.querySelector('.msheet');
      if (sheet) {
        sheet.scrollTop = sheet.scrollHeight;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(__dirname, 'settings_reorganized_verified.png') });
  console.log('Saved settings_reorganized_verified.png');

  // Close Settings modal
  await page.evaluate(() => {
    const sm = document.getElementById('settings-modal');
    if (sm) sm.classList.remove('open');
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. Switch to Hangouts tab
  console.log('Switching to Hangouts tab...');
  await page.evaluate(() => {
    if (typeof sw === 'function') {
      sw('hangouts', 'Planes');
    }
    if (typeof setHangoutSection === 'function') {
      setHangoutSection('all');
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_list_before_join.png') });
  console.log('Saved hangouts_list_before_join.png');

  // 3. Click the first event card to open detail modal
  console.log('Clicking the first event card...');
  const clicked = await page.evaluate(() => {
    const cards = document.querySelectorAll('.hangout-item-card');
    if (cards.length > 0) {
      cards[0].click();
      return true;
    }
    return false;
  });

  if (clicked) {
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'event_detail_verified.png') });
    console.log('Saved event_detail_verified.png');

    // 4. Click Join button inside the event detail modal
    console.log('Joining event from modal...');
    await page.evaluate(() => {
      const modal = document.getElementById('hangout-detail-modal');
      if (modal) {
        const joinBtn = modal.querySelector('button');
        if (joinBtn) joinBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(__dirname, 'event_joined_detail.png') });
    console.log('Saved event_joined_detail.png');

    // Close the detail modal
    await page.evaluate(() => {
      const modal = document.getElementById('hangout-detail-modal');
      if (modal) {
        const closeBtn = modal.querySelector('.hdm-close');
        if (closeBtn) closeBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(__dirname, 'hangouts_joined_card.png') });
    console.log('Saved hangouts_joined_card.png');
  } else {
    console.log('WARNING: No event cards found!');
  }

  await browser.close();
  console.log('All verification tasks finished!');
})();
