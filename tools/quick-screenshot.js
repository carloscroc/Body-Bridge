import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const url = process.argv[2] || process.env.URL || 'http://127.0.0.1:4173/?forceSettings=1';
  console.log('Opening', url);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    console.log('Status:', res && res.status());
    await page.waitForTimeout(2000);
    await fs.promises.mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: 'artifacts/quick-screenshot.png', fullPage: true });
    const body = await page.content();
    await fs.promises.writeFile('artifacts/page-content.html', body);
    console.log('Saved artifacts/quick-screenshot.png and page-content.html');
  } catch (err) {
    console.error('Error capturing page:', err);
  } finally {
    await browser.close();
  }
})();
