import { test, expect } from '@playwright/test';

test('verify 90/90 Hamstring video playback', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:7770/');

  // Wait for the landing page to load
  await page.waitForSelector('text=START TRAINING', { timeout: 10000 });

  // Click START TRAINING to begin the auth flow
  await page.click('text=START TRAINING');

  // Wait for auth screen
  await page.waitForTimeout(2000);

  // Take a screenshot to see where we are
  await page.screenshot({ path: 'test-results/90-90-hamstring-1-auth.png', fullPage: true });

  // Look for sign in button or continue button
  const signInButton = await page.locator('text=SIGN IN').first();
  if (await signInButton.isVisible()) {
    await signInButton.click();
    await page.waitForTimeout(2000);
  }

  // Try to find exercises button or navigate to exercises
  const exercisesButton = await page.locator('text=Exercises').first();
  if (await exercisesButton.isVisible({ timeout: 5000 })) {
    await exercisesButton.click();
  } else {
    // Try alternative navigation
    await page.goto('http://localhost:7770/exercises');
  }

  // Wait for exercises list to load
  await page.waitForTimeout(3000);

  // Take a screenshot of exercises list
  await page.screenshot({ path: 'test-results/90-90-hamstring-2-exercises.png', fullPage: true });

  // Search for "90/90 Hamstring" exercise
  const exerciseName = '90/90 Hamstring';

  // Try to find the exercise by text
  const exerciseCard = await page.locator(`text=${exerciseName}`).first();

  if (await exerciseCard.isVisible({ timeout: 5000 })) {
    console.log(`Found "${exerciseName}" exercise`);

    // Click on the exercise
    await exerciseCard.click();

    // Wait for exercise detail to load
    await page.waitForTimeout(3000);

    // Take a screenshot of exercise detail
    await page.screenshot({ path: 'test-results/90-90-hamstring-3-detail.png', fullPage: true });

    // Verify video player is present
    const videoPlayer = await page.locator('iframe').first();
    expect(await videoPlayer.isVisible()).toBeTruthy();

    // Check if video player has YouTube source
    const videoSrc = await videoPlayer.getAttribute('src');
    console.log('Video source:', videoSrc);
    expect(videoSrc).toContain('youtube');

    // Take a final screenshot showing the video player
    await page.screenshot({ path: 'test-results/90-90-hamstring-4-video.png', fullPage: true });

    console.log('✓ Video player loaded successfully');
  } else {
    // Take a screenshot showing what we see
    await page.screenshot({ path: 'test-results/90-90-hamstring-error.png', fullPage: true });
    console.log(`Could not find "${exerciseName}" exercise`);
    throw new Error(`Exercise "${exerciseName}" not found in the UI`);
  }
});
