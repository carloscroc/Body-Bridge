import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Non-exported admin secret checker
function isAdminSecret(secret?: string): boolean {
  return typeof secret === "string" && secret === process.env.ADMIN_SCRIPT_SECRET;
}

/**
 * Create a new trainer record.
 * 
 * Creates a trainer with the specified fields. Uses Convex's built-in
 * _creationTime for the creation timestamp instead of a manual createdAt field.
 * 
 * @param firstName - Trainer's first name (required)
 * @param lastName - Trainer's last name (required)
 * @param email - Trainer's email address (optional)
 * @param isActive - Whether the trainer is active (defaults to true)
 * @returns The created trainer record's ID
 */
export const createTrainer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin gate for now (can be updated to use requireTrainer when needed)
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: createTrainer requires admin secret");
    }

    const fullName = `${args.firstName} ${args.lastName}`;
    const now = Date.now();

    const trainerId = await ctx.db.insert("trainers", {
      firstName: args.firstName,
      lastName: args.lastName,
      fullName,
      email: args.email,
      updatedAt: now,
      isActive: args.isActive ?? true,
    });

    return trainerId;
  },
});

/**
 * Get a trainer by ID.
 * 
 * @param trainerId - The ID of the trainer to retrieve
 * @returns The trainer record or null if not found
 */
export const getTrainer = query({
  args: {
    trainerId: v.id("trainers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.trainerId);
  },
});

/**
 * List all trainers, optionally including inactive ones.
 * 
 * @param includeInactive - Whether to include inactive trainers (defaults to false)
 * @returns Array of trainer records
 */
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
        updatedAt: trainer.updatedAt,
        hasNotionConfig: !!trainer.notionDatabaseId,
      }));
  },
});

/**
 * Get the active trainer (the one with isActive === true).
 * 
 * If multiple active trainers exist, returns the first one by creation time.
 * If no active trainer exists, returns null.
 * 
 * @returns The active trainer record or null if none found
 */
export const getActiveTrainer = query({
  args: {},
  handler: async (ctx) => {
    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .first();
    return trainer ?? null;
  },
});

/**
 * Update a trainer's information.
 * 
 * @param trainerId - The ID of the trainer to update
 * @param updates - Object containing fields to update
 * @returns The updated trainer record
 */
export const updateTrainer = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    trainerId: v.id("trainers"),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      notionDatabaseId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: updateTrainer requires admin secret");
    }

    const existing = await ctx.db.get(args.trainerId);
    if (!existing) {
      throw new Error(`Trainer not found: ${args.trainerId}`);
    }

    const updateData: any = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    // Update fullName if firstName or lastName changed
    if (args.updates.firstName || args.updates.lastName) {
      updateData.fullName = `${args.updates.firstName ?? existing.firstName} ${args.updates.lastName ?? existing.lastName}`;
    }

    await ctx.db.patch(args.trainerId, updateData);
    return await ctx.db.get(args.trainerId);
  },
});