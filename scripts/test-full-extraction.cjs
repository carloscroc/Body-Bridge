const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const url = 'https://www.forksoverknives.com/recipes/vegan-menus-collections/dump-and-go-recipes-minimal-effort-maximum-taste/';
  
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  
  // Wait additional time for JSON-LD to load
  await page.waitForTimeout(3000);
  
  // Save screenshot to see page state
  await page.screenshot({ path: path.join(__dirname, 'recipe-page-loaded.png') });
  console.log('Screenshot saved');
  
  // Get full page HTML for inspection
  const html = await page.content();
  fs.writeFileSync(path.join(__dirname, 'recipe-full.html'), html);
  console.log('HTML saved (', html.length, 'bytes)');
  
  // Check JSON-LD
  const jsonLdScripts = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => ({
      len: s.textContent.length,
      preview: s.textContent.substring(0, 200),
    }));
  });
  
  console.log('Found', jsonLdScripts.length, 'JSON-LD scripts');
  jsonLdScripts.forEach((s, i) => {
    console.log(`Script ${i+1}: ${s.len} chars`);
    console.log('Preview:', s.preview);
  });
  });
  
  // Try to find recipe
  const recipeFound = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        if (Array.isArray(data)) {
          for (const item of data) {
            const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
            if (types.includes('Recipe')) {
              return item;
            }
          }
        }
        if (data['@type'] && data['@type'].includes('Recipe')) return data;
      } catch {}
    }
    return null;
  });
  
  console.log('Recipe found:', !!recipeFound);
  if (recipeFound) {
    console.log('Recipe title:', recipeFound.name);
    console.log('Has ingredients:', !!recipeFound.recipeIngredient);
  }
  
  await browser.close();
}

test().catch(console.error);
