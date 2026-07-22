const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe';
const ARTIFACT_DIR = 'C:\\\\Users\\\\IA ELYSA\\\\.gemini\\\\antigravity-ide\\\\brain\\\\01d6058e-4712-41e9-999a-fa5c35e829c5';

const viewports = [
  { name: 'iphone_se', width: 320, height: 568 },
  { name: 'iphone_12_pro', width: 390, height: 844 }
];

async function capture() {
  console.log("Launching Microsoft Edge...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Log in
  console.log("Loading App and logging in...");
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2' });
  await page.waitForTimeout ? await page.waitForTimeout(5500) : new Promise(r => setTimeout(r, 5500));

  try {
    await page.waitForSelector('#li-email', { visible: true, timeout: 6000 });
    await page.type('#li-email', 'valeriaorozco@uane.edu.mx');
    await page.type('#li-pass', '123456');
    await page.click('#do-login-btn');
    await page.waitForSelector('#app', { visible: true, timeout: 12000 });
    await page.waitForTimeout ? await page.waitForTimeout(4000) : new Promise(r => setTimeout(r, 4000));
    console.log("Logged in successfully!");

    // Switch to Profile tab
    await page.click('#np-profile');
    await page.waitForTimeout ? await page.waitForTimeout(1500) : new Promise(r => setTimeout(r, 1500));

    // Open Edit Profile Modal
    console.log("Opening Edit Profile Modal...");
    await page.evaluate(() => {
      var modal = document.getElementById('edit-modal');
      if (modal) modal.classList.add('open');
    });
    await page.waitForTimeout ? await page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000));

    for (const vp of viewports) {
      console.log(`Capturing Edit Profile Modal at ${vp.name}...`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `app_edit_profile_${vp.name}.png`) });
    }

  } catch (err) {
    console.error("Failed during edit profile captures:", err.stack);
  }

  await browser.close();
  console.log("Finished edit profile screenshot capture process.");
}

capture().catch(err => {
  console.error("Unhandled rejection in edit profile capture process:", err);
});
