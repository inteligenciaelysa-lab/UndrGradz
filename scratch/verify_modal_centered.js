const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true });
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });

  // Open discover/ranks tab and trigger user crush modal
  await page.evaluate(() => {
    if (typeof sw === 'function') sw('discover');
    if (typeof openCrushDetailsModal === 'function') openCrushDetailsModal();
  });

  await new Promise(r => setTimeout(r, 1000));

  const artifactPath = path.join('C:', 'Users', 'IA ELYSA', '.gemini', 'antigravity-ide', 'brain', '01d6058e-4712-41e9-999a-fa5c35e829c5', 'ranks_modal_centered.png');
  await page.screenshot({ path: artifactPath });

  console.log('Screenshot saved to:', artifactPath);
  await browser.close();
})();
