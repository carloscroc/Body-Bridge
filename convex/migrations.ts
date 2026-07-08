import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Bulk migration: Update all exercises with trainer data
 * This sets trainerFirstName, trainerLastName, and isActive on all exercises
 */
export const migrateTrainerData = internalMutation({
  args: {
    trainerFirstName: v.string(),
    trainerLastName: v.string(),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin secret check
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: admin secret required");
    }

    const { trainerFirstName, trainerLastName } = args;

    // Get all exercises
    const exercises = await ctx.db.query("exercises").collect();

    console.log(`Found ${exercises.length} exercises to update`);

    let updated = 0;
    let skipped = 0;

    for (const exercise of exercises) {
      // Skip if already has the correct trainer data
      if (exercise.trainerFirstName === trainerFirstName && 
          exercise.trainerLastName === trainerLastName &&
          exercise.isActive !== false) {
        skipped++;
        continue;
      }

      await ctx.db.patch(exercise._id, {
        trainerFirstName,
        trainerLastName,
        isActive: true,
      });
      updated++;
    }

    console.log(`Updated ${updated} exercises, skipped ${skipped}`);

    return { 
      success: true, 
      total: exercises.length, 
      updated, 
      skipped 
    };
  },
});

function isAdminSecret(secret?: string): boolean {
  // In production, this should check against a proper secret
  // For local development, we allow a test secret
  return secret === 'testsecret123' || 
         secret === process.env.ADMIN_SCRIPT_SECRET ||
         process.env.NODE_ENV !== 'production';
}