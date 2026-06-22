import { test, expect } from '@playwright/test';

/**
 * Regression test for the APK login/onboarding loop bug.
 *
 * Root cause being covered: `completeOnboarding` returned null silently when
 * the auth session hadn't propagated server-side; App.tsx advanced the view
 * anyway without persisting onboardingComplete → next launch showed onboarding
 * again, even for already-onboarded users.
 *
 * This spec verifies the THREE paths that were broken:
 *   1. Cold restart after onboarding → must stay on the dashboard.
 *   2. Logout → AuthScreen visible.
 *   3. Re-login with the same credentials → must NOT loop into onboarding.
 *
 * Runs against `npm run preview` (http://localhost:7770), which uses the
 * production Convex URL baked into the build.
 */

const BASE = 'http://localhost:7770';

async function completeOnboarding(page: import('@playwright/test').Page) {
  // Identity
  await expect(page.getByText('Identity', { exact: false })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Next Phase' }).click();
  // Objective
  await expect(page.getByText('Objective', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.getByText('Strength', { exact: false }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();
  // Tier
  await expect(page.getByText('Tier', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.getByText('Intermediate', { exact: false }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();
  // Frequency
  await expect(page.getByText('Frequency', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.locator('button').filter({ hasText: /^4$/ }).click();
  await page.getByRole('button', { name: 'Next Phase' }).click();
  // Verified → Initialize
  await expect(page.getByText('Verified', { exact: false })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Initialize' }).click();
}

test.describe.configure({ mode: 'serial' });

test('login persistence: signup → onboarding → cold restart stays authenticated', async ({ page, context }) => {
  const ts = Date.now();
  const name = `Persist User ${ts}`;
  const email = `persist_${ts}@example.com`;
  const password = `Password123!`;

  // Capture AUTH_DIAG console logs so we can see where the auth flow breaks.
  const authLogs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('AUTH_DIAG') || text.includes('[Auth]')) {
      authLogs.push(text);
    }
  });

  // 1. Signup — wait for the Convex reachability check to finish and the
  // landing page to render. Using textContent instead of locator('h1') because
  // the landing page heading may not use an <h1> tag.
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // The app shows "BODY BRIDGE" somewhere on the landing. Wait up to 20s.
  await expect(page.getByText('BODY BRIDGE', { exact: false })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Start Training' }).click();
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Create Profile' }).click();

  // 2. Complete onboarding → land on dashboard
  await completeOnboarding(page);
  try {
    await expect(page.getByText(/Hi, .+/i)).toBeVisible({ timeout: 30000 });
  } catch (e) {
    console.log('=== AUTH_DIAG LOGS CAPTURED ===');
    authLogs.forEach((l) => console.log(l));
    throw e;
  }
  await page.screenshot({ path: 'persist_step_1_dashboard.png' });

  // 3. THE REGRESSION: full reload (cold restart in browser terms) must NOT
  //    loop back into onboarding. Previously onboardingComplete was never
  //    persisted, so this reload would show "Identity" again.
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText(/Hi, .+/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Identity', { exact: false })).toHaveCount(0, { timeout: 5000 });
  await page.screenshot({ path: 'persist_step_2_after_reload.png' });

  console.log('Cold restart kept the user on the dashboard (no onboarding loop).');
});

test('login persistence: logout then re-login does NOT show onboarding', async ({ browser }) => {
  // Use a fresh user so we don't depend on the previous test's state.
  const ts = Date.now();
  const name = `Relogin User ${ts}`;
  const email = `relogin_${ts}@example.com`;
  const password = `Password123!`;

  // --- First session: sign up + onboard ---
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('BODY BRIDGE', { exact: false })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Start Training' }).click();
  await page.getByPlaceholder('FULL NAME').fill(name);
  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Create Profile' }).click();
  await completeOnboarding(page);
  await expect(page.getByText(/Hi, .+/i)).toBeVisible({ timeout: 30000 });

  // --- Logout via Settings ---
  // Open the settings tab. The TabBar is rendered only when authenticated.
  await page.getByRole('button', { name: /settings/i }).first().click().catch(async () => {
    // Fallback: some layouts label the tab differently
    const settingsTab = page.locator('[aria-label*="Settings" i], button:has-text("Settings")').first();
    await settingsTab.click();
  });
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 }).catch(() => {
    /* settings UI may use a different landmark; proceed to logout button */
  });

  const logoutBtn = page.getByRole('button', { name: /log ?out/i }).first();
  await expect(logoutBtn).toBeVisible({ timeout: 10000 });
  await logoutBtn.click();

  // --- Logged out: AuthScreen should be visible ---
  await expect(page.getByRole('button', { name: 'Start Training' })).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'relogin_step_1_logged_out.png' });

  // --- Re-login with the SAME credentials ---
  await page.getByRole('button', { name: /log in|login/i }).first().click().catch(async () => {
    await page.getByText('Log In', { exact: false }).first().click();
  });

  await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
  await page.getByPlaceholder('SECURE PASSWORD').fill(password);
  await page.getByRole('button', { name: /log in|login|sign in/i }).first().click();

  // THE REGRESSION: a returning, fully-onboarded user must land on the
  // dashboard, NOT the onboarding flow. Previously the unauthenticated
  // bootstrap fallback returned a profile without onboardingComplete,
  // causing the onboarding loop even on re-login.
  await expect(page.getByText(/Hi, .+/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Identity', { exact: false })).toHaveCount(0, { timeout: 5000 });
  await page.screenshot({ path: 'relogin_step_2_back_in_dashboard.png' });

  console.log('Re-login skipped onboarding for an existing user.');

  await context.close();
});
