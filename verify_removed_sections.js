const puppeteer = require('./backend/node_modules/puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ 
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });

  // 1. Go to Hangouts / PLANES section
  await page.evaluate(() => {
    sw('hangouts', 'Planes');
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:/Users/IA ELYSA/.gemini/antigravity-ide/brain/01d6058e-4712-41e9-999a-fa5c35e829c5/planes_tab_cleaned.png' });

  // 2. Go to CHATS section
  await page.evaluate(() => {
    sw('chats', 'Chats');
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:/Users/IA ELYSA/.gemini/antigravity-ide/brain/01d6058e-4712-41e9-999a-fa5c35e829c5/chats_tab_cleaned.png' });

  await browser.close();
  console.log('Screenshots captured successfully');
})();
