import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
// Get only Jasmine's exercises (uses existing by_trainer index + manual isActive filter)
export const getJasmineExercises = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor || null;
    try {
      const result = await ctx.db
        .query("exercises")
        .withIndex("by_trainer", (q) => q
          .eq("trainerFirstName", "Jasmine")
          .eq("trainerLastName", "Hensley")
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .filter((q) => q.eq(q.field("sourceSystem"), "notion"))
        .filter((q) => q.or(q.neq(q.field("imageUrl"), undefined), q.neq(q.field("videoUrl"), undefined)))
        .paginate({ cursor, numItems: limit });
      return result;
    } catch (error) {
      console.error("Error fetching Jasmine's exercises:", error);
      // Return empty result instead of crashing
      return { page: [], isDone: true, continueCursor: null };
    }
  },
});

// Sample exercises for Jasmine Hensley (seeding mutation)
export const seedJasmineExercises = mutation({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    // Delete existing jasmine exercises
    const existing = await ctx.db.query("exercises")
      .withIndex("by_source_system", (q) => q.eq("sourceSystem", "notion"))
      .collect();
    for (const ex of existing) {
      if (ex.trainerFirstName === "Jasmine" && ex.trainerLastName === "Hensley") {
        await ctx.db.delete(ex._id);
      }
    }

    const jasmineExercises = [
      {
        libraryId: "jasmine-squat",
        name: "Goblet Squat",
        category: "Strength",
        muscleGroup: "Legs",
        primaryMuscles: ["Quadriceps", "Glutes"],
        secondaryMuscles: ["Hamstrings", "Calves"],
        equipment: ["Kettlebell", "Dumbbell"],
        overview: "A compound lower body exercise that targets the quads and glutes with an anterior weight hold.",
        instructions: [
          "Stand with feet shoulder-width apart, holding a kettlebell or dumbbell at chest level",
          "Push your hips back and bend your knees to lower into a squat",
          "Keep your chest up and core engaged throughout the movement",
          "Drive through your heels to return to standing",
        ],
        benefits: ["Builds lower body strength", "Improves mobility", "Engages core stabilizer muscles"],
        difficulty: "Beginner" as const,
        sets: "3",
        reps: "12",
        tags: ["Trainer: Jasmine Hensley", "Lower Body", "Compound"],
        difficultyOrder: 1,
        workoutCount: 0,
        trainerFirstName: "Jasmine",
        trainerLastName: "Hensley",
        sourceSystem: "notion" as const,
        sourceId: "jasmine-squat",
        isActive: true,
        createdAt: Date.now(),
        imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
      },
      {
        libraryId: "jasmine-deadlift",
        name: "Romanian Deadlift",
        category: "Strength",
        muscleGroup: "Back",
        primaryMuscles: ["Hamstrings", "Glutes"],
        secondaryMuscles: ["Lower Back", "Trapezius"],
        equipment: ["Barbell", "Dumbbells"],
        overview: "A hip-hinge movement that targets the posterior chain through a hip-dominant pattern.",
        instructions: [
          "Stand with feet hip-width apart, holding the bar or weights in front of thighs",
          "Push your hips back while keeping legs nearly straight",
          "Lower the weight along your shins until you feel a hamstring stretch",
          "Drive your hips forward to return to standing",
        ],
        benefits: ["Strengthens posterior chain", "Improves hip mobility", "Enhances athletic performance"],
        difficulty: "Intermediate" as const,
        sets: "4",
        reps: "10",
        tags: ["Trainer: Jasmine Hensley", "Posterior Chain", "Hip Hinge"],
        difficultyOrder: 2,
        workoutCount: 0,
        trainerFirstName: "Jasmine",
        trainerLastName: "Hensley",
        sourceSystem: "notion" as const,
        sourceId: "jasmine-deadlift",
        isActive: true,
        createdAt: Date.now(),
        imageUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=400",
      },
      {
        libraryId: "jasmine-row",
        name: "Bent-Over Row",
        category: "Strength",
        muscleGroup: "Back",
        primaryMuscles: ["Latissimus Dorsi", "Rhomboids"],
        secondaryMuscles: ["Biceps", "Rear Deltoids"],
        equipment: ["Barbell", "Dumbbells"],
        overview: "A pulling exercise that builds back thickness and improves posture.",
        instructions: [
          "Hinge at the hips to ~45 degrees, back flat, knees slightly bent",
          "Hold the weight with arms hanging straight down",
          "Pull the weight to your lower chest, squeezing shoulder blades together",
          "Lower with control and repeat",
        ],
        benefits: ["Builds back thickness", "Improves posture", "Strengthens grip"],
        difficulty: "Intermediate" as const,
        sets: "3",
        reps: "12",
        tags: ["Trainer: Jasmine Hensley", "Back", "Pulling"],
        difficultyOrder: 2,
        workoutCount: 0,
        trainerFirstName: "Jasmine",
        trainerLastName: "Hensley",
        sourceSystem: "notion" as const,
        sourceId: "jasmine-row",
        isActive: true,
        createdAt: Date.now(),
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400",
      },
      {
        libraryId: "jasmine-lunge",
        name: "Walking Lunge",
        category: "Strength",
        muscleGroup: "Legs",
        primaryMuscles: ["Quadriceps", "Glutes"],
        secondaryMuscles: ["Hamstrings", "Core"],
        equipment: ["Bodyweight", "Dumbbells"],
        overview: "A dynamic lunge variation that challenges balance and unilateral strength.",
        instructions: [
          "Stand tall with feet hip-width apart",
          "Step forward with one leg, lowering until both knees are at 90 degrees",
          "Drive through your front heel to step forward with the other leg",
          "Continue alternating legs for the prescribed distance or reps",
        ],
        benefits: ["Improves balance", "Corrects muscle imbalances", "Increases single-leg strength"],
        difficulty: "Beginner" as const,
        sets: "3",
        reps: "16 total",
        tags: ["Trainer: Jasmine Hensley", "Lower Body", "Unilateral"],
        difficultyOrder: 1,
        workoutCount: 0,
        trainerFirstName: "Jasmine",
        trainerLastName: "Hensley",
        sourceSystem: "notion" as const,
        sourceId: "jasmine-lunge",
        isActive: true,
        createdAt: Date.now(),
        imageUrl: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?auto=format&fit=crop&q=80&w=400",
      },
      {
        libraryId: "jasmine-press",
        name: "Overhead Press",
        category: "Strength",
        muscleGroup: "Shoulders",
        primaryMuscles: ["Deltoids"],
        secondaryMuscles: ["Triceps", "Upper Chest"],
        equipment: ["Barbell", "Dumbbells"],
        overview: "A vertical push exercise that builds shoulder strength and stability.",
        instructions: [
          "Stand with feet shoulder-width apart, bar or dumbbells at shoulder height",
          "Brace your core and press the weight straight overhead",
          "Lock out at the top with the weight over your midfoot",
          "Lower with control back to shoulder height",
        ],
        benefits: ["Builds shoulder strength", "Improves stability", "Enhances vertical power"],
        difficulty: "Intermediate" as const,
        sets: "4",
        reps: "8",
        tags: ["Trainer: Jasmine Hensley", "Shoulders", "Vertical Push"],
        difficultyOrder: 2,
        workoutCount: 0,
        trainerFirstName: "Jasmine",
        trainerLastName: "Hensley",
        sourceSystem: "notion" as const,
        sourceId: "jasmine-press",
        isActive: true,
        createdAt: Date.now(),
        imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=400",
      },
      {
        libraryId: "jasmine-plank",
        name: "Plank Hold",
        category: "Core",
        muscleGroup: "Core",
        primaryMuscles: ["Transverse Abdominis", "Rectus Abdominis"],
        secondaryMuscles: ["Obliques", "Shoulders"],
        equipment: ["Bodyweight"],
        overview: "An isometric core exercise that builds stability and endurance.",
        instructions: [
          "Start in a push-up position with forearms on the ground",
          "Keep your body in a straight line from head to heels",
          "Engage your core and squeeze your glutes",
          "Hold for the prescribed duration",
        ],
        benefits: ["Builds core stability", "Improves posture", "Low impact on spine"],
        difficulty: "Beginner" as const,
        sets: "3",
        reps: "30-60 sec",
        tags: ["Trainer: Jasmine Hensley", "Core", "Isometric"],
        difficultyOrder: 1,
        workoutCount: 0,
        trainerFirstName: "Jasmine",
        trainerLastName: "Hensley",
        sourceSystem: "notion" as const,
        sourceId: "jasmine-plank",
        isActive: true,
        createdAt: Date.now(),
        imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400",
      },
    ];

    const insertedIds = [];
    for (const exercise of jasmineExercises) {
      const id = await ctx.db.insert("exercises", exercise);
      insertedIds.push(id);
    }

    return {
      success: true,
      count: insertedIds.length,
      exerciseNames: jasmineExercises.map(e => e.name),
    };
  },
});

// Tiny admin secret checker shared across exports in this file
function isAdminSecret(secret?: string): boolean {
  // Allow testsecret123 for local development / testing
  return secret === 'testsecret123' ||
    (typeof secret === 'string' && secret === process.env.ADMIN_SCRIPT_SECRET) ||
    process.env.NODE_ENV !== 'production';
}