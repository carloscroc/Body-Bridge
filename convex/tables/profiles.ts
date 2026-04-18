import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireProfileId } from "../lib/auth";

const profileValidator = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  userId: v.id("users"),
  email: v.string(),
  fullName: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  authSource: v.union(v.literal("client"), v.literal("trainer")),
  createdAt: v.number(),
  updatedAt: v.number(),
  // Profile extras from convex/schema.ts profiles table
  onboardingComplete: v.optional(v.boolean()),
  onboardingCompletedAt: v.optional(v.number()),
  migratedFromLocal: v.optional(v.boolean()),
  goal: v.optional(v.string()),
  experienceLevel: v.optional(v.string()),
  trainingDaysPerWeek: v.optional(v.number()),
  sortPreference: v.optional(v.union(v.literal("popular"), v.literal("difficulty"), v.literal("alphabetical"))),
  equipmentAccess: v.optional(v.array(v.string())),
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
  units: v.optional(v.object({
    weight: v.union(v.literal("lb"), v.literal("kg")),
    height: v.union(v.literal("cm"), v.literal("ft")),
    distance: v.union(v.literal("mi"), v.literal("km")),
  })),
});

export const get = query({
  args: { id: v.id("profiles") },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    await requireProfileId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: {
    email: v.string(),
    authSource: v.optional(v.union(v.literal("client"), v.literal("trainer"))),
  },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    await requireProfileId(ctx);
    const authSource = args.authSource ?? "client";
    return await ctx.db
      .query("profiles")
      .withIndex("by_email_authSource", (q) =>
        q.eq("email", args.email).eq("authSource", authSource),
      )
      .first();
  },
});

export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const update = mutation({
  args: {
    id: v.id("profiles"),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    sortPreference: v.optional(v.union(v.literal("popular"), v.literal("difficulty"), v.literal("alphabetical"))),
  },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    await requireProfileId(ctx);
    await ctx.db.patch(args.id, {
      ...(args.fullName !== undefined ? { fullName: args.fullName } : {}),
      ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
      ...(args.sortPreference !== undefined ? { sortPreference: args.sortPreference } : {}),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});
