import { test, expect } from '@playwright/test';

test('auth flow and tab navigation validation', async ({ page }) => {
  const ts = Date.now();
  const name = `Test User ${ts}`;
  const email = `test_${ts}@example.com`;
  const password = `Password123!`;

  console.log(`Starting test for user: ${email}`);

  // 1. Navigate to landing page
  await page.goto('http://localhost:7770');
  
  // Wait for initial load - Check for BODY BRIDGE text
  await expect(page.locator('h1')).toContainText('BODY BRIDGE', { timeout: 15000 });
  
  // 2. Start Training (Signup)
  const startBtn = page.getByRole('button', { name: 'Start Training' });
  await expect(startBtn).toBeVisible();
  await startBtn.click();

  // 3. Fill and submit signup form
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Create Profile' }).click();

  // 4. Onboarding Flow
  console.log('Completing onboarding flow...');
  
  // Step 1: Identity
  await expect(page.getByText('Identity', { exact: false })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 2: Objective
  await expect(page.getByText('Objective', { exact: false })).toBeVisible();
  await page.getByText('Strength', { exact: false }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 3: Tier
  await expect(page.getByText('Tier', { exact: false })).toBeVisible();
  await page.getByText('Intermediate', { exact: false }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 4: Frequency
  await expect(page.getByText('Frequency', { exact: false })).toBeVisible();
  // Using more robust selector for the number '4' button
  await page.locator('button').filter({ hasText: /^4$/ }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 5: Verified
  await expect(page.getByText('Verified', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Initialize' }).click();

  // 5. Dashboard Verification
  console.log('Verifying Dashboard...');
  // The header should say "Hi, [Name]!" - sometimes it's "Hi, Test User..."
  await expect(page.getByText(/Hi, .+/)).toBeVisible({ timeout: 15000 });
  
  // 6. Tab Navigation
  console.log('Testing Tab Navigation...');
  
  // Helper to click tab and verify content
  const testTab = async (tabId: string, expectedText: string | RegExp) => {
    console.log(`Switching to ${tabId} tab...`);
    // Tab bar buttons usually have the tab ID as text in a span
    const tabButton = page.locator('button').filter({ hasText: new RegExp(`^${tabId}$`, 'i') });
    await tabButton.click();
    await expect(page.getByText(expectedText)).toBeVisible({ timeout: 10000 });
  };

  await testTab('community', /Community Feed|Post/i);
  await testTab('exercises', /Library|Search/i);
  await testTab('workouts', /Protocol|Routine/i);
  await testTab('meals', /Nutrition|Meal/i);
  await testTab('home', /Hi, .+/i);

  console.log('Auth, onboarding, and tab navigation successful');
});
