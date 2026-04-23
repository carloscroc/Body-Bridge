const { chromium } = require('playwright');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false }); // Not headless to see what happens
  const page = await browser.newPage();
  
  console.log('Navigating to forksoverknives recipes list...');
  await page.goto('https://www.forksoverknives.com/recipes/', { waitUntil: 'networkidle', timeout: 10000 });
  await page.screenshot({ path: 'recipes-list.png' });
  
  console.log('Page title:', await page.title());
  
  // Get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/recipes/"]')).map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim().substring(0, 50),
    }));
  });
  
  console.log('Found', links.length, 'recipe links');
  links.forEach((l, i) => console.log(`Link ${i+1}: ${l.text} - ${l.href}`));
  
  // Click first recipe link
  if (links.length > 0) {
    console.log('Clicking on first recipe link...');
    await page.goto(links[0].href);
    await page.screenshot({ path: 'recipe-page.png' });
      return results;
    });
    
    console.log('Found', scripts.length, 'JSON-LD script tags');
    scripts.forEach((s, i) => console.log(`Script ${i+1}:`, s));
    
    // Try to find recipe in scripts
    const recipeData = await page.evaluate(() => {
      const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
      for (const s of scriptTags) {
        try {
          const data = JSON.parse(s.textContent);
          if (Array.isArray(data)) {
            for (const item of data) {
              const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
              if (types.includes('Recipe')) return item;
            }
          }
          if (data['@type'] && data['@type'].includes('Recipe')) return data;
          if (data['@graph']) {
            const r = data['@graph'].find((g) => {
              const t = Array.isArray(g['@type']) ? g['@type'] : [g['@type']];
              return t.includes('Recipe');
            });
            if (r) return r;
          }
        } catch {}
      }
      return null;
    });
    
    console.log('Recipe data:', JSON.stringify(recipeData, null, 2));
  }
  
  await browser.close();
}

test().catch(console.error);
