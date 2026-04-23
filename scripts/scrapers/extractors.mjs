/**
 * Site-specific recipe extractors.
 *
 * Each extractor receives the Playwright `page` object (fully loaded),
 * the canonical recipe `url`, and a `siteConfig` object.
 * It must return a normalised recipe object matching the Convex schema,
 * or `null` if the page is not a valid recipe.
 *
 * The default extractor uses JSON-LD structured data (schema.org/Recipe)
 * which most modern recipe sites embed.  Site-specific extractors override
 * when the site's JSON-LD is incomplete or missing.
 */

// ─── helpers ───────────────────────────────────────────────────────

function firstOf(v) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function textOf(v) {
  if (!v) return null;
  if (typeof v === 'string') return v.trim();
  if (v.text) return v.text.trim();
  if (Array.isArray(v)) return v.map(textOf).filter(Boolean).join(' ');
  return String(v).trim();
}

function parseDuration(iso) {
  if (!iso) return null;
  const m = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = parseInt(m[1]) || 0;
  const min = parseInt(m[2]) || 0;
  if (h && min) return `${h}h ${min}m`;
  if (h) return `${h} hour${h > 1 ? 's' : ''}`;
  if (min) return `${min} min`;
  return iso;
}

function parseYield(y) {
  if (!y) return null;
  const m = String(y).match(/(\d+)/);
  return m ? m[1] : String(y);
}

function parseNutrition(n) {
  if (!n) return null;
  const g = (k) => {
    const v = n[k];
    if (v == null) return null;
    const m = String(v).match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  };
  const result = {};
  const map = {
    calories: 'calories',
    proteinContent: 'protein',
    carbohydrateContent: 'carbs',
    fatContent: 'fat',
    fiberContent: 'fiber',
    sodiumContent: 'sodium',
    sugarContent: 'sugar',
  };
  for (const [ldKey, ourKey] of Object.entries(map)) {
    const val = g(ldKey);
    if (val !== null) result[ourKey] = val;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function imageUrl(img) {
  if (!img) return null;
  if (typeof img === 'string') return img;
  if (img.url) return img.url;
  if (Array.isArray(img)) {
    const i = img[0];
    return typeof i === 'string' ? i : i?.url || null;
  }
  return null;
}

function ingredientsFromLd(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((raw) => {
    const s = typeof raw === 'string' ? raw : String(raw);
    // try "2 cups flour" → {amount, unit, name}
    const m = s.match(/^([\d./\s–-]+)\s*(?:\(([^)]*)\)\s*)?([a-zA-Z]+)?\s*(.*)/);
    if (m && m[1].trim().length > 0) {
      return {
        amount: m[1].trim(),
        unit: m[3] || '',
        name: (m[4] || s).trim() || s,
        raw: s,
      };
    }
    return { name: s, raw: s };
  });
}

function instructionsFromLd(arr) {
  if (!arr) return [];
  if (typeof arr === 'string') return [arr];
  return (Array.isArray(arr) ? arr : []).map((s) => textOf(s)).filter(Boolean);
}

function extractTags(ld, siteConfig) {
  const tags = new Set(['healthy']);
  if (ld.keywords) {
    const kw = typeof ld.keywords === 'string' ? ld.keywords.split(',') : ld.keywords;
    for (const k of kw) {
      const t = String(k).trim().toLowerCase().replace(/\s+/g, '-');
      if (t) tags.add(t);
    }
  }
  if (ld.recipeCategory) tags.add(String(ld.recipeCategory).toLowerCase());
  if (ld.recipeCuisine) tags.add(String(ld.recipeCuisine).toLowerCase());
  if (siteConfig.diseaseFocus) tags.add(siteConfig.diseaseFocus.replace(/_/g, '-'));
  return [...tags].slice(0, 15);
}

// ─── JSON-LD default extractor ────────────────────────────────────

async function extractJsonLdRecipe(page) {
  return page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        let data = JSON.parse(s.textContent);
        if (Array.isArray(data)) {
          for (const item of data) {
            const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
            if (types.includes('Recipe')) { data = item; break; }
            if (item['@graph']) {
              const r = item['@graph'].find((g) => {
                const t = Array.isArray(g['@type']) ? g['@type'] : [g['@type']];
                return t.includes('Recipe');
              });
              if (r) { data = r; break; }
            }
          }
        }
        if (data['@graph']) {
          const r = data['@graph'].find((g) => {
            const t = Array.isArray(g['@type']) ? g['@type'] : [g['@type']];
            return t.includes('Recipe');
          });
          if (r) data = r;
        }
        const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
        if (types.includes('Recipe')) return data;
      } catch { /* skip */ }
    }
    return null;
  });
}

function ldToRecipe(ld, url, siteConfig) {
  return {
    source_site: siteConfig.name,
    source_url: url,
    recipe_title: ld.name || 'Untitled Recipe',
    short_description: ld.description || null,
    category: Array.isArray(ld.recipeCategory) ? ld.recipeCategory[0] : (ld.recipeCategory || null),
    tags: extractTags(ld, siteConfig),
    ingredients: ingredientsFromLd(ld.recipeIngredient),
    instructions: instructionsFromLd(ld.recipeInstructions),
    prep_time: parseDuration(ld.prepTime),
    cook_time: parseDuration(ld.cookTime),
    total_time: parseDuration(ld.totalTime),
    servings: parseYield(firstOf([ld.recipeYield].flat())),
    nutrition_info: parseNutrition(ld.nutrition),
    diet_type: siteConfig.dietType,
    disease_focus: siteConfig.diseaseFocus,
    image_url: imageUrl(ld.image),
  };
}

// ─── DOM fallback extractor ───────────────────────────────────────

async function extractFromDom(page, url, siteConfig) {
  return page.evaluate(() => {
    const sel = (s) => document.querySelector(s)?.textContent?.trim() || null;
    const selAll = (s) => [...document.querySelectorAll(s)].map((e) => e.textContent.trim()).filter(Boolean);

    const title = sel('h1') || sel('[itemprop="name"]') || document.title;
    const description = sel('[itemprop="description"]') || document.querySelector('meta[name="description"]')?.content;

    const ingredients =
      selAll('[itemprop="recipeIngredient"]') ||
      selAll('.recipe-ingredients li, .ingredients li, [class*="ingredient"] li');
    const instructions =
      selAll('[itemprop="recipeInstructions"] li, [itemprop="recipeInstructions"] p') ||
      selAll('.recipe-instructions li, .instructions li, [class*="step"] li, [class*="direction"] li');

    const img = document.querySelector('[itemprop="image"]')?.src
      || document.querySelector('meta[property="og:image"]')?.content
      || null;

    const servings = sel('[itemprop="recipeYield"]') || sel('[class*="yield"]');
    const prepTime = sel('[itemprop="prepTime"]') || sel('[class*="prep-time"]');
    const cookTime = sel('[itemprop="cookTime"]') || sel('[class*="cook-time"]');
    const totalTime = sel('[itemprop="totalTime"]') || sel('[class*="total-time"]');

    return {
      title, description, ingredients, instructions,
      image: img, servings, prepTime, cookTime, totalTime,
    };
  });
}

function domToRecipe(dom, url, siteConfig) {
  return {
    source_site: siteConfig.name,
    source_url: url,
    recipe_title: dom.title || 'Untitled Recipe',
    short_description: dom.description || null,
    category: null,
    tags: ['healthy'],
    ingredients: dom.ingredients.map((raw) => ({ name: raw, raw })),
    instructions: dom.instructions,
    prep_time: dom.prepTime,
    cook_time: dom.cookTime,
    total_time: dom.totalTime,
    servings: dom.servings || null,
    nutrition_info: null,
    diet_type: siteConfig.dietType,
    disease_focus: siteConfig.diseaseFocus,
    image_url: dom.image || null,
  };
}

async function extractKidneyRecipe(page, url, siteConfig) {
  const data = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const title = document.querySelector('h1')?.textContent?.trim() || document.title;
    const description = [...document.querySelectorAll('p')]
      .map((p) => p.textContent?.trim())
      .find((p) => p && !p.startsWith('Appropriate for:') && !p.startsWith('Diet preference:')) || null;
    const ingredientNodes = [
      ...document.querySelectorAll('.field--name-field-recipe-ingredients .field__item'),
      ...document.querySelectorAll('[class*=ingredient] li'),
    ];
    const ingredients = ingredientNodes.map((n) => n.textContent?.trim()).filter(Boolean);

    const dirIndex = lines.indexOf('Directions');
    const nutritionIndex = lines.indexOf('Nutritional Information');
    const directions = dirIndex >= 0
      ? lines.slice(dirIndex + 1, nutritionIndex >= 0 ? nutritionIndex : undefined)
      : [];

    const timing = directions[0]?.startsWith('Prep: ') ? directions.shift() : null;
    const servingsIndex = lines.indexOf('Yield');
    const servings = servingsIndex >= 0 ? lines[servingsIndex + 1] : null;
    const image = document.querySelector('img[src*="/styles/"]')?.src
      || document.querySelector('meta[property="og:image"]')?.content
      || null;

    return { title, description, ingredients, directions, timing, servings, image };
  });

  if (!data.title || !data.ingredients.length) return null;

  const prep = data.timing?.match(/Prep:\s*([^,]+)/i)?.[1]?.trim() || null;
  const cook = data.timing?.match(/Cook:\s*([^,]+)/i)?.[1]?.trim() || null;
  const total = data.timing?.match(/Total:\s*([^,]+)/i)?.[1]?.trim() || null;

  return stripNulls({
    source_site: siteConfig.name,
    source_url: url,
    recipe_title: data.title,
    short_description: data.description,
    tags: ['healthy', 'kidney-disease'],
    ingredients: data.ingredients.map((raw) => ({ name: raw, raw })),
    instructions: data.directions,
    prep_time: prep,
    cook_time: cook,
    total_time: total,
    servings: data.servings,
    diet_type: siteConfig.dietType,
    disease_focus: siteConfig.diseaseFocus,
    image_url: data.image,
  });
}

// ─── public API ───────────────────────────────────────────────────

/**
 * Remove top-level keys whose value is `null`.
 * Convex v.optional() means the key may be absent but NOT set to null.
 */
function stripNulls(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null) out[k] = v;
  }
  return out;
}

/**
 * Extract a recipe from a fully-loaded Playwright page.
 * Tries JSON-LD first, then falls back to DOM scraping.
 */
export async function extractRecipe(page, url, siteConfig) {
  if (url.includes('kidney.org/nutrition/recipes/')) {
    try {
      const kidneyRecipe = await extractKidneyRecipe(page, url, siteConfig);
      if (kidneyRecipe) return kidneyRecipe;
    } catch { /* fall through */ }
  }

  // 1. Try JSON-LD
  try {
    const ld = await extractJsonLdRecipe(page);
    if (ld && ld.name) return stripNulls(ldToRecipe(ld, url, siteConfig));
  } catch { /* fall through */ }

  // 2. DOM fallback
  try {
    const dom = await extractFromDom(page, url, siteConfig);
    if (dom.ingredients.length > 0 || dom.instructions.length > 0) {
      return stripNulls(domToRecipe(dom, url, siteConfig));
    }
  } catch { /* nothing */ }

  return null;
}
