import { test, expect } from '@playwright/test';

test('community feed Skool-style features', async ({ page }) => {
  const ts = Date.now();
  const email = `test_community_${ts}@example.com`;
  const name = `Tester ${ts}`;
  const password = `Pass123!`;

  console.log('1. Loading app and signing up...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Start Training' }).click();
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Create Profile' }).click();

  console.log('2. Handling onboarding phases...');
  for (let i = 1; i <= 15; i++) {
    const nextBtn = page.locator('button').filter({ hasText: /NEXT|CONTINUE|COMPLETE|GO|START|INITIALIZE/i }).first();
    try {
      await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
      await nextBtn.click();
      await page.waitForTimeout(300);
    } catch (e) {
      break;
    }
  }

  console.log('3. Navigating to Community tab...');
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/posts/' } }));
  });

  console.log('Verifying community header...');
  await expect(page.getByText('Forge Elite')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'test-community-1-feed-initial.png' });
  
  console.log('4. Testing Composer Launcher...');
  const launcher = page.getByText(/Write something/i);
  await expect(launcher).toBeVisible({ timeout: 10000 });
  await launcher.click();
  
  console.log('5. Creating a new post...');
  await expect(page.getByText(/Create Post/i)).toBeVisible();
  await page.getByPlaceholder(/Add a title/i).fill('Playwright Test Title');
  await page.getByPlaceholder(/Share today's win/i).fill('Verifying Skool-style feed features via Playwright.');
  
  // Select 'Wins' category chip - be extremely flexible
  // The chips are in a flex wrap div, usually buttons or spans
  const winsChip = page.locator('button, div, span').filter({ hasText: /^Wins$/i }).last();
  await winsChip.click();
  
  await page.getByRole('button', { name: /Post to Community/i }).click();

  console.log('6. Verifying post in feed...');
  await expect(page.getByText('Playwright Test Title')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'test-community-2-post-added.png' });

  console.log('7. Testing Search...');
  // Find search by SVG or label
  const searchToggle = page.locator('button').filter({ has: page.locator('svg') }).filter({ has: page.locator('path[d*="M21"]') }).last();
  try {
      await searchToggle.click({ timeout: 5000 });
  } catch (e) {
      // fallback to searching all buttons with search text/svg
      await page.locator('button').filter({ has: page.locator('svg') }).last().click();
  }
  
  const searchInput = page.getByPlaceholder(/Search posts/i);
  if (await searchInput.isVisible()) {
    await searchInput.fill('Playwright');
    await expect(page.getByText('Playwright Test Title')).toBeVisible();
    await page.screenshot({ path: 'test-community-3-search-active.png' });
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click(); 
  }

  console.log('8. Testing Filter Chips...');
  const generalFilter = page.getByRole('button', { name: /^General$/i, exact: true });
  if (await generalFilter.isVisible()) {
    await generalFilter.click();
    await expect(page.getByText('Playwright Test Title')).not.toBeVisible();
    await page.getByRole('button', { name: /^Wins$/i, exact: true }).click();
    await expect(page.getByText('Playwright Test Title')).toBeVisible();
  }

  console.log('9. Testing Comments Threading...');
  // Find comment button by SVG
  const commentBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ has: page.locator('path[d*="M21 15a2"]') }).first();
  await commentBtn.click();
  await expect(page.getByText('Comments')).toBeVisible();
  
  const commentInput = page.getByPlaceholder(/Write a comment/i);
  await commentInput.fill('Test parent comment');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Test parent comment')).toBeVisible();
  
  const replyBtn = page.getByRole('button', { name: /Reply/i }).first();
  if (await replyBtn.isVisible()) {
    await replyBtn.click();
    await commentInput.fill('Test nested reply');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Test nested reply')).toBeVisible();
  }
  
  await page.screenshot({ path: 'test-community-4-comments-threaded.png' });
  console.log('Testing complete.');
});
