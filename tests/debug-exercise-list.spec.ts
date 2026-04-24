import { test } from '@playwright/test';

test('debug exercise list', async ({ page }) => {
  await page.goto('http://localhost:7770/');
  await page.getByText('START TRAINING').click();
  await page.waitForTimeout(2000);
  
  // Click Exercises Tab
  const exercisesTab = page.locator('button:has(svg), button:has-text("EXERCISES")').nth(1); 
  await exercisesTab.click();
  await page.waitForTimeout(2000);
  
  const names = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3, h2, h4, span, p')).map(el => el.textContent?.trim()).filter(Boolean);
  });
  
  console.log('VISIBLE TEXT ELEMENTS:');
  console.log(JSON.stringify(names, null, 2));
  
  await page.screenshot({ path: 'screenshots/debug-exercise-list.png' });
});
