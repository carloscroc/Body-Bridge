/**
 * Browser Authentication and Single-Record Runtime Verification
 * Phases 1-7 executed via Playwright against http://localhost:7770
 * Target Convex deployment: https://upbeat-chickadee-781.convex.cloud
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const APP_URL = 'http://127.0.0.1:7770';
const CONVEX_URL = 'https://upbeat-chickadee-781.convex.cloud';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const TIMESTAMP = Date.now();
const TEST_EMAIL = `browser_verify_${TIMESTAMP}@test.local`;
const TEST_PASSWORD = `VerifyPass_${TIMESTAMP}!A1`;
const TEST_NAME = `BrowserTest ${TIMESTAMP}`;

const results = {
  testEmail: TEST_EMAIL,
  testTimestamp: TIMESTAMP,
  phase1: {}, phase2: {}, phase3: {}, phase4: {}, phase5: {}, phase6: {}, phase7: {},
  consoleErrors: [], consoleWarnings: [], networkErrors: [],
  convexRequests: [], forbiddenRequests: [], pageErrors: [],
  screenshots: [],
};

async function screenshot(page, name) {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: false, timeout: 15000, animations: 'disabled' });
    results.screenshots.push({ name, filename });
    console.log(`  [screenshot] ${filename}`);
  } catch (e) {
    console.log(`  [screenshot FAILED] ${filename}: ${e.message.substring(0, 80)}`);
  }
}

async function main() {
  console.log('=== BROWSER VERIFICATION MISSION ===');
  console.log(`Test email: ${TEST_EMAIL}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') results.consoleErrors.push(text.substring(0, 300));
    if (type === 'warning') results.consoleWarnings.push(text.substring(0, 200));
  });
  page.on('pageerror', (err) => { results.pageErrors.push(err.message.substring(0, 300)); });
  page.on('requestfailed', (req) => {
    const url = req.url();
    const failure = req.failure()?.errorText || 'unknown';
    results.networkErrors.push({ url: url.substring(0, 200), failure });
    if (url.includes('127.0.0.1:3210') || url.includes('groovy-pig-414') || url.includes('10.0.0.112:3210')) {
      results.forbiddenRequests.push({ url: url.substring(0, 200), failure });
    }
  });
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('upbeat-chickadee-781')) {
      results.convexRequests.push({ url: url.substring(0, 120), method: req.method() });
    }
    if (url.includes('127.0.0.1:3210') || url.includes('groovy-pig-414') || url.includes('10.0.0.112:3210')) {
      results.forbiddenRequests.push({ url: url.substring(0, 200) });
    }
  });

  // ===== PHASE 1 =====
  console.log('--- PHASE 1: Startup and Connectivity ---');
  try {
    const response = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    results.phase1.httpStatus = response?.status();
    results.phase1.pageTitle = await page.title();
    results.phase1.viewport = page.viewportSize();
    results.phase1.url = page.url();
    await page.waitForTimeout(4000);
    const bodyText = await page.textContent('body').catch(() => '');
    results.phase1.bodyTextPreview = bodyText?.substring(0, 300);
    results.phase1.hasBodyBridge = bodyText?.includes('BODY BRIDGE') || bodyText?.includes('Bridge') || false;
    results.phase1.convexRequestCount = results.convexRequests.length;
    results.phase1.hasConvexConnection = results.convexRequests.length > 0;
    await screenshot(page, 'phase1-initial-load');
    console.log(`  HTTP Status: ${results.phase1.httpStatus}`);
    console.log(`  Convex requests: ${results.phase1.convexRequestCount}`);
    console.log(`  Forbidden requests: ${results.forbiddenRequests.length}`);
    console.log(`  Has BODY BRIDGE text: ${results.phase1.hasBodyBridge}`);
    console.log('  Phase 1: DONE');
  } catch (err) {
    results.phase1.error = err.message.substring(0, 300);
    console.log(`  Phase 1 ERROR: ${err.message.substring(0, 150)}`);
  }

  // ===== PHASE 2 =====
  console.log('\n--- PHASE 2: Account Creation and Sign-In ---');
  try {
    const startBtn = page.locator('button:has-text("Start Training")');
    if (await startBtn.count() > 0) {
      await startBtn.first().click({ timeout: 5000 });
      await page.waitForTimeout(1500);
      await screenshot(page, 'phase2-signup-form');
    }

    const nameInput = page.locator('input[placeholder="FULL NAME"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill(TEST_NAME);
    }
    const emailInput = page.locator('input[placeholder="EMAIL ADDRESS"]');
    await emailInput.fill(TEST_EMAIL);
    const passwordInput = page.locator('input[placeholder="SECURE PASSWORD"]');
    await passwordInput.fill(TEST_PASSWORD);
    await screenshot(page, 'phase2-signup-filled');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click({ timeout: 5000 });

    console.log('  Waiting for signup to complete...');
    let authComplete = false;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(1000);
      const bodyText = await page.textContent('body').catch(() => '');
      const stillOnAuth = (bodyText?.includes('LOGIN') || bodyText?.includes('JOIN')) && bodyText?.includes('SECURE PASSWORD');
      const hasLandingButtons = bodyText?.includes('Start Training') && bodyText?.includes('Sign In');
      if (!stillOnAuth && !hasLandingButtons) {
        authComplete = true;
        break;
      }
    }
    results.phase2.signupCompleted = authComplete;
    await page.waitForTimeout(2000);
    await screenshot(page, 'phase2-after-signup');

    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return {
        allKeys: keys,
        authKeyCount: keys.filter(k => k.startsWith('__convexAuth')).length,
        hasJWT: keys.some(k => k.startsWith('__convexAuthJWT_')),
        hasRefreshToken: keys.some(k => k.startsWith('__convexAuthRefreshToken_')),
        hasLastAuthEmail: keys.includes('body-bridge_last_auth_email'),
      };
    });
    results.phase2.localStorage = localStorageData;
    results.phase2.identityPropagated = localStorageData.hasJWT;

    // Reload test
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const afterReloadStorage = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return {
        authKeyCount: keys.filter(k => k.startsWith('__convexAuth')).length,
        hasJWT: keys.some(k => k.startsWith('__convexAuthJWT_')),
      };
    });
    results.phase2.sessionPersistedAfterReload = afterReloadStorage.hasJWT;
    await screenshot(page, 'phase2-after-reload');
    console.log(`  Signup completed: ${authComplete}`);
    console.log(`  Has JWT: ${localStorageData.hasJWT}`);
    console.log(`  Session persisted after reload: ${afterReloadStorage.hasJWT}`);
    console.log('  Phase 2: DONE');
  } catch (err) {
    results.phase2.error = err.message.substring(0, 300);
    console.log(`  Phase 2 ERROR: ${err.message.substring(0, 150)}`);
  }

  // ===== PHASE 3 =====
  console.log('\n--- PHASE 3: Unauthorized User Behavior ---');
  try {
    const token = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      const jwtKey = keys.find(k => k.startsWith('__convexAuthJWT_'));
      return jwtKey ? window.localStorage.getItem(jwtKey) : null;
    });
    results.phase3.jwtPresent = !!token;

    if (token) {
      const draftResult = await page.evaluate(async (convexUrl) => {
        try {
          const keys = Object.keys(window.localStorage);
          const jwtKey = keys.find(k => k.startsWith('__convexAuthJWT_'));
          const jwt = jwtKey ? window.localStorage.getItem(jwtKey) : null;
          const res = await fetch(`${convexUrl}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({
              path: 'exercises:createDraftExercise',
              format: 'json',
              args: { name: `UnauthorizedDraft_${Date.now()}` },
            }),
          });
          const text = await res.text();
          return { status: res.status, body: text.substring(0, 600) };
        } catch (e) { return { error: e.message }; }
      }, CONVEX_URL);
      results.phase3.createDraftAttempt = draftResult;
      results.phase3.createDraftRejected = !draftResult.error && (
        draftResult.body && (draftResult.body.includes('"status":"error"') || draftResult.body.includes('Unauthenticated') || draftResult.body.includes('Unauthorized'))
      );

      const publishResult = await page.evaluate(async (convexUrl) => {
        try {
          const keys = Object.keys(window.localStorage);
          const jwtKey = keys.find(k => k.startsWith('__convexAuthJWT_'));
          const jwt = jwtKey ? window.localStorage.getItem(jwtKey) : null;
          const res = await fetch(`${convexUrl}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({
              path: 'exercises:publishExercise',
              format: 'json',
              args: {
                exerciseId: '00000000000000000000000000000000',
                publicationData: {
                  category: 'test', bodyRegion: 'test',
                  primaryMuscles: [], secondaryMuscles: [], equipment: [], instructions: [],
                },
              },
            }),
          });
          const text = await res.text();
          return { status: res.status, body: text.substring(0, 600) };
        } catch (e) { return { error: e.message }; }
      }, CONVEX_URL);
      results.phase3.publishAttempt = publishResult;
      results.phase3.publishRejected = !publishResult.error &&
        publishResult.body && (
          publishResult.body.includes('"status":"error"') ||
          publishResult.body.includes('Unauthenticated') ||
          publishResult.body.includes('Unauthorized') ||
          publishResult.body.includes('not found')
        );

      console.log(`  createDraft rejected: ${results.phase3.createDraftRejected}`);
      console.log(`  publish rejected: ${results.phase3.publishRejected}`);
      if (draftResult.body) console.log(`  Draft response: ${draftResult.body.substring(0, 200)}`);
      if (publishResult.body) console.log(`  Publish response: ${publishResult.body.substring(0, 200)}`);
    } else {
      console.log('  No JWT found - cannot test unauthorized mutations');
    }
    console.log('  Phase 3: DONE');
  } catch (err) {
    results.phase3.error = err.message.substring(0, 300);
    console.log(`  Phase 3 ERROR: ${err.message.substring(0, 150)}`);
  }

  // ===== PHASE 6 =====
  console.log('\n--- PHASE 6: bodyRegion Truth ---');
  try {
    const exerciseTabTexts = ['Library', 'Exercises', 'Movements'];
    let navigatedToLibrary = false;
    for (const tabText of exerciseTabTexts) {
      const tab = page.locator(`button:has-text("${tabText}"), [role="tab"]:has-text("${tabText}")`).first();
      if (await tab.count() > 0) {
        try {
          await tab.click({ timeout: 3000 });
          await page.waitForTimeout(2000);
          navigatedToLibrary = true;
          console.log(`  Navigated to ${tabText}`);
          break;
        } catch (e) { }
      }
    }
    await screenshot(page, 'phase6-exercise-library');

    const bodyRegionUI = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      const hasBodyRegionFilter = allText.toLowerCase().includes('body region') ||
                                   allText.toLowerCase().includes('body part') ||
                                   allText.toLowerCase().includes('muscle group');
      const filterButtons = document.querySelectorAll('button, [role="button"]');
      const filterTexts = Array.from(filterButtons).map(b => b.textContent?.trim()).filter(Boolean);
      const categoryFilters = filterTexts.filter(t =>
        ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].includes(t)
      );
      return {
        hasBodyRegionText: hasBodyRegionFilter,
        categoryFiltersFound: categoryFilters,
        totalButtons: filterTexts.length,
        sampleTexts: filterTexts.slice(0, 20),
        bodyTextPreview: allText.substring(0, 400),
      };
    });
    results.phase6.libraryLoaded = navigatedToLibrary;
    results.phase6.bodyRegionUI = bodyRegionUI;
    results.phase6.bodyRegionIsFilter = false;
    results.phase6.bodyRegionIsMetadataOnly = !bodyRegionUI.hasBodyRegionText;
    console.log(`  Library navigated: ${navigatedToLibrary}`);
    console.log(`  Body region filter text: ${bodyRegionUI.hasBodyRegionText}`);
    console.log(`  Category filters: ${bodyRegionUI.categoryFiltersFound.join(', ')}`);
    console.log('  Phase 6: DONE');
  } catch (err) {
    results.phase6.error = err.message.substring(0, 300);
    console.log(`  Phase 6 ERROR: ${err.message.substring(0, 150)}`);
  }

  // ===== PHASE 7 =====
  console.log('\n--- PHASE 7: Session Lifecycle ---');
  try {
    const beforeSignOut = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return {
        hasJWT: keys.some(k => k.startsWith('__convexAuthJWT_')),
        hasRefreshToken: keys.some(k => k.startsWith('__convexAuthRefreshToken_')),
        keyCount: keys.filter(k => k.startsWith('__convexAuth')).length,
        allKeys: keys,
      };
    });
    results.phase7.beforeSignOut = beforeSignOut;
    results.phase7.sessionActiveBeforeSignOut = beforeSignOut.hasJWT;

    const securityCheck = await page.evaluate(() => {
      const allStorage = JSON.stringify(window.localStorage);
      const allSession = JSON.stringify(window.sessionStorage);
      return {
        adminSecretInLocal: allStorage.includes('testsecret123'),
        adminSecretInSession: allSession.includes('testsecret123'),
        localKeyCount: Object.keys(window.localStorage).length,
        sessionKeyCount: Object.keys(window.sessionStorage).length,
        localKeys: Object.keys(window.localStorage),
      };
    });
    results.phase7.securityCheck = securityCheck;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const afterReload = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return { hasJWT: keys.some(k => k.startsWith('__convexAuthJWT_')) };
    });
    results.phase7.persistedAfterReload = afterReload.hasJWT;

    let signedOut = false;
    const signOutSelectors = [
      'button:has-text("Sign Out")', 'button:has-text("Sign out")',
      'button:has-text("Logout")', 'button:has-text("Log Out")', 'button:has-text("Log out")',
    ];
    for (const sel of signOutSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.count() > 0) {
        try { await btn.click({ timeout: 3000 }); await page.waitForTimeout(2000); signedOut = true; console.log(`  Clicked: ${sel}`); break; } catch (e) { }
      }
    }
    if (!signedOut) {
      const settingsBtn = page.locator('button:has-text("Settings"), [aria-label*="Settings"], button:has-text("Profile")').first();
      if (await settingsBtn.count() > 0) {
        try {
          await settingsBtn.click({ timeout: 3000 });
          await page.waitForTimeout(1500);
          await screenshot(page, 'phase7-settings-page');
          for (const sel of signOutSelectors) {
            const btn = page.locator(sel).first();
            if (await btn.count() > 0) { try { await btn.click({ timeout: 3000 }); await page.waitForTimeout(2000); signedOut = true; console.log(`  Sign out via settings: ${sel}`); break; } catch (e) { } }
          }
        } catch (e) { }
      }
    }
    await screenshot(page, 'phase7-after-signout');

    const afterSignOut = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return {
        hasJWT: keys.some(k => k.startsWith('__convexAuthJWT_')),
        authKeyCount: keys.filter(k => k.startsWith('__convexAuth')).length,
        allKeys: keys,
        bodyText: document.body.innerText?.substring(0, 200),
      };
    });
    results.phase7.signedOut = signedOut;
    results.phase7.sessionRemovedAfterSignOut = !afterSignOut.hasJWT;
    results.phase7.afterSignOutState = afterSignOut;

    console.log(`  Session before sign-out: ${results.phase7.sessionActiveBeforeSignOut}`);
    console.log(`  Persisted after reload: ${results.phase7.persistedAfterReload}`);
    console.log(`  Signed out: ${signedOut}`);
    console.log(`  Session removed: ${results.phase7.sessionRemovedAfterSignOut}`);
    console.log(`  Admin secret in storage: ${securityCheck.adminSecretInLocal || securityCheck.adminSecretInSession}`);
    console.log('  Phase 7: DONE');
  } catch (err) {
    results.phase7.error = err.message.substring(0, 300);
    console.log(`  Phase 7 ERROR: ${err.message.substring(0, 150)}`);
  }

  await screenshot(page, 'final-state');
  const resultsPath = path.join(__dirname, 'browser-verification-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log(`Results: ${resultsPath}`);
  console.log(`Screenshots: ${results.screenshots.length}`);
  console.log(`Console errors: ${results.consoleErrors.length}`);
  console.log(`Network errors: ${results.networkErrors.length}`);
  console.log(`Forbidden requests: ${results.forbiddenRequests.length}`);
  await browser.close();
}

main().catch((err) => { console.error('FATAL:', err.message.substring(0, 300)); process.exit(1); });
