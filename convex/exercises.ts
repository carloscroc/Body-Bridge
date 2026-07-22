import { query, mutation, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireTrainer, getMaybeProfileId } from "./lib/auth";
import { createCanonicalExercise, normalizeToLibraryId } from "./lib/sharedHelpers";
import type { Id } from "./_generated/dataModel";

// Non-exported admin secret checker (tiny helper)
function isAdminSecret(secret?: string): boolean {
  return typeof secret === 'string' && secret === process.env.ADMIN_SCRIPT_SECRET;
}

/**
 * List exercises
 * Replaces the deprecated fetchExercises
 */
export const list = query({
  args: {
    adminSecret: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Admin bypass: allow script access without trainer/identity
    if (isAdminSecret(args?.adminSecret)) {
      const q = ctx.db.query("exercises");
      if (args.limit) return await q.take(args.limit);
      return await q.collect();
    }

    // Allow unauthenticated access in development
    const allowUnauthenticated = true; // Temporary for verification
    const userId = await getAuthUserId(ctx);
    if (!userId && !allowUnauthenticated) return [];

    const q = ctx.db.query("exercises");
    if (args.limit) return await q.take(args.limit);
    return await q.collect();
  },
});

/**
 * Advanced Search with Pagination and Filters
 * Supports filtering by category, muscle group, equipment, and text search.
 */
export const advancedSearch = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    bodyRegion: v.optional(v.string()), // Renamed from muscle
    sortBy: v.optional(v.union(
      v.literal("popular"),
      v.literal("alphabetical")
    )),
    equipment: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // Convex pagination cursor
    onlyMyExercises: v.optional(v.boolean()), // If true, only show exercises created by the current user
    lifecycle: v.optional(v.union(v.literal("draft"), v.literal("ready"), v.literal("archived"))),
    // paginationOpts will be validated server-side using paginationOptsValidator
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const allowUnauthenticated = true;
    if (!userId && !allowUnauthenticated) {
      // Unauthenticated access: return unified pagination shape for usePaginatedQuery
      return {
        page: [],
        isDone: true,
        continueCursor: null,
        exercises: [],
        cursor: null,
        status: "Exhausted",
        numItems: 0,
      };
    }

    const limit = args.limit ?? 20;
    const lifecycleFilter = args.lifecycle ?? "ready"; // Default to ready exercises

    // 1. Full-text search (most restrictive, use if query exists)
    if (args.query && args.query.trim().length > 0) {
      // Build pagination options using server-validated paginationOpts or legacy args
      // Respect legacy args.cursor when paginationOpts.cursor is absent
      const cursorArg = (args.paginationOpts as any)?.cursor ?? args.cursor ?? null;
      const numItemsArg = (args.paginationOpts as any)?.numItems ?? limit;
      const paginationDirect = {
        cursor: cursorArg,
        numItems: numItemsArg,
      };
      let queryBuilder = ctx.db.query("exercises");

      // No trainer name filter - proceed with normal query
      const results = await queryBuilder.withSearchIndex('search_name', (q: any) => {
        let search = q.search('name', args.query!);
        if (args.category && args.category !== 'All') search = search.eq('category', args.category);
        if (args.bodyRegion && args.bodyRegion !== 'All') search = search.eq('bodyRegion', args.bodyRegion);
        search = search.eq('lifecycle', lifecycleFilter);
        return search;
      }).paginate(paginationDirect);
      return {
        page: results.page,
        isDone: results.isDone,
        continueCursor: results.continueCursor,
        // Backwards-compat aliases for existing callers
        exercises: results.page,
        cursor: results.continueCursor,
        status: results.isDone ? "Exhausted" : "CanLoadMore",
        numItems: results.page.length,
      };
    }

    // 2. Index-based filtering (if no text search)
    let paginatedResult: any;
    const poNonSearch = (args.paginationOpts ?? {}) as any;
    const cursorNon = poNonSearch?.cursor ?? args.cursor ?? null;
    const numItemsNon = poNonSearch?.numItems ?? limit;

    // Apply filter based on available criteria (use first applicable)
    if (args.category && args.category !== "All") {
      // Category filter - use fresh index query
      let categoryQueryBuilder = ctx.db.query("exercises").withIndex("by_category", (q) => 
        q.eq("category", args.category!)
      );
      paginatedResult = await categoryQueryBuilder.paginate({ cursor: cursorNon, numItems: numItemsNon });
      // Filter by lifecycle after pagination
      paginatedResult.page = paginatedResult.page.filter((ex: any) => ex.lifecycle === lifecycleFilter);
    } else if (args.bodyRegion && args.bodyRegion !== "All") {
      // Body region filter - use fresh index query
      let bodyRegionQueryBuilder = ctx.db.query("exercises").withIndex("by_bodyRegion", (q) => 
        q.eq("bodyRegion", args.bodyRegion!)
      );
      paginatedResult = await bodyRegionQueryBuilder.paginate({ cursor: cursorNon, numItems: numItemsNon });
      // Filter by lifecycle after pagination
      paginatedResult.page = paginatedResult.page.filter((ex: any) => ex.lifecycle === lifecycleFilter);
    } else {
      // Lifecycle filter - default filter
      let lifecycleQueryBuilder = ctx.db.query("exercises").withIndex("by_lifecycle", (q) => 
        q.eq("lifecycle", lifecycleFilter)
      );
      paginatedResult = await lifecycleQueryBuilder.paginate({ cursor: cursorNon, numItems: numItemsNon });
    }

    // Apply equipment filtering to non-search results if needed
    if (args.equipment && args.equipment.length > 0 && paginatedResult) {
      const equipmentToFilter = args.equipment;
      paginatedResult.page = paginatedResult.page.filter((ex: any) =>
        ex.equipment?.some((eq: string) => equipmentToFilter.includes(eq))
      );
    }


    return {
      page: paginatedResult.page,
      isDone: paginatedResult.isDone,
      continueCursor: paginatedResult.continueCursor,
      // Backwards-compat aliases
      exercises: paginatedResult.page,
      cursor: paginatedResult.continueCursor,
      status: paginatedResult.isDone ? "Exhausted" : "CanLoadMore",
      numItems: paginatedResult.page.length,
    };
  },
});

/**
 * Create a minimal draft exercise with only required fields.
 * Draft exercises are not visible in the main library until published.
 */
export const createDraftExercise = mutation({
  args: {
    name: v.string(),
    libraryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireTrainer(ctx);

    // Use shared helper for canonical exercise creation
    return await createCanonicalExercise(ctx, {
      name: args.name,
      libraryId: args.libraryId,
      lifecycle: "draft",
    });
  },
});

/**
 * Publish a draft exercise, making it visible in the library.
 * All required publication fields must be provided.
 */
export const publishExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    publicationData: v.object({
      category: v.string(),
      bodyRegion: v.string(), // Was muscleGroup, now bodyRegion
      primaryMuscles: v.array(v.string()),
      secondaryMuscles: v.array(v.string()),
      equipment: v.array(v.string()),
      instructions: v.array(v.string()),
      overview: v.optional(v.string()),
      benefits: v.optional(v.array(v.string())),
      tags: v.optional(v.array(v.string())),
      imageUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    if (exercise.lifecycle !== "draft") {
      throw new Error("Only draft exercises can be published");
    }

    await ctx.db.patch(args.exerciseId, {
      ...args.publicationData,
      lifecycle: "ready",
      overview: args.publicationData.overview || exercise.name,
      benefits: args.publicationData.benefits || [],
      tags: args.publicationData.tags || [],
    });

    return await ctx.db.get(args.exerciseId);
  },
});

export const addExercise = mutation({
  args: {
    name: v.string(),
    bodyRegion: v.string(), // Renamed from muscleGroup
    primaryMuscles: v.array(v.string()),
    secondaryMuscles: v.array(v.string()),
    equipment: v.array(v.string()),
    tags: v.array(v.string()),
    instructions: v.array(v.string()),
    // Extended fields
    category: v.optional(v.string()),
    overview: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    libraryId: v.optional(v.string()),
    lifecycle: v.optional(v.union(v.literal("draft"), v.literal("ready"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const profile = await requireTrainer(ctx);

    // Use shared helper for canonical exercise creation (checks for duplicates)
    const exerciseId = await createCanonicalExercise(ctx, {
      name: args.name,
      libraryId: args.libraryId,
      lifecycle: args.lifecycle || "ready",
    });

    // Fill in defaults for required fields in schema
    const exerciseData = {
      bodyRegion: args.bodyRegion,
      primaryMuscles: args.primaryMuscles,
      secondaryMuscles: args.secondaryMuscles,
      equipment: args.equipment,
      tags: args.tags,
      instructions: args.instructions,
      category: args.category || 'strength',
      overview: args.overview || args.name,
      benefits: args.benefits || [],
      imageUrl: args.imageUrl,
    };

    // Update the created exercise with full data
    await ctx.db.patch(exerciseId, exerciseData);
    return await ctx.db.get(exerciseId);
  },
});

export const updateExercise = mutation({
  args: {
    id: v.id("exercises"),
    updates: v.object({
      name: v.optional(v.string()),
      bodyRegion: v.optional(v.string()), // Renamed from muscleGroup
      primaryMuscles: v.optional(v.array(v.string())),
      secondaryMuscles: v.optional(v.array(v.string())),
      equipment: v.optional(v.array(v.string())),
      tags: v.optional(v.array(v.string())),
      instructions: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      overview: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      benefits: v.optional(v.array(v.string())),
      lifecycle: v.optional(v.union(v.literal("draft"), v.literal("ready"), v.literal("archived"))),
    }),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin bypass path
    if (isAdminSecret((args as any).adminSecret)) {
      const updates: any = (args as any).updates || {};
      const allowed = new Set(["imageUrl"]);
      for (const key of Object.keys(updates)) {
        if (!allowed.has(key)) {
          throw new Error("Admin bypass can only update imageUrl");
        }
      }
      await ctx.db.patch((args as any).id, updates);
      return await ctx.db.get((args as any).id);
    }
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, args.updates);
    return await ctx.db.get(args.id);
  },
});

export const deleteExercise = mutation({
  args: { id: v.id("exercises") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      // Idempotent delete: treat missing docs as already deleted.
      return true;
    }
    await ctx.db.delete(args.id);
    return true;
  },
});

/**
 * Generate a short-lived upload URL for exercise media
 */
export const generateUploadUrl = mutation({
  args: { adminSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Admin bypass for script-based upload URL generation
    if (isAdminSecret(args?.adminSecret)) {
      return await ctx.storage.generateUploadUrl();
    }
    await requireTrainer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a public URL for a storage ID
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get unique categories for filtering
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const exercises = await ctx.db.query("exercises").collect();
    // Manual aggregation since Convex doesn't support distinct/groupBy native yet
    const categories = new Set(exercises.map((e) => e.category).filter(Boolean));
    return Array.from(categories).sort();
  },
});

/**
 * Get available body regions for filtering
 */
export const getBodyRegions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const exercises = await ctx.db.query("exercises").collect();
    // Manual aggregation since Convex doesn't support distinct/groupBy native yet
    const bodyRegions = new Set(exercises.map((e) => e.bodyRegion).filter(Boolean));
    return Array.from(bodyRegions).sort();
  },
});

export const batchCreate = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    exercises: v.array(v.object({
      name: v.string(),
      bodyRegion: v.string(), // Renamed from muscleGroup
      primaryMuscles: v.array(v.string()),
      secondaryMuscles: v.array(v.string()),
      equipment: v.array(v.string()),
      tags: v.array(v.string()),
      instructions: v.array(v.string()),
      category: v.optional(v.string()),
      overview: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      benefits: v.optional(v.array(v.string())),
      libraryId: v.optional(v.string()),
      lifecycle: v.optional(v.union(v.literal("draft"), v.literal("ready"), v.literal("archived"))),
    })),
  },
  handler: async (ctx, args) => {
    // batchCreate is a seed function - allow unauthenticated access for development
    // The admin secret check is optional for production safety, but not required

    const results = [];
    for (const ex of args.exercises) {
      // Generate or normalize libraryId
      const libraryId = ex.libraryId 
        ? normalizeToLibraryId(ex.libraryId)
        : normalizeToLibraryId(ex.name);

      // Check for duplicates by libraryId (canonical prevention)
      const existing = await ctx.db
        .query("exercises")
        .withIndex("by_libraryId", (q) => q.eq("libraryId", libraryId))
        .first();

      if (existing) {
        results.push({ libraryId, action: "skipped_duplicate", reason: "libraryId_exists" });
        continue;
      }

      await ctx.db.insert("exercises", {
        libraryId,
        name: ex.name,
        bodyRegion: ex.bodyRegion,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        tags: ex.tags,
        instructions: ex.instructions,
        category: ex.category || "strength",
        overview: ex.overview || ex.name,
        benefits: ex.benefits || [],
        imageUrl: ex.imageUrl,
        lifecycle: ex.lifecycle || "ready",
      });
      results.push({ libraryId, action: "created" });
    }
    
    return { processed: args.exercises.length, results };
  },
});


/**
 * Migration: Add firstName and lastName to profiles
 * Splits existing fullName into first and last name
 */
export const migrateProfileNames = mutation({
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();

    for (const profile of profiles) {
      if (!profile.fullName && (profile.firstName || profile.lastName)) {
        // Already has separate names, skip
        continue;
      }

      if (profile.fullName && !profile.firstName) {
        // Split fullName into firstName and lastName
        const nameParts = profile.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        await ctx.db.patch(profile._id, {
          firstName,
          lastName,
        });
      }
    }

    return { processed: profiles.length };
  },
});