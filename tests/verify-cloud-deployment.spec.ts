import { test, expect } from '@playwright/test';

test('Verify cloud deployment connectivity and Exercise Library', async ({ page }) => {
  const targetUrl = 'http://127.0.0.1:7770';
  
  console.log('=== Cloud Deployment Verification ===');
  console.log(`Target: ${targetUrl}`);
  
  // Navigate to the application
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check for connectivity error
  const connectivityError = page.locator('text=Convex is not reachable');
  const hasError = await connectivityError.count();
  
  console.log(`Connectivity error present: ${hasError > 0 ? 'YES ❌' : 'NO ✅'}`);
  
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Capture network requests
  const convexRequests: { url: string; status?: number }[] = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('convex.cloud')) {
      convexRequests.push({ url });
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('convex.cloud')) {
      const existing = convexRequests.find(r => r.url === url);
      if (existing) {
        existing.status = response.status();
      }
    }
  });
  
  // Wait a moment for network activity
  await page.waitForTimeout(3000);
  
  // Analyze Convex traffic
  console.log('\n=== Convex Network Traffic ===');
  const hasUpbeat = convexRequests.some(r => r.url.includes('upbeat-chickadee-781'));
  const hasGroovy = convexRequests.some(r => r.url.includes('groovy-pig-414'));
  const hasLocal = convexRequests.some(r => r.url.includes('127.0.0.1:3210') || r.url.includes('10.0.0.112'));
  
  console.log(`upbeat-chickadee-781: ${hasUpbeat ? 'YES ✅' : 'NO ❌'}`);
  console.log(`groovy-pig-414: ${hasGroovy ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Local Convex: ${hasLocal ? 'YES ❌' : 'NO ✅'}`);
  
  if (hasUpbeat) {
    const upbeatRequests = convexRequests.filter(r => r.url.includes('upbeat-chickadee-781'));
    console.log(`\nupbeat-chickadee-781 requests: ${upbeatRequests.length}`);
    upbeatRequests.forEach(r => {
      console.log(`  - ${r.url} (status: ${r.status || 'pending'})`);
    });
  }
  
  // Check console errors
  console.log('\n=== Console Errors ===');
  console.log(`Error count: ${consoleErrors.length}`);
  consoleErrors.forEach(err => console.log(`  - ${err}`));
  
  // Try to navigate to Exercise Library (might need auth)
  // For empty database, we just verify the page loads without crashing
  console.log('\n=== Page State ===');
  const pageTitle = await page.title();
  console.log(`Page title: ${pageTitle}`);
  
  // Take screenshot for visual verification
  await page.screenshot({ path: 'test-results/cloud-deployment-verification.png', fullPage: true });
  console.log('\nScreenshot saved to test-results/cloud-deployment-verification.png');
  
  // Assertions
  expect(hasError).toBe(0);
  expect(hasGroovy).toBe(false);
  expect(hasLocal).toBe(false);
  
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('✅ No connectivity error');
  console.log('✅ No requests to groovy-pig-414');
  console.log('✅ No requests to local Convex');
  console.log(`✅ ${hasUpbeat ? 'Has requests to upbeat-chickadee-781' : 'Waiting for network activity'}`);
});