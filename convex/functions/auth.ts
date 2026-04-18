import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const profileValidator = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  userId: v.id("users"),
  email: v.string(),
  fullName: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  authSource: v.union(v.literal("client"), v.literal("trainer")),
  onboardingComplete: v.optional(v.boolean()),
  onboardingCompletedAt: v.optional(v.number()),
  migratedFromLocal: v.optional(v.boolean()),
  goal: v.optional(v.string()),
  experienceLevel: v.optional(v.string()),
  trainingDaysPerWeek: v.optional(v.number()),
  equipmentAccess: v.optional(v.array(v.string())),
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
  units: v.optional(v.object({
    weight: v.union(v.literal("lb"), v.literal("kg")),
    height: v.union(v.literal("cm"), v.literal("ft")),
    distance: v.union(v.literal("mi"), v.literal("km")),
  })),
  sortPreference: v.optional(v.union(v.literal("popular"), v.literal("difficulty"), v.literal("alphabetical"))),
  planSummaryLastShown: v.optional(v.string()),
  subRenewalLastShown: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

/**
 * Get the current authenticated user's profile
 * Uses Convex Auth to get the current user ID
 */
export const getCurrentUser = query({
  args: {
    authSource: v.optional(v.union(v.literal("client"), v.literal("trainer"))),
  },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Find profile by userId
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

/**
 * Get or create user profile
 * Called after successful authentication to ensure profile exists
 */
export const getOrCreateUser = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    authSource: v.union(v.literal("client"), v.literal("trainer")),
  },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    // Get the current authenticated user ID from Convex Auth
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Try to find existing profile by userId
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      // Update last login and any changed fields
      await ctx.db.patch(profile._id, {
        updatedAt: Date.now(),
        fullName: args.fullName ?? profile.fullName,
        avatarUrl: args.avatarUrl ?? profile.avatarUrl,
      });
      return await ctx.db.get(profile._id);
    }

    // Try to find by email and auth source (migration case)
    profile = await ctx.db
      .query("profiles")
      .withIndex("by_email_authSource", (q) => 
        q.eq("email", args.email).eq("authSource", args.authSource)
      )
      .first();

    if (profile) {
      // Link to new Convex Auth userId
      await ctx.db.patch(profile._id, {
        userId,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(profile._id);
    }

    // Create new profile
    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId,
      email: args.email,
      fullName: args.fullName,
      avatarUrl: args.avatarUrl,
      authSource: args.authSource,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(profileId);
  },
});

/**
 * Mark onboarding as complete for the current authenticated user.
 */
export const completeOnboarding = mutation({
  args: {
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    migratedFromLocal: v.optional(v.boolean()),
  goal: v.optional(v.string()),
  experienceLevel: v.optional(v.string()),
  trainingDaysPerWeek: v.optional(v.number()),
  equipmentAccess: v.optional(v.array(v.string())),
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
  units: v.optional(v.object({
    weight: v.union(v.literal("lb"), v.literal("kg")),
    height: v.union(v.literal("cm"), v.literal("ft")),
    distance: v.union(v.literal("mi"), v.literal("km")),
  })),
  },
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    await ctx.db.patch(profile._id, {
      fullName: args.fullName ?? profile.fullName,
      avatarUrl: args.avatarUrl ?? profile.avatarUrl,
      onboardingComplete: true,
      onboardingCompletedAt: Date.now(),
      migratedFromLocal: args.migratedFromLocal ?? profile.migratedFromLocal,
      goal: args.goal ?? profile.goal,
      experienceLevel: args.experienceLevel ?? profile.experienceLevel,
      trainingDaysPerWeek: args.trainingDaysPerWeek ?? profile.trainingDaysPerWeek,
      equipmentAccess: args.equipmentAccess ?? profile.equipmentAccess,
      bio: args.bio ?? profile.bio,
      location: args.location ?? profile.location,
      units: args.units ?? profile.units,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});
