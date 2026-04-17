import { test, expect } from '@playwright/test';

test('auth flow diagnostic for community', async ({ page }) => {
  const ts = Date.now();
  const name = `Test User ${ts}`;
  const email = `test_${ts}@example.com`;
  const password = `TestPass123!`;

  console.log('Loading app...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'auth_debug_1_load.png' });
  
  console.log('Clicking Start Training...');
  await page.getByRole('button', { name: 'Start Training' }).click();
  await page.screenshot({ path: 'auth_debug_2_signup.png' });

  console.log('Filling signup form...');
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Create Profile' }).click();

  console.log('Waiting for onboarding or dashboard...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'auth_debug_3_result.png' });

  // Debug: Log all buttons to find the Community tab
  const buttons = await page.getByRole('button').all();
  console.log(`Found ${buttons.length} buttons`);
  for (const btn of buttons) {
    const text = await btn.innerText();
    const isVisible = await btn.isVisible();
    console.log(`Button text: "${text}", visible: ${isVisible}`);
  }
});
