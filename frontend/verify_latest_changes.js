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

  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const app = document.getElementById('app');
    if (app) app.classList.add('active');
    if (typeof sw === 'function') sw('chats', 'Chats');
  });

  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'chats_banner_with_x.png') });

  await page.evaluate(() => {
    const btn = document.querySelector('#chats-match-banner button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'chats_banner_closed.png') });

  console.log('Verification screenshots captured successfully!');
  await browser.close();
})();
