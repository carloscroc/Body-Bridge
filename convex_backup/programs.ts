import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfileId, getMaybeProfileId } from "./lib/auth";


const oldExerciseValidator = v.object({
  id: v.string(),
  name: v.string(),
  image: v.optional(v.string()),
  sets: v.optional(v.string()),
  reps: v.optional(v.string()),
  weight: v.optional(v.string()),
  rest: v.optional(v.string()),
  notes: v.optional(v.string()),
  completed: v.optional(v.boolean()),
});

const newExerciseValidator = v.object({
  exerciseId: v.string(),
  name: v.string(),
  image: v.string(),
  muscleGroup: v.string(),
  sets: v.optional(v.number()),
  reps: v.optional(v.string()),
  duration: v.optional(v.string()),
  restSeconds: v.optional(v.number()),
  order: v.number(),
  videoUrl: v.optional(v.string()),
});

const exerciseUnionValidator = v.union(oldExerciseValidator, newExerciseValidator);

export const createProgram = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    difficulty: v.optional(v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced"))),
    tags: v.array(v.string()),
    exercises: v.optional(v.array(newExerciseValidator)),
    coverImage: v.optional(v.string()),
  },
  returns: v.id("workoutPrograms"),
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);

    const now = Date.now();

    return await ctx.db.insert("workoutPrograms", {
      title: args.title,
      content: args.content,
      difficulty: args.difficulty ?? "Beginner",
      tags: args.tags,
      coachId: profileId,
      createdAt: now,
      updatedAt: now,
      ...(args.exercises !== undefined ? { exercises: args.exercises } : {}),
      ...(args.coverImage !== undefined ? { coverImage: args.coverImage } : {}),
    });
  },
});

export const getPrograms = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("workoutPrograms"),
      _creationTime: v.number(),
      coachId: v.id("profiles"),
      title: v.string(),
      content: v.string(),
      difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
      exercises: v.optional(v.array(exerciseUnionValidator)),
      coverImage: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const profileId = await getMaybeProfileId(ctx);
    if (!profileId) return [];

    return await ctx.db
      .query("workoutPrograms")
      .withIndex("by_coach", (q) => q.eq("coachId", profileId))
      .collect();
  },
});

export const assignToClient = mutation({
  args: {
    programId: v.id("workoutPrograms"),
    clientId: v.id("profiles"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.id("programAssignments"),
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);

    const now = Date.now();

    return await ctx.db.insert("programAssignments", {
      programId: args.programId,
      clientId: args.clientId,
      coachId: profileId,
      assignedDate: now,
      status: "active",
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getClientAssignments = query({
  args: { clientId: v.id("profiles") },
  returns: v.array(
    v.object({
      _id: v.id("programAssignments"),
      _creationTime: v.number(),
      programId: v.id("workoutPrograms"),
      clientId: v.id("profiles"),
      coachId: v.id("profiles"),
      assignedDate: v.number(),
      status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      program: v.union(
        v.object({
          _id: v.id("workoutPrograms"),
          _creationTime: v.number(),
          coachId: v.id("profiles"),
          title: v.string(),
          content: v.string(),
          difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
          tags: v.optional(v.array(v.string())),
          createdAt: v.number(),
          updatedAt: v.number(),
          exercises: v.optional(v.array(exerciseUnionValidator)),
          coverImage: v.optional(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("programAssignments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const results = [];
    for (const assignment of assignments) {
      const program = await ctx.db.get(assignment.programId);
      results.push({ ...assignment, program });
    }
    return results;
  },
});
