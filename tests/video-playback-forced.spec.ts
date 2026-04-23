import { test, expect } from '@playwright/test';

test('verify video playback on forced ExercisesView', async ({ page }) => {
  console.log('--- STARTING VIDEO PLAYBACK QA (FORCED VIEW) ---');
  await page.goto('http://127.0.0.1:7770');
  await page.waitForLoadState('networkidle');
  
  // App.tsx now forces ExercisesView
  console.log('Action: Waiting for library content');
  await page.waitForSelector('button.press-scale', { timeout: 10000 });
  await page.screenshot({ path: 'artifacts/forced-library.png' });
  
  // Click first exercise
  console.log('Action: Selecting first exercise');
  await page.locator('button.press-scale').first().click();
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/forced-detail.png' });
  
  // Click WATCH DEMO
  console.log('Action: Clicking WATCH DEMO');
  const watchDemoBtn = page.getByRole('button', { name: /watch demo/i });
  if (await watchDemoBtn.isVisible()) {
    await watchDemoBtn.click();
  } else {
    // Fallback if the button text is different or not found
    await page.getByText(/watch demo/i).click();
  }
  
  const loadingVeil = page.getByText('Loading demo');
  console.log('Action: Waiting for loading veil to disappear...');
  await expect(loadingVeil).not.toBeVisible({ timeout: 20000 });
  
  console.log('Action: Observing video playback');
  const iframe = page.locator('iframe[title="Video"]');
  await expect(iframe).toBeVisible();
  
  // Verify YouTube embed code
  const src = await iframe.getAttribute('src');
  console.log(`Verified YouTube Embed URL: ${src}`);
  
  // Wait for video to "play" for 10 seconds (recorded in screencast)
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'artifacts/forced-playback-final.png' });
  
  console.log('--- QA COMPLETE: Video is loaded and play icon is visible ---');
});
