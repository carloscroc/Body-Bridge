const { chromium } = require('playwright');
const { extractRecipe } = require('./scripts/scrapers/extractors.mjs');

const siteConfig = {
  name: 'Forks Over Knives',
  dietType: ['plant_based'],
  diseaseFocus: null,
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.forksoverknives.com/recipes/vegan-menus-collections/dump-and-go-recipes-minimal-effort-maximum-taste/';
  console.log('Testing URL:', url);
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  
  const recipe = await extractRecipe(page, url, siteConfig);
  
  console.log('Recipe extracted:', !!recipe);
  if (recipe) {
    console.log('Title:', recipe.recipe_title);
    console.log('Has ingredients:', recipe.ingredients && recipe.ingredients.length > 0);
    console.log('Has instructions:', recipe.instructions && recipe.instructions.length > 0);
  } else {
    console.log('No recipe found');
  }
  
  await browser.close();
})();
