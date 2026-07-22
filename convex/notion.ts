import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { NotionExerciseService, NotionExercise } from "./services/notionService";
import type { Id } from "./_generated/dataModel";

/**
 * Normalize a string to a stable libraryId format.
 * Converts to lowercase, replaces spaces and special chars with hyphens,
 * removes consecutive hyphens, and trims.
 */
function normalizeToLibraryId(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const upsertTrainer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    notionDatabaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const fullName = `${args.firstName} ${args.lastName}`;

    // Check if trainer already exists
    const existingTrainers = await ctx.db
      .query("trainers")
      .withIndex("by_fullName", (q) => q.eq("fullName", fullName))
      .collect();

    if (existingTrainers.length > 0) {
      // Update existing trainer
      const trainer = existingTrainers[0];
      await ctx.db.patch(trainer._id, {
        notionDatabaseId: args.notionDatabaseId,
        email: args.email,
        updatedAt: Date.now(),
      });
      return trainer._id;
    }

    // Create new trainer
    const trainerId = await ctx.db.insert("trainers", {
      firstName: args.firstName,
      lastName: args.lastName,
      fullName,
      email: args.email,
      notionDatabaseId: args.notionDatabaseId,
      updatedAt: Date.now(),
      isActive: true,
    });

    return trainerId;
  },
});

export const syncNotionExercises = action({
  args: {
    trainerId: v.id("trainers"),
    forceResync: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ synced: number; results: Array<{ name: string; action: string }>; trainer: string }> => {
    // Fetch trainer configuration
    const trainer = await ctx.runQuery(api.notion.getTrainerById, { trainerId: args.trainerId }) as { _id: Id<"trainers">; firstName: string; lastName: string; fullName: string; notionDatabaseId: string; profileId?: Id<"profiles"> } | null;
    if (!trainer) {
      throw new Error("Trainer not found");
    }

    if (!trainer.notionDatabaseId) {
      throw new Error("Trainer not configured with Notion database ID");
    }

    // Get Notion access token from environment variable (NOTION_API_KEY)
    const notionAccessToken = process.env.NOTION_API_KEY;
    if (!notionAccessToken) {
      throw new Error("NOTION_API_KEY environment variable not configured");
    }

    // Create Notion service
    const notionService = new NotionExerciseService(
      notionAccessToken,
      trainer.notionDatabaseId,
      {
        firstName: trainer.firstName,
        lastName: trainer.lastName,
      }
    );

    // Fetch exercises from Notion
    const notionExercises: NotionExercise[] = await notionService.fetchExercises();

    // Sync each exercise
    const results = [];
    for (const notionExercise of notionExercises) {
      // Check if exercise already exists in trainerExercises (by sourceSystem and sourceId)
      const existingTrainerExercises = await ctx.runQuery(api.notion.getTrainerExercisesBySourceSystem, {
        trainerId: args.trainerId,
        sourceSystem: "notion",
      });

      const existingAssignment = existingTrainerExercises.find(
        (te: any) => te.sourceId === notionExercise.name
      );

      if (existingAssignment && !args.forceResync) {
        // Skip if already exists and not forcing resync
        results.push({ name: notionExercise.name, action: "skipped" });
        continue;
      }

      // Insert or update the canonical exercise
      const libraryId = normalizeToLibraryId(notionExercise.name);

      // Check if canonical exercise exists by libraryId
      const existingExercises = await ctx.runQuery(api.notion.getExercisesByLibraryId, {
        libraryId,
      });

      let exerciseId: Id<"exercises">;
      if (existingExercises.length > 0) {
        exerciseId = existingExercises[0]._id;
        results.push({ name: notionExercise.name, action: "updated_canonical" });
      } else {
        // Insert new canonical exercise
        exerciseId = await ctx.runMutation(api.notion.insertCanonicalExercise, {
          exerciseData: {
            libraryId,
            name: notionExercise.name,
            category: notionExercise.category || 'General',
            bodyRegion: notionExercise.primaryMuscles[0] || "General", // Changed from muscleGroup
            primaryMuscles: notionExercise.primaryMuscles,
            secondaryMuscles: notionExercise.secondaryMuscles,
            equipment: notionExercise.equipment,
            overview: `Exercise from ${trainer.fullName}'s library`,
            instructions: notionExercise.instructions,
            benefits: [],
            tags: ["Notion Import"],
            lifecycle: "ready",
          },
        });
        results.push({ name: notionExercise.name, action: "inserted_canonical" });
      }

      // Create or update trainer assignment with the video URL
      if (existingAssignment) {
        await ctx.runMutation(api.trainerExercises.assignExerciseToTrainer, {
          trainerId: args.trainerId,
          exerciseId: exerciseId,
          videoUrl: notionExercise.videoUrl || "",
          sourceSystem: "notion",
          sourceId: notionExercise.name,
          adminSecret: process.env.ADMIN_SCRIPT_SECRET,
        });
        results.push({ name: notionExercise.name, action: "updated_assignment" });
      } else {
        await ctx.runMutation(api.trainerExercises.assignExerciseToTrainer, {
          trainerId: args.trainerId,
          exerciseId: exerciseId,
          videoUrl: notionExercise.videoUrl || "",
          sourceSystem: "notion",
          sourceId: notionExercise.name,
          adminSecret: process.env.ADMIN_SCRIPT_SECRET,
        });
        results.push({ name: notionExercise.name, action: "assigned" });
      }
    }

    return {
      synced: results.length,
      results,
      trainer: trainer.fullName,
    };
  },
});

// Helper functions for action to call
export const getTrainerById = query({
  args: { trainerId: v.id("trainers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.trainerId);
  },
});

export const getTrainerExercisesBySourceSystem = query({
  args: {
    trainerId: v.id("trainers"),
    sourceSystem: v.union(v.literal("notion"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("trainerExercises")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
    return assignments.filter((te: any) => te.sourceSystem === args.sourceSystem);
  },
});

export const getExercisesByLibraryId = query({
  args: { libraryId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exercises")
      .withIndex("by_libraryId", (q) => q.eq("libraryId", args.libraryId))
      .collect();
  },
});

export const insertCanonicalExercise = mutation({
  args: { exerciseData: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("exercises", args.exerciseData);
  },
});

export const listTrainers = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const trainers = await ctx.db.query("trainers").collect();

    return trainers
      .filter((trainer) =>
        args.includeInactive ? true : trainer.isActive
      )
      .map((trainer) => ({
        _id: trainer._id,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        fullName: trainer.fullName,
        email: trainer.email,
        isActive: trainer.isActive,
        hasNotionConfig: !!trainer.notionDatabaseId,
      }));
  },
});

export const listExercisesByTrainer = query({
  args: {
    trainerId: v.id("trainers"),
  },
  handler: async (ctx, args) => {
    // Get all active trainer-exercise assignments for this trainer
    const trainerAssignments = await ctx.db
      .query("trainerExercises")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    const activeAssignments = trainerAssignments.filter((te: any) => te.isActive === true && te.videoUrl.trim().length > 0);

    // Resolve canonical exercises for each assignment
    const exercises = [];
    for (const assignment of activeAssignments) {
      const exercise = await ctx.db.get(assignment.exerciseId);
      if (exercise) {
        exercises.push({
          ...exercise,
          videoUrl: assignment.videoUrl,
          trainerExerciseId: assignment._id,
          sourceSystem: assignment.sourceSystem,
          sourceId: assignment.sourceId,
        });
      }
    }

    return {
      exercises,
      count: exercises.length,
    };
  },
});

export const listAllTrainers = query({
  args: {},
  handler: async (ctx, args) => {
    const trainers = await ctx.db.query("trainers").collect();

    // Get exercise count per trainer from trainerExercises
    const trainerExercises = await ctx.db.query("trainerExercises").collect();
    const activeTrainerExercises = trainerExercises.filter((te: any) => te.isActive);

    const trainerCounts: Record<string, number> = {};
    for (const te of activeTrainerExercises) {
      const trainerId = te.trainerId.toString();
      trainerCounts[trainerId] = (trainerCounts[trainerId] || 0) + 1;
    }

    return {
      trainers: trainers.map((trainer) => ({
        _id: trainer._id,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        fullName: trainer.fullName,
        email: trainer.email,
        isActive: trainer.isActive,
        hasNotionConfig: !!trainer.notionDatabaseId,
        exerciseCount: trainerCounts[trainer._id.toString()] || 0,
      })),
    };
  },
});