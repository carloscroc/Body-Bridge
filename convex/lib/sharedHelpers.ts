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
 * 5. Throw when existing record found
 * 6. Insert only when absent
 * 7. Return created record ID
 * 
 * @param ctx - Mutation context
 * @param args - Validated exercise arguments
 * @returns The ID of the created exercise
 * @throws Error if exercise with libraryId already exists
 */
export async function createCanonicalExercise(
  ctx: MutationCtx,
  args: {
    name: string;
    libraryId?: string;
    lifecycle?: "draft" | "ready" | "archived";
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

  // Query by_libraryId
  const existing = await ctx.db
    .query("exercises")
    .withIndex("by_libraryId", (q) => q.eq("libraryId", libraryId))
    .first();

  // Throw when existing record found
  if (existing) {
    throw new Error(`Exercise with libraryId "${libraryId}" already exists`);
  }

  // Insert only when absent
  const exerciseId = await ctx.db.insert("exercises", {
    libraryId,
    name: args.name,
    lifecycle: args.lifecycle || "draft",
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