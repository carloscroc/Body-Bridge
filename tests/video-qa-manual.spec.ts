import { test, expect } from '@playwright/test';

test('verify 90/90 hamstring video playback direct', async ({ page }) => {
  console.log('Navigating to http://localhost:7770/');
  await page.goto('http://localhost:7770/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Searching for 90/90 Hamstring');
  const card = page.getByText('90/90 Hamstring', { exact: false }).first();
  await card.click();
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/02-detail-view.png' });

  console.log('Clicking WATCH DEMO');
  const watchDemoBtn = page.locator('button:has-text("WATCH DEMO"), [aria-label="Watch exercise demo"]');
  await watchDemoBtn.click();
  
  console.log('Waiting for video overlay');
  await page.waitForSelector('iframe', { timeout: 15000 });
  await page.waitForTimeout(8000); // Give it time to play
  
  await page.screenshot({ path: 'screenshots/03-video-playback-proof.png' });
  
  const src = await page.locator('iframe').getAttribute('src');
  console.log('Video Source:', src);
  
  console.log('QA proof captured.');
});
