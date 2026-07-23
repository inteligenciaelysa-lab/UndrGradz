const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const filePath = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));

  // Mock ugzAlert so it doesn't block or redirect
  await page.evaluate(() => {
    window.ugzAlert = function(msg) { return Promise.resolve(); };
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const app = document.getElementById('app');
    if (app) app.classList.add('active');
    
    // Scroll settings to bottom
    const sm = document.getElementById('settings-modal');
    if (sm) {
      sm.classList.add('open');
      const sheet = sm.querySelector('.msheet');
      if (sheet) sheet.scrollTop = 1600;
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, 'settings_bottom_logout_verified.png') });

  // Switch to Hangouts (section 'all')
  await page.evaluate(() => {
    const sm = document.getElementById('settings-modal');
    if (sm) sm.classList.remove('open');
    if (typeof sw === 'function') sw('hangouts', 'Planes');
    if (typeof setHangoutSection === 'function') setHangoutSection('all');
  });
  await new Promise(r => setTimeout(r, 800));

  // Open Event Detail Modal
  await page.evaluate(() => {
    if (typeof openHangoutDetailModal === 'function') {
      openHangoutDetailModal('Frat Row After-Party');
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Join event inside modal
  await page.evaluate(() => {
    const modalBtn = document.querySelector('#hangout-detail-modal button');
    if (modalBtn) modalBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_list_after_join.png') });

  console.log('Verification screenshots captured successfully!');
  await browser.close();
})();
