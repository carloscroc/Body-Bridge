import { internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { createCanonicalExercise, assignExerciseToTrainerHelper } from "./lib/sharedHelpers";
import type { Id } from "./_generated/dataModel";

interface NotionExerciseEntry {
  notionPageId: string;
  notionUrl: string;
  title: string;
  videoUrl: string;
  bodyRegion?: string[];
  equipment?: string[];
  musclesUsed?: string[];
  movementGoal?: string;
  movementType?: string;
  level?: string[];
  source?: string;
  instructions?: string;
  videoDescription?: string;
  otherNames?: string[];
  status?: string;
  clientGoal?: string[];
  location?: string;
  visualsComplete?: string;
  coverPhoto?: string[];
  dateAdded?: string;
}

export const syncNotionExerciseLibraryInternal = internalMutation({
  args: {
    notionData: v.array(
      v.object({
        notionPageId: v.string(),
        notionUrl: v.string(),
        title: v.string(),
        videoUrl: v.string(),
        bodyRegion: v.optional(v.array(v.string())),
        equipment: v.optional(v.array(v.string())),
        musclesUsed: v.optional(v.array(v.string())),
        movementGoal: v.optional(v.string()),
        movementType: v.optional(v.string()),
        level: v.optional(v.array(v.string())),
        source: v.optional(v.string()),
        instructions: v.optional(v.string()),
        videoDescription: v.optional(v.string()),
        otherNames: v.optional(v.array(v.string())),
        status: v.optional(v.string()),
        clientGoal: v.optional(v.array(v.string())),
        location: v.optional(v.string()),
        visualsComplete: v.optional(v.string()),
        coverPhoto: v.optional(v.array(v.string())),
        dateAdded: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<{ created: number; updated: number; errors: string[] }> => {
    // Get or create active trainer
    const trainers = await ctx.db.query("trainers").collect();
    let activeTrainer = trainers.find((t) => t.isActive);
    
    if (!activeTrainer) {
      if (trainers.length > 0) {
        // Activate the first trainer
        const firstTrainer = trainers[0];
        await ctx.db.patch(firstTrainer._id, { isActive: true, updatedAt: Date.now() });
        activeTrainer = { ...firstTrainer, isActive: true };
      } else {
        // Create Jasmine trainer
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
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const entry of args.notionData as NotionExerciseEntry[]) {
      try {
        // Map difficulty
        let difficulty: "Beginner" | "Intermediate" | "Advanced" = "Beginner";
        if (entry.level?.[0] === "Intermediate") difficulty = "Intermediate";
        if (entry.level?.[0] === "Advanced") difficulty = "Advanced";

        // Map category
        const category = entry.movementGoal === "Mobility" ? "Mobility" : "Strength";

        // Create canonical exercise (idempotent)
        const exerciseId = await createCanonicalExercise(ctx, {
          name: entry.title,
          sourceSystem: "notion",
          sourceId: `notion:${entry.notionPageId}`,
          category,
          bodyRegion: entry.bodyRegion?.[0] || "Other",
          primaryMuscles: entry.musclesUsed?.slice(0, 3) || [],
          secondaryMuscles: entry.musclesUsed?.slice(3) || [],
          equipment: entry.equipment || ["Bodyweight"],
          difficulty,
          overview: entry.videoDescription?.slice(0, 200) || "",
          instructions: entry.instructions || "",
          coverPhoto: entry.coverPhoto?.[0],
          lifecycle: "ready",
        });

        // Assign to trainer (idempotent via helper)
        const assignment = await assignExerciseToTrainerHelper(ctx, {
          trainerId: activeTrainer._id as Id<"trainers">,
          exerciseId,
          videoUrl: entry.videoUrl,
          sourceSystem: "notion",
          sourceId: entry.notionPageId,
        });

        if (assignment.status === "created") results.created++;
        else results.updated++;
      } catch (e) {
        results.errors.push(`${entry.title}: ${String(e)}`);
      }
    }

    return results;
  },
});