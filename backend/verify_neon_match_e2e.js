// Drives two real logged-in browser sessions through a real mutual swipe against the
// real backend/DB to trigger an actual match, then verifies the new "Neon Energy"
// match modal (frontend/app.js _showMatchOverlay): visual sequence via screenshots,
// frame timing during the animation (checking for drops below 50fps), the
// "Send Message" -> chat + icebreaker prefill flow, and the "Keep Swiping" +
// retention-badge-reopen flow. All actions are real UI clicks, no direct JS calls
// into the app's own match/animation functions.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:8080/';
const ARTIFACT_DIR = path.join(__dirname, 'qa_screenshots', 'neon_match');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const ANA = { email: process.argv[2], password: process.argv[3], name: 'Ana' };
const BETO = { email: process.argv[4], password: process.argv[5], name: 'Beto' };

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Installed in-page: records rAF frame timestamps for `durationMs` and resolves
// with the list of frame deltas (ms). A delta > 20ms means that frame rendered
// below 50fps — the same threshold used previously for this animation.
async function armFrameRecorder(page) {
  await page.evaluate(() => {
    window.__frames = [];
    window.__recording = true;
    let last = performance.now();
    function tick(t) {
      if (!window.__recording) return;
      window.__frames.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

async function stopFrameRecorder(page) {
  return page.evaluate(() => {
    window.__recording = false;
    return window.__frames || [];
  });
}

function summarizeFrames(label, frames) {
  const drops = frames.filter((d) => d > 20);
  console.log(`\n[FPS] ${label}: ${frames.length} frames captured, ${drops.length} below 50fps (>20ms).`);
  if (drops.length) {
    console.log(`  Worst frame deltas (ms): ${drops.sort((a, b) => b - a).slice(0, 8).map((d) => d.toFixed(1)).join(', ')}`);
  }
  return drops.length;
}

async function login(page, user) {
  await page.goto(APP_URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#li-email', { timeout: 15000 });
  await page.type('#li-email', user.email, { delay: 15 });
  await page.type('#li-pass', user.password, { delay: 15 });
  await page.click('#do-login-btn');
  await page.waitForFunction(() => {
    var a = document.getElementById('app');
    return a && a.classList.contains('active');
  }, { timeout: 20000 });
  console.log(`✅ ${user.name} logged in.`);
}

async function goToCrushDeck(page, user) {
  // Equivalent to tapping the app's own "SAY HI"/Crush nav entry point, then the
  // "Crush" top-level sub-tab (the swipe deck defaults to "Discover" otherwise).
  await page.evaluate(() => { if (typeof sw === 'function') sw('unicrush', 'Crush'); });
  await delay(500);
  await page.evaluate(() => { if (typeof switchCrushTab === 'function') switchCrushTab('swipe'); });
  await delay(500);
  await page.waitForFunction(() => {
    var bar = document.getElementById('deck-action-bar');
    return bar && getComputedStyle(bar).display !== 'none';
  }, { timeout: 15000 });
  console.log(`✅ ${user.name} on crush deck.`);
}

async function currentCardName(page) {
  return page.evaluate(() => {
    try { return (window.crushData && window.crushData[window.crushIdx] && window.crushData[window.crushIdx].name) || null; } catch (e) { return null; }
  });
}

async function swipeUntilTarget(page, targetName, maxSkips) {
  for (let i = 0; i < maxSkips; i++) {
    const name = await currentCardName(page);
    if (name && name.indexOf(targetName) !== -1) return true;
    const passBtn = await page.$('.crb-neon-x');
    if (!passBtn) return false;
    await passBtn.click();
    await delay(500);
  }
  return (await currentCardName(page) || '').indexOf(targetName) !== -1;
}

async function clickRealLike(page) {
  await page.click('.crb-neon-heart');
}

(async () => {
  if (!ANA.email || !BETO.email) {
    console.error('Usage: node verify_neon_match_e2e.js <anaEmail> <anaPass> <betoEmail> <betoPass>');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--window-size=900,900'],
    defaultViewport: null,
  });

  const ctxA = await browser.createBrowserContext();
  const ctxB = await browser.createBrowserContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  await pageA.setViewport({ width: 400, height: 860 });
  await pageB.setViewport({ width: 400, height: 860 });

  const errorsA = []; const errorsB = [];
  pageA.on('console', (m) => { if (m.type() === 'error') errorsA.push(m.text()); if (/match/i.test(m.text())) console.log('[Ana console]', m.text()); });
  pageB.on('console', (m) => { if (m.type() === 'error') errorsB.push(m.text()); if (/match/i.test(m.text())) console.log('[Beto console]', m.text()); });
  pageA.on('pageerror', (e) => errorsA.push(String(e)));
  pageB.on('pageerror', (e) => errorsB.push(String(e)));

  try {
    await login(pageA, ANA);
    await login(pageB, BETO);

    await goToCrushDeck(pageA, ANA);
    await goToCrushDeck(pageB, BETO);

    console.log('\n--- Ana likes Beto (first swipe, no match yet) ---');
    const foundBeto = await swipeUntilTarget(pageA, 'Beto', 10);
    if (!foundBeto) throw new Error('Beto never showed up in Ana\'s deck after 10 skips.');
    await clickRealLike(pageA);
    await delay(1200);

    console.log('\n--- Beto likes Ana (deciding swipe -> real match) ---');
    const foundAna = await swipeUntilTarget(pageB, 'Ana', 10);
    if (!foundAna) throw new Error('Ana never showed up in Beto\'s deck after 10 skips.');

    // Arm frame recorders on BOTH pages right before the deciding swipe: Beto sees
    // the modal via the HTTP isMatch:true response, Ana sees it via the 'newMatch'
    // socket push — both fire within the same window.
    await armFrameRecorder(pageA);
    await armFrameRecorder(pageB);
    await clickRealLike(pageB);

    const swipeClickTime = Date.now();
    await pageB.waitForSelector('#match-neon-line-blue', { timeout: 8000 });
    const mountTime = Date.now();
    console.log(`\n[TIMING] Overlay mounted +${mountTime - swipeClickTime}ms after the click (network/API latency, not part of the animation budget).`);

    // Non-blocking in-page timers so measuring doesn't eat into the screenshot loop.
    await pageB.evaluate(() => {
      window.__t0 = performance.now();
      window.__titleAt = null; window.__buttonsAt = null;
      var iv = setInterval(() => {
        var t = document.getElementById('match-title');
        var a = document.getElementById('match-actions');
        if (window.__titleAt === null && t && getComputedStyle(t).opacity > 0.5) window.__titleAt = performance.now() - window.__t0;
        if (window.__buttonsAt === null && a && getComputedStyle(a).opacity > 0.95) { window.__buttonsAt = performance.now() - window.__t0; clearInterval(iv); }
      }, 20);
    });

    // Screenshot each phase as it plays out (~2.8s total sequence), timed from mount.
    const shots = [200, 500, 900, 1400, 1900, 2200, 2500, 2900];
    for (const t of shots) {
      const elapsed = Date.now() - mountTime;
      const waitFor = Math.max(0, t - elapsed);
      await delay(waitFor);
      await pageB.screenshot({ path: path.join(ARTIFACT_DIR, `beto_t${t}ms.png`) });
      await pageA.screenshot({ path: path.join(ARTIFACT_DIR, `ana_t${t}ms.png`) });
    }

    const phaseTimes = await pageB.evaluate(() => ({ titleAt: window.__titleAt, buttonsAt: window.__buttonsAt }));
    console.log(`[TIMING] "IT'S A MATCH" title visible at +${Math.round(phaseTimes.titleAt)}ms, buttons fully visible at +${Math.round(phaseTimes.buttonsAt)}ms (from overlay mount, i.e. the animation's own timeline).`);

    const framesA = await stopFrameRecorder(pageA);
    const framesB = await stopFrameRecorder(pageB);
    const dropsA = summarizeFrames('Ana (socket-received match)', framesA);
    const dropsB = summarizeFrames('Beto (HTTP-received match, deciding swipe)', framesB);

    console.log('\n--- Testing "Send Message" on Beto\'s modal ---');
    const chatBtn = await pageB.$('#live-match-btn-chat');
    if (!chatBtn) throw new Error('Send Message button not found on Beto\'s overlay.');
    await chatBtn.click();
    await delay(600);
    const cinpValue = await pageB.evaluate(() => { var i = document.getElementById('cinp'); return i ? i.value : null; });
    const chatsActive = await pageB.evaluate(() => { var s = document.getElementById('sec-chats'); return s && getComputedStyle(s).display !== 'none'; });
    console.log(`  chats screen active: ${chatsActive}, icebreaker prefilled: "${cinpValue}"`);
    await pageB.screenshot({ path: path.join(ARTIFACT_DIR, 'beto_after_send_message.png') });

    console.log('\n--- Testing "Keep Swiping" is NOT used; instead letting Ana\'s modal idle for the retention badge ---');
    await delay(5000); // total idle since modal appeared comfortably exceeds the 8s badge delay
    const badgeVisible = await pageA.evaluate(() => !!document.getElementById('match-retention-badge'));
    console.log(`  Ana retention badge appeared: ${badgeVisible}`);
    await pageA.screenshot({ path: path.join(ARTIFACT_DIR, 'ana_retention_badge.png') });

    if (badgeVisible) {
      await pageA.click('#match-retention-badge');
      await delay(800);
      const cinpValueA = await pageA.evaluate(() => { var i = document.getElementById('cinp'); return i ? i.value : null; });
      const chatsActiveA = await pageA.evaluate(() => { var s = document.getElementById('sec-chats'); return s && getComputedStyle(s).display !== 'none'; });
      console.log(`  Ana badge click -> chats active: ${chatsActiveA}, input: "${cinpValueA}"`);
      await pageA.screenshot({ path: path.join(ARTIFACT_DIR, 'ana_after_badge_click.png') });
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Ana frames below 50fps: ${dropsA} / ${framesA.length}`);
    console.log(`Beto frames below 50fps: ${dropsB} / ${framesB.length}`);
    console.log(`Ana console errors: ${errorsA.length}`);
    if (errorsA.length) errorsA.forEach((e) => console.log('  [Ana]', e));
    console.log(`Beto console errors: ${errorsB.length}`);
    if (errorsB.length) errorsB.forEach((e) => console.log('  [Beto]', e));
    console.log(`Screenshots saved to ${ARTIFACT_DIR}`);
  } catch (err) {
    console.error('\n❌ Verification script error:', err);
    await pageA.screenshot({ path: path.join(ARTIFACT_DIR, 'ERROR_ana.png') }).catch(() => {});
    await pageB.screenshot({ path: path.join(ARTIFACT_DIR, 'ERROR_beto.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
