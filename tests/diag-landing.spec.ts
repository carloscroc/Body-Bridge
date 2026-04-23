import { test, expect } from '@playwright/test';

test('diagnose landing page', async ({ page }) => {
  await page.goto('http://127.0.0.1:7770');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'artifacts/diag-landing.png' });
  
  // Print all button text
  const buttons = await page.locator('button').allInnerTexts();
  console.log('Buttons on page:', buttons.join(', '));
  
  // Print all links
  const links = await page.locator('a').allInnerTexts();
  console.log('Links on page:', links.join(', '));
  
  // Check for "Library" specifically
  const libraryText = await page.getByText(/Library/i).count();
  console.log('Occurrences of "Library":', libraryText);
});
