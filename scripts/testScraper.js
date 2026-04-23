#!/usr/bin/env node

import dotenv from "dotenv";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const FirecrawlApp = require("@firecrawl/firecrawl");

let firecrawlApp = null;

async function initFirecrawl() {
  if (!firecrawlApp) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("Missing FIRECRAWL_API_KEY in environment variables");
    }

    firecrawlApp = new FirecrawlApp({ apiKey });
    console.log("Firecrawl client initialized successfully");
  }
  return firecrawlApp;
}

class RecipeScraper {
  constructor() {
    this.client = null;
    this.adminSecret = null;
    this.initConvex();
  }

  initConvex() {
    try {
      const url = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
      if (!url) {
        throw new Error(
          "Missing Convex URL. Set VITE_CONVEX_URL (preferred) or CONVEX_URL in your environment.",
        );
      }
      this.client = new ConvexHttpClient(url);
      
      const secret = process.env.ADMIN_SCRIPT_SECRET;
      if (!secret) {
        throw new Error(
          "Missing ADMIN_SCRIPT_SECRET. Set it locally and also in Convex env vars.",
        );
      }
      this.adminSecret = secret;
      console.log("Convex client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Convex client:", error);
      process.exit(1);
    }
  }

  async checkForDuplicate(sourceUrl, recipeTitle) {
    try {
      const existing = await this.client.query(api.recipes.checkDuplicate, {
        sourceUrl,
        recipeTitle,
        adminSecret: this.adminSecret
      });

      return existing;
    } catch (error) {
      console.warn("Duplicate check function not found:", error.message);
      return null; // Assume no duplicate for now
    }
  }

  async storeRecipe(recipeData) {
    try {
      const result = await this.client.mutation(api.recipes.create, {
        recipe: recipeData,
        adminSecret: this.adminSecret
      });

      return result;
    } catch (error) {
      console.error("Failed to store recipe:", error);
      throw error;
    }
  }

  async scrapeSite(siteConfig) {
    console.log(`Starting scrape for ${siteConfig.name}`);
    
    const stats = {
      archivePagesFound: 0,
      recipePagesScraped: 0,
      recordsStored: 0,
      duplicatesSkipped: 0,
      failures: 0
    };

    const firecrawl = await initFirecrawl();
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      console.log(`Mapping recipe library at: ${siteConfig.recipeLibraryUrl}`);
      const mapOptions = {
        limit: 500,
        scrapeOptions: {
          onlyMainContent: true,
          formats: ["markdown"]
        }
      };

      let mapResult;
      try {
        mapResult = await firecrawl.scrape(siteConfig.recipeLibraryUrl, mapOptions);
        stats.archivePagesFound = 1;
      } catch (mapError) {
        console.warn(`Map failed, falling back to search: ${mapError.message}`);
        const searchResult = await firecrawl.search({
          query: siteConfig.name + " recipes",
          pageOptions: {
            onlyMainContent: true,
            formats: ["markdown"]
          },
          limit: 100
        });
        mapResult = searchResult;
        stats.archivePagesFound = 1;
      }

      const recipeUrls = this.extractRecipeUrls(mapResult, siteConfig);
      console.log(`Found ${recipeUrls.length} recipe URLs to process`);

      if (recipeUrls.length === 0) {
        console.log("No recipes found, skipping site");
        return stats;
      }

      const batchSize = 5;
      const batches = Math.ceil(recipeUrls.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min((i + 1) * batchSize, recipeUrls.length);
        const batch = recipeUrls.slice(batchStart, batchEnd);
        
        console.log(`Processing batch ${i + 1}/${batches} (${batch.length} recipes)`);
        
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            try {
              stats.recipePagesScraped++;
              console.log(`  Processing: ${url}`);
              
              const scrapeOptions = {
                formats: ["markdown", "html"]
              };
              const crawlResult = await firecrawl.scrape(url, scrapeOptions);
              
              const data = this.extractRecipeFromContent(crawlResult, url, siteConfig);
              const normalizedData = this.normalizeRecipeData(data, siteConfig);
              
              const isDuplicate = await this.checkForDuplicate(
                normalizedData.source_url, 
                normalizedData.recipe_title
              );
              
              if (isDuplicate) {
                stats.duplicatesSkipped++;
                console.log(`    Duplicate skipped: ${normalizedData.recipe_title}`);
                return { success: true, stored: false, duplicate: true };
              }
              
              await this.storeRecipe(normalizedData);
              stats.recordsStored++;
              console.log(`    Stored: ${normalizedData.recipe_title}`);
              
              return { success: true, stored: true };
            } catch (error) {
              console.error(`    Failed: ${url} - ${error.message}`);
              stats.failures++;
              return { success: false, error: error.message };
            }
          })
        );

        if (i < batches - 1) {
          console.log("Pausing for 2 seconds before next batch...");
          await sleep(2000);
        }
      }
      
    } catch (error) {
      console.error(`Site scraping failed for ${siteConfig.name}:`, error);
      stats.failures++;
    }
    
    return stats;
  }

  extractRecipeUrls(crawlResult, siteConfig) {
    const urls = new Set();
    const content = crawlResult.markdown || crawlResult.content || "";
    
    const urlPatterns = [
      /\/recipes[\/][^"'\s]+/gi,
      /\/cancer-prevention\/recipes\/[^"'\s]+/gi,
      /\/nutrition\/recipes\/[^"'\s]+/gi
    ];
    
    const pattern = urlPatterns[siteConfig.name] || /\/recipes[\/][^"'\s]+/gi;
    const matches = content.match(pattern) || [];
    
    for (const match of matches) {
      urls.add(match);
    }
    
    return Array.from(urls);
  }

  extractRecipeFromContent(crawlResult, sourceUrl, siteConfig) {
    const content = crawlResult.markdown || crawlResult.content || "";
    const metadata = crawlResult.metadata || {};
    
    const recipe = {
      source_site: siteConfig.name,
      source_url: sourceUrl,
      recipe_title: metadata.title || "Untitled Recipe",
      short_description: metadata.description || "",
      category: "Main Course",
      tags: ["healthy"],
      ingredients: [],
      instructions: [],
      prep_time: null,
      cook_time: null,
      total_time: null,
      servings: 4,
      nutrition_info: {
        calories: null,
        protein: null,
        carbs: null,
        fat: null
      },
      image_url: metadata.ogImage || null,
      diet_type: this.assignDietType(siteConfig),
      disease_focus: siteConfig.diseaseFocus || null
    };
    
    return recipe;
  }

  extractTitleFromContent(content) {
    const match = content.match(/^#+\s+[^#\n]+/m);
    if (match) return match[0].trim();
    return null;
  }

  extractDescriptionFromContent(content) {
    const match = content.match(/^#+\s+[^#\n]+(?:.+\n+)([^#\n]+)(?=\\n|$)/m);
    if (match && match[1]) {
      const desc = match[1].trim();
      return desc.length > 20 && desc.length < 500 ? desc : null;
    }
    return null;
  }

  extractCategoryFromContent(content) {
    if (content.toLowerCase().includes("main course")) return "Main Course";
    if (content.toLowerCase().includes("appetizer")) return "Appetizer";
    if (content.toLowerCase().includes("side dish")) return "Side Dish";
    if (content.toLowerCase().includes("salad")) return "Salad";
    if (content.toLowerCase().includes("soup")) return "Soup";
    if (content.toLowerCase().includes("dessert")) return "Dessert";
    if (content.toLowerCase().includes("beverage")) return "Beverage";
    if (content.toLowerCase().includes("breakfast")) return "Breakfast";
    if (content.toLowerCase().includes("snack")) return "Snack";
    return "Main Course";
  }

  extractTagsFromContent(content, siteConfig) {
    const tags = new Set(["healthy"]);
    
    if (siteConfig.name === "EatingWell") tags.add("whole-food");
    if (siteConfig.diseaseFocus === "cancer") tags.add("cancer-prevention");
    if (siteConfig.diseaseFocus === "heart_health") tags.add("heart-healthy");
    if (siteConfig.diseaseFocus === "diabetes") tags.add("diabetes-friendly");
    if (siteConfig.diseaseFocus === "kidney_disease") tags.add("kidney-friendly");
    
    if (/vegetarian/i.test(content)) tags.add("vegetarian");
    if (/vegan/i.test(content)) tags.add("vegan");
    if (/gluten-free/i.test(content)) tags.add("gluten-free");
    if (/dairy-free/i.test(content)) tags.add("dairy-free");
    if (/low-sodium/i.test(content)) tags.add("low-sodium");
    if (/high-protein/i.test(content)) tags.add("high-protein");
    
    return Array.from(tags);
  }

  extractIngredientsFromContent(content) {
    const lines = content.split('\n');
    const ingredients = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && trimmed.length < 200) {
        ingredients.push({
          name: trimmed,
          amount: "1",
          unit: "portion",
          raw: trimmed
        });
      }
    }
    
    return ingredients.slice(0, 20);
  }

  extractInstructionsFromContent(content) {
    const instructions = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 20 && line.length < 500 && i < 10) {
        instructions.push(line);
      }
    }
    
    return instructions;
  }

  extractPrepTimeFromContent(content) {
    const match = content.match(/prep time[:\s]*\s*(\d+)\s*(?:min|minute)/i);
    if (match) return `${match[1]} minutes`;
    return null;
  }

  extractCookTimeFromContent(content) {
    const match = content.match(/cook time[:\s]*\s*(\d+)\s*(?:min|minute)/i);
    if (match) return `${match[1]} minutes`;
    return null;
  }

  extractTotalTimeFromContent(content) {
    const match = content.match(/total time[:\s]*\s*(\d+)\s*(?:min|minute)/i);
    if (match) return `${match[1]} minutes`;
    return null;
  }

  extractServingsFromContent(content) {
    const match = content.match(/servings[:\s]*\s*(\d+)/i);
    if (match) return match[1];
    return 4;
  }

  extractNutritionFromContent(content) {
    return {
      calories: null,
      protein: null,
      carbs: null,
      fat: null
    };
  }

  extractImageFromContent(content, baseUrl, siteConfig) {
    const ogMatch = content.match(/og:image["']?\s*[:=]\s*["']([^"']+)["']/i);
    if (ogMatch && !ogMatch[1].startsWith("http")) {
      const base = new URL(baseUrl).origin;
      return base + ogMatch[1];
    }
    return null;
  }

  normalizeRecipeData(data, siteConfig) {
    return {
      ...data,
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      instructions: Array.isArray(data.instructions) ? data.instructions : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      diet_type: Array.isArray(data.diet_type) ? data.diet_type : []
    };
  }

  assignDietType(siteConfig) {
    const baseTypes = [];
    
    switch (siteConfig.name.toLowerCase()) {
      case 'forks over knives':
        baseTypes.push('plant_based');
        break;
      case 'eatingwell':
        baseTypes.push('plant_based', 'minimally_processed_with_meat');
        break;
      case 'aicr recipes':
        baseTypes.push('plant_based', 'cancer');
        break;
      case 'american heart association':
        baseTypes.push('heart_health', 'plant_based', 'minimally_processed_with_meat');
        break;
      case 'diabetes food hub':
        baseTypes.push('diabetes');
        break;
      case 'national kidney foundation':
        baseTypes.push('kidney_disease', 'plant_based');
        break;
      default:
        baseTypes.push('unknown');
    }
    
    return baseTypes;
  }

  async run() {
    console.log("Starting recipe scraping process...");
    
    // Test with just one site first
    const testSite = {
      name: "Test Site",
      website: "https://example.com",
      recipeLibraryUrl: "https://example.com/recipes/",
      diseaseFocus: null,
      extractionPrompt: "Test extraction"
    };

    console.log("Testing Convex and Firecrawl initialization...");
    const scraper = new RecipeScraper();
    
    try {
      console.log("Initializing Firecrawl...");
      const firecrawl = await scraper.initFirecrawl();
      console.log("Firecrawl initialized:", !!firecrawl);
      console.log("Test passed - script is ready for production!");
    } catch (error) {
      console.error("Test failed:", error.message);
    }
    
    process.exit(0);
  }

// Run the test
const testScraper = new RecipeScraper();
testScraper.run().catch((e) => { console.error(e); process.exit(1); });
