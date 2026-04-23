import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

let _client = null;
let _secret = null;

export function getConvexClient() {
  if (!_client) {
    const url = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
    if (!url) throw new Error("Missing VITE_CONVEX_URL in .env.local");
    _client = new ConvexHttpClient(url);
    _secret = process.env.ADMIN_SCRIPT_SECRET;
    if (!_secret) throw new Error("Missing ADMIN_SCRIPT_SECRET in .env.local");
    console.log(`[Convex] Client initialized → ${url}`);
  }
  return { client: _client, secret: _secret };
}

export async function checkDuplicate(sourceUrl, recipeTitle) {
  const { client, secret } = getConvexClient();
  try {
    return await client.query(api["functions/recipes"].checkDuplicate, {
      sourceUrl,
      recipeTitle,
      adminSecret: secret,
    });
  } catch (err) {
    console.warn(`[Convex] Duplicate check failed: ${err.message}`);
    return null;
  }
}

export async function storeRecipe(recipe) {
  const { client, secret } = getConvexClient();
  return await client.mutation(api["functions/recipes"].create, {
    recipe,
    adminSecret: secret,
  });
}
