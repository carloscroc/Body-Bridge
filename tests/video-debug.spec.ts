import { test, expect } from '@playwright/test';

test('verify video playback with specific selectors', async ({ page }) => {
  console.log('--- STARTING VIDEO PLAYBACK QA ---');
  await page.goto('http://127.0.0.1:7770');
  await page.waitForLoadState('networkidle');
  
  // Click Library using a more robust selector
  console.log('Action: Clicking Library in TabBar');
  await page.locator('button').filter({ hasText: 'Exercises' }).or(page.locator('button').filter({ hasText: 'Library' })).first().click();
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'artifacts/debug-library-view.png' });
  
  // Click the first exercise card (Barbell Squat or similar)
  console.log('Action: Selecting first exercise');
  await page.locator('button.press-scale').first().click();
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/debug-detail-view.png' });
  
  // Click WATCH DEMO
  console.log('Action: Clicking WATCH DEMO');
  await page.getByRole('button', { name: /watch demo/i }).click();
  
  const loadingVeil = page.getByText('Loading demo');
  console.log('Action: Waiting for loading veil to disappear...');
  await expect(loadingVeil).not.toBeVisible({ timeout: 20000 });
  
  console.log('Action: Observing video playing state');
  const iframe = page.locator('iframe[title="Video"]');
  await expect(iframe).toBeVisible();
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'artifacts/debug-video-playing.png' });
  console.log('--- QA COMPLETE ---');
});
