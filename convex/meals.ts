import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMeals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("meals")
      .order("desc")
      .collect();
  },
});

export const getUserMeals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return [];

    return await ctx.db
      .query("meals")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .order("desc")
      .collect();
  },
});

export const createMeal = mutation({
  args: {
    title: v.string(),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    calories: v.optional(v.number()),
    macros: v.optional(v.object({ p: v.number(), c: v.number(), f: v.number() })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const now = Date.now();
    return await ctx.db.insert("meals", {
      userId: profile._id,
      title: args.title,
      type: args.type,
      description: args.description,
      image: args.image,
      calories: args.calories,
      macros: args.macros,
      completed: false,
      date: now,
      createdAt: now,
    });
  },
});
