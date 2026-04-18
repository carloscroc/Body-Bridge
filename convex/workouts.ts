import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfileId } from "./lib/auth";

/**
 * Workouts API
 * Handles creation, retrieval, and management of workout programs.
 */

// Validator for a single exercise within a workout
const workoutExerciseValidator = v.object({
  id: v.optional(v.string()),
  exerciseId: v.optional(v.string()),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  muscleGroup: v.optional(v.string()),
  sets: v.optional(v.union(v.string(), v.number())),
  reps: v.optional(v.union(v.string(), v.number())),
  weight: v.optional(v.string()),
  rest: v.optional(v.union(v.string(), v.number())),
  restSeconds: v.optional(v.number()),
  duration: v.optional(v.string()),
  notes: v.optional(v.string()),
  completed: v.optional(v.boolean()),
  order: v.optional(v.number()),
  videoUrl: v.optional(v.string()),
  libraryId: v.optional(v.string()),
});

/**
 * Create a new workout
 */
export const create = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    duration: v.optional(v.string()),
    exercises: v.array(workoutExerciseValidator),
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
    exercises: v.optional(v.array(workoutExerciseValidator)),
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
