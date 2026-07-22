import { test, expect } from '@playwright/test';

test('exercise detail modal video playback and scrolling', async ({ page }) => {
  console.log('Starting exercise detail modal test...');

  // 1. Navigate to landing page
  await page.goto('http://localhost:7770', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('BODY BRIDGE', { timeout: 15000 });

  // 2. Sign In with existing account or create quick one
  console.log('Attempting sign in...');
  const signInBtn = page.getByRole('button', { name: 'Sign In' });
  await signInBtn.click();
  await page.screenshot({ path: 'exercise_test_1_signin.png', fullPage: true });

  // Try to sign in with test credentials or navigate directly
  await page.waitForTimeout(3000);

  // 3. Navigate to Exercises directly
  console.log('Navigating to exercises...');
  await page.goto('http://localhost:7770/#/exercises');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'exercise_test_2_library.png', fullPage: true });

  // 4. Look for exercise cards
  console.log('Looking for exercise cards...');
  const cards = await page.locator('[data-testid*="exercise-card"], .exercise-card, article').count();
  console.log(`Found ${cards} exercise cards`);

  // Try to find and click on Goblet Squat (from Convex data)
  const gobletSquat = await page.getByText('Goblet Squat', { exact: false }).first();
  if (await gobletSquat.isVisible()) {
    await gobletSquat.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'exercise_test_3_detail_preplay.png', fullPage: true });

    // Check for Play Video control
    const playButton = await page.getByRole('button', { name: /play|video/i }).first();
    if (await playButton.isVisible()) {
      console.log('Play Video button found');
      await playButton.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'exercise_test_4_playing.png', fullPage: true });
    }

    // Test scrolling
    console.log('Testing scroll behavior...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'exercise_test_5_scrolled_mid.png', fullPage: true });

    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'exercise_test_6_scrolled_bottom.png', fullPage: true });

    // Test close with Escape
    console.log('Testing Escape close...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
  }

  // Try other viewport sizes for responsive testing
  console.log('Testing mobile viewport...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:7770/#/exercises');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'exercise_test_7_mobile_library.png', fullPage: true });

  console.log('Exercise detail modal test complete');
});