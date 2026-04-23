const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  await p.goto('https://www.forksoverknives.com/recipes/vegan-menus-collections/dump-and-go-recipes-minimal-effort-maximum-taste/');
  
  const hasJsonLd = await p.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"]');
    return !!script;
  });
  
  console.log('Has JSON-LD:', hasJsonLd);
  
  if (hasJsonLd) {
    const firstScript = await p.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      return script ? script.textContent.substring(0, 100) : null;
    });
    console.log('First 100 chars of JSON-LD:', firstScript);
  }
  
  await b.close();
})();
