import { test, expect } from '@playwright/test';

test('E2E: Community Feed Overhaul (Skool-style)', async ({ page }) => {
  const ts = Date.now();
  const email = `e2e_skool_${ts}@example.com`;
  const name = `E2E Tester ${ts}`;
  const password = `SecurePass123!`;

  console.log('--- STARTING COMMUNITY FEED E2E ---');

  // 1. App Initialization
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // 2. Auth Flow
  console.log('STEP 2: Authentication');
  await page.getByRole('button', { name: /Start Training/i }).click();
  await page.getByPlaceholder(/FULL NAME/i).fill(name);
  await page.getByPlaceholder(/EMAIL ADDRESS/i).fill(email);
  await page.getByPlaceholder(/SECURE PASSWORD/i).fill(password);
  await page.getByRole('button', { name: /Create Profile/i }).click();

  // 3. Onboarding Sequence
  console.log('STEP 3: Onboarding Sequence');
  for (let i = 1; i <= 15; i++) {
    const nextBtn = page.locator('button').filter({ 
      hasText: /NEXT PHASE|CONTINUE|COMPLETE|INITIALIZE|GET STARTED/i 
    }).first();
    
    try {
        await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
        await nextBtn.click();
        await page.waitForTimeout(300);
    } catch (e) {
        break;
    }
  }

  // 4. Navigation to Community
  console.log('STEP 4: Navigating to Community Feed');
  await page.waitForTimeout(2000);
  
  // Directly navigate via app-navigate event to bypass icon finding
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/posts/' } }));
  });
  
  await expect(page.getByText('Forge Elite')).toBeVisible({ timeout: 15000 });
  
  // 5. Composer Card & Post Creation
  console.log('STEP 5: Testing Composer & Post Creation');
  const launcher = page.getByText(/Write something/i);
  await expect(launcher).toBeVisible({ timeout: 10000 });
  await launcher.click();

  const postTitle = `Skool Title ${ts}`;
  const postBody = `Automated testing content.`;

  await page.getByPlaceholder(/Add a title/i).fill(postTitle);
  await page.getByPlaceholder(/Share today's win/i).fill(postBody);
  
  console.log('Submitting post via evaluate click...');
  // Force click on category and submit
  await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const wins = allButtons.find(b => b.innerText.includes('Wins'));
      if (wins) wins.click();
      
      const post = allButtons.find(b => b.innerText.includes('Post to Community'));
      if (post) post.click();
  });

  // Alternative fallback click
  try {
      await page.getByRole('button', { name: /Post to Community/i }).click({ force: true, timeout: 2000 });
  } catch (e) {}
  
  // 6. Feed Item Verification
  console.log('STEP 6: Verifying Feed Item Layout');
  // Refresh feed if it didn't appear (though Convex should auto-update)
  // Let's just wait for either title or body
  const postInFeed = page.getByText(postTitle);
  await expect(postInFeed).toBeVisible({ timeout: 15000 });
  
  const postCard = page.locator('div').filter({ has: postInFeed }).last();
  await expect(postCard).toBeVisible();

  // 7. Search Interaction
  console.log('STEP 7: Testing Search Functionality');
  const searchToggle = page.locator('button').filter({ has: page.locator('svg') }).last();
  await searchToggle.click();
  
  const searchInput = page.getByPlaceholder(/Search posts/i);
  await expect(searchInput).toBeVisible();
  await searchInput.fill(postTitle);
  await expect(page.getByText(postTitle)).toBeVisible();
  
  await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();

  // 8. Category Filtering
  console.log('STEP 8: Testing Category Filters');
  const winsFilter = page.locator('button').filter({ hasText: /^Wins$/i }).first();
  await winsFilter.click();
  await expect(page.getByText(postTitle)).toBeVisible();

  // 9. Threaded Comments
  console.log('STEP 9: Testing Threaded Comments');
  const commentBtn = postCard.locator('button').filter({ has: page.locator('svg') }).nth(1);
  await commentBtn.click();

  await expect(page.getByText(/Comments/i).last()).toBeVisible();

  const parentText = `Parent comment ${ts}`;
  const commentInput = page.getByPlaceholder(/Write a comment/i);
  await commentInput.fill(parentText);
  await page.keyboard.press('Enter');
  await expect(page.getByText(parentText)).toBeVisible();

  await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();

  console.log('--- E2E TEST COMPLETED SUCCESSFULLY ---');
});
