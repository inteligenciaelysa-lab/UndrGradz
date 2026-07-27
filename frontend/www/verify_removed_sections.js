const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ 
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });

  // Dismiss splash/onboarding if visible
  await page.evaluate(() => {
    var splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
    var app = document.getElementById('app');
    if (app) app.style.display = 'flex';
    sw('hangouts', 'Planes');
  });

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/IA ELYSA/.gemini/antigravity-ide/brain/01d6058e-4712-41e9-999a-fa5c35e829c5/planes_tab_cleaned.png' });

  // 2. Go to CHATS section
  await page.evaluate(() => {
    sw('chats', 'Chats');
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/IA ELYSA/.gemini/antigravity-ide/brain/01d6058e-4712-41e9-999a-fa5c35e829c5/chats_tab_cleaned.png' });

  await browser.close();
  console.log('Screenshots captured successfully');
})();
