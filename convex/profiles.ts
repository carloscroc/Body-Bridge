import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPublicProfiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("profiles"),
      fullName: v.string(),
      avatarUrl: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      authSource: v.union(v.literal("client"), v.literal("trainer")),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const rows = await ctx.db.query("profiles").order("desc").take(limit);

    return rows.map((p) => ({
      _id: p._id,
      fullName: p.fullName ?? "",
      avatarUrl: p.avatarUrl,
      bio: p.bio,
      location: p.location,
      authSource: p.authSource,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

/** Look up a profile by full name — used by community profile sheets */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // No index on fullName, so collect and filter
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.find((p) => p.fullName === name) ?? null;
  },
});

export const updateMe = mutation({
    args: {
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    goal: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    trainingDaysPerWeek: v.optional(v.number()),
    equipmentAccess: v.optional(v.array(v.string())),
    units: v.optional(v.object({
      weight: v.union(v.literal("lb"), v.literal("kg")),
      height: v.union(v.literal("cm"), v.literal("ft")),
      distance: v.union(v.literal("mi"), v.literal("km")),
    })),
    sortPreference: v.optional(v.union(v.literal("popular"), v.literal("difficulty"), v.literal("alphabetical"))),
    planSummaryLastShown: v.optional(v.string()),
    subRenewalLastShown: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log("updateMe userId:", userId);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
