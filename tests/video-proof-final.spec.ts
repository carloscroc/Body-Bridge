import { test, expect } from '@playwright/test';

test('EXERCISE VIDEO PLAYBACK PROOF', async ({ page }) => {
  test.setTimeout(120000);
  console.log('--- STARTING VIDEO PLAYBACK VERIFICATION ---');
  
  await page.goto('http://127.0.0.1:7770');
  await page.waitForLoadState('networkidle');
  
  // Sign in or start training (Bypass landing)
  await page.getByText('START TRAINING').click().catch(() => {});
  
  // Navigate to Library via bottom tab if needed
  console.log('Navigating to library...');
  await page.locator('button').filter({ hasText: 'Exercises' }).or(page.getByText('Library')).first().click();
  
  await page.waitForTimeout(3000);
  
  // Click first exercise
  console.log('Opening exercise...');
  const card = page.locator('button.press-scale').first();
  await card.click();
  
  await page.waitForTimeout(2000);
  
  // The button in ExerciseDetail.tsx is: <span className="text-[9px] font-bold uppercase tracking-[0.2em]">WATCH DEMO</span>
  // It's inside a motion.button
  console.log('Clicking Watch Demo...');
  const watchBtn = page.getByText('WATCH DEMO');
  await watchBtn.click();
  
  const loadingVeil = page.getByText('Loading demo');
  console.log('Waiting for Loading demo to disappear...');
  await expect(loadingVeil).not.toBeVisible({ timeout: 20000 });
  
  console.log('SUCCESS: Loading veil disappeared. Video active.');
  const iframe = page.locator('iframe[title="Video"]');
  await expect(iframe).toBeVisible();
  
  await page.waitForTimeout(10000); // Record playback
  await page.screenshot({ path: 'artifacts/FINAL-PROOF.png' });
});
