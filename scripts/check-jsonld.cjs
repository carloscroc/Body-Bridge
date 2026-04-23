const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  await p.goto('https://www.forksoverknives.com/recipes/vegan-menus-collections/dump-and-go-recipes-minimal-effort-maximum-taste/');
  
  const title = await p.title();
  console.log('Title:', title);
  
  const hasJsonLd = await p.evaluate(() => {
    return !!document.querySelector('script[type="application/ld+json"]');
  });
  
  console.log('Has JSON-LD:', hasJsonLd);
  
  await b.close();
})();
