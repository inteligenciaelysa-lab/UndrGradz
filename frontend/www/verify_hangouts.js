const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const filePath = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));

  // Navigate to Hangouts screen
  await page.evaluate(() => {
    if (typeof sw === 'function') sw('hangouts', 'Hangouts');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_nearby.png') });

  // 1. Click on the first event to open details
  const clicked = await page.evaluate(() => {
    const card = document.querySelector('.ev-card');
    if (card) {
      card.click();
      return true;
    }
    return false;
  });
  console.log('Event clicked:', clicked);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_detail_modal.png') });

  // 2. Join the event from detail modal
  await page.evaluate(() => {
    const joinBtn = document.getElementById('ev-detail-join-btn');
    if (joinBtn) joinBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_detail_joined.png') });

  // 3. Close the modal
  await page.evaluate(() => {
    const closeBtn = document.getElementById('ev-detail-close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_nearby_after_join.png') });

  // 4. Create a new event and test the Edit mode
  await page.evaluate(() => {
    if (typeof switchEvTab === 'function') switchEvTab('create');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.type('#ev-nm', 'My Puppeteer Party');
  await page.type('#ev-desc', 'An awesome party created by the automation script to test edit mode.');
  await page.type('#ev-time', 'Friday 9 PM');
  await page.type('#ev-addr', 'Penthouse Suite 9A');
  await page.screenshot({ path: path.join(__dirname, 'hangouts_create_filled.png') });

  // Click publish
  await page.evaluate(() => {
    const pubBtn = document.getElementById('ev-publish-btn');
    if (pubBtn) pubBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_nearby_with_my_party.png') });

  // Find and click our created event
  const clickedMyParty = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ev-card'));
    const myCard = cards.find(c => c.innerHTML.includes('My Puppeteer Party'));
    if (myCard) {
      myCard.click();
      return true;
    }
    return false;
  });
  console.log('My party clicked:', clickedMyParty);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_my_party_details.png') });

  // Click edit button
  await page.evaluate(() => {
    const editBtn = document.getElementById('ev-detail-edit-btn');
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_edit_mode_active.png') });

  // Update title
  await page.evaluate(() => {
    const nm = document.getElementById('ev-nm');
    if (nm) nm.value = '';
  });
  await page.type('#ev-nm', 'My Updated Puppeteer Party');
  await page.screenshot({ path: path.join(__dirname, 'hangouts_edit_mode_modified.png') });

  // Save changes
  await page.evaluate(() => {
    const pubBtn = document.getElementById('ev-publish-btn');
    if (pubBtn) pubBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_nearby_after_edit_save.png') });

  // Open detail again to verify
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ev-card'));
    const myCard = cards.find(c => c.innerHTML.includes('My Updated Puppeteer Party'));
    if (myCard) {
      myCard.click();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'hangouts_my_party_details_after_save.png') });

  // Now, test settings renaming and rearranging
  await page.evaluate(() => {
    // Close detail modal if open
    const closeBtn = document.getElementById('ev-detail-close');
    if (closeBtn) closeBtn.click();
    // Open settings modal
    if (typeof openSettings === 'function') openSettings();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'settings_rearranged_top.png') });

  // Scroll settings down
  await page.evaluate(() => {
    const content = document.querySelector('#settings-modal .set-content');
    if (content) content.scrollTop = 300;
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'settings_rearranged_scrolled.png') });

  console.log('All verification screenshots captured successfully!');
  await browser.close();
})();
