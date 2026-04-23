const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  await p.goto('https://www.forksoverknives.com/recipes/');
  
  const links = await p.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors
      .filter(a => {
        const text = a.textContent.trim();
        return text.length > 0 && text.length < 80 && text.toLowerCase().includes('recipe');
      })
      .map(a => ({
        text: a.textContent.trim().substring(0, 50),
        href: a.href,
      }))
      .slice(0, 5);
  });
  
  console.log('Found', links.length, 'recipe links:');
  links.forEach(l => console.log('-', l.text, l.href));
  
  await b.close();
})();
