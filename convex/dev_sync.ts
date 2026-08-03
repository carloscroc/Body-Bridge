import { internalMutation } from "./_generated/server";
import { createCanonicalExercise, assignExerciseToTrainerHelper } from "./lib/sharedHelpers";

export const seedFiveNotionExercises = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get or create active trainer
    const trainers = await ctx.db.query("trainers").collect();
    let activeTrainer = trainers.find((t) => t.isActive);
    
    if (!activeTrainer) {
      const trainerId = await ctx.db.insert("trainers", {
        firstName: "Jasmine",
        lastName: "Trainer",
        fullName: "Jasmine Trainer",
        email: "jasmine@bodybridge.fitness",
        updatedAt: Date.now(),
        isActive: true,
      });
      activeTrainer = {
        _id: trainerId,
        firstName: "Jasmine",
        lastName: "Trainer",
        fullName: "Jasmine Trainer",
        email: "jasmine@bodybridge.fitness",
        updatedAt: Date.now(),
        isActive: true,
      };
    }

    const exercises = [
      {
        notionPageId: "30d97d6b-662f-804f-8e18-d3da5cfef45d",
        title: "Ankle Dorsiflexion",
        videoUrl: "https://youtube.com/shorts/ADF8ICk-i6o?feature=share",
        bodyRegion: "Ankle",
        movementGoal: "Mobility",
        level: "Beginner",
        equipment: "Bodyweight",
        videoDescription: "This drill improves ankle dorsiflexion (toes up), which supports better squatting, walking, and stair mechanics.",
        instructions: "Sit on floor with one leg straight, toes up. Pull toes toward shin. 2-3 sets of 10-15 reps.",
      },
      {
        notionPageId: "30d97d6b-662f-8087-af29-f37bf50106cb",
        title: "Ankle Plantar Flexion",
        videoUrl: "https://youtube.com/shorts/DntsMu7A3Ng?feature=share",
        bodyRegion: "Ankle",
        movementGoal: "Mobility",
        level: "Beginner",
        equipment: "Bodyweight",
        videoDescription: "Plantar flexion is pointing your toes away from your shin.",
        instructions: "Sit with knee straight, toes relaxed. Slowly point toes away. 2-3 sets of 10-15 reps.",
      },
      {
        notionPageId: "2fb97d6b-662f-8055-83c3-f2bc96e1e8d3",
        title: "Elbow Extension",
        videoUrl: "https://youtube.com/shorts/rkOr-BQmzxY?feature=share",
        bodyRegion: "Arm",
        movementGoal: "Mobility",
        level: "Beginner",
        equipment: "Bodyweight",
        videoDescription: "Elbow extension is straightening your arm from a bent position.",
        instructions: "Stand upright, shoulders relaxed. Slowly straighten elbow. 10-15 reps, 2-3 sets.",
      },
      {
        notionPageId: "2fb97d6b-662f-80fc-bac4-f6dcb4aaf16b",
        title: "Elbow Flexion",
        videoUrl: "https://youtube.com/shorts/ovk6gWEamjo?feature=share",
        bodyRegion: "Arm",
        movementGoal: "Mobility",
        level: "Beginner",
        equipment: "Bodyweight",
        videoDescription: "Elbow flexion is bending the arm to bring forearm toward body.",
        instructions: "Stand with arm relaxed. Bend elbow, bringing hand toward shoulder. 10-15 reps.",
      },
      {
        notionPageId: "31597d6b-662f-80ea-bacd-d14fa5bef461",
        title: "Finger Abduction & Adduction",
        videoUrl: "https://youtube.com/shorts/sovVlLwYRZY?feature=share",
        bodyRegion: "Hand",
        movementGoal: "Mobility",
        level: "Beginner",
        equipment: "Bodyweight",
        videoDescription: "Finger abduction/adduction opens and closes hands.",
        instructions: "Spread fingers apart, then close into fist. 10-15 reps, slow and controlled.",
      },
    ];

    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const ex of exercises) {
      try {
        const exerciseId = await createCanonicalExercise(ctx, {
          name: ex.title,
          sourceSystem: "notion",
          sourceId: `notion:${ex.notionPageId}`,
          category: ex.movementGoal === "Mobility" ? "Mobility" : "Strength",
          bodyRegion: ex.bodyRegion || "Other",
          primaryMuscles: [],
          secondaryMuscles: [],
          equipment: [ex.equipment || "Bodyweight"],
          difficulty: (ex.level === "Intermediate" ? "Intermediate" : ex.level === "Advanced" ? "Advanced" : "Beginner") as "Beginner" | "Intermediate" | "Advanced",
          overview: ex.videoDescription?.slice(0, 200) || "",
          instructions: ex.instructions || "",
          lifecycle: "ready",
        });

        const assignment = await assignExerciseToTrainerHelper(ctx, {
          trainerId: activeTrainer._id as any,
          exerciseId,
          videoUrl: ex.videoUrl,
          sourceSystem: "notion",
          sourceId: ex.notionPageId,
        });

        if (assignment.status === "created") results.created++;
        else results.updated++;
      } catch (e) {
        results.errors.push(`${ex.title}: ${String(e)}`);
      }
    }

    return results;
  },
});