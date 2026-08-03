import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";

/**
 * Normalize a string to a stable libraryId format.
 * Converts to lowercase, replaces spaces and special chars with hyphens,
 * removes consecutive hyphens, and trims.
 */
export function normalizeToLibraryId(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Shared server-only helper for canonical exercise creation.
 * 
 * This helper contains the core business logic for creating exercises
 * with duplicate prevention. Both public mutations and internal tests
 * must use this helper to ensure consistent behavior.
 * 
 * Requirements:
 * 1. Accept MutationCtx and validated arguments
 * 2. Normalize libraryId
 * 3. Reject empty normalized identifier
 * 4. Query by_libraryId index
 * 5. Return existing ID instead of throwing (idempotent)
 * 6. Query by_sourceSystem_sourceId index (double dedup)
 * 7. Insert only when absent
 * 8. Return created or existing record ID
 * 
 * @param ctx - Mutation context
 * @param args - Validated exercise arguments
 * @returns The ID of the created or existing exercise
 */
export async function createCanonicalExercise(
  ctx: MutationCtx,
  args: {
    name: string;
    libraryId?: string;
    lifecycle?: "draft" | "ready" | "archived";

    // Notion fields
    sourceSystem?: "notion" | "manual";
    sourceId?: string;
    category?: string;
    bodyRegion?: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: string[];
    difficulty?: "Beginner" | "Intermediate" | "Advanced";
    overview?: string;
    instructions?: string;
    coverPhoto?: string;
  }
): Promise<Id<"exercises">> {
  // Generate or normalize libraryId
  const libraryId = args.libraryId 
    ? normalizeToLibraryId(args.libraryId)
    : normalizeToLibraryId(args.name);

  // Reject empty normalized identifier
  if (!libraryId || libraryId.length === 0) {
    throw new Error("libraryId cannot be empty after normalization");
  }

  // Double dedup: First check by_libraryId
  const existingByLibraryId = await ctx.db
    .query("exercises")
    .withIndex("by_libraryId", (q) => q.eq("libraryId", libraryId))
    .first();

  if (existingByLibraryId) {
    return existingByLibraryId._id;
  }

  // Double dedup: Also check by_sourceSystem_sourceId if provided
  if (args.sourceSystem && args.sourceId) {
    const existingBySource = await ctx.db
      .query("exercises")
      .withIndex("by_sourceSystem_sourceId", (q) =>
        q.eq("sourceSystem", args.sourceSystem).eq("sourceId", args.sourceId)
      )
      .first();

    if (existingBySource) {
      return existingBySource._id;
    }
  }

  // Insert only when absent
  const exerciseId = await ctx.db.insert("exercises", {
    libraryId,
    name: args.name,
    lifecycle: args.lifecycle || "draft",
    category: args.category,
    bodyRegion: args.bodyRegion,
    primaryMuscles: args.primaryMuscles,
    secondaryMuscles: args.secondaryMuscles,
    equipment: args.equipment,
    difficulty: args.difficulty,
    overview: args.overview,
    instructions: args.instructions,
    coverPhoto: args.coverPhoto,
    sourceSystem: args.sourceSystem,
    sourceId: args.sourceId,
  });

  return exerciseId;
}

/**
 * Shared server-only helper for assignment creation/update.
 * 
 * This helper contains the core business logic for assigning exercises
 * to trainers with idempotent behavior. Both public mutations and internal
 * tests must use this helper to ensure consistent behavior.
 * 
 * Requirements:
 * 1. Query by_trainer_exercise index
 * 2. When assignment exists:
 *    - Patch that exact row
 *    - Reactivate if needed
 *    - Return same ID with status "updated"
 * 3. Otherwise:
 *    - Insert one row
 *    - Return status "created"
 * 
 * @param ctx - Mutation context
 * @param args - Validated assignment arguments
 * @returns Object with assignment ID and status
 */
export async function assignExerciseToTrainerHelper(
  ctx: MutationCtx,
  args: {
    trainerId: Id<"trainers">;
    exerciseId: Id<"exercises">;
    videoUrl: string;
    sourceSystem: "notion" | "manual";
    sourceId?: string;
  }
): Promise<{ _id: Id<"trainerExercises">; status: "created" | "updated" }> {
  // Query by_trainer_exercise
  const existing = await ctx.db
    .query("trainerExercises")
    .withIndex("by_trainer_exercise", (q) =>
      q.eq("trainerId", args.trainerId).eq("exerciseId", args.exerciseId),
    )
    .unique();

  const now = Date.now();
  const trimmedUrl = args.videoUrl.trim();

  if (existing) {
    // Patch that exact row
    await ctx.db.patch(existing._id, {
      videoUrl: trimmedUrl,
      sourceSystem: args.sourceSystem,
      sourceId: args.sourceId ?? existing.sourceId,
      isActive: true, // Reactivate if needed
      updatedAt: now,
    });
    
    // Return same ID with status "updated"
    return { _id: existing._id, status: "updated" as const };
  }

  // Insert one row
  const newId: Id<"trainerExercises"> = await ctx.db.insert("trainerExercises", {
    trainerId: args.trainerId,
    exerciseId: args.exerciseId,
    videoUrl: trimmedUrl,
    sourceSystem: args.sourceSystem,
    sourceId: args.sourceId,
    isActive: true,
    assignedAt: now,
    updatedAt: now,
  });

  // Return status "created"
  return { _id: newId, status: "created" as const };
}