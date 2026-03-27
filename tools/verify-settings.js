import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  // Allow overriding the target URL via env VERIFY_URL or the first CLI arg.
  const url = process.env.VERIFY_URL || process.argv[2] || 'http://127.0.0.1:4173/';
  console.log('Verifying settings at', url);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for app to hydrate and attempt to show header. Retry for up to 8s.
    const selectors = ['button[aria-label="Open settings"]', 'button[title="Settings"]', 'button:has-text("Settings")', 'button[aria-label="Settings"]'];
    let btn = null;
    const start = Date.now();
    while (Date.now() - start < 8000) {
      for (const s of selectors) {
        btn = await page.$(s);
        if (btn) {
          console.log('Found settings button via selector:', s);
          break;
        }
      }
      if (btn) break;
      await page.waitForTimeout(500);
    }

    if (!btn) {
      console.warn('Settings button not found via selectors after waiting. Will repeatedly dispatch navigation event to /settings as fallback.');
      // Repeatedly dispatch app-navigate for up to 6s to ensure listener receives it after mount
      const dispatchStart = Date.now();
      while (Date.now() - dispatchStart < 6000) {
        try {
          await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/settings' } })));
        } catch (e) {}
        await page.waitForTimeout(500);
      }
    } else {
      await btn.click();
    }

    // Wait for Settings view to appear. Look for known landmarks
    const expected = [ 'Training Plan', 'Coach Settings', 'Membership Hub', 'System Settings', 'Save Changes', 'Profile Identity', 'Settings' ];
    let found = false;
    const start2 = Date.now();
    while (Date.now() - start2 < 8000) {
      for (const text of expected) {
        const el = await page.$(`text=${text}`);
        if (el) {
          console.log('Found settings landmark text:', text);
          found = true;
          break;
        }
      }
      if (found) break;
      await page.waitForTimeout(500);
    }

    try { await fs.promises.mkdir('artifacts', { recursive: true }); } catch (e) {}
    await page.screenshot({ path: 'artifacts/settings-after-click.png', fullPage: true });

    if (!found) {
      console.error('Settings view did not show expected content. See artifacts/settings-after-click.png');
      process.exitCode = 3;
    } else {
      console.log('Settings visual verification successful. Screenshot: artifacts/settings-after-click.png');
      process.exitCode = 0;
    }
    await browser.close();
  } catch (err) {
    console.error('Verification failed:', err);
    try { await fs.promises.mkdir('artifacts', { recursive: true }); } catch (e) {}
    try { await page.screenshot({ path: 'artifacts/settings-error.png', fullPage: true }); } catch (e) {}
    await browser.close();
    process.exitCode = 1;
  }
})();
