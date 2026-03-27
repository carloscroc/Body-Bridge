const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    logs.push({ type: 'console', text: msg.text(), location: msg.location() });
  });
  page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: String(err) }));

  const network = [];
  page.on('request', (req) => network.push({ type: 'request', url: req.url(), method: req.method(), postData: req.postData() }));
  page.on('response', async (res) => {
    let body = null;
    try { body = await res.text(); } catch (e) {}
    network.push({ type: 'response', url: res.url(), status: res.status(), body });
  });

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:7770', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for auth landing buttons
    await page.waitForSelector('text=Start Training', { timeout: 15000 });
    console.log('Click Start Training');
    await page.click('text=Start Training');

    // Wait for signup form
    await page.waitForSelector('input[placeholder="FULL NAME"]', { timeout: 10000 });
    await page.fill('input[placeholder="FULL NAME"]', 'Playwright Test');
    await page.fill('input[placeholder="EMAIL ADDRESS"]', 'pwtest+' + Date.now() + '@example.com');
    await page.fill('input[placeholder="SECURE PASSWORD"]', 'TestPass123!');

    // Submit
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth') || r.url().includes('convex') , { timeout: 20000 }).catch(() => null),
      page.click('button:has-text("Create Profile")'),
    ]);

    // Wait a bit for any redirects
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({ path: 'auto_auth_result.png', fullPage: true });

    fs.writeFileSync('auto_auth_logs.json', JSON.stringify({ logs, network }, null, 2));
    console.log('Saved auto_auth_result.png and auto_auth_logs.json');
  } catch (err) {
    console.error('Error during automated auth test:', err);
    fs.writeFileSync('auto_auth_error.txt', String(err));
  } finally {
    await browser.close();
  }
})();
