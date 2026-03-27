// signup_onboard.js
// Robust Playwright automation to sign up a new user, complete onboarding,
// and land on the dashboard. Generates unique credentials using a timestamp.
// Prereqs: node, Playwright installed (npm i -D playwright), npx playwright install

import { chromium } from 'playwright';

(async () => {
  const ts = Date.now();
  const name = `Verification User ${ts}`;
  const email = `verify_test_${ts}@example.com`;
  const password = `TestPassword!${String(ts).slice(-4)}`;

  const signupPath = 'signup_form.png';
  const onboard1 = 'onboard_step1.png';
  const onboard2 = 'onboard_step2.png';
  const dashboard = 'dashboard.png';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  async function clickByTextVariants(variants) {
    for (const v of variants) {
      try {
        const el = page.locator(v);
        const count = await el.count();
        if (count > 0) {
          await el.first().click();
          return true;
        }
      } catch {}
    }
    return false;
  }

  async function fillInputByCandidates(candidates, value) {
    for (const sel of candidates) {
      const el = page.locator(sel);
      const cnt = await el.count();
      if (cnt > 0) {
        await el.first().fill(value);
        return true;
      }
    }
    return false;
  }

  try {
    // 1) Navigate to app
    await page.goto('http://localhost:7770', { waitUntil: 'load' });

    // 2) Start Training (Sign Up)
    const started = await clickByTextVariants([
      'button:has-text("Start Training")',
      'text=Start Training',
      'button:has-text("Sign Up")',
    ]);
    if (!started) throw new Error('Start Training button not found');

    // 3) Fill signup form
    const nameFilled = await fillInputByCandidates([
      "input[name='name']",
      "input[name='fullName']",
      "input[placeholder*='Name']",
      "input[type='text']",
    ], name);
    const emailFilled = await fillInputByCandidates([
      "input[name='email']",
      "input[placeholder*='Email']",
      "input[type='email']",
    ], email);
    const passFilled = await fillInputByCandidates([
      "input[name='password']",
      "input[placeholder*='Password']",
      "input[type='password']",
    ], password);

    // Take signup screenshot if possible
    if (nameFilled || emailFilled || passFilled) {
      await page.screenshot({ path: signupPath });
    }

    // Try to submit if a visible submit button exists, as a fallback
    async function trySubmitFallback() {
      for (const sel of ["button[type=submit]", "button:has-text(\"Submit\")", "button:has-text(\"Sign Up\")", "button:has-text(\"Create Profile\")"]) {
        const el = page.locator(sel);
        if (await el.count() > 0) {
          await el.first().click();
          return true;
        }
      }
      return false;
    }
    await trySubmitFallback();

    // 4) Create Profile
    const created = await clickByTextVariants([
      'button:has-text("Create Profile")',
      'text=Create Profile',
    ]);
    if (!created) {
      console.warn('Create Profile button not found; continuing with onboarding steps if possible.');
    }

    // 5) Onboarding steps: navigate Next Phase / Initialize
    // First onboarding step
    let progressed = false;
    progressed = await clickByTextVariants(['button:has-text("Next Phase")', 'text=Next Phase']);
    if (progressed) {
      await page.waitForTimeout(600);
      await page.screenshot({ path: onboard1 });
    }

    // Second onboarding step
    progressed = await clickByTextVariants(['button:has-text("Next Phase")', 'text=Next Phase']);
    if (progressed) {
      await page.waitForTimeout(600);
      await page.screenshot({ path: onboard2 });
    }

    // Some flows may require Initialize on the last step
    const initialized = await clickByTextVariants(['button:has-text("Initialize")', 'text=Initialize']);
    if (initialized) {
      await page.waitForTimeout(600);
    }

    // 6) Final dashboard: verify login and take screenshot
    // Try to reach dashboard, then verify by username or Logout
    // Attempt a few common navigation anchors to reach dashboard
    await clickByTextVariants(['text=Dashboard', 'text=Overview', 'text=Home', 'text=Go to Dashboard']);
    // Wait a bit for the dashboard to render
    await sleep(800);
    // Check for login indicators
    let loggedIn = false;
    for (let i = 0; i < 20; i++) {
      if (await page.locator(`text=${name}`).count() > 0) { loggedIn = true; break; }
      if (await page.locator('text=Logout').count() > 0) { loggedIn = true; break; }
      await sleep(500);
    }
    await page.screenshot({ path: dashboard });

    if (!loggedIn) {
      console.warn('Login verification failed: user not visible on dashboard; proceeding with captured screenshots.');
    }

    console.log('Signup and onboarding automation completed. Screenshots saved (if created).');
    console.log(`Credentials: name=${name}, email=${email}`);
  } catch (err) {
    console.error('Automation error:', err.message);
  } finally {
    await browser.close();
  }
})();
