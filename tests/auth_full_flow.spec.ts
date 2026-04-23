import { test, expect } from '@playwright/test';

test('auth flow and onboarding validation', async ({ page }) => {
  const ts = Date.now();
  const name = `Test User ${ts}`;
  const email = `test_${ts}@example.com`;
  const password = `Password123!`;

  console.log(`Starting test for user: ${email}`);

  // 1. Navigate to landing page
  await page.goto('http://localhost:7770', { waitUntil: 'networkidle' });
  
  // Wait for initial load
  await expect(page.locator('h1')).toContainText('FORGE', { timeout: 15000 });
  await page.screenshot({ path: 'auth_step_1_landing.png' });
  
  // 2. Start Training (Signup)
  console.log('Clicking Start Training...');
  const startBtn = page.getByRole('button', { name: 'Start Training' });
  await expect(startBtn).toBeVisible();
  await startBtn.click();
  await page.screenshot({ path: 'auth_step_2_form.png' });

  // 3. Fill and submit signup form
  console.log('Filling signup form...');
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.screenshot({ path: 'auth_step_3_filled.png' });
  
  await page.getByRole('button', { name: 'Create Profile' }).click();

  // 4. Onboarding Flow
  console.log('Waiting for onboarding flow...');
  
  // Step 1: Identity
  console.log('Onboarding Step 1: Identity');
  await expect(page.getByText('Identity', { exact: false })).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'auth_step_4_identity.png' });
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 2: Objective
  console.log('Onboarding Step 2: Objective');
  await expect(page.getByText('Objective', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'auth_step_5_objective.png' });
  await page.getByText('Strength', { exact: false }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 3: Tier
  console.log('Onboarding Step 3: Tier');
  await expect(page.getByText('Tier', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'auth_step_6_tier.png' });
  await page.getByText('Intermediate', { exact: false }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 4: Frequency
  console.log('Onboarding Step 4: Frequency');
  await expect(page.getByText('Frequency', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'auth_step_7_frequency.png' });
  await page.locator('button').filter({ hasText: /^4$/ }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();

  // Step 5: Verified
  console.log('Onboarding Step 5: Verified');
  await expect(page.getByText('Verified', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'auth_step_8_verified.png' });
  await page.getByRole('button', { name: 'Initialize' }).click();

  // 5. Dashboard Verification
  console.log('Waiting for dashboard...');
  await expect(page.getByText(/Hi, .+/i)).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: 'auth_step_9_dashboard.png' });
  
  await expect(page.getByText("Today's Plan", { exact: false })).toBeVisible();

  console.log('Auth and onboarding flow successful');
});
