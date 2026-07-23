const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const filePath = 'file://' + path.join(__dirname, 'frontend', 'index.html');
  await page.goto(filePath, { waitUntil: 'load' });

  // 1. Campus spotlight / ranks verify no "See all"
  await page.evaluate(() => sw('spotlight', 'Campus'));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'frontend/campus_no_see_all.png' });

  // 2. Chats banner X button & click
  await page.evaluate(() => sw('chats', 'Chats'));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'frontend/chats_banner_with_x.png' });

  await page.click('#chats-match-banner button');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'frontend/chats_banner_closed.png' });

  // 3. Settings modal
  await page.evaluate(() => document.getElementById('settings-modal').classList.add('open'));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'frontend/settings_cleaned.png' });

  console.log('Verification screenshots captured successfully!');
  await browser.close();
})();
