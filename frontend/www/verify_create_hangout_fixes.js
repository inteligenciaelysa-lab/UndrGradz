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
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const filePath = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  // Set mock user with Greek org
  await page.evaluate(() => {
    window.userPro = { org: 'Sigma Phi Epsilon' };
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const app = document.getElementById('app');
    if (app) app.classList.add('active');
    
    // Switch to Create Hangout panel
    if (typeof openCreateHangout === 'function') {
      openCreateHangout();
    } else {
      const p = document.getElementById('evp-create');
      if (p) p.style.display = 'block';
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // 1. Screenshot with non-greek section (Sports)
  await page.evaluate(() => {
    const sel = document.getElementById('ev-section');
    if (sel) {
      sel.value = 'sports';
      if (typeof onEvSectionChange === 'function') onEvSectionChange('sports');
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'create_hangout_sports_verified.png') });

  // 2. Screenshot with Greek Life section
  await page.evaluate(() => {
    console.log('FN:', typeof _renderEvGreekCohost, typeof _greekPartner, typeof onEvSectionChange);
    console.log('USERPRO:', window.userPro);
    const sel = document.getElementById('ev-section');
    if (sel) {
      sel.value = 'greek';
    }
    if (typeof _renderEvGreekCohost === 'function') _renderEvGreekCohost('greek');
    const box = document.getElementById('ev-greek-cohost');
    if (box) {
      console.log('BOX HTML:', box.innerHTML);
      box.scrollIntoView({ block: 'center' });
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'create_hangout_greek_verified.png') });

  console.log('Verification screenshots captured successfully!');
  await browser.close();
})();
