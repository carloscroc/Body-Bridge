#!/usr/bin/env node

/**
 * Screenshot generator for Body Bridge Fitness app
 * Uses Playwright to capture screenshots for Google Play Store
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Device configurations for Play Store screenshots
const devices = [
    {
        name: 'Pixel 7',
        viewport: { width: 412, height: 915 },
        path: 'pixel-7',
        description: 'Phone screenshot - Pixel 7'
    },
    {
        name: 'Samsung Galaxy S21',
        viewport: { width: 360, height: 800 },
        path: 'samsung-s21',
        description: 'Phone screenshot - Samsung Galaxy'
    },
    {
        name: 'Nexus 6',
        viewport: { width: 412, height: 915 },
        path: 'nexus-6',
        description: 'Phone screenshot - Nexus 6'
    }
];

// Screenshots to capture
const screenshots = [
    { route: '/', name: 'home', description: 'Home screen showing workout overview' },
    { route: '/workouts', name: 'workouts', description: 'Workout list and categories' },
    { route: '/calendar', name: 'calendar', description: 'Calendar view with scheduled workouts' },
    { route: '/profile', name: 'profile', description: 'User profile and settings' },
    { route: '/stats', name: 'stats', description: 'Progress statistics and analytics' }
];

async function generateScreenshots() {
    const outputDir = path.join(process.cwd(), 'play-store-screenshots');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📸 Generating Play Store screenshots...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        for (const device of devices) {
            console.log(`📱 Generating screenshots for ${device.name}...`);
            
            const page = await context.newPage();
            await page.setViewportSize(device.viewport);

            // Create device-specific directory
            const deviceDir = path.join(outputDir, device.path);
            if (!fs.existsSync(deviceDir)) {
                fs.mkdirSync(deviceDir, { recursive: true });
            }

            for (const screenshot of screenshots) {
                try {
                    // Navigate to the route
                    await page.goto(`http://localhost:5173${screenshot.route}`, {
                        waitUntil: 'networkidle',
                        timeout: 10000
                    });

                    // Wait for page to fully load
                    await page.waitForTimeout(2000);

                    // Take screenshot
                    const filename = `screenshot-${screenshot.name}.png`;
                    const filepath = path.join(deviceDir, filename);
                    
                    await page.screenshot({
                        path: filepath,
                        fullPage: false
                    });

                    console.log(`  ✅ ${screenshot.name}: ${screenshot.description}`);
                } catch (error) {
                    console.log(`  ❌ ${screenshot.name}: Failed - ${error.message}`);
                }
            }

            await page.close();
        }

        console.log('\n✅ All screenshots generated successfully!');
        console.log(`📂 Output directory: ${outputDir}`);
        console.log('\n📝 Next steps:');
        console.log('1. Review the screenshots');
        console.log('2. Select 2-8 best screenshots per device');
        console.log('3. Upload to Google Play Console');
        console.log('4. Make sure screenshots match current UI');

    } catch (error) {
        console.error('❌ Error generating screenshots:', error);
    } finally {
        await browser.close();
    }
}

// Check if dev server is running
async function checkDevServer() {
    try {
        const response = await fetch('http://localhost:5173');
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Main execution
(async () => {
    console.log('🔍 Checking if dev server is running...');
    const isRunning = await checkDevServer();
    
    if (!isRunning) {
        console.error('❌ Dev server is not running!');
        console.error('Please start the dev server first: npm run dev');
        process.exit(1);
    }

    console.log('✅ Dev server is running\n');
    await generateScreenshots();
})();