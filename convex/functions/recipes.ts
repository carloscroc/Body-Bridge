import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Check if a recipe already exists (duplicate check)
 */
export const checkDuplicate = query({
  args: {
    sourceUrl: v.string(),
    recipeTitle: v.string(),
    adminSecret: v.string(),
  },
  returns: v.union(v.id("recipes"), v.null()),
  handler: async (ctx, { sourceUrl, recipeTitle, adminSecret }) => {
    // Verify admin secret
    const expectedSecret = process.env.ADMIN_SCRIPT_SECRET;
    if (adminSecret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    // Check for existing recipe with same source_url and recipe_title
    const existing = await ctx.db
      .query("recipes")
      .filter(q => q.eq(q.field("source_url"), sourceUrl))
      .filter(q => q.eq(q.field("recipe_title"), recipeTitle))
      .first();

    return existing ? existing._id : null;
  },
});

/**
 * Create a new recipe
 */
export const create = mutation({
  args: {
    recipe: v.any(), // The recipe object matching our schema
    adminSecret: v.string(),
  },
  returns: v.id("recipes"),
  handler: async (ctx, { recipe, adminSecret }) => {
    // Verify admin secret
    const expectedSecret = process.env.ADMIN_SCRIPT_SECRET;
    if (adminSecret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    // Add timestamps
    const now = Date.now();
    const recipeWithTimestamps = {
      ...recipe,
      createdAt: now,
      updatedAt: now,
    };

    // Insert the recipe
    const docId = await ctx.db.insert("recipes", recipeWithTimestamps);
    return docId;
  },
});