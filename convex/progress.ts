import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";
import type { Id } from "./_generated/dataModel";


export const getClientProgress = query({
  args: { clientId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progressEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.clientId))
      .order("desc")
      .collect();
  },
});

export const createProgressEntry = mutation({
  args: {
    userId: v.id("profiles"),
    date: v.number(),
    weight: v.optional(v.number()),
    bodyFat: v.optional(v.number()),
    measurements: v.optional(v.any()),
    photos: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);

    return await ctx.db.insert("progressEntries", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateProgressEntry = mutation({
  args: {
    id: v.id("progressEntries"),
    updates: v.object({
      date: v.optional(v.number()),
      weight: v.optional(v.number()),
      bodyFat: v.optional(v.number()),
      measurements: v.optional(v.any()),
      photos: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteProgressEntry = mutation({
  args: { id: v.id("progressEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getClientWorkoutLogs = query({
  args: { clientId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workoutLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.clientId))
      .order("desc")
      .collect();
  },
});

export const createWorkoutLog = mutation({
  args: {
    userId: v.id("profiles"),
    date: v.number(),
    exercises: v.array(v.any()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workoutLogId = await ctx.db.insert("workoutLogs", {
      ...args,
      createdAt: Date.now(),
    });

    for (const rawExercise of args.exercises) {
      try {
        if (!rawExercise || typeof rawExercise !== "object") {
          continue;
        }

        const exercise = rawExercise as Record<string, unknown>;
        let exerciseDoc = null;

        // 1) Try direct document IDs first (exerciseId, _id, then id if it represents a direct Id)
        const directIdCandidates = [
          exercise.exerciseId,
          exercise._id,
          exercise.id,
        ].filter((v): v is string => typeof v === "string");

        for (const cand of directIdCandidates) {
          try {
            exerciseDoc = await ctx.db.get(cand as Id<"exercises">);
            if (exerciseDoc) break;
          } catch {
            // If the ID is invalid for the exercises collection, treat as not found and continue
            exerciseDoc = null;
          }
        }

        // 2) If not found via direct IDs, fall back to libraryId lookup (library-based identification)
        if (!exerciseDoc) {
          const libraryId = exercise.libraryId ?? (typeof exercise.id === "string" ? exercise.id : undefined);
          if (typeof libraryId === "string") {
            exerciseDoc = await ctx.db
              .query("exercises")
              .withIndex("by_libraryId", (q) => q.eq("libraryId", libraryId))
              .first();
          }
        }

        if (!exerciseDoc) {
          continue;
        }

        const existingUsage = await ctx.db
          .query("exerciseUsage")
          .withIndex("by_user_exercise", (q) => q
            .eq("userId", args.userId)
            .eq("exerciseId", exerciseDoc._id))
          .first();

        if (existingUsage) {
          await ctx.db.patch(existingUsage._id, { count: existingUsage.count + 1 });
        } else {
          await ctx.db.insert("exerciseUsage", {
            userId: args.userId,
            exerciseId: exerciseDoc._id,
            count: 1,
          });
        }
      } catch (error) {
        console.error("Failed to update exercise usage", error);
      }
    }

    return workoutLogId;
  },
});
