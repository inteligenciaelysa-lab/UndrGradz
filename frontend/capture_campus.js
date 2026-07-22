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

      document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
      var dSec = document.getElementById('sec-discover');
      if (dSec) dSec.style.display = 'block';

      var pn = document.getElementById('discover-panels');
      var uPanel = document.getElementById('cpanel-uni');
      if (pn && uPanel) {
        pn.appendChild(uPanel);
      }

      if (typeof _renderUniTab === 'function') _renderUniTab();

      if (uPanel) {
        uPanel.style.display = 'block';
        uPanel.classList.add('active');
      }

      var ctabUni = document.getElementById('ctab-uni');
      if (ctabUni) {
        document.querySelectorAll('.crush-tab').forEach(t => t.classList.remove('active'));
        ctabUni.classList.add('active');
      }
    });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'campus_dashboard_all.png') });
    console.log("Saved campus_dashboard_all.png");

    // Click Events pill
    await page.evaluate(() => {
      if (typeof filterCampusCategory === 'function') filterCampusCategory('events');
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'campus_dashboard_events_only.png') });
    console.log("Saved campus_dashboard_events_only.png");

  } catch (err) {
    console.error("Error during capture:", err.stack);
  }

  await browser.close();
}

capture().catch(err => console.error(err));
