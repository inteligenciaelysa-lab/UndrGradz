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

    console.log("Navigating to Profile screen...");
    await page.evaluate(() => {
      if (typeof sw === 'function') {
        sw('profile', 'Profile');
      }
    });
    await page.waitForTimeout ? await page.waitForTimeout(1500) : new Promise(r => setTimeout(r, 1500));

    // Tab 1: My Card
    await page.evaluate(() => {
      if (typeof switchProfTab === 'function') switchProfTab('crush');
    });
    await page.waitForTimeout ? await page.waitForTimeout(800) : new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_tab_mycard.png') });
    console.log("Saved profile_tab_mycard.png");

    // Tab 2: Activity
    await page.evaluate(() => {
      if (typeof switchProfTab === 'function') switchProfTab('activity');
    });
    await page.waitForTimeout ? await page.waitForTimeout(800) : new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_tab_activity.png') });
    console.log("Saved profile_tab_activity.png");

    // Tab 3: Safety
    await page.evaluate(() => {
      if (typeof switchProfTab === 'function') switchProfTab('safety');
    });
    await page.waitForTimeout ? await page.waitForTimeout(800) : new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_tab_safety.png') });
    console.log("Saved profile_tab_safety.png");

    // Tab 4: Filters
    await page.evaluate(() => {
      if (typeof switchProfTab === 'function') switchProfTab('filters');
    });
    await page.waitForTimeout ? await page.waitForTimeout(800) : new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_tab_filters.png') });
    console.log("Saved profile_tab_filters.png");

  } catch (err) {
    console.error("Error during capture:", err.stack);
  }

  await browser.close();
}

capture().catch(err => console.error(err));
