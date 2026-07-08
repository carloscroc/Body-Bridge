import { query } from "./_generated/server";
import { v } from "convex-values";

// Get only Jasmine's exercises (simplified query)
export const getJasmineExercises = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor;
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_trainer_and_active", (q) => q
        .eq("trainerFirstName", "Jasmine")
        .eq("trainerLastName", "Hensley")
        .eq("isActive", true)
      )
      .paginate({ cursor, numItems: limit });
    return exercises;
  },
});