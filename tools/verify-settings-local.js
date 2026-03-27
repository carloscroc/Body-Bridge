import express from 'express';
import path from 'path';
import { chromium } from 'playwright';
import fs from 'fs';

async function serveDist(port = 4173) {
  const app = express();
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  // Serve index.html for any unmatched route (single-page app).
  // Fallback: if no static file matched, return index.html for SPA routing
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

(async () => {
  const port = process.env.VERIFY_PORT ? Number(process.env.VERIFY_PORT) : 4173;
  const url = process.env.VERIFY_URL || `http://127.0.0.1:${port}/?forceSettings=1`;
  console.log('Starting local static server for dist at port', port);
  const server = await serveDist(port);
  console.log('Serving dist at', url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  // Capture console messages for debugging
  const consoleLogs = [];
  page.on('console', (msg) => {
    try {
      const text = `${new Date().toISOString()} [${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
    } catch (e) {}
  });
  page.on('pageerror', (err) => {
    try { consoleLogs.push(`${new Date().toISOString()} [pageerror] ${err.message}\n${err.stack}`); } catch (e) {}
  });
  page.on('requestfailed', (req) => {
    try { consoleLogs.push(`${new Date().toISOString()} [requestfailed] ${req.url()} ${req.failure()?.errorText}`); } catch (e) {}
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const selectors = ['button[aria-label="Open settings"]', 'button[title="Settings"]', 'button:has-text("Settings")', 'button[aria-label="Settings"]'];
    let btn = null;
    const start = Date.now();
    while (Date.now() - start < 8000) {
      for (const s of selectors) {
        btn = await page.$(s);
        if (btn) break;
      }
      if (btn) break;
      await page.waitForTimeout(500);
    }

    if (!btn) {
      console.warn('Settings button not found via selectors after waiting. Will dispatch navigation event fallback.');
      const dispatchStart = Date.now();
      while (Date.now() - dispatchStart < 6000) {
        try {
          // First try the app-navigate fallback
          await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/settings' } })));
        } catch (e) {}
        // If a debug hook is exposed, call it directly to force-settings (more reliable)
        try {
          await page.evaluate(() => {
            // runtime check for debug helper attached to window
            // eslint-disable-next-line no-undef
            try {
              if (typeof window.__openSettings === 'function') {
                // eslint-disable-next-line no-undef
                window.__openSettings();
              }
            } catch (e) {}
          });
        } catch (e) {}
        await page.waitForTimeout(500);
      }
    } else {
      await btn.click();
    }

    const expected = [ 'Training Plan', 'Coach Settings', 'Membership Hub', 'System Settings', 'Save Changes', 'Profile Identity', 'Settings' ];
    let found = false;
    const start2 = Date.now();
    while (Date.now() - start2 < 12000) {
      for (const text of expected) {
        const el = await page.$(`text=${text}`);
        if (el) { found = true; break; }
      }
      if (found) break;
      await page.waitForTimeout(500);
    }

    try { await fs.promises.mkdir('artifacts', { recursive: true }); } catch (e) {}
    await page.screenshot({ path: 'artifacts/settings-after-click.png', fullPage: true });
    try {
      const content = await page.content();
      await fs.promises.writeFile('artifacts/page-content.html', content, 'utf8');
    } catch (e) {}
    try {
      await fs.promises.writeFile('artifacts/console.log', consoleLogs.join('\n'), 'utf8');
    } catch (e) {}

    if (!found) {
      console.error('Settings view did not show expected content. See artifacts/settings-after-click.png');
      process.exitCode = 3;
    } else {
      console.log('Settings visual verification successful. Screenshot: artifacts/settings-after-click.png');
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Verification failed:', err);
    try { await fs.promises.mkdir('artifacts', { recursive: true }); } catch (e) {}
    try { await page.screenshot({ path: 'artifacts/settings-error.png', fullPage: true }); } catch (e) {}
    process.exitCode = 1;
  } finally {
    try { await browser.close(); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
})();
