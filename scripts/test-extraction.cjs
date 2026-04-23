const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.forksoverknives.com/recipes/simple-vegan-stir-fry/', { waitUntil: 'networkidle' });
  
  // Get page content
  const content = await page.content();
  
  // Write to file for inspection
  const outputFile = path.join(__dirname, 'test-page.html');
  fs.writeFileSync(outputFile, content);
  console.log('Page saved to:', outputFile);
  
  // Try to find any recipe data
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for JSON-LD
  const jsonLdData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        let data = JSON.parse(s.textContent);
        if (Array.isArray(data)) {
          for (const item of data) {
            const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
            if (types.includes('Recipe')) return item;
          }
        }
        if (item['@type'] && item['@type'].includes('Recipe')) return item;
      } catch {}
    }
    return null;
  });
  
  console.log('JSON-LD found:', !!jsonLdData);
  if (jsonLdData) {
    console.log('Recipe title:', jsonLdData.name);
    console.log('Description:', jsonLdData.description?.substring(0, 100));
  }
  
  await browser.close();
}

test().catch(console.error);
