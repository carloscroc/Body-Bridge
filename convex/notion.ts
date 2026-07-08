import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { NotionExerciseService, NotionExercise } from "./services/notionService";
import type { Id } from "./_generated/dataModel";

export const upsertTrainer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    notionDatabaseId: v.string(),
    notionAccessToken: v.string(),
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
        notionAccessToken: args.notionAccessToken,
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
      notionAccessToken: args.notionAccessToken,
      createdAt: Date.now(),
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
    const trainer = await ctx.runQuery(api.notion.getTrainerById, { trainerId: args.trainerId }) as { _id: Id<"trainers">; firstName: string; lastName: string; fullName: string; notionDatabaseId: string; notionAccessToken: string; profileId?: Id<"profiles"> } | null;
    if (!trainer) {
      throw new Error("Trainer not found");
    }

    if (!trainer.notionDatabaseId || !trainer.notionAccessToken) {
      throw new Error("Trainer not configured with Notion credentials");
    }

    // Create Notion service
    const notionService = new NotionExerciseService(
      trainer.notionAccessToken,
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
      // Check if exercise already exists (by sourceSystem and sourceId)
      const notionExercisesForTrainer = await ctx.runQuery(api.notion.getExercisesBySourceSystem, { sourceSystem: "notion" });
      
      const existingExercises = notionExercisesForTrainer.filter(
        (ex) => ex.sourceId === notionExercise.name && !!ex.sourceId
      );
      if (existingExercises.length > 0 && !args.forceResync) {
        // Skip if already exists and not forcing resync
        results.push({ name: notionExercise.name, action: "skipped" });
        continue;
      }

      // Insert or update exercise
      const exerciseData = {
        libraryId: `notion-${trainer.notionDatabaseId}-${notionExercise.name}`,
        name: notionExercise.name,
        category: notionExercise.category || 'General',
        muscleGroup: notionExercise.primaryMuscles[0] || "General",
        primaryMuscles: notionExercise.primaryMuscles,
        secondaryMuscles: notionExercise.secondaryMuscles,
        equipment: notionExercise.equipment,
        overview: `Exercise from ${trainer.fullName}'s library`,
        instructions: notionExercise.instructions,
        benefits: [],
        videoUrl: notionExercise.videoUrl,
        imageUrl: undefined,
        difficulty: notionExercise.difficulty,
        sets: notionExercise.sets,
        reps: notionExercise.reps,
        tempo: undefined,
        rest: notionExercise.rest,
        tags: [`Trainer: ${trainer.fullName}`, "Notion Import"],
        weight: undefined,
        notes: undefined,
        duration: undefined,
        distance: undefined,
        rpe: undefined,
        power: undefined,
        cadence: undefined,
        heartRate: undefined,
        load: undefined,
        speed: undefined,
        bpm: undefined,
        calories: undefined,
        metadata: undefined,
        coachId: trainer.profileId,
        createdAt: Date.now(),
        difficultyOrder: getDifficultyOrder(notionExercise.difficulty),
        workoutCount: 0,
        trainerFirstName: trainer.firstName,
        trainerLastName: trainer.lastName,
        sourceSystem: "notion" as const,
        sourceId: notionExercise.name,
        isActive: true,
      };

      if (existingExercises.length > 0) {
        // Update existing
        await ctx.runMutation(api.notion.updateExercise, { exerciseId: existingExercises[0]._id, exerciseData });
        results.push({ name: notionExercise.name, action: "updated" });
      } else {
        // Insert new
        await ctx.runMutation(api.notion.insertExercise, { exerciseData });
        results.push({ name: notionExercise.name, action: "inserted" });
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

export const getExercisesBySourceSystem = query({
  args: { sourceSystem: v.union(v.literal("notion"), v.literal("seed"), v.literal("manual"), v.literal("import")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exercises")
      .withIndex("by_source_system", (q) => q.eq("sourceSystem", args.sourceSystem))
      .collect();
  },
});

export const updateExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    exerciseData: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.exerciseId, args.exerciseData);
  },
});

export const insertExercise = mutation({
  args: { exerciseData: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("exercises", args.exerciseData);
  },
});

function getDifficultyOrder(
  difficulty: "Beginner" | "Intermediate" | "Advanced"
): number {
  switch (difficulty) {
    case "Beginner":
      return 1;
    case "Intermediate":
      return 2;
    case "Advanced":
      return 3;
    default:
      return 2;
  }
}

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
        hasNotionConfig: !!(
          trainer.notionDatabaseId && trainer.notionAccessToken
        ),
        createdAt: trainer.createdAt,
      }));
  },
});