import { test, expect } from '@playwright/test';

test('signup and navigate to exercise library', async ({ page }) => {
  // Collect console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // 1. Navigate to landing
  await page.goto('http://localhost:7770/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=BODY BRIDGE', { timeout: 10000 });
  console.log('STEP 1: Landing page loaded');

  // 2. Click START TRAINING
  await page.click('button:has-text("START TRAINING")');
  await page.waitForSelector('text=JOIN', { timeout: 10000 });
  console.log('STEP 2: JOIN page loaded');

  // 3. Fill signup form
  await page.fill('input[placeholder="FULL NAME"]', 'Test User');
  await page.fill('input[placeholder="EMAIL ADDRESS"]', `testuser_${Date.now()}@bodybridge.test`);
  await page.fill('input[placeholder="SECURE PASSWORD"]', 'TestPass123!');

  // 4. Submit form
  await page.click('button:has-text("CREATE PROFILE")');
  console.log('STEP 3: Submitted signup form');

  // 5. Wait for navigation away from JOIN page (give it up to 15s)
  await page.waitForTimeout(3000);

  // Check for error messages
  const errorText = await page.textContent('body').catch(() => '');
  const hasError = /error|invalid|failed|pkcs8|unauthorized/i.test(errorText || '');

  // Wait longer for auth to complete
  await page.waitForTimeout(5000);

  const pageText = await page.textContent('body').catch(() => '');
  console.log('STEP 4: After submit - page text length:', (pageText || '').length);
  console.log('STEP 4: First 200 chars:', (pageText || '').substring(0, 200));

  // Check if still on JOIN page (signup failed) or navigated (signup succeeded)
  const stillOnJoin = await page.locator('text=JOIN').count().catch(() => 0);
  const hasLibrary = await page.locator('text=Exercise').count().catch(() => 0);
  const hasDashboard = await page.locator('text=Dashboard').count().catch(() => 0);
  console.log('STEP 5: stillOnJoin=', stillOnJoin, 'hasLibrary=', hasLibrary, 'hasDashboard=', hasDashboard);

  // Try to navigate to exercises directly
  await page.goto('http://localhost:7770/exercises', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const exercisesText = await page.textContent('body').catch(() => '');
  console.log('STEP 6: /exercises route - page text length:', (exercisesText || '').length);
  console.log('STEP 6: First 500 chars:', (exercisesText || '').substring(0, 500));

  // Look for exercise cards
  const exerciseCards = await page.locator('[class*="card"], [class*="exercise"], [data-exercise]').count();
  console.log('STEP 7: Exercise card count:', exerciseCards);

  // Check for common library indicators
  const libraryText = await page.textContent('body').catch(() => '');
  const hasExerciseLibrary = /exercise library|exercises|workout/i.test(libraryText || '');
  console.log('STEP 8: Has exercise library text:', hasExerciseLibrary);

  // Capture screenshots
  await page.screenshot({ path: '.hermes/screenshots/library-v2/after-signup.png', fullPage: true });
  console.log('STEP 9: Screenshot saved to .hermes/screenshots/library-v2/after-signup.png');

  // Try other common routes
  for (const route of ['/dashboard', '/library', '/home', '/workouts', '/']) {
    await page.goto(`http://localhost:7770${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const text = await page.textContent('body').catch(() => '');
    const hasContent = (text || '').length > 100;
    const hasExercises = /exercise|workout|library|dashboard/i.test(text || '');
    console.log(`STEP 10: Route ${route} - content=${hasContent}, exercises=${hasExercises}, first100=${(text || '').substring(0, 100)}`);
  }

  console.log('Console errors:', consoleErrors.length);
  consoleErrors.forEach((e, i) => console.log(`  Error ${i}: ${e.substring(0, 200)}`));

  // Final screenshot on landing after auth attempt
  await page.goto('http://localhost:7770/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '.hermes/screenshots/library-v2/landing-after-auth.png', fullPage: true });
  console.log('STEP 11: Final landing screenshot saved');
});
