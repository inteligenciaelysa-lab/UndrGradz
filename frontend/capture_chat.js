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
  await new Promise(r => setTimeout(r, 2000));

  try {
    await page.evaluate(() => {
      var s = document.getElementById('splash');
      if (s) { s.classList.remove('active'); s.style.display = 'none'; }
      var auth = document.getElementById('authscreen');
      if (auth) { auth.classList.remove('active'); auth.style.display = 'none'; }
      var a = document.getElementById('app');
      if (a) { a.classList.add('active'); a.style.display = 'block'; }

      window.uni = { domain: 'utnc.edu.mx', acronym: 'UTNC', name: 'Universidad Tecnológica de Coahuila' };
      window.userPro = { name: 'Valeria Orozco', handle: '@valeriao', uni: 'UTNC' };

      if (typeof openChat === 'function') {
        openChat('gfifa', 'FIFA Tournament ⚽', '#22c55e', '⚽', true, ['Luis: See you guys at 7pm!', '🎉 Say hi 👋'], true);
      }
    });

    await new Promise(r => setTimeout(r, 1000));

    // Screenshot 1: Empty input state (Mic icon)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chat_new_design_empty.png') });
    console.log("Saved chat_new_design_empty.png");

    // Screenshot 2: Typing "Hola" (Send icon)
    await page.evaluate(() => {
      var cinp = document.getElementById('cinp');
      if (cinp) {
        cinp.value = 'Hola';
        if (typeof _handleCinpInput === 'function') _handleCinpInput();
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chat_new_design_typed.png') });
    console.log("Saved chat_new_design_typed.png");

  } catch (err) {
    console.error("Error during capture:", err.stack);
  }

  await browser.close();
}

capture().catch(err => console.error(err));
