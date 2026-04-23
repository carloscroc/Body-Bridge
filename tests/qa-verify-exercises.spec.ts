import { test, expect } from '@playwright/test';

test('verify exercises are visible', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:7770');
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot of the home page
  await page.screenshot({ path: '.gstack/qa-reports/screenshots/home-page.png' });
  
  // Try to find exercise-related text or elements
  const exerciseNames = ["Barbell Squat", "Dumbbell Press", "Deadlift"];
  
  let foundAny = false;
  for (const name of exerciseNames) {
    const isVisible = await page.getByText(name, { exact: false }).isVisible();
    if (isVisible) {
      console.log(`Found exercise: ${name}`);
      foundAny = true;
    }
  }
  
  if (!foundAny) {
    console.log("No exercises found on the landing page. Searching for 'Exercise' link or button...");
    const exerciseLink = page.getByRole('link', { name: /exercise/i }).or(page.getByRole('button', { name: /exercise/i }));
    if (await exerciseLink.isVisible()) {
      await exerciseLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '.gstack/qa-reports/screenshots/exercise-page.png' });
      console.log("Navigated to exercise page");
    }
  }
  
  // Take another screenshot after potential navigation
  await page.screenshot({ path: '.gstack/qa-reports/screenshots/final-state.png' });
});
