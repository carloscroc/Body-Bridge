import { internalMutation } from "./_generated/server";

export const updateExercisesDefaults = internalMutation({
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    
    for (const exercise of exercises) {
      if (exercise.isActive === undefined) {
        await ctx.db.patch(exercise._id, {
          isActive: true,
          sourceSystem: "seed"
        });
      }
    }
    
    return { updated: exercises.length, processed: exercises.filter(e => e.isActive === undefined).length };
  }
});