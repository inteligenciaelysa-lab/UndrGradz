const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\IA ELYSA\\.gemini\\antigravity-ide\\brain\\01d6058e-4712-41e9-999a-fa5c35e829c5';

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
  await new Promise(r => setTimeout(r, 3500));

  try {
    await page.evaluate(() => {
      var splash = document.getElementById('splash');
      if (splash) { splash.classList.remove('active'); splash.style.display = 'none'; }
      var auth = document.getElementById('authscreen');
      if (auth) { auth.classList.remove('active'); auth.style.display = 'none'; }
      var app = document.getElementById('app');
      if (app) { app.classList.add('active'); app.style.display = 'block'; }

      window.uni = { domain: 'utnc.edu.mx', acronym: 'UTNC', name: 'Universidad Tecnológica de Coahuila' };
      window.userPro = { name: 'Valeria Orozco', handle: '@valeriao', uni: 'UTNC' };

      if (typeof sw === 'function') {
        sw('chats', 'Chats');
      }
    });

    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chats_list_new_design.png') });
    console.log("Saved chats_list_new_design.png");

  } catch (err) {
    console.error("Error during capture:", err.stack);
  }

  await browser.close();
}

capture().catch(err => console.error(err));
