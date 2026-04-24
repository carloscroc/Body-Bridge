import { test } from '@playwright/test';

test('inspect landing page', async ({ page }) => {
  await page.goto('http://localhost:7770/');
  await page.waitForLoadState('networkidle');
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(el => ({
      tag: el.tagName,
      text: (el as HTMLElement).innerText || (el as HTMLElement).getAttribute('aria-label') || '',
      id: el.id,
      classes: el.className
    }));
  });
  
  console.log('INTERACTIVE ELEMENTS:');
  console.log(JSON.stringify(buttons, null, 2));
  
  await page.screenshot({ path: 'screenshots/debug-landing.png' });
});
