const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe';
const ARTIFACT_DIR = 'C:\\\\Users\\\\IA ELYSA\\\\.gemini\\\\antigravity-ide\\\\brain\\\\01d6058e-4712-41e9-999a-fa5c35e829c5';

async function capture() {
  console.log("Launching Edge...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  
  console.log("Navigating to app...");
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2' });
  await page.waitForTimeout ? await page.waitForTimeout(5500) : new Promise(r => setTimeout(r, 5500));

  try {
    await page.waitForSelector('#li-email', { visible: true });
    await page.type('#li-email', 'valeriaorozco@uane.edu.mx');
    await page.type('#li-pass', '123456');
    await page.click('#do-login-btn');
    await page.waitForSelector('#app', { visible: true });
    await page.waitForTimeout ? await page.waitForTimeout(3000) : new Promise(r => setTimeout(r, 3000));
    console.log("Logged in!");

    console.log("Opening Plans section via sw('premium','Plans')...");
    await page.evaluate(() => {
      if (typeof sw === 'function') {
        sw('premium', 'Plans');
      }
      if (typeof _plansTabSet === 'function') {
        _plansTabSet('plans');
      }
    });
    await page.waitForTimeout ? await page.waitForTimeout(2000) : new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'neon_tabs_aplus_selected.png') });
    console.log("Saved neon_tabs_aplus_selected.png");

    await page.evaluate(() => {
      if (typeof _plansTabSet === 'function') {
        _plansTabSet('cheats');
      }
    });
    await page.waitForTimeout ? await page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'neon_tabs_cheats_selected.png') });
    console.log("Saved neon_tabs_cheats_selected.png");

    await page.evaluate(() => {
      if (typeof _plansTabSet === 'function') {
        _plansTabSet('invite');
      }
    });
    await page.waitForTimeout ? await page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'neon_tabs_invite_selected.png') });
    console.log("Saved neon_tabs_invite_selected.png");

  } catch (err) {
    console.error("Error during capture:", err.stack);
  }

  await browser.close();
}

capture().catch(err => console.error(err));
