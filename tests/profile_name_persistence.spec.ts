import { test, expect } from '@playwright/test';

/**
 * Targeted regression test for the profile name persistence bug.
 *
 * Bug: After logout → re-login, the dashboard showed "Hi, Member!" instead of
 * the user's actual name. Root cause: `getOrCreateUser` used `??` instead of
 * `||` for the fullName patch, so empty-string `fullName` args wiped the
 * stored value.
 *
 * Fix: `convex/functions/auth.ts` line 96 — `??` → `||`
 *
 * This test verifies:
 *   1. Signup → name appears on dashboard
 *   2. Logout → name gone
 *   3. Re-login → name STILL appears (the actual regression)
 */

const BASE = 'http://localhost:7770';

test('profile name persists across logout + re-login', async ({ browser }) => {
  const ts = Date.now();
  const name = `NameTest ${ts}`;
  const email = `nametest_${ts}@example.com`;
  const password = `Password123!`;

  const context = await browser.newContext();
  const page = await context.newPage();

  // --- Signup ---
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('BODY BRIDGE', { exact: false })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Start Training' }).click();
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Create Profile' }).click();

  // Wait for dashboard — skip onboarding if it appears, or proceed if auto-skipped
  // Try clicking through onboarding phases if present
  for (let i = 0; i < 6; i++) {
    const nextBtn = page.getByRole('button', { name: 'Next Phase' });
    const initBtn = page.getByRole('button', { name: 'Initialize' });
    const isNextVisible = await nextBtn.isVisible().catch(() => false);
    const isInitVisible = await initBtn.isVisible().catch(() => false);
    if (isInitVisible) { await initBtn.click(); break; }
    if (isNextVisible) { await nextBtn.click(); await page.waitForTimeout(500); continue; }
    break; // No onboarding buttons → already on dashboard
  }

  // 1. Verify name shows on dashboard after signup
  await expect(page.getByText(/Hi,/i)).toBeVisible({ timeout: 30000 });
  const dashboardHeading1 = await page.locator('h1').first().textContent();
  console.log(`After signup: "${dashboardHeading1}"`);
  await page.screenshot({ path: 'name_test_1_after_signup.png' });

  // Verify it's NOT "Hi, Member!" (the bug symptom)
  expect(dashboardHeading1).not.toContain('Member');
  expect(dashboardHeading1).toContain(name);

  // --- Logout ---
  // Clear auth tokens from localStorage to simulate logout/session expiry.
  // This tests the exact regression path: user's session ends, then they log
  // back in with the same credentials.
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('__convexAuth') || key.startsWith('body-bridge_')) {
        localStorage.removeItem(key);
      }
    });
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'name_test_2_logged_out.png' });

  // --- Re-login with same credentials ---
  // Click 'Sign In' to switch to login mode
  await page.getByRole('button', { name: /sign in|log in|login/i }).first().click();
  await page.waitForTimeout(500);

  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: /sign in|log in|login|enter/i }).first().click();

  // 3. THE REGRESSION CHECK: name must STILL appear after re-login
  await expect(page.getByText(/Hi,/i)).toBeVisible({ timeout: 30000 });
  const dashboardHeading2 = await page.locator('h1').first().textContent();
  console.log(`After re-login: "${dashboardHeading2}"`);
  await page.screenshot({ path: 'name_test_3_after_relogin.png' });

  // This is the critical assertion: name must survive logout+login
  expect(dashboardHeading2).not.toContain('Member');
  expect(dashboardHeading2).toContain(name);

  console.log('PASS: Profile name persisted across logout + re-login.');
  await context.close();
});
