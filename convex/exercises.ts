import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireTrainer, getMaybeProfileId } from "./lib/auth";
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
    const userId = await getAuthUserId(ctx);
    const allowUnauthenticated = process.env.VITE_DEV_AUTH === "true" || process.env.ALLOW_UNAUTHENTICATED_EXERCISES === "1";
    if (!userId && !allowUnauthenticated) return [];
    
    const q = ctx.db.query("exercises");
    if (args.limit) return await q.take(args.limit);
    return await q.collect();
  },
});

/**
 * Advanced Search with Pagination and Filters
 * Supports filtering by category, muscle group, difficulty, equipment, and text search.
 */
export const advancedSearch = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    muscle: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("popular"),
      v.literal("difficulty"),
      v.literal("alphabetical")
    )),
    difficulty: v.optional(v.union(
      v.literal("Beginner"),
      v.literal("Intermediate"),
      v.literal("Advanced")
    )),
    equipment: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // Convex pagination cursor
    coachId: v.optional(v.id("profiles")), // Filter by specific coach
    onlyMyExercises: v.optional(v.boolean()), // If true, only show exercises created by the current user
    // paginationOpts will be validated server-side using paginationOptsValidator
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const allowUnauthenticated = process.env.VITE_DEV_AUTH === "true" || process.env.ALLOW_UNAUTHENTICATED_EXERCISES === "1";
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
    let coachFilterId: Id<"profiles"> | undefined = args.coachId;

    if (args.onlyMyExercises && userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (profile) {
        coachFilterId = profile._id;
      }
    }

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
      const results = await ctx.db
        .query("exercises")
        .withSearchIndex("search_name", (q: any) => {
          let search = q.search("name", args.query!);
          if (args.category && args.category !== "All") search = search.eq("category", args.category);
          if (args.muscle && args.muscle !== "All") search = search.eq("muscleGroup", args.muscle);
          if (args.difficulty && (args.difficulty as string) !== "All") search = search.eq("difficulty", args.difficulty);
           if (coachFilterId) search = search.eq("coachId", coachFilterId);
           return search;
          })
        .paginate(paginationDirect);

      // Server-side filtering for equipment
      let filtered = results.page;
      if (args.equipment && args.equipment.length > 0) {
        filtered = results.page.filter(ex =>
          ex.equipment?.some((eq: string) => args.equipment!.includes(eq))
        );
      }

      // Normalize response shape across all paths to be compatible with usePaginatedQuery
      return {
        page: filtered,
        isDone: results.isDone,
        continueCursor: results.continueCursor,
        // Backwards-compat aliases for existing callers
        exercises: filtered,
        cursor: results.continueCursor,
        status: results.isDone ? "Exhausted" : "CanLoadMore",
        numItems: filtered.length,
      };
    }

    // 2. Index-based filtering (if no text search)
    let paginatedResult: any;

    const poNonSearch = (args.paginationOpts ?? {}) as any;
    const cursorNon = poNonSearch?.cursor ?? args.cursor ?? null;
    const numItemsNon = poNonSearch?.numItems ?? limit;
    if (coachFilterId) {
      paginatedResult = await ctx.db
        .query("exercises")
        .withIndex("by_coach", (q) => q.eq("coachId", coachFilterId))
        .paginate({ cursor: cursorNon, numItems: numItemsNon });
    } else if (args.category && args.category !== "All") {
      paginatedResult = await ctx.db
        .query("exercises")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .paginate({ cursor: cursorNon, numItems: numItemsNon });
    } else if (args.muscle && args.muscle !== "All") {
      paginatedResult = await ctx.db
        .query("exercises")
        .withIndex("by_muscle", (q) => q.eq("muscleGroup", args.muscle!))
        .paginate({ cursor: cursorNon, numItems: numItemsNon });
    } else {
      // No coach/category/muscle filters applied. Support sorting approaches without text query.
      if ((args.sortBy as string) === "difficulty") {
        // Order by difficultyOrder, then by name using dedicated index
        paginatedResult = await ctx.db
          .query("exercises")
          .withIndex("by_difficultyOrder_name", (q) => q)
          .paginate({ cursor: cursorNon, numItems: numItemsNon });
      } else if (args.sortBy === "popular") {
        // Use current user's profile to sort by popularity, then include never-used exercises.
        const profileId = await getMaybeProfileId(ctx);
        if (profileId) {
          const usageRows = await ctx.db
            .query("exerciseUsage")
            .withIndex("by_user_count", (q) => q.eq("userId", profileId))
            .order("desc")
            .collect();

          // Preserve fallback behavior when usage is empty.
          if (usageRows.length === 0) {
            if (!cursorNon) {
              paginatedResult = await ctx.db
                .query("exercises")
                .withIndex("by_name", (q) => q)
                .paginate({ cursor: cursorNon, numItems: numItemsNon });
            } else {
              paginatedResult = {
                page: [],
                isDone: true,
                continueCursor: null,
              };
            }
          } else {
            const startOffset = (() => {
              if (!cursorNon || !cursorNon.startsWith("popular:")) return 0;
              const parsed = Number(cursorNon.slice("popular:".length));
              if (!Number.isFinite(parsed) || parsed < 0) return 0;
              return Math.floor(parsed);
            })();

            const usageByExerciseId = new Map<string, number>();
            for (const row of usageRows) {
              const key = String(row.exerciseId);
              const existing = usageByExerciseId.get(key);
              if (existing === undefined || row.count > existing) {
                usageByExerciseId.set(key, row.count);
              }
            }

            const allExercises = await ctx.db.query("exercises").collect();
            const sortedExercises = allExercises
              .map((exercise) => ({
                exercise,
                usageCount: usageByExerciseId.get(String(exercise._id)) ?? 0,
              }))
              .sort((a, b) => {
                if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
                const difficultyA = a.exercise.difficultyOrder ?? Number.MAX_SAFE_INTEGER;
                const difficultyB = b.exercise.difficultyOrder ?? Number.MAX_SAFE_INTEGER;
                if (difficultyA !== difficultyB) return difficultyA - difficultyB;
                const nameCompare = a.exercise.name.localeCompare(b.exercise.name);
                if (nameCompare !== 0) return nameCompare;
                return String(a.exercise._id).localeCompare(String(b.exercise._id));
              })
              .map((item) => item.exercise);

            const page = sortedExercises.slice(startOffset, startOffset + numItemsNon);
            const nextOffset = startOffset + page.length;
            const isDone = nextOffset >= sortedExercises.length;

            paginatedResult = {
              page,
              isDone,
              continueCursor: isDone ? null : `popular:${nextOffset}`,
            };
          }
        } else {
          paginatedResult = await ctx.db
            .query("exercises")
            .withIndex("by_name", (q) => q)
            .paginate({ cursor: cursorNon, numItems: numItemsNon });
        }
      } else if (args.sortBy === "alphabetical") {
        // Existing alphabetical sorting path
        paginatedResult = await ctx.db
          .query("exercises")
          .withIndex("by_name", (q) => q)
          .paginate({ cursor: cursorNon, numItems: numItemsNon });
      } else {
        // Default order (desc) remains unchanged for non-specified cases
        paginatedResult = await ctx.db
          .query("exercises")
          .order("desc") // Default order
          .paginate({ cursor: cursorNon, numItems: numItemsNon });
      }
    }

    // Apply equipment filtering to non-search results if needed
    if (args.equipment && args.equipment.length > 0 && paginatedResult) {
      paginatedResult.page = paginatedResult.page.filter(ex =>
        ex.equipment?.some((eq: string) => args.equipment!.includes(eq))
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

const MOCK_EXERCISES = [
  {
    name: "Barbell Squat",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    secondaryMuscles: ["Lower Back", "Core"],
    equipment: ["Barbell", "Squat Rack"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "12",
    instructions: [
      "Set up the barbell on the rack at shoulder height.",
      "Step under the bar and rest it on your upper traps.",
      "Unrack the bar and take two steps back.",
      "Lower your hips back and down until your thighs are parallel to the floor.",
      "Drive back up to the starting position."
    ],
    imageUrl: "https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Dumbbell Press",
    category: "Strength",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals", "Triceps", "Shoulders"],
    secondaryMuscles: ["Core"],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Lie back on a flat bench with a dumbbell in each hand.",
      "Hold the weights above your chest with arms extended.",
      "Lower the weights to your chest level.",
      "Press them back up to the starting position."
    ],
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Deadlift",
    category: "Power",
    muscleGroup: "Back",
    primaryMuscles: ["Hamstrings", "Glutes", "Lower Back"],
    secondaryMuscles: ["Upper Back", "Forearms", "Core"],
    equipment: ["Barbell"],
    difficulty: "Advanced",
    sets: "3",
    reps: "8",
    instructions: [
      "Stand with feet hip-width apart, barbell over mid-foot.",
      "Bend at the hips and knees to grip the bar.",
      "Keep your back flat and chest up.",
      "Lift the bar by extending your hips and knees.",
      "Lower the bar back to the floor with control."
    ],
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Push-ups",
    category: "Strength",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals", "Triceps", "Shoulders"],
    secondaryMuscles: ["Core"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    sets: "3",
    reps: "15",
    instructions: [
      "Start in a plank position with hands slightly wider than shoulders.",
      "Lower your body until your chest nearly touches the floor.",
      "Push back up to the starting position.",
      "Keep your core engaged and back straight throughout."
    ],
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Pull-ups",
    category: "Strength",
    muscleGroup: "Back",
    primaryMuscles: ["Lats", "Biceps", "Upper Back"],
    secondaryMuscles: ["Shoulders", "Core"],
    equipment: ["Pull-up Bar"],
    difficulty: "Advanced",
    sets: "3",
    reps: "8",
    instructions: [
      "Grip the pull-up bar with hands wider than shoulders.",
      "Pull your body up until your chin is over the bar.",
      "Lower yourself back down with control.",
      "Avoid swinging your legs."
    ],
    imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Plank",
    category: "Core",
    muscleGroup: "Core",
    primaryMuscles: ["Abs", "Obliques"],
    secondaryMuscles: ["Shoulders", "Back"],
    equipment: ["None"],
    difficulty: "Beginner",
    sets: "3",
    reps: "60s",
    instructions: [
      "Start in a push-up position but with weight on your forearms.",
      "Keep your body in a straight line from head to heels.",
      "Engage your core and hold the position."
    ],
    imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab26d16?auto=format&fit=crop&q=80&w=400"
  }
];

export const seed = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const isAdmin = args.adminSecret === process.env.ADMIN_SCRIPT_SECRET;
    const isDev = process.env.VITE_DEV_AUTH === "true";
    
    if (!userId && !isAdmin && !isDev) {
      throw new Error("Unauthenticated");
    }

    if (args.clearExisting) {
      const existing = await ctx.db.query("exercises").collect();
      for (const ex of existing) {
        await ctx.db.delete(ex._id);
      }
      
      // Also clear usage to avoid broken references
      const usages = await ctx.db.query("exerciseUsage").collect();
      for (const u of usages) {
        await ctx.db.delete(u._id);
      }
    }

    let count = 0;
    for (const ex of MOCK_EXERCISES) {
      const existing = await ctx.db
        .query("exercises")
        .withIndex("by_name", (q) => q.eq("name", ex.name))
        .first();
      
      if (!existing || args.clearExisting) {
        await ctx.db.insert("exercises", {
          ...ex,
          libraryId: `seed-${ex.name.toLowerCase().replace(/\s+/g, "-")}`,
          overview: `${ex.name} is a great exercise for targeting ${ex.muscleGroup.toLowerCase()}.`,
          benefits: ["Increased strength", "Improved muscle tone", "Better functional movement"],
          tags: [ex.category.toLowerCase(), ex.muscleGroup.toLowerCase()],
          difficultyOrder: ex.difficulty === "Beginner" ? 1 : ex.difficulty === "Intermediate" ? 2 : 3,
          createdAt: Date.now(),
        } as any);
        count++;
      }
    }

    return { ok: true, seededCount: count };
  },
});

export const addExercise = mutation({
  args: {
    name: v.string(),
    muscleGroup: v.string(),
    primaryMuscles: v.array(v.string()),
    secondaryMuscles: v.array(v.string()),
    difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
    sets: v.string(),
    reps: v.string(),
    tempo: v.optional(v.string()),
    rest: v.optional(v.string()),
    weight: v.optional(v.string()),
    notes: v.optional(v.string()),
    duration: v.optional(v.string()),
    distance: v.optional(v.string()),
    rpe: v.optional(v.number()),
    power: v.optional(v.string()),
    cadence: v.optional(v.string()),
    heartRate: v.optional(v.string()),
    load: v.optional(v.string()),
    speed: v.optional(v.string()),
    bpm: v.optional(v.number()),
    calories: v.optional(v.number()),
    equipment: v.array(v.string()),
    tags: v.array(v.string()),
    videoUrl: v.optional(v.string()),
    instructions: v.array(v.string()),
    // Extended fields
    category: v.optional(v.string()),
    overview: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    libraryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireTrainer(ctx);
    
    // Destructure to separate optional fields that need defaults
    const { 
      category, 
      overview, 
      benefits, 
      libraryId, 
      ...rest 
    } = args;

    // Fill in defaults for required fields in schema
    const exercise = {
      ...rest,
      category: category || 'strength',
      overview: overview || args.name,
      benefits: benefits || [],
      libraryId: libraryId || `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      coachId: profile._id,
      createdAt: Date.now(),
      difficultyOrder: rest.difficulty === "Beginner" ? 1 : rest.difficulty === "Intermediate" ? 2 : 3,
    };
    
    return await ctx.db.insert("exercises", exercise);
  },
});

export const updateExercise = mutation({
  args: {
    id: v.id("exercises"),
    updates: v.object({
      name: v.optional(v.string()),
      muscleGroup: v.optional(v.string()),
      primaryMuscles: v.optional(v.array(v.string())),
      secondaryMuscles: v.optional(v.array(v.string())),
      difficulty: v.optional(v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced"))),
      sets: v.optional(v.string()),
      reps: v.optional(v.string()),
      tempo: v.optional(v.string()),
      rest: v.optional(v.string()),
      weight: v.optional(v.string()),
      notes: v.optional(v.string()),
      duration: v.optional(v.string()),
      distance: v.optional(v.string()),
      rpe: v.optional(v.number()),
      power: v.optional(v.string()),
      cadence: v.optional(v.string()),
      heartRate: v.optional(v.string()),
      load: v.optional(v.string()),
      speed: v.optional(v.string()),
      bpm: v.optional(v.number()),
      calories: v.optional(v.number()),
      equipment: v.optional(v.array(v.string())),
      tags: v.optional(v.array(v.string())),
      videoUrl: v.optional(v.string()),
      instructions: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      overview: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      benefits: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()),
    }),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Admin bypass path
    if (isAdminSecret((args as any).adminSecret)) {
      const updates: any = (args as any).updates || {};
      const allowed = new Set(["imageUrl", "metadata"]);
      for (const key of Object.keys(updates)) {
        if (!allowed.has(key)) {
          throw new Error("Admin bypass can only update imageUrl and metadata");
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
    const categories = new Set(exercises.map((e) => e.category || e.muscleGroup).filter(Boolean));
    return Array.from(categories).sort();
  },
});

export const batchCreate = mutation({
  args: {
    exercises: v.array(v.object({
      name: v.string(),
      muscleGroup: v.string(),
      primaryMuscles: v.array(v.string()),
      secondaryMuscles: v.array(v.string()),
      difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
      sets: v.string(),
      reps: v.string(),
      tempo: v.optional(v.string()),
      rest: v.optional(v.string()),
      weight: v.optional(v.string()),
      notes: v.optional(v.string()),
      duration: v.optional(v.string()),
      distance: v.optional(v.string()),
      rpe: v.optional(v.number()),
      power: v.optional(v.string()),
      cadence: v.optional(v.string()),
      heartRate: v.optional(v.string()),
      load: v.optional(v.string()),
      speed: v.optional(v.string()),
      bpm: v.optional(v.number()),
      calories: v.optional(v.number()),
      equipment: v.array(v.string()),
      tags: v.array(v.string()),
      videoUrl: v.optional(v.string()),
      instructions: v.array(v.string()),
      category: v.optional(v.string()),
      overview: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      benefits: v.optional(v.array(v.string())),
      libraryId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const profile = await requireTrainer(ctx);
    for (const ex of args.exercises) {
      // Check for duplicates by libraryId first (preferred)
      const existingByLibraryId = ex.libraryId
        ? await ctx.db
            .query("exercises")
            .withIndex("by_libraryId", (q) => q.eq("libraryId", ex.libraryId!))
            .first()
        : null;

      // Fallback: exact name match from full-text search results
      const existingByName = !existingByLibraryId
        ? (await ctx.db
            .query("exercises")
            .withSearchIndex("search_name", (q) => q.search("name", ex.name))
            .take(25))
            .find((row) => row.name === ex.name)
        : null;

      const existing = existingByLibraryId ?? existingByName;

      if (!existing) {
        await ctx.db.insert("exercises", {
          ...ex,
          category: ex.category || "strength",
          overview: ex.overview || ex.name,
          benefits: ex.benefits || [],
          libraryId: ex.libraryId || `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          coachId: profile._id,
          createdAt: Date.now(),
        });
      }
    }
  },
});
