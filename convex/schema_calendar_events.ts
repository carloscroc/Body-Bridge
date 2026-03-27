import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Calendar events table
export default defineSchema({
  calendarEvents: defineTable({
    title: v.string(),
    start: v.string(), // ISO date string
    end: v.string(), // ISO date string
    programId: v.optional(v.string()),
    programType: v.optional(
      v.union(
        v.literal("Workout A"),
        v.literal("Workout B"),
        v.literal("Cardio"),
        v.literal("Yoga"),
        v.literal("Rest"),
        v.literal("Flexibility"),
      ),
    ),
    exercises: v.optional(v.array(v.object({
      id: v.optional(v.string()),
      name: v.string(),
      sets: v.number(),
      reps: v.string(),
      weight: v.optional(v.string()),
      rest: v.optional(v.string()),
      tempo: v.optional(v.string()),
      notes: v.optional(v.string()),
    }))),
    duration: v.optional(v.number()),
    intensity: v.optional(
      v.union(
        v.literal("Easy"),
        v.literal("Medium"),
        v.literal("Hard"),
        v.literal("Extreme"),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal("Scheduled"),
        v.literal("Completed"),
        v.literal("In Progress"),
        v.literal("Cancelled"),
      ),
    ),
    recurrence: v.optional(v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly"),
      ),
      interval: v.optional(v.number()),
      endDate: v.optional(v.string()),
      daysOfWeek: v.optional(v.array(v.number())),
      daysOfMonth: v.optional(v.array(v.number())),
      excludeDates: v.optional(v.array(v.string())),
    })),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_start", ["start"]),
});
