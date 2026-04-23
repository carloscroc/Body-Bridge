import { test, expect } from '@playwright/test';

test.describe('Video Player Fix Verification', () => {
  test('ensure video loading veil eventually disappears', async ({ page }) => {
    await page.goto('http://127.0.0.1:7770');
    await page.waitForLoadState('networkidle');
    
    // Force dev mode for exercises to skip nav
    // We already committed a change to App.tsx once but reverted it.
    // Let's just navigate normally.
    
    console.log('Navigating to library...');
    await page.getByRole('button', { name: /library/i }).first().click().catch(() => {});
    await page.getByText(/library/i).first().click().catch(() => {});
    
    await page.waitForTimeout(2000);
    
    console.log('Selecting exercise...');
    await page.locator('button.press-scale').first().click();
    
    await page.waitForTimeout(1000);
    
    console.log('Clicking Watch Demo...');
    await page.getByRole('button', { name: /watch demo/i }).click();
    
    const loadingVeil = page.getByText('Loading demo');
    console.log('Waiting for Loading demo veil to disappear...');
    
    // We expect it to disappear within 30s for a full verification
    await expect(loadingVeil).not.toBeVisible({ timeout: 30000 });
    
    console.log('SUCCESS: Loading veil disappeared.');
    await page.screenshot({ path: 'artifacts/video-verification-success.png' });
  });
});
