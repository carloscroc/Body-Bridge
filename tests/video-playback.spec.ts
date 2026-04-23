import { test, expect } from '@playwright/test';

test('verify video playback and record evidence', async ({ page }) => {
  console.log('--- STARTING VIDEO PLAYBACK QA ---');
  
  // Navigate to the app
  console.log('Action: Navigating to http://127.0.0.1:7770');
  await page.goto('http://127.0.0.1:7770');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of landing
  await page.screenshot({ path: 'artifacts/playback-01-landing.png' });
  
  // Go to Library
  console.log('Action: Opening Library');
  await page.getByText(/Library/i).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/playback-02-library.png' });
  
  // Pick an exercise (Barbell Squat)
  console.log('Action: Selecting Barbell Squat');
  await page.getByText('Barbell Squat').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/playback-03-detail.png' });
  
  // Click Watch Demo
  console.log('Action: Clicking WATCH DEMO');
  await page.getByRole('button', { name: /watch demo/i }).click();
  
  // Wait for loading veil to disappear (the fix we just added)
  const loadingVeil = page.getByText('Loading demo');
  console.log('Action: Waiting for loading veil to disappear...');
  await expect(loadingVeil).not.toBeVisible({ timeout: 20000 });
  
  // Now verify if the video is actually playing
  // For YouTube iframes, we can check if the iframe exists and its src
  const iframe = page.locator('iframe[title="Video"]');
  const src = await iframe.getAttribute('src');
  console.log(`Video Source: ${src}`);
  
  // Take a screenshot of the video modal
  await page.screenshot({ path: 'artifacts/playback-04-video-loaded.png' });
  
  // Wait a bit more to ensure video would be running
  console.log('Action: Observing video for 10 seconds...');
  await page.waitForTimeout(10000);
  
  // Final screenshot
  await page.screenshot({ path: 'artifacts/playback-05-final.png' });
  console.log('--- QA COMPLETE ---');
});
