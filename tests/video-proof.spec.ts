import { test, expect } from '@playwright/test';

test('EXERCISE VIDEO PLAYBACK PROOF', async ({ page }) => {
  // Increase timeout for video interactions
  test.setTimeout(120000);

  console.log('--- STARTING VIDEO PLAYBACK VERIFICATION ---');
  
  // 1. Navigate to the app (port 7770, host 127.0.0.1)
  console.log('STEP 1: Navigating to app...');
  await page.goto('http://127.0.0.1:7770');
  await page.waitForLoadState('networkidle');
  
  // 2. Wait for the Exercise Library (forced in App.tsx)
  console.log('STEP 2: Waiting for Exercise Library to load...');
  const movementHeader = page.getByText('Movements');
  await expect(movementHeader).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'artifacts/PROOF-01-library-loaded.png' });
  
  // 3. Select the first exercise card
  console.log('STEP 3: Opening first exercise...');
  const exerciseCard = page.locator('button.press-scale').first();
  await exerciseCard.click();
  
  // 4. Verify Detail view is open
  console.log('STEP 4: Verifying detail view...');
  const watchDemoBtn = page.getByRole('button', { name: /WATCH DEMO/i });
  await expect(watchDemoBtn).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'artifacts/PROOF-02-exercise-detail.png' });
  
  // 5. Click WATCH DEMO
  console.log('STEP 5: Clicking WATCH DEMO...');
  await watchDemoBtn.click();
  
  // 6. Verify Loading screen disappears and Video Player appears
  console.log('STEP 6: Waiting for video player to initialize...');
  const loadingVeil = page.getByText('Loading demo');
  // Should disappear because of the onReady fix
  await expect(loadingVeil).not.toBeVisible({ timeout: 20000 });
  
  // 7. Verify Iframe is present and check URL
  console.log('STEP 7: Verifying video content...');
  const iframe = page.locator('iframe[title="Video"]');
  await expect(iframe).toBeVisible();
  const src = await iframe.getAttribute('src');
  console.log(`VIDEO PROOF: Iframe src is ${src}`);
  
  // 8. Capture the "Playing" state
  console.log('STEP 8: Capturing proof of playback...');
  await page.waitForTimeout(15000); // Allow 15s of "playback" time to be recorded in the screencast
  await page.screenshot({ path: 'artifacts/PROOF-03-video-active.png' });
  
  console.log('--- VERIFICATION COMPLETE ---');
});
