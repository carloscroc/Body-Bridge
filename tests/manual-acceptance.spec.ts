import { test, expect } from '@playwright/test';

/**
 * Simple Manual Acceptance Test for Exercise Detail Video
 *
 * This test provides step-by-step verification with screenshots
 * for visual inspection of the Exercise Detail Modal improvements.
 */

test('Manual acceptance test with screenshots', async ({ page }) => {
  console.log('=== Starting Manual Acceptance Test ===\n');

  const APP_URL = 'http://localhost:7770';

  // Step 1: Load application
  console.log('Step 1: Loading application...');
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/manual-01-landing.png', fullPage: true });
  console.log('✓ Application loaded\n');

  // Step 2: Navigate to Exercise Library
  console.log('Step 2: Navigating to Exercise Library...');

  // Try multiple strategies to find library button
  let libraryClicked = false;

  // Strategy 1: Look for Library/Exercises button by role
  try {
    const libraryBtn = await page.getByRole('button', { name: /library|exercises/i }).first();
    if (await libraryBtn.isVisible({ timeout: 3000 })) {
      await libraryBtn.click();
      libraryClicked = true;
      console.log('✓ Clicked Library button (by role)');
    }
  } catch (e) {
    console.log('  Strategy 1 failed:', e.message);
  }

  // Strategy 2: Look in tab bar
  if (!libraryClicked) {
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text && /library|exercises/i.test(text)) {
        await btn.click();
        libraryClicked = true;
        console.log('✓ Clicked Library button (by text search)');
        break;
      }
    }
  }

  // Strategy 3: Look for nav items
  if (!libraryClicked) {
    const navItems = await page.locator('nav button, [role="navigation"] button').all();
    for (const item of navItems) {
      const text = await item.textContent().catch(() => '');
      if (text && /library|exercises/i.test(text)) {
        await item.click();
        libraryClicked = true;
        console.log('✓ Clicked Library button (in navigation)');
        break;
      }
    }
  }

  if (!libraryClicked) {
    console.log('⚠ Could not find Library button, continuing...');
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/manual-02-library-view.png', fullPage: true });

  // Log all visible exercise names
  console.log('\nVisible exercises:');
  const exerciseButtons = await page.locator('button').all();
  let exerciseCount = 0;
  for (const btn of exerciseButtons.slice(0, 20)) {
    const text = await btn.textContent().catch(() => '');
    if (text && text.length > 0 && text.length < 100 && !text.includes('Add') && !text.includes('Filter')) {
      console.log(`  - ${text.trim()}`);
      exerciseCount++;
    }
  }
  console.log(`\n✓ Found ${exerciseCount} exercise cards\n`);

  // Step 3: Select an exercise with video
  console.log('Step 3: Selecting an exercise with video...');
  const EXERCISE_WITH_VIDEO = 'Machine Chest Press';

  let exerciseClicked = false;
  const allButtons = await page.locator('button').all();

  for (const btn of allButtons) {
    const text = await btn.textContent().catch(() => '');
    if (text && text.includes(EXERCISE_WITH_VIDEO)) {
      console.log(`  Found exercise: "${text.trim()}"`);
      await btn.click();
      exerciseClicked = true;
      console.log('✓ Clicked exercise with video\n');
      break;
    }
  }

  if (!exerciseClicked) {
    console.log(`⚠ Could not find "${EXERCISE_WITH_VIDEO}", trying first exercise...`);
    if (allButtons.length > 0) {
      await allButtons[0].click();
      console.log('✓ Clicked first available exercise\n');
    }
  }

  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/manual-03-modal-opened.png', fullPage: false });

  // Step 4: Check modal elements
  console.log('Step 4: Checking modal elements...');

  // Check for modal
  const modal = await page.locator('[role="dialog"], .fixed').first();
  const modalVisible = await modal.isVisible().catch(() => false);
  console.log(`  Modal visible: ${modalVisible}`);

  // Check for video player
  const video = await page.locator('video').first();
  const videoVisible = await video.isVisible().catch(() => false);
  console.log(`  Video element visible: ${videoVisible}`);

  if (videoVisible) {
    const videoSrc = await video.getAttribute('src').catch(() => 'N/A');
    console.log(`  Video source: ${videoSrc}`);
    const hasControls = await video.getAttribute('controls').then(c => c !== null).catch(() => false);
    console.log(`  Video has controls: ${hasControls}`);
  }

  // Check for iframe (YouTube/Vimeo)
  const iframe = await page.locator('iframe').first();
  const iframeVisible = await iframe.isVisible().catch(() => false);
  console.log(`  Iframe visible: ${iframeVisible}`);

  if (iframeVisible) {
    const iframeSrc = await iframe.getAttribute('src').catch(() => 'N/A');
    console.log(`  Iframe source: ${iframeSrc}`);
  }

  // Check for close button
  const closeButton = await page.locator('button:has([aria-label*="close" i]), button:has-text("×")').first();
  const closeVisible = await closeButton.isVisible().catch(() => false);
  console.log(`  Close button visible: ${closeVisible}`);

  // Check for difficulty badge
  const difficultyBadge = await page.locator('span:has-text("Beginner"), span:has-text("Intermediate"), span:has-text("Advanced")').first();
  const badgeVisible = await difficultyBadge.isVisible().catch(() => false);
  console.log(`  Difficulty badge visible: ${badgeVisible}`);

  // Check for title
  const title = await page.locator('h2, h1').first();
  const titleVisible = await title.isVisible().catch(() => false);
  if (titleVisible) {
    const titleText = await title.textContent().catch(() => 'N/A');
    console.log(`  Title visible: ${titleVisible} - "${titleText}"`);
  }

  await page.screenshot({ path: 'artifacts/manual-04-modal-details.png', fullPage: false });

  // Step 5: Test scrolling
  console.log('\nStep 5: Testing modal content scrolling...');

  const contentArea = await page.locator('.custom-scrollbar, [aria-label="Exercise details"], .overflow-y-auto').first();
  const contentVisible = await contentArea.isVisible().catch(() => false);
  console.log(`  Scrollable content area visible: ${contentVisible}`);

  if (contentVisible) {
    // Check scroll properties
    const scrollInfo = await contentArea.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
      isScrollable: el.scrollHeight > el.clientHeight
    })).catch(() => ({ scrollHeight: 0, clientHeight: 0, scrollTop: 0, isScrollable: false }));

    console.log(`  Scroll height: ${scrollInfo.scrollHeight}`);
    console.log(`  Client height: ${scrollInfo.clientHeight}`);
    console.log(`  Is scrollable: ${scrollInfo.isScrollable}`);

    // Scroll to bottom
    if (scrollInfo.isScrollable) {
      await contentArea.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'artifacts/manual-05-scrolled-bottom.png', fullPage: false });
      console.log('✓ Scrolled to bottom');

      // Check for Add to Workout button
      const addToWorkoutBtn = await page.locator('button:has-text("Add to Workout")').first();
      const addToWorkoutVisible = await addToWorkoutBtn.isVisible().catch(() => false);
      console.log(`  Add to Workout button visible at bottom: ${addToWorkoutVisible}`);

      // Scroll back to top
      await contentArea.evaluate(el => el.scrollTop = 0);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'artifacts/manual-06-scrolled-top.png', fullPage: false });
      console.log('✓ Scrolled back to top');
    } else {
      console.log('  Content fits in viewport (not scrollable)');
      await page.screenshot({ path: 'artifacts/manual-05-no-scroll-needed.png', fullPage: false });
    }
  }

  // Step 6: Test close functionality
  console.log('\nStep 6: Testing close functionality...');

  // Test Escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const modalAfterEscape = await page.locator('[role="dialog"]').first();
  const modalClosed = await modalAfterEscape.isHidden().catch(() => true);
  console.log(`  Modal closed with Escape: ${modalClosed}`);

  if (modalClosed) {
    console.log('✓ Escape key closes modal');

    // Re-open for close button test
    console.log('  Re-opening modal for close button test...');
    const exerciseAgain = await page.locator('button').filter({ hasText: /machine|chest|press/i }).first();
    if (await exerciseAgain.isVisible({ timeout: 3000 })) {
      await exerciseAgain.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Modal re-opened');

      // Test close button
      const closeBtnAgain = await page.locator('button:has([aria-label*="close" i]), button:has-text("×")').first();
      if (await closeBtnAgain.isVisible({ timeout: 3000 })) {
        await closeBtnAgain.click();
        await page.waitForTimeout(500);
        const modalAfterClick = await page.locator('[role="dialog"]').first();
        const modalClosedByClick = await modalAfterClick.isHidden().catch(() => true);
        console.log(`  Modal closed with close button: ${modalClosedByClick}`);

        if (modalClosedByClick) {
          console.log('✓ Close button works');
        }
      }
    }
  }

  await page.screenshot({ path: 'artifacts/manual-07-after-close.png', fullPage: true });

  // Step 7: Test exercise without video
  console.log('\nStep 7: Testing exercise without video...');
  const EXERCISE_WITHOUT_VIDEO = 'Single-Arm Dumbbell Fly';

  // Find and click exercise without video
  const noVideoButtons = await page.locator('button').all();
  let noVideoClicked = false;

  for (const btn of noVideoButtons) {
    const text = await btn.textContent().catch(() => '');
    if (text && text.includes(EXERCISE_WITHOUT_VIDEO)) {
      await btn.click();
      noVideoClicked = true;
      console.log(`✓ Opened exercise without video: "${text.trim()}"`);
      break;
    }
  }

  if (noVideoClicked) {
    await page.waitForTimeout(1000);

    // Check for fallback
    const videoAgain = await page.locator('video').first();
    const hasVideo = await videoAgain.isVisible().catch(() => false);

    if (!hasVideo) {
      console.log('✓ No video player for exercise without video');

      // Check for fallback image
      const image = await page.locator('img').first();
      const hasImage = await image.isVisible().catch(() => false);
      console.log(`  Has fallback image: ${hasImage}`);

      if (!hasImage) {
        // Check for placeholder
        const placeholder = await page.locator('.text-white\\/10, [aria-hidden]').first();
        const hasPlaceholder = await placeholder.isVisible().catch(() => false);
        console.log(`  Has placeholder icon: ${hasPlaceholder}`);
      }
    }

    await page.screenshot({ path: 'artifacts/manual-08-no-video-fallback.png', fullPage: false });
  }

  // Step 8: Test different viewports
  console.log('\nStep 8: Testing responsive viewports...');

  const VIEWPORTS = [
    { name: 'Small Mobile', width: 360, height: 800 },
    { name: 'Mobile', width: 390, height: 844 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const viewport of VIEWPORTS) {
    console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);

    // Navigate to exercise
    const exerciseBtn = await page.locator('button').filter({ hasText: /machine|chest/i }).first();
    if (await exerciseBtn.isVisible({ timeout: 3000 })) {
      await exerciseBtn.click();
      await page.waitForTimeout(1000);

      // Screenshot
      await page.screenshot({
        path: `artifacts/manual-viewport-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: false
      });

      // Test scrolling if applicable
      const scrollArea = await page.locator('.custom-scrollbar, .overflow-y-auto').first();
      if (await scrollArea.isVisible().catch(() => false)) {
        await scrollArea.evaluate(el => {
          el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
        });
        await page.waitForTimeout(300);

        await page.screenshot({
          path: `artifacts/manual-viewport-${viewport.name.toLowerCase().replace(' ', '-')}-bottom.png`,
          fullPage: false
        });

        await scrollArea.evaluate(el => el.scrollTop = 0);
        await page.waitForTimeout(300);
      }

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      console.log(`  ✓ ${viewport.name} tested`);
    } else {
      console.log(`  ⚠ Could not open modal in ${viewport.name}`);
    }
  }

  console.log('\n=== Manual Acceptance Test Complete ===');
  console.log('\nScreenshots saved to artifacts/ directory:');
  console.log('  - manual-01-landing.png');
  console.log('  - manual-02-library-view.png');
  console.log('  - manual-03-modal-opened.png');
  console.log('  - manual-04-modal-details.png');
  console.log('  - manual-05-scrolled-bottom.png (or manual-05-no-scroll-needed.png)');
  console.log('  - manual-06-scrolled-top.png');
  console.log('  - manual-07-after-close.png');
  console.log('  - manual-08-no-video-fallback.png');
  console.log('  - manual-viewport-*.png (for each viewport)');

  await page.screenshot({ path: 'artifacts/manual-final-state.png', fullPage: true });
});