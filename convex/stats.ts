import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getUserStats = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    // 1. Workouts Completed
    // We can count from workouts table or workoutLogs
    const workoutLogs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const workoutsCompleted = workoutLogs.length;

    // 2. Total Volume (Weight Lifted)
    let weightLiftedKg = 0;
    for (const log of workoutLogs) {
       if (Array.isArray(log.exercises)) {
         for (const ex of log.exercises) {
           // Calculation logic: sets * reps * weight
           const sets = typeof ex.sets === 'string' ? parseInt(ex.sets) : (ex.sets || 0);
           const reps = typeof ex.reps === 'string' ? parseInt(ex.reps) : (ex.reps || 0);
           const weight = typeof ex.weight === 'string' ? parseFloat(ex.weight) : (ex.weight || 0);
           weightLiftedKg += sets * reps * weight;
         }
       }
    }

    // 3. Streak Days
    // Simplified streak: count consecutive days with at least one workout log starting from today or last workout
    const dates = workoutLogs
      .map(log => new Date(log.date).toISOString().split('T')[0])
      .sort((a, b) => b.localeCompare(a)); // Descending
    
    const uniqueDates = Array.from(new Set(dates));
    
    let streakDays = 0;
    if (uniqueDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Start checking if the most recent workout was today or yesterday
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streakDays = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = new Date(uniqueDates[i]);
          const next = new Date(uniqueDates[i+1]);
          const diff = (current.getTime() - next.getTime()) / 86400000;
          if (diff === 1) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    return {
      workoutsCompleted,
      streakDays,
      weightLiftedKg,
      level: workoutsCompleted > 50 ? "Elite" : workoutsCompleted > 20 ? "Advanced" : "Beginner"
    };
  },
});
