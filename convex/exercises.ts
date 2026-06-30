import { query, mutation, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
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
    showInactive: v.optional(v.boolean()), // Default: false (hide inactive exercises)
    trainerName: v.optional(v.string()), // Filter by trainer name (e.g., "Jasmine Smith")
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
      let queryBuilder = ctx.db.query("exercises");
      
      // Apply isActive filter: default to true (hide inactive exercises)
      const showInactive = args.showInactive ?? false;
      if (!showInactive) {
        queryBuilder = queryBuilder.filter((q) => q.eq(q.field("isActive"), true));
      }
      
      // Apply trainer name filter if provided
      if (args.trainerName) {
        const [firstName, ...lastNameParts] = args.trainerName.trim().split(' ');
        const lastName = lastNameParts.join(' ');
        
        // First get all results from search/index
        const searchResults = await queryBuilder.withSearchIndex('search_name', (q: any) => {
          let search = q.search('name', args.query!);
          if (args.category && args.category !== 'All') search = search.eq('category', args.category);
          if (args.muscle && args.muscle !== 'All') search = search.eq('muscleGroup', args.muscle);
          if (args.difficulty && (args.difficulty as string) !== 'All') search = search.eq('difficulty', args.difficulty);
          if (coachFilterId) search = search.eq('coachId', coachFilterId);
          if (!showInactive) search = search.eq('isActive', true);
          return search;
        }).collect();
        
        // Then filter by trainer name in-memory
        const filteredResults = searchResults.filter(exercise => {
          const firstNameMatch = !firstName || exercise.trainerFirstName === firstName;
          const lastNameMatch = !lastName || exercise.trainerLastName === lastName;
          return firstNameMatch && lastNameMatch;
        });
        
        // Rebuild query to return only filtered results
        if (filteredResults.length > 0) {
          const ids = filteredResults.map(e => e._id);
          queryBuilder = ctx.db.query('exercises').filter((q: any) => q.in(q.field('_id'), ids));
        } else {
          // No matches - return empty result
          queryBuilder = ctx.db.query('exercises').filter((q: any) => q.neq(q.field('_id'), '_placeholder_never_match_'));
        }
      } else {
        // No trainer name filter - proceed with normal query
        const results = await queryBuilder.withSearchIndex('search_name', (q: any) => {
          let search = q.search('name', args.query!);
          if (args.category && args.category !== 'All') search = search.eq('category', args.category);
          if (args.muscle && args.muscle !== 'All') search = search.eq('muscleGroup', args.muscle);
          if (args.difficulty && (args.difficulty as string) !== 'All') search = search.eq('difficulty', args.difficulty);
          if (coachFilterId) search = search.eq('coachId', coachFilterId);
          if (!showInactive) search = search.eq('isActive', true);
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
      // Trainer name filter was applied - paginate filtered results
      const paginatedResults = await queryBuilder.paginate(paginationDirect);
      return {
        page: paginatedResults.page,
        isDone: paginatedResults.isDone,
        continueCursor: paginatedResults.continueCursor,
        // Backwards-compat aliases for existing callers
        exercises: paginatedResults.page,
        cursor: paginatedResults.continueCursor,
        status: paginatedResults.isDone ? "Exhausted" : "CanLoadMore",
        numItems: paginatedResults.page.length,
      };
    }

    // 2. Index-based filtering (if no text search)
    let paginatedResult: any;
    const showInactive = args.showInactive ?? false;
    let queryBuilder = ctx.db.query("exercises");
    if (!showInactive) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("isActive"), true));
    }
    const poNonSearch = (args.paginationOpts ?? {}) as any;
    const cursorNon = poNonSearch?.cursor ?? args.cursor ?? null;
    const numItemsNon = poNonSearch?.numItems ?? limit;
    // Apply coach filter if provided
    if (coachFilterId) {
      paginatedResult = await queryBuilder.withIndex("by_coach", (q) => q.eq("coachId", coachFilterId))
        .paginate({ cursor: cursorNon, numItems: numItemsNon });
      }
      // Apply category filter if provided
      if (args.category && args.category !== "All") {
        paginatedResult = await queryBuilder.withIndex("by_category", (q) => q.eq("category", args.category!))
          .paginate({ cursor: cursorNon, numItems: numItemsNon });
      } else if (args.muscle && args.muscle !== "All") {
        paginatedResult = await queryBuilder.withIndex("by_muscle", (q) => q.eq("muscleGroup", args.muscle!))
          .paginate({ cursor: cursorNon, numItems: numItemsNon });
      } else {
        // No coach/category/muscle filters applied. Support sorting approaches without text query.
          // Order by difficultyOrder, then by name using dedicated index
          let diffQueryBuilder = ctx.db.query("exercises");
          if (!showInactive) {
            diffQueryBuilder = diffQueryBuilder.filter((q) => q.eq(q.field("isActive"), true));
          }
          if (args.trainerName) {
            // Trainer filter requires different index, collect and sort in-memory
            const [firstName, ...lastNameParts] = args.trainerName.trim().split(' ');
            const lastName = lastNameParts.join(' ');
            const trainerFiltered = await diffQueryBuilder.withIndex("by_trainer_and_active", (q: any) => {
              let indexQuery = q;
              if (firstName) indexQuery = indexQuery.eq("trainerFirstName", firstName);
              if (lastName) indexQuery = indexQuery.eq("trainerLastName", lastName);
              if (!showInactive) indexQuery = indexQuery.eq("isActive", true);
              return indexQuery;
            }).collect();
            // Sort by difficultyOrder then name in-memory
            trainerFiltered.sort((a, b) => {
              if ((a.difficultyOrder ?? 0) !== (b.difficultyOrder ?? 0)) {
                return (a.difficultyOrder ?? 0) - (b.difficultyOrder ?? 0);
              }
              return a.name.localeCompare(b.name);
            });
            // Manual pagination
            const startIdx = cursorNon ? 0 : 0;
            const endIndex = startIdx + numItemsNon;
            const paginatedPage = trainerFiltered.slice(startIdx, endIndex);
            paginatedResult = {
              page: paginatedPage,
              isDone: endIndex >= trainerFiltered.length,
              continueCursor: endIndex >= trainerFiltered.length ? undefined : String(endIndex),
            };
          } else {
            // No trainer filter, use difficulty index for sorting
            paginatedResult = await diffQueryBuilder.withIndex("by_difficultyOrder_name", (q) => q)
              .paginate({ cursor: cursorNon, numItems: numItemsNon });
          }
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
              let nameQueryBuilder = ctx.db.query("exercises");
              if (!showInactive) {
                nameQueryBuilder = nameQueryBuilder.filter((q) => q.eq(q.field("isActive"), true));
              }
              paginatedResult = await nameQueryBuilder.withIndex("by_name", (q) => q)
                .paginate({ cursor: cursorNon, numItems: numItemsNon });
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

            const sortedExercises = (await queryBuilder.collect())
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
          let alphaQueryBuilder = ctx.db.query("exercises");
          if (!showInactive) {
            alphaQueryBuilder = alphaQueryBuilder.filter((q) => q.eq(q.field("isActive"), true));
          }
          paginatedResult = await alphaQueryBuilder.withIndex("by_name", (q) => q)
            .paginate({ cursor: cursorNon, numItems: numItemsNon });
        } else {
          let defaultQueryBuilder = ctx.db.query("exercises");
          if (!showInactive) {
            defaultQueryBuilder = defaultQueryBuilder.filter((q) => q.eq(q.field("isActive"), true));
          }
          paginatedResult = await defaultQueryBuilder.order("desc")
            .paginate({ cursor: cursorNon, numItems: numItemsNon });
        }
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

const SEED_EXERCISES = [
  {
    name: "90/90 Hamstring",
    category: "Flexibility",
    muscleGroup: "Legs",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core"],
    equipment: ["None"],
    difficulty: "Beginner",
    sets: "3",
    reps: "30s",
    instructions: [
      "Sit on the floor with one leg in front, bent at 90 degrees.",
      "The other leg is out to the side, also bent at 90 degrees.",
      "Hinge forward at the hips over your front leg.",
      "Hold the stretch and feel it in your hamstrings and glutes."
    ],
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://www.youtube.com/watch?v=n0vH_N6_X_M"
  },
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
    imageUrl: "https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://www.youtube.com/watch?v=gcNh17Ckjgg"
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
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://www.youtube.com/watch?v=VmBy7_fT068"
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
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://www.youtube.com/watch?v=op9kVnViXIA"
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
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4"
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
    imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g"
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
  },
  // ===== CHEST =====
  {
    name: "Barbell Bench Press",
    category: "Strength",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals", "Triceps", "Anterior Deltoids"],
    secondaryMuscles: ["Core"],
    equipment: ["Barbell", "Bench"],
    difficulty: "Intermediate",
    sets: "4",
    reps: "8",
    instructions: [
      "Lie flat on a bench, grip the bar slightly wider than shoulder width.",
      "Unrack the bar and lower it to your mid-chest.",
      "Press the bar up until arms are fully extended.",
      "Keep your feet flat and shoulder blades retracted."
    ],
    imageUrl: ""
  },
  {
    name: "Incline Dumbbell Press",
    category: "Hypertrophy",
    muscleGroup: "Chest",
    primaryMuscles: ["Upper Pectorals", "Anterior Deltoids"],
    secondaryMuscles: ["Triceps"],
    equipment: ["Dumbbells", "Incline Bench"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Set the bench to a 30-45 degree incline.",
      "Press the dumbbells from chest level to full extension.",
      "Squeeze your upper chest at the top of the movement.",
      "Lower the weights with control."
    ],
    imageUrl: ""
  },
  {
    name: "Cable Crossover",
    category: "Hypertrophy",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals"],
    secondaryMuscles: ["Anterior Deltoids", "Biceps"],
    equipment: ["Cable Machine"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "12",
    instructions: [
      "Set the cables to a high position.",
      "Step forward and bring your hands together in a hugging motion.",
      "Squeeze your chest at the center.",
      "Return to the starting position with control."
    ],
    imageUrl: ""
  },
  {
    name: "Dumbbell Fly",
    category: "Hypertrophy",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals"],
    secondaryMuscles: ["Anterior Deltoids"],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Lie flat on a bench with dumbbells above your chest.",
      "Open your arms wide with a slight bend in your elbows.",
      "Feel the stretch across your chest.",
      "Bring the weights back together above your chest."
    ],
    imageUrl: ""
  },
  {
    name: "Pec Deck Machine",
    category: "Hypertrophy",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals"],
    secondaryMuscles: ["Anterior Deltoids"],
    equipment: ["Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Sit on the machine with your upper arms against the pads.",
      "Bring the pads together in front of your chest.",
      "Squeeze your chest muscles at the center.",
      "Slowly return to the starting position."
    ],
    imageUrl: ""
  },
  // ===== BACK =====
  {
    name: "Barbell Row",
    category: "Strength",
    muscleGroup: "Back",
    primaryMuscles: ["Lats", "Rhomboids", "Traps"],
    secondaryMuscles: ["Biceps", "Rear Deltoids"],
    equipment: ["Barbell"],
    difficulty: "Intermediate",
    sets: "4",
    reps: "8",
    instructions: [
      "Hinge at the hips with a flat back, holding the barbell.",
      "Pull the bar toward your lower chest/upper abdomen.",
      "Squeeze your shoulder blades together at the top.",
      "Lower the bar with control."
    ],
    imageUrl: ""
  },
  {
    name: "Lat Pulldown",
    category: "Hypertrophy",
    muscleGroup: "Back",
    primaryMuscles: ["Lats", "Biceps"],
    secondaryMuscles: ["Rhomboids", "Upper Back"],
    equipment: ["Cable Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Sit at the pulldown machine and grip the bar wide.",
      "Pull the bar down to your upper chest.",
      "Squeeze your lats at the bottom.",
      "Extend your arms fully on the return."
    ],
    imageUrl: ""
  },
  {
    name: "Seated Cable Row",
    category: "Hypertrophy",
    muscleGroup: "Back",
    primaryMuscles: ["Rhomboids", "Lats", "Traps"],
    secondaryMuscles: ["Biceps", "Rear Deltoids"],
    equipment: ["Cable Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Sit at the rowing machine with feet on the platform.",
      "Pull the handle to your lower chest.",
      "Squeeze your shoulder blades together.",
      "Return with control, maintaining a neutral spine."
    ],
    imageUrl: ""
  },
  {
    name: "Chin-up",
    category: "Strength",
    muscleGroup: "Back",
    primaryMuscles: ["Lats", "Biceps"],
    secondaryMuscles: ["Upper Back", "Core"],
    equipment: ["Pull-up Bar"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "8",
    instructions: [
      "Grip the bar with palms facing you, shoulder-width apart.",
      "Pull your chin above the bar.",
      "Lower yourself with control.",
      "Keep your core tight throughout."
    ],
    imageUrl: ""
  },
  {
    name: "Romanian Deadlift",
    category: "Hypertrophy",
    muscleGroup: "Back",
    primaryMuscles: ["Hamstrings", "Glutes", "Lower Back"],
    secondaryMuscles: ["Upper Back", "Forearms"],
    equipment: ["Barbell"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Hold the barbell at hip height with a shoulder-width grip.",
      "Hinge at the hips, pushing your glutes back.",
      "Lower the bar along your legs until you feel a hamstring stretch.",
      "Drive your hips forward to return to standing."
    ],
    imageUrl: ""
  },
  // ===== SHOULDERS =====
  {
    name: "Overhead Press",
    category: "Strength",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps"],
    secondaryMuscles: ["Upper Chest", "Core"],
    equipment: ["Barbell"],
    difficulty: "Intermediate",
    sets: "4",
    reps: "8",
    instructions: [
      "Start with the barbell at shoulder height in a front rack position.",
      "Press the bar overhead until arms are fully extended.",
      "Bring the bar back down to shoulder height.",
      "Keep your core braced and avoid excessive back lean."
    ],
    imageUrl: ""
  },
  {
    name: "Lateral Raise",
    category: "Hypertrophy",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Lateral Deltoids"],
    secondaryMuscles: ["Anterior Deltoids", "Traps"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "15",
    instructions: [
      "Stand with dumbbells at your sides.",
      "Raise your arms out to the sides until shoulder height.",
      "Keep a slight bend in your elbows.",
      "Lower the weights with control."
    ],
    imageUrl: ""
  },
  {
    name: "Arnold Press",
    category: "Hypertrophy",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Anterior Deltoids", "Lateral Deltoids"],
    secondaryMuscles: ["Triceps", "Upper Chest"],
    equipment: ["Dumbbells"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Start with dumbbells at shoulder height, palms facing you.",
      "Press the weights up while rotating your palms forward.",
      "Fully extend your arms overhead.",
      "Reverse the motion back to the starting position."
    ],
    imageUrl: ""
  },
  {
    name: "Face Pull",
    category: "Hypertrophy",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Rear Deltoids", "Rhomboids"],
    secondaryMuscles: ["Traps", "Rotator Cuff"],
    equipment: ["Cable Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "15",
    instructions: [
      "Set the cable at face height with a rope attachment.",
      "Pull the rope toward your face, spreading it apart.",
      "Squeeze your rear delts and upper back.",
      "Return with control."
    ],
    imageUrl: ""
  },
  {
    name: "Upright Row",
    category: "Hypertrophy",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Lateral Deltoids", "Traps"],
    secondaryMuscles: ["Biceps", "Forearms"],
    equipment: ["Barbell"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Hold the barbell with a narrow overhand grip.",
      "Pull the bar up to chest height, leading with your elbows.",
      "Keep the bar close to your body throughout.",
      "Lower the bar with control."
    ],
    imageUrl: ""
  },
  // ===== ARMS =====
  {
    name: "Barbell Bicep Curl",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Barbell"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Stand with a shoulder-width underhand grip on the barbell.",
      "Curl the bar up toward your chest.",
      "Squeeze your biceps at the top.",
      "Lower the bar slowly to full extension."
    ],
    imageUrl: ""
  },
  {
    name: "Hammer Curl",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Biceps", "Brachialis"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Stand with dumbbells at your sides, palms facing in.",
      "Curl the weights up, keeping your palms facing each other.",
      "Squeeze at the top of the movement.",
      "Lower with control."
    ],
    imageUrl: ""
  },
  {
    name: "Tricep Dip",
    category: "Strength",
    muscleGroup: "Arms",
    primaryMuscles: ["Triceps", "Chest"],
    secondaryMuscles: ["Anterior Deltoids"],
    equipment: ["Bodyweight", "Dip Station"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Grip the parallel bars and lift yourself up.",
      "Lower your body by bending your elbows.",
      "Keep your torso upright to target the triceps.",
      "Press back up to full arm extension."
    ],
    imageUrl: ""
  },
  {
    name: "Skull Crusher",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Barbell", "Bench"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Lie on a bench holding a barbell above your chest.",
      "Bend your elbows to lower the bar toward your forehead.",
      "Keep your upper arms stationary.",
      "Extend your arms to return to the starting position."
    ],
    imageUrl: ""
  },
  {
    name: "Tricep Pushdown",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Cable Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Attach a straight or V-bar to a high cable.",
      "Push the bar down until your arms are fully extended.",
      "Squeeze your triceps at the bottom.",
      "Release slowly back to the starting position."
    ],
    imageUrl: ""
  },
  {
    name: "Concentration Curl",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Sit on a bench with your elbow braced against your inner thigh.",
      "Curl the dumbbell up toward your shoulder.",
      "Squeeze your bicep at the top.",
      "Lower the weight slowly."
    ],
    imageUrl: ""
  },
  {
    name: "Overhead Tricep Extension",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Triceps"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Hold a dumbbell with both hands overhead.",
      "Lower the weight behind your head by bending your elbows.",
      "Keep your upper arms close to your ears.",
      "Extend your arms to return to the starting position."
    ],
    imageUrl: ""
  },
  // ===== LEGS =====
  {
    name: "Leg Press",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Calves"],
    equipment: ["Machine"],
    difficulty: "Beginner",
    sets: "4",
    reps: "10",
    instructions: [
      "Sit in the leg press machine with feet shoulder-width apart.",
      "Release the safety bars and lower the platform.",
      "Push the platform back up without locking your knees.",
      "Keep your back flat against the pad."
    ],
    imageUrl: ""
  },
  {
    name: "Bulgarian Split Squat",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Place one foot behind you on a bench.",
      "Lower your back knee toward the ground.",
      "Keep your front knee over your ankle.",
      "Drive through your front foot to stand back up."
    ],
    imageUrl: ""
  },
  {
    name: "Lunges",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Stand tall holding dumbbells at your sides.",
      "Step forward into a lunge, lowering your back knee.",
      "Push back to the starting position.",
      "Alternate legs with each rep."
    ],
    imageUrl: ""
  },
  {
    name: "Leg Curl",
    category: "Hypertrophy",
    muscleGroup: "Legs",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: ["Calves"],
    equipment: ["Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Sit in the leg curl machine with the pad against your lower legs.",
      "Curl the weight toward your glutes.",
      "Squeeze your hamstrings at the top.",
      "Lower the weight with control."
    ],
    imageUrl: ""
  },
  {
    name: "Leg Extension",
    category: "Hypertrophy",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps"],
    secondaryMuscles: [],
    equipment: ["Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Sit in the machine with the pad against your shins.",
      "Extend your legs to straighten them.",
      "Squeeze your quads at the top.",
      "Lower the weight with control."
    ],
    imageUrl: ""
  },
  {
    name: "Calf Raise",
    category: "Hypertrophy",
    muscleGroup: "Legs",
    primaryMuscles: ["Calves"],
    secondaryMuscles: [],
    equipment: ["Machine"],
    difficulty: "Beginner",
    sets: "4",
    reps: "15",
    instructions: [
      "Stand on a raised surface with heels hanging off.",
      "Push up onto your toes as high as possible.",
      "Hold for a moment at the top.",
      "Lower your heels below the surface level."
    ],
    imageUrl: ""
  },
  {
    name: "Hip Thrust",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Glutes", "Hamstrings"],
    secondaryMuscles: ["Core", "Quadriceps"],
    equipment: ["Barbell", "Bench"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Sit on the ground with your upper back against a bench.",
      "Roll a barbell over your hips.",
      "Drive your hips up until your body forms a straight line.",
      "Squeeze your glutes at the top and lower with control."
    ],
    imageUrl: ""
  },
  {
    name: "Front Squat",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Upper Back"],
    equipment: ["Barbell", "Squat Rack"],
    difficulty: "Advanced",
    sets: "3",
    reps: "8",
    instructions: [
      "Rest the barbell on your front shoulders in a front rack position.",
      "Keep your elbows high and chest up.",
      "Squat down until your thighs are parallel.",
      "Drive back up keeping your torso upright."
    ],
    imageUrl: ""
  },
  // ===== CORE =====
  {
    name: "Russian Twist",
    category: "Core",
    muscleGroup: "Core",
    primaryMuscles: ["Obliques", "Abs"],
    secondaryMuscles: ["Lower Back"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "20",
    instructions: [
      "Sit on the floor with knees bent, leaning back slightly.",
      "Hold a weight in front of your chest.",
      "Rotate your torso to one side, then the other.",
      "Keep your core engaged throughout."
    ],
    imageUrl: ""
  },
  {
    name: "Hanging Leg Raise",
    category: "Core",
    muscleGroup: "Core",
    primaryMuscles: ["Abs", "Hip Flexors"],
    secondaryMuscles: ["Obliques", "Lats"],
    equipment: ["Pull-up Bar"],
    difficulty: "Advanced",
    sets: "3",
    reps: "10",
    instructions: [
      "Hang from a pull-up bar with arms extended.",
      "Raise your legs until they are parallel to the floor.",
      "Lower your legs with control.",
      "Avoid swinging your body."
    ],
    imageUrl: ""
  },
  {
    name: "Ab Wheel Rollout",
    category: "Core",
    muscleGroup: "Core",
    primaryMuscles: ["Abs", "Obliques"],
    secondaryMuscles: ["Lower Back", "Shoulders"],
    equipment: ["Ab Wheel"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Kneel with the ab wheel in front of you.",
      "Roll the wheel forward, extending your body.",
      "Go as far as you can while keeping your core tight.",
      "Roll back to the starting position."
    ],
    imageUrl: ""
  },
  {
    name: "Mountain Climbers",
    category: "Cardio",
    muscleGroup: "Core",
    primaryMuscles: ["Abs", "Hip Flexors"],
    secondaryMuscles: ["Shoulders", "Quadriceps"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    sets: "3",
    reps: "30s",
    instructions: [
      "Start in a high plank position.",
      "Drive one knee toward your chest.",
      "Quickly switch legs in a running motion.",
      "Keep your hips level throughout."
    ],
    imageUrl: ""
  },
  // ===== FULL BODY / FUNCTIONAL =====
  {
    name: "Burpees",
    category: "Cardio",
    muscleGroup: "Full Body",
    primaryMuscles: ["Quadriceps", "Chest", "Abs"],
    secondaryMuscles: ["Shoulders", "Triceps", "Calves"],
    equipment: ["Bodyweight"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Stand with feet shoulder-width apart.",
      "Drop into a squat and place your hands on the floor.",
      "Jump your feet back into a plank, do a push-up.",
      "Jump your feet forward and leap up with arms overhead."
    ],
    imageUrl: ""
  },
  {
    name: "Kettlebell Swing",
    category: "Power",
    muscleGroup: "Full Body",
    primaryMuscles: ["Glutes", "Hamstrings", "Core"],
    secondaryMuscles: ["Shoulders", "Forearms"],
    equipment: ["Kettlebell"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "15",
    instructions: [
      "Stand with feet wider than shoulders, kettlebell between your legs.",
      "Hinge at the hips and swing the kettlebell between your legs.",
      "Drive your hips forward to swing the kettlebell to chest height.",
      "Control the downward swing and repeat."
    ],
    imageUrl: ""
  },
  {
    name: "Box Jump",
    category: "Power",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core"],
    equipment: ["Box"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "8",
    instructions: [
      "Stand in front of a sturdy box or platform.",
      "Swing your arms and jump onto the box.",
      "Land softly with both feet fully on the box.",
      "Step down and repeat."
    ],
    imageUrl: ""
  },
  {
    name: "Farmer's Walk",
    category: "Strength",
    muscleGroup: "Full Body",
    primaryMuscles: ["Traps", "Forearms", "Core"],
    secondaryMuscles: ["Shoulders", "Calves"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "40m",
    instructions: [
      "Pick up heavy dumbbells in each hand.",
      "Walk with a tall posture and tight core.",
      "Keep your shoulders back and down.",
      "Walk for the prescribed distance."
    ],
    imageUrl: ""
  },
  {
    name: "Step-up",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    equipment: ["Dumbbells", "Box"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Hold dumbbells and stand in front of a raised platform.",
      "Step up onto the platform with one foot.",
      "Drive through the raised foot to stand up.",
      "Step down and alternate legs."
    ],
    imageUrl: ""
  },
  {
    name: "Dumbbell Shrug",
    category: "Hypertrophy",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Upper Traps"],
    secondaryMuscles: ["Levator Scapulae"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    sets: "3",
    reps: "12",
    instructions: [
      "Stand holding dumbbells at your sides.",
      "Shrug your shoulders up toward your ears.",
      "Hold at the top for a moment.",
      "Lower your shoulders with control."
    ],
    imageUrl: ""
  },
  {
    name: "Good Morning",
    category: "Strength",
    muscleGroup: "Back",
    primaryMuscles: ["Hamstrings", "Lower Back", "Glutes"],
    secondaryMuscles: ["Core"],
    equipment: ["Barbell"],
    difficulty: "Advanced",
    sets: "3",
    reps: "8",
    instructions: [
      "Rest a barbell on your upper back as for a squat.",
      "Hinge at the hips, pushing your glutes back.",
      "Lower your torso until nearly parallel to the floor.",
      "Drive your hips forward to stand back up."
    ],
    imageUrl: ""
  },
  {
    name: "Cable Crunch",
    category: "Core",
    muscleGroup: "Core",
    primaryMuscles: ["Abs"],
    secondaryMuscles: ["Obliques"],
    equipment: ["Cable Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "15",
    instructions: [
      "Kneel in front of a cable machine with a rope attachment.",
      "Pull the rope down and crunch your torso toward your knees.",
      "Squeeze your abs at the bottom.",
      "Return to the starting position with control."
    ],
    imageUrl: ""
  },
  {
    name: "Sled Push",
    category: "Power",
    muscleGroup: "Full Body",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Chest", "Triceps"],
    equipment: ["Sled"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "20m",
    instructions: [
      "Position yourself behind the sled with arms extended.",
      "Drive your legs into the ground to push the sled forward.",
      "Keep your core tight and back flat.",
      "Push for the prescribed distance."
    ],
    imageUrl: ""
  },
  {
    name: "Battle Ropes",
    category: "Cardio",
    muscleGroup: "Full Body",
    primaryMuscles: ["Shoulders", "Abs", "Arms"],
    secondaryMuscles: ["Back", "Legs"],
    equipment: ["Battle Ropes"],
    difficulty: "Intermediate",
    sets: "4",
    reps: "30s",
    instructions: [
      "Hold one rope in each hand, standing with feet shoulder-width apart.",
      "Alternate raising and lowering each arm rapidly.",
      "Create waves in the ropes with consistent power.",
      "Keep your core engaged and maintain a slight squat."
    ],
    imageUrl: ""
  },
  {
    name: "Preacher Curl",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Biceps"],
    secondaryMuscles: ["Forearms"],
    equipment: ["Barbell", "Preacher Bench"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Sit at a preacher bench with your upper arms on the pad.",
      "Curl the barbell up toward your shoulders.",
      "Squeeze your biceps at the top.",
      "Lower the bar slowly to full extension."
    ],
    imageUrl: ""
  },
  {
    name: "Hack Squat",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Calves"],
    equipment: ["Machine"],
    difficulty: "Intermediate",
    sets: "4",
    reps: "10",
    instructions: [
      "Position yourself on the hack squat machine.",
      "Lower your body by bending your knees.",
      "Keep your back flat against the pad.",
      "Push back up to the starting position."
    ],
    imageUrl: ""
  },
  {
    name: "Dumbbell Wrist Curl",
    category: "Hypertrophy",
    muscleGroup: "Arms",
    primaryMuscles: ["Forearms"],
    secondaryMuscles: [],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Beginner",
    sets: "3",
    reps: "15",
    instructions: [
      "Sit on a bench with your forearms on your thighs.",
      "Hold dumbbells with an underhand grip, wrists hanging off your knees.",
      "Curl the weights up using only your wrists.",
      "Lower with control."
    ],
    imageUrl: ""
  },
  {
    name: "Incline Bench Press",
    category: "Strength",
    muscleGroup: "Chest",
    primaryMuscles: ["Upper Pectorals", "Triceps", "Anterior Deltoids"],
    secondaryMuscles: ["Core"],
    equipment: ["Barbell", "Incline Bench"],
    difficulty: "Intermediate",
    sets: "4",
    reps: "8",
    instructions: [
      "Set the bench to a 30-45 degree incline.",
      "Grip the bar slightly wider than shoulder width.",
      "Lower the bar to your upper chest.",
      "Press the bar back up to full extension."
    ],
    imageUrl: ""
  },
  {
    name: "Dumbbell Pullover",
    category: "Hypertrophy",
    muscleGroup: "Chest",
    primaryMuscles: ["Pectorals", "Lats"],
    secondaryMuscles: ["Triceps", "Core"],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "12",
    instructions: [
      "Lie across a bench, holding a dumbbell over your chest.",
      "Lower the dumbbell behind your head with a slight bend in your elbows.",
      "Feel the stretch in your chest and lats.",
      "Pull the weight back over your chest."
    ],
    imageUrl: ""
  },
  {
    name: "Landmine Press",
    category: "Strength",
    muscleGroup: "Shoulders",
    primaryMuscles: ["Anterior Deltoids", "Triceps"],
    secondaryMuscles: ["Core", "Upper Chest"],
    equipment: ["Barbell", "Landmine"],
    difficulty: "Intermediate",
    sets: "3",
    reps: "10",
    instructions: [
      "Hold the end of a barbell at shoulder height.",
      "Press the barbell up and away from your shoulder.",
      "Fully extend your arm at the top.",
      "Lower with control and repeat."
    ],
    imageUrl: ""
  },
  {
    name: "Single-Leg Deadlift",
    category: "Strength",
    muscleGroup: "Legs",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Lower Back"],
    equipment: ["Dumbbells"],
    difficulty: "Advanced",
    sets: "3",
    reps: "8",
    instructions: [
      "Stand on one leg holding a dumbbell in the opposite hand.",
      "Hinge forward, extending your free leg behind you.",
      "Lower the dumbbell toward the ground.",
      "Drive your hips forward to return to standing."
    ],
    imageUrl: ""
  },
  {
    name: "Pallof Press",
    category: "Core",
    muscleGroup: "Core",
    primaryMuscles: ["Obliques", "Abs"],
    secondaryMuscles: ["Shoulders", "Lower Back"],
    equipment: ["Cable Machine"],
    difficulty: "Beginner",
    sets: "3",
    reps: "10",
    instructions: [
      "Stand perpendicular to a cable machine at chest height.",
      "Hold the handle at your chest with both hands.",
      "Press the handle straight out in front of you.",
      "Resist the rotation and return to your chest."
    ],
    imageUrl: ""
  },
];

async function insertSeedExerciseIfMissing(
  ctx: MutationCtx,
  ex: (typeof SEED_EXERCISES)[number],
  coachId?: Id<"profiles">,
) {
  const existingByLibraryId = await ctx.db
    .query("exercises")
    .withIndex("by_libraryId", (q: any) => q.eq("libraryId", `seed-${ex.name.toLowerCase().replace(/\s+/g, "-")}`))
    .first();

  const existingByName = existingByLibraryId
    ? null
    : await ctx.db
        .query("exercises").filter((q) => q.eq(q.field("isActive"), true)).withIndex("by_name", (q: any) => q.eq("name", ex.name))
        .first();

  if (existingByLibraryId || existingByName) return false;

  await ctx.db.insert("exercises", {
    ...ex,
    libraryId: `seed-${ex.name.toLowerCase().replace(/\s+/g, "-")}`,
    overview: `${ex.name} is a great exercise for targeting ${ex.muscleGroup.toLowerCase()}.`,
    benefits: ["Increased strength", "Improved muscle tone", "Better functional movement"],
    tags: [ex.category.toLowerCase(), ex.muscleGroup.toLowerCase()],
    difficultyOrder: ex.difficulty === "Beginner" ? 1 : ex.difficulty === "Intermediate" ? 2 : 3,
    createdAt: Date.now(),
    coachId,
  } as any);

  return true;
}

export const seedExercises = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clearExisting = args.clearExisting === true;
    let coachId: Id<"profiles"> | undefined;

    if (isAdminSecret(args.adminSecret)) {
      const adminProfile = await ctx.db
        .query("profiles")
        .withIndex("by_authSource", (q) => q.eq("authSource", "trainer"))
        .first();
      coachId = adminProfile?._id;
    } else {
      try {
        const profile = await requireTrainer(ctx);
        coachId = profile._id;
      } catch {
        // Allow local seeding when no trainer session exists.
        coachId = undefined;
      }
    }

    if (clearExisting) {
      const existing = await ctx.db.query("exercises").filter((q) => q.eq(q.field("isActive"), true)).collect();
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
    for (const ex of SEED_EXERCISES) {
      if (await insertSeedExerciseIfMissing(ctx, ex, coachId)) count++;
    }

    return { ok: true, seededCount: count, totalSeedLibrary: SEED_EXERCISES.length };
  },
});

export const seed = seedExercises;

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
    const exercises = await ctx.db.query("exercises").filter((q) => q.eq(q.field("isActive"), true)).collect();
    // Manual aggregation since Convex doesn't support distinct/groupBy native yet
    const categories = new Set(exercises.map((e) => e.category || e.muscleGroup).filter(Boolean));
    return Array.from(categories).sort();
  },
});

export const batchCreate = mutation({
  args: {
    adminSecret: v.optional(v.string()),
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
    // batchCreate is a seed function - allow unauthenticated access for development
    // The admin secret check is optional for production safety, but not required
    
    let coachId: Id<"profiles"> | undefined;
    if (isAdminSecret(args.adminSecret)) {
      // Find or create an admin profile
      const adminProfile = await ctx.db
        .query("profiles")
        .withIndex("by_authSource", (q) => q.eq("authSource", "trainer"))
        .first();
      coachId = adminProfile?._id;
    } else {
      // Try to find a trainer profile, but don't fail if none exists
      const trainerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_authSource", (q) => q.eq("authSource", "trainer"))
        .first();
      coachId = trainerProfile?._id;
    }

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
            .query("exercises").filter((q) => q.eq(q.field("isActive"), true)).withSearchIndex("search_name", (q) => q.search("name", ex.name))
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
          coachId,
          createdAt: Date.now(),
        });
      }
    }
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


/**
 * Get exercises for a specific trainer (by coachId)
 */
export const getTrainerExercises = query({
  args: {
    coachId: v.id("profiles"),
    paginationOpts: v.optional(paginationOptsValidator),
    showInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const showInactive = args.showInactive ?? false;
    const po = (args.paginationOpts ?? {}) as any;
    const cursor = po?.cursor ?? null;
    const numItems = po?.numItems ?? 50;
    
    let queryBuilder = ctx.db.query("exercises").withIndex("by_coach", (q) => q.eq("coachId", args.coachId));
    
    if (!showInactive) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("isActive"), true));
    }
    
    const result = await queryBuilder.paginate({ cursor, numItems });
    
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
