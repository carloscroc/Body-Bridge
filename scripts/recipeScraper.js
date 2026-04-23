#!/usr/bin/env node
/**
 * Recipe Scraper — Crawlee + Playwright
 *
 * Scrapes 6 health-focused recipe websites and stores results in Convex.
 *
 * Usage:
 *   node scripts/recipeScraper.js --site forksoverknives --limit 5   # test one site
 *   node scripts/recipeScraper.js --all --limit 0                    # all sites, no limit
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PlaywrightCrawler } from 'crawlee';
import { ConvexClient } from './scrapers/convex-client.mjs';
import { extractRecipe } from './scrapers/extractors.mjs';

import { spawn } from 'node:child_process';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ═════════════════════════════════════════════════════════════════
// CONVEX AUTO-START
// ═════════════════════════════════════════════════════════════════

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const CONVEX_PORT = parseInt(new URL(CONVEX_URL).port) || 3210;
let convexChild = null;

function isConvexUp() {
  return new Promise((resolve) => {
    const sock = net.createConnection({ port: CONVEX_PORT, host: '127.0.0.1' });
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
  });
}

async function ensureConvex() {
  console.log(`[convex] Checking ${CONVEX_URL} ...`);
  if (await isConvexUp()) {
    console.log('[convex] Already running.');
    return;
  }
  console.log('[convex] Not running — starting in background ...');
  convexChild = spawn('npx', ['convex', 'dev', '--local', '--typecheck', 'disable'], {
    stdio: 'ignore',
    detached: false,
    shell: true,
  });
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    if (await isConvexUp()) {
      console.log('[convex] Started successfully.');
      return;
    }
  }
  throw new Error('Convex failed to start after 90s');
}

// ═════════════════════════════════════════════════════════════════
// SITE CONFIGS
// ═══════════════════════════════════════════════════════════════════

const SITES = {
  forksoverknives: {
    name: 'Forks Over Knives',
    startUrls: ['https://www.forksoverknives.com/recipes/'],
    crawlGlobs: ['https://www.forksoverknives.com/recipes/**'],
    dietType: ['plant_based'],
    diseaseFocus: null,
  },
  eatingwell: {
    name: 'EatingWell',
    startUrls: ['https://www.eatingwell.com/recipes/'],
    crawlGlobs: ['https://www.eatingwell.com/recipes/**', 'https://www.eatingwell.com/recipe/**'],
    dietType: ['plant_based', 'minimally_processed_with_meat'],
    diseaseFocus: null,
  },
  aicr: {
    name: 'AICR Recipes',
    startUrls: ['https://www.aicr.org/cancer-prevention/recipes/'],
    crawlGlobs: ['https://www.aicr.org/cancer-prevention/recipes/**'],
    dietType: ['plant_based', 'cancer'],
    diseaseFocus: 'cancer',
  },
  heart: {
    name: 'American Heart Association',
    startUrls: ['https://recipes.heart.org/en/recipes'],
    crawlGlobs: ['https://recipes.heart.org/en/recipes/**'],
    dietType: ['heart_health', 'plant_based', 'minimally_processed_with_meat'],
    diseaseFocus: 'heart_health',
  },
  diabetes: {
    name: 'Diabetes Food Hub',
    startUrls: ['https://diabetesfoodhub.org/recipes'],
    crawlGlobs: ['https://diabetesfoodhub.org/recipes**', 'https://www.diabetesfoodhub.org/recipes**'],
    dietType: ['diabetes'],
    diseaseFocus: 'diabetes',
  },
  kidney: {
    name: 'National Kidney Foundation',
    startUrls: ['https://www.kidney.org/nutrition/recipes'],
    crawlGlobs: ['https://www.kidney.org/nutrition/recipes/*'],
    dietType: ['kidney_disease', 'plant_based'],
    diseaseFocus: 'kidney_disease',
  },
};

// ═══════════════════════════════════════════════════════════════════
// AUTO-SCROLL (for lazy-loaded listing pages)
// ═══════════════════════════════════════════════════════════════════

async function autoScroll(page, maxScrolls = 8) {
  try {
    await page.evaluate(
      (max) =>
        new Promise((resolve) => {
          let count = 0;
          const timer = setInterval(() => {
            window.scrollBy(0, 600);
            if (++count >= max) { clearInterval(timer); resolve(); }
          }, 250);
        }),
      maxScrolls,
    );
    await page.waitForTimeout(500);
  } catch { /* page may have navigated away */ }
}

// ═══════════════════════════════════════════════════════════════════
// SCRAPE ONE SITE
// ═══════════════════════════════════════════════════════════════════

async function scrapeSite(siteKey, options = {}) {
  const { limit = 0, concurrency = 2, noConvex = false, outputDir = null, startUrl = null, globOverride = null } = options;
  const baseSiteConfig = SITES[siteKey];
  const siteConfig = baseSiteConfig
    ? {
        ...baseSiteConfig,
        startUrls: startUrl ? [startUrl] : baseSiteConfig.startUrls,
        crawlGlobs: globOverride ? [globOverride] : baseSiteConfig.crawlGlobs,
      }
    : null;
  if (!siteConfig) throw new Error(`Unknown site: ${siteKey}. Available: ${Object.keys(SITES).join(', ')}`);

  let store = null;
  if (!noConvex) {
    const convexUrl = process.env.VITE_CONVEX_URL;
    const adminSecret = process.env.ADMIN_SCRIPT_SECRET;
    if (!convexUrl || !adminSecret) throw new Error('Missing VITE_CONVEX_URL or ADMIN_SCRIPT_SECRET');

    store = new ConvexClient(convexUrl, adminSecret);

    try {
      await store.checkDuplicate('__ping__', '__ping__');
      console.log(`[convex] Connected to ${convexUrl}`);
    } catch (e) {
      throw new Error(`Cannot reach Convex at ${convexUrl}: ${e.message}`);
    }
  }

  let fileStream = null;
  const localSeen = new Set();
  if (outputDir) {
    await fsp.mkdir(outputDir, { recursive: true });
    const outputPath = path.resolve(outputDir, `${siteKey}.ndjson`);
    fileStream = fs.createWriteStream(outputPath, { flags: 'a' });
    console.log(`[file] Writing recipes to ${outputPath}`);
  }

  const stats = { pagesVisited: 0, recipesExtracted: 0, stored: 0, duplicates: 0, failures: 0 };

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${siteConfig.name}`);
  console.log(`  Limit: ${limit || 'unlimited'} | Concurrency: ${concurrency}`);
  console.log(`${'═'.repeat(60)}\n`);

  let storedCount = 0;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: limit ? limit * 4 : 5000,
    maxConcurrency: concurrency,
    navigationTimeoutSecs: 45,
    requestHandlerTimeoutSecs: 120,
    launchContext: { launchOptions: { headless: true } },

    async requestHandler({ page, request, enqueueLinks, log }) {
      const url = request.url;

      // ── scroll to trigger lazy content ──
      await autoScroll(page, 6);
      stats.pagesVisited++;

      // ── try to extract recipe data ──
      try {
        const recipe = await extractRecipe(page, url, siteConfig);
        if (recipe) {
          stats.recipesExtracted++;

          // enforce limit
          if (limit && storedCount >= limit) {
            log.info(`Limit (${limit}) reached — skipping ${recipe.recipe_title}`);
            return;
          }

          const dedupeKey = `${recipe.source_url}::${recipe.recipe_title}`;
          if (fileStream) {
            if (localSeen.has(dedupeKey)) {
              stats.duplicates++;
              log.info(`⊘ dup(file)  ${recipe.recipe_title}`);
            } else {
              localSeen.add(dedupeKey);
              fileStream.write(`${JSON.stringify(recipe)}\n`);
              storedCount++;
              stats.stored++;
              log.info(`✓ #${storedCount}  ${recipe.recipe_title}`);
            }
          } else {
            const dup = await store.checkDuplicate(recipe.source_url, recipe.recipe_title);
            if (dup) {
              stats.duplicates++;
              log.info(`⊘ dup  ${recipe.recipe_title}`);
            } else {
              await store.createRecipe(recipe);
              storedCount++;
              stats.stored++;
              log.info(`✓ #${storedCount}  ${recipe.recipe_title}`);
            }
          }
        }
      } catch (err) {
        stats.failures++;
        log.warning(`Extract error ${url}: ${err.message}`);
      }

      // ── enqueue more pages within the site ──
      if (!limit || storedCount < limit) {
        await enqueueLinks({ globs: siteConfig.crawlGlobs });
      }
    },

    failedRequestHandler({ request }) {
      stats.failures++;
      console.error(`  ✗ Failed: ${request.url}`);
    },
  });

  // Start from listing pages
  await crawler.run(siteConfig.startUrls);

  if (fileStream) {
    await new Promise((resolve) => fileStream.end(resolve));
  }

  console.log(`\n── ${siteConfig.name} ──`);
  console.log(`  Pages visited : ${stats.pagesVisited}`);
  console.log(`  Recipes found : ${stats.recipesExtracted}`);
  console.log(`  Stored        : ${stats.stored}`);
  console.log(`  Duplicates    : ${stats.duplicates}`);
  console.log(`  Failures      : ${stats.failures}\n`);

  return stats;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  const siteIdx = args.indexOf('--site');
  const limitIdx = args.indexOf('--limit');
  const concurrencyIdx = args.indexOf('--concurrency');
  const runAll = args.includes('--all');
  const noConvex = args.includes('--no-convex');
  const outputDirIdx = args.indexOf('--output-dir');
  const startUrlIdx = args.indexOf('--start-url');
  const globIdx = args.indexOf('--glob');
  const storageDirIdx = args.indexOf('--storage-dir');

  const siteKey = siteIdx >= 0 ? args[siteIdx + 1] : null;
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || 0 : 50;
  const concurrency = concurrencyIdx >= 0 ? parseInt(args[concurrencyIdx + 1]) || 2 : 2;
  const outputDir = outputDirIdx >= 0 ? args[outputDirIdx + 1] : null;
  const startUrl = startUrlIdx >= 0 ? args[startUrlIdx + 1] : null;
  const globOverride = globIdx >= 0 ? args[globIdx + 1] : null;
  const storageDir = storageDirIdx >= 0 ? args[storageDirIdx + 1] : null;

  if (storageDir) {
    await fsp.mkdir(storageDir, { recursive: true });
    process.env.CRAWLEE_STORAGE_DIR = path.resolve(storageDir);
    console.log(`[crawlee] Using storage dir ${process.env.CRAWLEE_STORAGE_DIR}`);
  }

  if (!noConvex) {
    await ensureConvex();
  }

  if (!siteKey && !runAll) {
    console.log('Usage:');
    console.log('  node scripts/recipeScraper.js --site <key> [--limit N] [--concurrency N]');
    console.log('  node scripts/recipeScraper.js --all [--limit N]');
    console.log(`\nSites: ${Object.keys(SITES).join(', ')}`);
    process.exit(1);
  }

  const sites = runAll ? Object.keys(SITES) : [siteKey];
  const overall = { totalStored: 0, totalFailures: 0, results: [] };

  for (const key of sites) {
    try {
      const st = await scrapeSite(key, { limit, concurrency, noConvex, outputDir, startUrl, globOverride });
      overall.totalStored += st.stored;
      overall.totalFailures += st.failures;
      overall.results.push({ site: key, ...st });
    } catch (err) {
      console.error(`\n✗ Site ${key} failed: ${err.message}\n`);
      overall.results.push({ site: key, error: err.message });
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  FINAL REPORT');
  console.log(`${'═'.repeat(60)}`);
  for (const r of overall.results) {
    if (r.error) console.log(`  ${r.site}: FAILED — ${r.error}`);
    else console.log(`  ${r.site}: ${r.stored} stored, ${r.duplicates} dupes, ${r.failures} failures`);
  }
  console.log(`\n  Total stored: ${overall.totalStored}`);
  console.log(`  Total failures: ${overall.totalFailures}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });

process.on('exit', () => { if (convexChild) convexChild.kill('SIGTERM'); });
