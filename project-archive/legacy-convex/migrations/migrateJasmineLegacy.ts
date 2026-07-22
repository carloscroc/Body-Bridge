import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

// Mirrors exercises.ts — admin-secret gate for migration scripts.
function isAdminSecret(secret?: string): boolean {
  return typeof secret === "string" && secret === process.env.ADMIN_SCRIPT_SECRET;
}

/**
 * Pre-migration audit (read-only).
 *
 * Reports the exact current state of the data so the migration's expected
 * counts can be verified before any writes happen. Run this BEFORE and
 * AFTER `migrateJasmineLegacyAssignments` to confirm the result.
 */
export const reportTrainerExerciseState = query({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: admin secret required.");
    }

    const trainers = await ctx.db.query("trainers").collect();
    const exercises = await ctx.db.query("exercises").collect();

    const jasmineTagged = exercises.filter(
      (e) => e.trainerFirstName === "Jasmine" && e.trainerLastName === "Trainer",
    );
    const isValidUrl = (e: Doc<"exercises">) =>
      typeof e.videoUrl === "string" && e.videoUrl.trim().length > 0;

    const jasmineWithValidUrl = jasmineTagged.filter(isValidUrl);
    const jasmineMissingUrl = jasmineTagged.filter((e) => !isValidUrl(e));
    const untagged = exercises.filter((e) => !e.trainerFirstName && !e.trainerLastName);

    // Existing trainerExercises rows (after migration this should match).
    let existingAssignments = 0;
    try {
      existingAssignments = (await ctx.db.query("trainerExercises").collect()).length;
    } catch {
      existingAssignments = -1; // table does not exist yet
    }

    return {
      trainersCount: trainers.length,
      trainers: trainers.map((t) => ({
        _id: t._id,
        fullName: t.fullName,
        email: t.email,
        isActive: t.isActive,
        profileId: t.profileId ?? null,
      })),
      exercisesTotal: exercises.length,
      jasmineCandidates: jasmineTagged.length,
      jasmineWithValidUrl: jasmineWithValidUrl.length,
      jasmineMissingUrl: jasmineMissingUrl.length,
      openSourceUntagged: untagged.length,
      trainerExercisesRowsExisting: existingAssignments,
    };
  },
});

/**
 * Idempotent Jasmine legacy migration.
 *
 * For each existing exercise tagged `(Jasmine, Trainer)` that ALSO has a
 * non-empty `videoUrl`, create or update a `trainerExercises` assignment
 * for the active trainer. Exercises without a valid URL are skipped.
 *
 * Idempotency: every assignment is keyed by `(trainerId, exerciseId)` via
 * the `by_trainer_exercise` index, so re-running never creates duplicates
 * — existing assignments are patched in place.
 *
 * What this does NOT do:
 *   - Touch the ~1001 open-source exercises (left untouched, unassigned).
 *   - Delete or duplicate any canonical exercise.
 *   - Create fake trainer assignments for unassigned exercises.
 *   - Fall back to canonical `videoUrl` — only rows with a valid URL migrate.
 *
 * Auth: admin-secret only. This is a one-time migration script.
 *
 * Usage:
 *   npx convex run migrations/migrateJasmineLegacy:migrateJasmineLegacyAssignments \
 *     '{ "adminSecret": "..." }'
 */
export const migrateJasmineLegacyAssignments = mutation({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: admin secret required.");
    }

    // 1. Resolve the active trainer. The application today has one trainer
    //    (Jasmine Trainer), resolved from `trainers` where isActive=true.
    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .first();

    if (!trainer) {
      return {
        ok: false,
        error: "No active trainer found in `trainers` table.",
        jasmineCandidates: 0,
        assignmentsCreated: 0,
        assignmentsUpdated: 0,
        missingUrlSkipped: 0,
        ambiguousTrainerSkipped: 0,
        openSourceExercisesLeftUnassigned: 0,
      };
    }

    // 2. Stream all Jasmine-tagged exercises via the legacy by_trainer index.
    const jasmineExercises = await ctx.db
      .query("exercises")
      .withIndex("by_trainer", (q) =>
        q.eq("trainerFirstName", "Jasmine").eq("trainerLastName", "Trainer"),
      )
      .collect();

    const isValidUrl = (e: Doc<"exercises">) =>
      typeof e.videoUrl === "string" && e.videoUrl.trim().length > 0;

    let assignmentsCreated = 0;
    let assignmentsUpdated = 0;
    let missingUrlSkipped = 0;
    const now = Date.now();

    for (const exercise of jasmineExercises) {
      // 3. Skip rows without a valid URL. These will not be visible in the
      //    trainer library — that is intentional and matches the visibility
      //    rule. They are NOT deleted.
      if (!isValidUrl(exercise)) {
        missingUrlSkipped++;
        continue;
      }

      // 4. Idempotent upsert via the (trainerId, exerciseId) index.
      const existing = await ctx.db
        .query("trainerExercises")
        .withIndex("by_trainer_exercise", (q) =>
          q.eq("trainerId", trainer._id).eq("exerciseId", exercise._id),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          videoUrl: exercise.videoUrl!.trim(),
          sourceType: "legacy",
          isActive: true,
          updatedAt: now,
        });
        assignmentsUpdated++;
      } else {
        await ctx.db.insert("trainerExercises", {
          trainerId: trainer._id,
          exerciseId: exercise._id,
          videoUrl: exercise.videoUrl!.trim(),
          sourceType: "legacy",
          isActive: true,
          assignedAt: exercise._creationTime ?? now,
          updatedAt: now,
        });
        assignmentsCreated++;
      }
    }

    // 5. Count the open-source exercises left unassigned (informational).
    const allExercises = await ctx.db.query("exercises").collect();
    const openSourceUntagged = allExercises.filter(
      (e) => !e.trainerFirstName && !e.trainerLastName,
    ).length;

    return {
      ok: true,
      trainerId: trainer._id as Id<"trainers">,
      trainerFullName: trainer.fullName,
      jasmineCandidates: jasmineExercises.length,
      assignmentsCreated,
      assignmentsUpdated,
      missingUrlSkipped,
      ambiguousTrainerSkipped: 0,
      openSourceExercisesLeftUnassigned: openSourceUntagged,
    };
  },
});

/**
 * Duplicate-detection audit.
 *
 * Convex indexes do not enforce uniqueness. This query reports any
 * `(trainerId, exerciseId)` pairs that have more than one assignment row,
 * so they can be repaired if present. Expected to return zero duplicates
 * after a clean migration.
 */
export const auditDuplicateAssignments = query({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: admin secret required.");
    }

    const all = await ctx.db.query("trainerExercises").collect();
    const byKey = new Map<string, typeof all>();
    for (const a of all) {
      const key = `${a.trainerId}|${a.exerciseId}`;
      const arr = byKey.get(key) ?? [];
      arr.push(a);
      byKey.set(key, arr);
    }

    const duplicates = [...byKey.entries()]
      .filter(([, arr]) => arr.length > 1)
      .map(([key, arr]) => {
        const [trainerId, exerciseId] = key.split("|");
        return {
          trainerId,
          exerciseId,
          count: arr.length,
          rowIds: arr.map((a) => a._id),
        };
      });

    return {
      totalAssignments: all.length,
      duplicatePairs: duplicates.length,
      duplicates,
    };
  },
});
