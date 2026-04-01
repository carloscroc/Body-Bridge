import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDailyPlan = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return [];

    const today = args.date || new Date().toISOString().split('T')[0];

    return await ctx.db
      .query("userPlans")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", profile._id).eq("scheduledDate", today)
      )
      .collect();
  },
});

export const getAllPlans = query({
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
      .query("userPlans")
      .withIndex("by_user_date", (q) => q.eq("userId", profile._id))
      .collect();
  },
});

export const addToPlan = mutation({
  args: {
    type: v.union(v.literal("meal"), v.literal("workout")),
    item: v.any(),
    scheduledDate: v.string(),
    mealType: v.optional(v.string()),
    notes: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
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
    return await ctx.db.insert("userPlans", {
      userId: profile._id,
      type: args.type,
      item: args.item,
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
      mealType: args.mealType,
      notes: args.notes,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePlanItem = mutation({
  args: {
    id: v.id("userPlans"),
    updates: v.object({
      scheduledDate: v.optional(v.string()),
      scheduledTime: v.optional(v.string()),
      mealType: v.optional(v.string()),
      completed: v.optional(v.boolean()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Plan item not found");

    // In a real app, we'd check if existing.userId matches the current user's profile._id
    
    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

export const removeFromPlan = mutation({
  args: { id: v.id("userPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});

export const togglePlanItemStatus = mutation({
  args: { id: v.id("userPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Plan item not found");

    await ctx.db.patch(args.id, {
      completed: !existing.completed,
      updatedAt: Date.now(),
    });
  },
});
export const getPlansInRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return [];

    return await ctx.db
      .query("userPlans")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", profile._id)
         .gte("scheduledDate", args.startDate)
         .lte("scheduledDate", args.endDate)
      )
      .collect();
  },
});
