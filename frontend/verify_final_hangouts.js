const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 412, height: 915, isMobile: true }
  });
  const page = await browser.newPage();
  
  const indexPath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  console.log('Navigating to:', indexPath);
  await page.goto(indexPath, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Check Settings Modal
  console.log('Opening Settings Modal...');
  await page.evaluate(() => {
    if (typeof openSettingsModal === 'function') openSettingsModal();
    else {
      var modal = document.getElementById('settings-modal');
      if (modal) modal.style.display = 'block';
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'final_settings_modal.png' });
  console.log('Saved final_settings_modal.png');

  // Close Settings Modal
  await page.evaluate(() => {
    var modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
  });

  // 2. Go to Hangouts tab
  console.log('Switching to Hangouts tab...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab('hangout');
  });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: 'final_hangouts_list.png' });
  console.log('Saved final_hangouts_list.png');

  // 3. Click on the first event card to open detail modal
  console.log('Opening event detail modal...');
  const cardClicked = await page.evaluate(() => {
    var cards = document.querySelectorAll('.evc');
    if (cards.length > 0) {
      cards[0].click();
      return true;
    }
    return false;
  });

  if (cardClicked) {
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'final_event_detail_modal.png' });
    console.log('Saved final_event_detail_modal.png');

    // Click Join Event inside detail modal
    console.log('Joining event from modal...');
    await page.evaluate(() => {
      var modal = document.getElementById('hangout-detail-modal');
      if (modal) {
        var joinBtn = modal.querySelector('button');
        if (joinBtn) joinBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'final_hangouts_joined_card.png' });
    console.log('Saved final_hangouts_joined_card.png');
  } else {
    console.log('No event cards found on page');
  }

  await browser.close();
  console.log('Verification complete!');
})();
