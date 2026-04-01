import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfileId } from "./lib/auth";

/**
 * Workouts API
 * Handles creation, retrieval, and management of workout programs.
 */

// Validator for a single exercise within a workout
const workoutExerciseValidator = v.object({
  id: v.string(),
  name: v.string(),
  image: v.optional(v.string()),
  sets: v.optional(v.string()),
  reps: v.optional(v.string()),
  weight: v.optional(v.string()),
  rest: v.optional(v.string()),
  notes: v.optional(v.string()),
  completed: v.optional(v.boolean()),
});

/**
 * Create a new workout
 */
export const create = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    duration: v.optional(v.string()),
    exercises: v.array(v.any()), // Use any for flexibility with frontend types
    completed: v.boolean(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);
    
    return await ctx.db.insert("workouts", {
      userId: profileId,
      title: args.title,
      subtitle: args.subtitle,
      duration: args.duration,
      exercises: args.exercises,
      completed: args.completed,
      date: args.date,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all workouts for the authenticated user
 */
export const getUserWorkouts = query({
  args: {},
  handler: async (ctx) => {
    const profileId = await requireProfileId(ctx);
    
    return await ctx.db
      .query("workouts")
      .withIndex("by_userId", (q) => q.eq("userId", profileId))
      .order("desc")
      .collect();
  },
});

/**
 * Delete a workout
 */
export const remove = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);
    const workout = await ctx.db.get(args.id);
    
    if (!workout || workout.userId !== profileId) {
      throw new Error("Unauthorized or workout not found");
    }
    
    await ctx.db.delete(args.id);
  },
});

/**
 * Update an existing workout
 */
export const update = mutation({
  args: {
    id: v.id("workouts"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    duration: v.optional(v.string()),
    exercises: v.optional(v.array(v.any())),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);
    const workout = await ctx.db.get(args.id);
    
    if (!workout || workout.userId !== profileId) {
      throw new Error("Unauthorized or workout not found");
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
