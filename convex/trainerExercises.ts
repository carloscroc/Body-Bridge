import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import { assignExerciseToTrainerHelper } from "./lib/sharedHelpers";

// Non-exported admin secret checker (mirrors exercises.ts).
function isAdminSecret(secret?: string): boolean {
  return typeof secret === "string" && secret === process.env.ADMIN_SCRIPT_SECRET;
}

/**
 * Validate video URL with comprehensive security and format checks.
 * 
 * Rules:
 * - Non-empty after trimming
 * - Valid URL syntax
 * - HTTPS protocol only (no HTTP, javascript:, data:, file:)
 * - Distinguishes Notion page URLs from video URLs
 * 
 * @param url - The URL string to validate
 * @returns Object with isValid flag and error message if invalid
 * 
 * Test examples:
 * // Valid URLs:
 * isValidVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ") // ✓ valid
 * isValidVideoUrl("https://youtu.be/dQw4w9WgXcQ") // ✓ valid
 * isValidVideoUrl("https://vimeo.com/123456789") // ✓ valid
 * isValidVideoUrl("https://example.com/video.mp4") // ✓ valid
 * isValidVideoUrl("https://example.com/video.webm") // ✓ valid
 * 
 * // Invalid URLs:
 * isValidVideoUrl("") // ✗ empty
 * isValidVideoUrl("   ") // ✗ whitespace only
 * isValidVideoUrl("http://example.com/video.mp4") // ✗ HTTP not allowed
 * isValidVideoUrl("javascript:alert('xss')") // ✗ dangerous protocol
 * isValidVideoUrl("data:text/html,<script>") // ✗ dangerous protocol
 * isValidVideoUrl("file:///path/to/video.mp4") // ✗ file protocol not allowed
 * isValidVideoUrl("https://www.notion.so/page") // ✗ Notion page URL
 * isValidVideoUrl("not a url") // ✗ invalid URL format
 * isValidVideoUrl("https://") // ✗ missing hostname
 */
function isValidVideoUrl(url: string): { isValid: boolean; error?: string } {
  // Check if URL is empty or only whitespace
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "videoUrl cannot be empty or whitespace" };
  }

  // Check if it's a Notion page URL
  if (trimmed.includes("notion.so")) {
    return { isValid: false, error: "Notion page URLs are not valid video URLs" };
  }

  // Validate URL syntax
  try {
    const parsedUrl = new URL(trimmed);

    // Reject dangerous protocols
    const dangerousProtocols = ["javascript:", "data:", "file:", "http:"];
    if (dangerousProtocols.includes(parsedUrl.protocol)) {
      return { 
        isValid: false, 
        error: `URL protocol ${parsedUrl.protocol} is not allowed. Only HTTPS URLs are accepted.` 
      };
    }

    // Require HTTPS
    if (parsedUrl.protocol !== "https:") {
      return { 
        isValid: false, 
        error: `URL protocol ${parsedUrl.protocol} is not allowed. Only HTTPS URLs are accepted.` 
      };
    }

    // Additional validation: ensure hostname exists
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return { isValid: false, error: "URL must have a valid hostname" };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Resolve the single active trainer that the Exercise Library is currently
 * scoped to. The application today has exactly one trainer (Jasmine Trainer),
 * so "the active trainer" is well-defined as the unique row in `trainers`
 * with `isActive === true`.
 *
 * If multiple active trainers ever exist, this function returns the first by
 * `createdAt` and logs nothing — that is the documented temporary limitation
 * noted in the trainer-scoped visibility plan. No frontend selector exists,
 * and the trainer is NEVER chosen by the end user.
 *
 * This helper is the single source of truth for "which trainer does the app
 * show?" — derived entirely from Convex data, never hardcoded in the client.
 */
async function getActiveTrainer(ctx: QueryCtx): Promise<Doc<"trainers"> | null> {
  const trainer = await ctx.db
    .query("trainers")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .order("asc")
    .first();
  return trainer ?? null;
}

/**
 * Visibility predicate for a `trainerExercises` assignment.
 *
 * An assignment contributes a visible exercise to the library IFF:
 *   - `isActive === true`, AND
 *   - `videoUrl` is a non-empty, trimmed string.
 *
 * Note: this is the ONLY rule that decides whether an exercise is shown.
 * The canonical `exercises.videoUrl` is never consulted for visibility
 * and is never used as a fallback.
 */
function isVisibleAssignment(a: Doc<"trainerExercises">): boolean {
  return a.isActive === true
    && typeof a.videoUrl === "string"
    && a.videoUrl.trim().length > 0;
}

/**
 * Merge a canonical exercise doc with the trainer-specific assignment URL.
 *
 * CRITICAL: the returned `videoUrl` is ALWAYS `assignment.videoUrl`.
 * DO NOT add `?? exercise.videoUrl` as a fallback. If the assignment has
 * no valid URL, the exercise is filtered out before reaching this function.
 */
function mergeExerciseWithAssignment(
  exercise: Doc<"exercises">,
  assignment: Doc<"trainerExercises">,
) {
  return {
    ...exercise,
    // Override the canonical videoUrl with the trainer's assignment URL.
    // Forbidden: `assignment.videoUrl ?? exercise.videoUrl`
    videoUrl: assignment.videoUrl,
    trainerExerciseId: assignment._id,
    sourceSystem: assignment.sourceSystem,
  };
}

// =====================================================================
// READ — Trainer-scoped Exercise Library query
// =====================================================================

/**
 * Trainer-scoped Exercise Library query.
 *
 * Returns ONLY exercises that the active trainer has been assigned via
 * `trainerExercises`, with an active assignment and a non-empty
 * trainer-specific `videoUrl`. The canonical `exercises` table is joined
 * only to provide shared metadata (name, category, instructions, etc.) —
 * the playable URL is ALWAYS the assignment's URL.
 *
 * This query is the data source for `src/screens/ExercisesView.tsx` and
 * `src/components/ExercisePicker.tsx`. It replaces the previous
 * `api.exercises.advancedSearch` call that filtered by a hardcoded
 * trainer-name string in the frontend.
 *
 * The trainer is resolved on the backend via `getActiveTrainer(ctx)` —
 * the client does not supply and cannot choose a trainerId.
 *
 * Response shape matches `advancedSearch` so the existing frontend
 * pagination/accumulation code keeps working:
 *   {
 *     exercises: Array<MergedExercise>,
 *     page:      Array<MergedExercise>,  // alias
 *     isDone:    boolean,
 *     continueCursor: string | null,
 *     cursor:    string | null,           // alias
 *     status:    "Exhausted" | "CanLoadMore",
 *     numItems:  number,
 *   }
 *
 * Forbidden patterns (enforced here, not in the client):
 *   - `allExercises.filter(...)`            // never load global exercises
 *   - `assignment.videoUrl ?? exercise.videoUrl`  // never fall back
 *   - appending open-source exercises       // never mix in canonical-only rows
 */
export const listExercisesForTrainer = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    equipment: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // 1. Resolve the active trainer from Convex data. No client input.
    const trainer = await getActiveTrainer(ctx);
    if (!trainer) {
      return emptyResult();
    }

    // 2. Paginate the trainer's assignments via the by_trainer index.
    const cursor = args.paginationOpts?.cursor ?? args.cursor ?? null;
    const numItems = args.paginationOpts?.numItems ?? args.limit ?? 20;

    const assignmentPage = await ctx.db
      .query("trainerExercises")
      .withIndex("by_trainer", (q) => q.eq("trainerId", trainer._id))
      .paginate({ cursor, numItems });

    // 3. Keep only visible assignments (active + non-empty URL).
    const visibleAssignments = assignmentPage.page.filter(isVisibleAssignment);

    // 4. Resolve each canonical exercise. Skip missing references.
    const exercises: ReturnType<typeof mergeExerciseWithAssignment>[] = [];
    for (const assignment of visibleAssignments) {
      const exercise = await ctx.db.get(assignment.exerciseId);
      if (!exercise) continue;
      exercises.push(mergeExerciseWithAssignment(exercise, assignment));
    }

    // 5. Apply in-memory filters (scoped to the trainer's set only).
    const filtered = applyTrainerScopedFilters(exercises, args);

    return {
      exercises: filtered,
      page: filtered,
      isDone: assignmentPage.isDone,
      continueCursor: assignmentPage.continueCursor,
      cursor: assignmentPage.continueCursor,
      status: assignmentPage.isDone ? "Exhausted" : "CanLoadMore",
      numItems: filtered.length,
    };
  },
});

function emptyResult() {
  return {
    exercises: [],
    page: [],
    isDone: true,
    continueCursor: null,
    cursor: null,
    status: "Exhausted" as const,
    numItems: 0,
  };
}

/**
 * Apply text/category/difficulty/equipment filters to the already-resolved
 * trainer-scoped exercise set. These filters can NEVER cause a global
 * exercise to leak in — they only narrow the trainer's assigned set.
 */
function applyTrainerScopedFilters(
  exercises: ReturnType<typeof mergeExerciseWithAssignment>[],
  args: {
    query?: string;
    category?: string;
    difficulty?: string;
    equipment?: string[];
  },
) {
  let result = exercises;

  // Text search on name (case-insensitive substring).
  if (args.query && args.query.trim().length > 0) {
    const q = args.query.trim().toLowerCase();
    result = result.filter((e) => (e.name ?? "").toLowerCase().includes(q));
  }

  // Category filter (skip the "All" sentinel).
  if (args.category && args.category !== "All") {
    result = result.filter((e) => e.category === args.category);
  }

  // Equipment filter — exercise must include every requested equipment item.
  if (args.equipment && args.equipment.length > 0) {
    const requested = args.equipment;
    result = result.filter((e) => {
      const exEquip = Array.isArray(e.equipment) ? e.equipment : [];
      return requested.every((req) => exEquip.includes(req));
    });
  }

  return result;
}

// =====================================================================
// WRITE — Assign / Unassign (admin-gated; used by migration only)
// =====================================================================

/**
 * Assign (or update) a trainer → exercise relationship with a specific URL.
 *
 * Idempotent: keyed by `(trainerId, exerciseId)` via the
 * `by_trainer_exercise` index. If an assignment already exists it is
 * patched in place; otherwise a new row is inserted. No duplicates are
 * ever created.
 *
 * Source field rules:
 * - When sourceSystem="notion", sourceId is REQUIRED
 * - When sourceSystem="manual", sourceId may be absent
 *
 * Auth: admin-secret (for the legacy migration). A future trainer-write
 * path can add `requireTrainer` + `trainers.profileId === profile._id`
 * verification once live trainers have `profileId` populated.
 */
export const assignExerciseToTrainer = mutation({
  args: {
    trainerId: v.id("trainers"),
    exerciseId: v.id("exercises"),
    videoUrl: v.string(),
    sourceSystem: v.union(v.literal("notion"), v.literal("manual")),
    sourceId: v.optional(v.string()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth gate — admin-only for now (migration path).
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: assignExerciseToTrainer requires admin secret.");
    }

    // Validate the URL with proper URL validation
    const trimmedUrl = (args.videoUrl ?? "").trim();
    
    // Use the comprehensive video URL validation
    const validationResult = isValidVideoUrl(trimmedUrl);
    if (!validationResult.isValid) {
      throw new Error(`Invalid video URL: ${validationResult.error}`);
    }

    // Validate source field rules
    if (args.sourceSystem === "notion" && !args.sourceId) {
      throw new Error("sourceId is required when sourceSystem is 'notion'");
    }

    // Confirm trainer and exercise exist.
    const trainer = await ctx.db.get(args.trainerId);
    if (!trainer) {
      throw new Error(`Trainer not found: ${args.trainerId}`);
    }
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new Error(`Exercise not found: ${args.exerciseId}`);
    }

    // Use shared helper for assignment creation/update
    return await assignExerciseToTrainerHelper(ctx, {
      trainerId: args.trainerId,
      exerciseId: args.exerciseId,
      videoUrl: trimmedUrl,
      sourceSystem: args.sourceSystem,
      sourceId: args.sourceId,
    });
  },
});

/**
 * Deactivate a trainer → exercise assignment (soft delete).
 *
 * Does NOT delete the canonical exercise. The exercise may still be
 * assigned to other trainers (the join row is per-trainer).
 */
export const unassignExerciseFromTrainer = mutation({
  args: {
    trainerId: v.id("trainers"),
    exerciseId: v.id("exercises"),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: unassignExerciseFromTrainer requires admin secret.");
    }

    const existing = await ctx.db
      .query("trainerExercises")
      .withIndex("by_trainer_exercise", (q) =>
        q.eq("trainerId", args.trainerId).eq("exerciseId", args.exerciseId),
      )
      .unique();

    if (!existing) {
      return { _id: null, status: "not_found" as const };
    }

    await ctx.db.patch(existing._id, {
      isActive: false,
      updatedAt: Date.now(),
    });
    return { _id: existing._id, status: "deactivated" as const };
  },
});
