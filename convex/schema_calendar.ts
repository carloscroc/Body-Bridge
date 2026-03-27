import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Calendar exercises table (shared with exercise library)
export default defineSchema({
  calendarExercises: defineTable({
    name: v.string(),
    sets: v.number(),
    reps: v.string(),
    weight: v.optional(v.string()),
    rest: v.optional(v.string()),
    tempo: v.optional(v.string()),
    notes: v.optional(v.string()),
    muscleGroup: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index("by_category", ["category"]).index("by_muscle_group", ["muscleGroup"]),
});
