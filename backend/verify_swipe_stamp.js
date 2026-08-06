// Verifies the swipe deck's "A+"/"F" stamp fix: logs in with one real account,
// clicks the real Like and Pass deck buttons (not drag, not a direct function call
// into the fix), and screenshots the stamp mid-flight to confirm the text renders
// and the card's exit doesn't feel instant/empty.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:8080/';
const ARTIFACT_DIR = path.join(__dirname, 'qa_screenshots', 'swipe_stamp');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const USER = { email: process.argv[2], password: process.argv[3] };

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function login(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#li-email', { timeout: 15000 });
  await page.type('#li-email', USER.email, { delay: 15 });
  await page.type('#li-pass', USER.password, { delay: 15 });
  await page.click('#do-login-btn');
  await page.waitForFunction(() => {
    var a = document.getElementById('app');
    return a && a.classList.contains('active');
  }, { timeout: 20000 });
}

async function goToCrushDeck(page) {
  await page.evaluate(() => { if (typeof sw === 'function') sw('unicrush', 'Crush'); });
  await delay(500);
  await page.evaluate(() => { if (typeof switchCrushTab === 'function') switchCrushTab('swipe'); });
  await delay(500);
  await page.waitForFunction(() => {
    var bar = document.getElementById('deck-action-bar');
    return bar && getComputedStyle(bar).display !== 'none';
  }, { timeout: 15000 });
}

(async () => {
  if (!USER.email) { console.error('Usage: node verify_swipe_stamp.js <email> <password>'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--window-size=450,900'],
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 860 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    await login(page);
    await goToCrushDeck(page);

    // --- Real LIKE button click ---
    console.log('\n--- Clicking real Like button ---');
    await page.click('.crb-neon-heart');
    await delay(120);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'like_stamp_120ms.png') });
    // Sample the stamp text/opacity at short intervals in-page (non-blocking to Node timing).
    const likeTrace = await page.evaluate(() => new Promise((resolve) => {
      var el = document.getElementById('swipe-overlay-like');
      var samples = [];
      var t0 = performance.now();
      var iv = setInterval(() => {
        var cs = el ? getComputedStyle(el) : null;
        samples.push({ t: Math.round(performance.now() - t0), text: el ? el.textContent : null, opacity: cs ? cs.opacity : null });
        if (performance.now() - t0 > 500) { clearInterval(iv); resolve(samples); }
      }, 40);
    }));
    console.log('[LIKE STAMP TRACE]', JSON.stringify(likeTrace));
    await delay(600); // let the card fully cycle to the next one

    // --- Real PASS button click ---
    console.log('\n--- Clicking real Pass button ---');
    await page.click('.crb-neon-x');
    await delay(120);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pass_stamp_120ms.png') });
    const passTrace = await page.evaluate(() => new Promise((resolve) => {
      var el = document.getElementById('swipe-overlay-reject');
      var samples = [];
      var t0 = performance.now();
      var iv = setInterval(() => {
        var cs = el ? getComputedStyle(el) : null;
        samples.push({ t: Math.round(performance.now() - t0), text: el ? el.textContent : null, opacity: cs ? cs.opacity : null });
        if (performance.now() - t0 > 500) { clearInterval(iv); resolve(samples); }
      }, 40);
    }));
    console.log('[PASS STAMP TRACE]', JSON.stringify(passTrace));

    console.log(`\nConsole/page errors: ${errors.length}`);
    errors.forEach((e) => console.log('  ', e));
  } catch (err) {
    console.error('\n❌ Error:', err);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ERROR.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
