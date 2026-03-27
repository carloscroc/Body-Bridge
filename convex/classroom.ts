import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    return await ctx.db
      .query("classroomProgress")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .unique();
  },
});

export const updateProgress = mutation({
  args: {
    progress: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const existing = await ctx.db
      .query("classroomProgress")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        progress: args.progress,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("classroomProgress", {
        userId: profile._id,
        progress: args.progress,
        updatedAt: Date.now(),
      });
    }
  },
});
