import { test, expect } from '@playwright/test';

/**
 * MISSION 2 PART 2: PLAYWRIGHT BROWSER VERIFICATION
 * 
 * This test verifies that the production build correctly targets the
 * Convex cloud deployment at https://upbeat-chickadee-781.convex.cloud
 * and does NOT include any legacy deployment URLs.
 */

test.describe('Cloud Deployment Verification', () => {
  let networkRequests: string[] = [];
  let excludedUrls: string[] = [];
  let includedUrls: string[] = [];

  test.beforeEach(async ({ context }) => {
    // Reset tracking arrays
    networkRequests = [];
    excludedUrls = [];
    includedUrls = [];
    
    // Capture network traffic
    context.on('request', (request) => {
      const url = request.url();
      networkRequests.push(url);
      
      // Check for excluded URLs
      if (url.includes('groovy-pig-414') || 
          url.includes('127.0.0.1:3210') || 
          url.includes('10.0.0.112:3210')) {
        excludedUrls.push(url);
      }
      
      // Check for target Convex deployment
      if (url.includes('upbeat-chickadee-781')) {
        includedUrls.push(url);
      }
    });
  });

  test('verify cloud deployment targets correct Convex URL', async ({ page }) => {
    // Navigate to local development server
    await page.goto('http://127.0.0.1:7770');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Allow some time for API calls
    await page.waitForTimeout(3000);
    
    // Log all network requests for debugging
    console.log('Total network requests:', networkRequests.length);
    console.log('First 10 requests:', networkRequests.slice(0, 10));
    
    // CRITICAL VERIFICATION: No excluded URLs
    expect(excludedUrls.length).toBe(0);
    
    // CRITICAL VERIFICATION: Must include target Convex URL
    expect(includedUrls.length).toBeGreaterThan(0);
    
    // Verify specific Convex deployment URL
    const convexUrls = includedUrls.filter(url => 
      url.includes('https://upbeat-chickadee-781.convex.cloud')
    );
    expect(convexUrls.length).toBeGreaterThan(0);
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: 'screenshots/landing-cloud-verify.png',
      fullPage: true
    });
  });

  test('verify exercise library renders and targets correct deployment', async ({ page }) => {
    // Start at home
    await page.goto('http://127.0.0.1:7770');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercises library
    await page.click('text=Library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verify library loaded
    const libraryTitle = page.locator('text=Movements');
    await expect(libraryTitle).toBeVisible({ timeout: 10000 });
    
    // Verify network requests still target correct deployment
    expect(excludedUrls.length).toBe(0);
    expect(includedUrls.length).toBeGreaterThan(0);
    
    // Take screenshot of exercise library
    await page.screenshot({ 
      path: 'screenshots/library-cloud-verify.png',
      fullPage: true
    });
  });

  test('verify exercise detail modal and network targeting', async ({ page }) => {
    // Navigate to exercises library
    await page.goto('http://127.0.0.1:7770');
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Library');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Wait for exercises to load
    await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 10000 });
    
    // Click on the first exercise card
    const firstExercise = page.locator('[data-testid="exercise-card"]').first();
    await firstExercise.click();
    
    // Wait for modal to appear
    await page.waitForSelector('text=Add to Workout', { timeout: 5000 });
    await page.waitForTimeout(2000);
    
    // Verify no excluded URLs
    expect(excludedUrls.length).toBe(0);
    
    // Verify correct deployment targeting
    expect(includedUrls.length).toBeGreaterThan(0);
    
    // Take screenshot of exercise detail modal
    await page.screenshot({ 
      path: 'screenshots/modal-cloud-verify.png',
      fullPage: true
    });
  });

  test('comprehensive network verification', async ({ page }) => {
    // Full user flow
    await page.goto('http://127.0.0.1:7770');
    await page.waitForLoadState('networkidle');
    
    // Navigate through major sections
    await page.click('text=Library');
    await page.waitForTimeout(2000);
    
    await page.click('text=Workouts');
    await page.waitForTimeout(2000);
    
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    
    // Final verification
    expect(excludedUrls.length).toBe(0);
    expect(includedUrls.length).toBeGreaterThan(0);
    
    // Ensure no legacy deployment URLs exist in entire session
    const allUrls = networkRequests.join(' ');
    expect(allUrls).not.toContain('groovy-pig-414');
    expect(allUrls).not.toContain('127.0.0.1:3210');
    expect(allUrls).not.toContain('10.0.0.112:3210');
    
    // Ensure target URL is present
    expect(allUrls).toContain('upbeat-chickadee-781');
  });
});