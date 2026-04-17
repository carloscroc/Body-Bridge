import { test, expect } from '@playwright/test';

test('auth flow diagnostic', async ({ page }) => {
  const ts = Date.now();
  const name = `Test User ${ts}`;
  const email = `diag_${ts}@example.com`;
  const password = `TestPass123!`;

  // 1. Load app
  console.log('Loading app...');
  await page.goto('http://localhost:7770');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'diag_1_load.png' });
  
  // Debug: Log all text on page
  const bodyText = await page.innerText('body');
  console.log('Body Text:', bodyText);

  // Debug: Log all buttons
  const buttons = await page.getByRole('button').all();
  console.log(`Found ${buttons.length} buttons`);
  for (const btn of buttons) {
    console.log(`Button text: ${await btn.innerText()}`);
  }

  // 2. Click Start Training
  console.log('Clicking Start Training...');
  const startBtn = page.getByRole('button', { name: 'Start Training' });
  await expect(startBtn).toBeVisible();
  await startBtn.click();
  await page.screenshot({ path: 'diag_2_signup_form.png' });

  // 3. Fill Signup
  console.log('Filling signup form...');
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.screenshot({ path: 'diag_3_filled.png' });

  // 4. Submit
  console.log('Submitting...');
  const createBtn = page.getByRole('button', { name: 'Create Profile' });
  await createBtn.click();

  // 5. Wait for Onboarding or Dashboard
  console.log('Waiting for response...');
  // Check for error messages
  const errorMsg = page.locator('.bg-red-500\\/10');
  
  try {
    await Promise.race([
        expect(page.getByText('WELCOME', { exact: false })).toBeVisible({ timeout: 10000 }),
        expect(page.getByText('STEP 1', { exact: false })).toBeVisible({ timeout: 10000 }),
        expect(errorMsg).toBeVisible({ timeout: 10000 })
    ]);
  } catch (e) {
    console.log('Timeout waiting for transition');
  }

  await page.screenshot({ path: 'diag_4_result.png' });
  
  if (await errorMsg.isVisible()) {
    console.log('Auth Error detected:', await errorMsg.innerText());
  } else {
    console.log('No immediate error detected, check diag_4_result.png');
  }
});
