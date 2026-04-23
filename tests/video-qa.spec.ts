import { test, expect } from '@playwright/test';

test.describe('Video Player QA', () => {
  test('verify video player loading state and content', async ({ page }) => {
    console.log('--- STARTING VIDEO QA ---');
    
    // 1. Navigate to the app (using the known working port and host)
    console.log('Action: Navigating to http://127.0.0.1:7770');
    await page.goto('http://127.0.0.1:7770');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/01-landing-page.png' });
    
    // 2. Navigate to Exercises (Library)
    // The App.tsx shows HomeView has an onNavigateToLibrary prop
    // We'll try to find a link or button for "Library" or "Exercises"
    console.log('Action: Clicking Library/Exercises');
    const libraryBtn = page.getByRole('button', { name: /library|exercises/i }).first();
    if (await libraryBtn.isVisible()) {
      await libraryBtn.click();
    } else {
      // Try tab bar
      await page.getByRole('button', { name: /library/i }).click();
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/02-library-view.png' });
    
    // 3. Select an exercise (e.g., Barbell Squat which we know exists)
    console.log('Action: Selecting "Barbell Squat"');
    const exerciseCard = page.getByText('Barbell Squat').first();
    await exerciseCard.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/03-exercise-detail.png' });
    
    // 4. Click WATCH DEMO
    console.log('Action: Clicking "WATCH DEMO"');
    const watchDemoBtn = page.getByRole('button', { name: /watch demo/i });
    await watchDemoBtn.click();
    
    // 5. OBSERVE LOADING STATE
    console.log('Action: Observing video player modal');
    // The modal has a loading veil with text "Loading demo"
    const loadingVeil = page.getByText('Loading demo');
    const isVeilVisible = await loadingVeil.isVisible();
    console.log(`Initial observation: Loading veil is ${isVeilVisible ? 'VISIBLE' : 'HIDDEN'}`);
    
    await page.screenshot({ path: 'artifacts/04-video-modal-initial.png' });
    
    // 6. WAIT FOR VIDEO READY
    console.log('Action: Waiting for video to be ready (max 15s)');
    try {
      // In the code, setVideoReady(true) happens onReady of VideoPlayer
      // If it's an iframe, it might take a while.
      // We check if the loading veil disappears
      await expect(loadingVeil).not.toBeVisible({ timeout: 15000 });
      console.log('Result: Loading veil disappeared! Video is ready.');
    } catch (e) {
      console.log('Result: TIMEOUT - Loading veil is still visible after 15s. Video is STUCK.');
      await page.screenshot({ path: 'artifacts/05-video-stuck.png' });
      
      // INSPECT THE IFRAME
      const iframe = page.locator('iframe[title="Video"]');
      const iframeCount = await iframe.count();
      console.log(`Technical info: Found ${iframeCount} video iframe(s)`);
      if (iframeCount > 0) {
        const src = await iframe.getAttribute('src');
        console.log(`Technical info: Iframe src is ${src}`);
      }
      
      // Capture console errors
      const logs = await page.evaluate(() => window.performance.getEntries().map(e => e.name).filter(n => n.includes('youtube')));
      console.log(`Network logs (YouTube related): ${logs.join(', ')}`);
      
      throw new Error('Video player is stuck on loading');
    }
    
    // 7. FINAL STATE
    await page.screenshot({ path: 'artifacts/06-video-playing.png' });
    console.log('--- VIDEO QA COMPLETE: SUCCESS ---');
  });
});
