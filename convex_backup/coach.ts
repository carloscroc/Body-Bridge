import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfileId } from "./lib/auth";

/**
 * Coach Relationship API
 * Handles linking clients to trainers.
 */

/**
 * Client joins a coach using the coach's email address.
 */
export const joinCoachByEmail = mutation({
  args: { coachEmail: v.string() },
  handler: async (ctx, args) => {
    const clientProfileId = await requireProfileId(ctx);
    
    // 1. Find the coach's profile
    const coachProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email_authSource", (q) => 
        q.eq("email", args.coachEmail).eq("authSource", "trainer")
      )
      .first();
    
    if (!coachProfile) {
      throw new Error("Trainer not found with that email. Make sure they have a trainer account.");
    }
    
    // 2. Check if relationship already exists
    const existing = await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_pair", (q) => 
        q.eq("coachId", coachProfile._id).eq("clientId", clientProfileId)
      )
      .first();
    
    if (existing) {
      if (existing.status === "cancelled") {
        await ctx.db.patch(existing._id, { status: "pending", updatedAt: Date.now() });
        return existing._id;
      }
      return existing._id;
    }
    
    // 3. Create new pending relationship
    return await ctx.db.insert("coachClientRelationships", {
      coachId: coachProfile._id,
      clientId: clientProfileId,
      status: "pending", // Coach must approve in their app
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get the current user's active coach
 */
export const getMyCoach = query({
  args: {},
  handler: async (ctx) => {
    const profileId = await requireProfileId(ctx);
    
    const relationship = await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_client", (q) => q.eq("clientId", profileId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!relationship) return null;
    
    return await ctx.db.get(relationship.coachId);
  },
});

/**
 * Assign a workout to a client (Called by Trainer in Apex app)
 */
export const assignWorkoutToClient = mutation({
  args: {
    clientId: v.id("profiles"),
    workoutTemplateId: v.id("workoutPrograms"), // Assign a program and materialize as a client workout
  },
  handler: async (ctx, args) => {
    const coachProfileId = await requireProfileId(ctx);
    
    // 1. Verify relationship exists and is active
    const rel = await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_pair", (q) => 
        q.eq("coachId", coachProfileId).eq("clientId", args.clientId)
      )
      .first();
    
    if (!rel || rel.status !== "active") {
      throw new Error("You must have an active relationship with this client to assign workouts.");
    }
    
    // 2. Get the program template
    const template = await ctx.db.get(args.workoutTemplateId);
    if (!template) throw new Error("Workout program not found.");
    // 3. Normalize exercises to canonical WorkoutExercise shape.
    //    Template may store OLD shape ({id, sets:string, rest:string, ...})
    //    or NEW shape ({exerciseId, sets:number, restSeconds:number, order, ...}).
    const rawExercises = Array.isArray(template.exercises) ? template.exercises : [];
    const canonicalExercises = rawExercises.map((ex: Record<string, unknown>, idx: number) => {
      // NEW shape already has exerciseId
      if (typeof ex.exerciseId === "string") {
        return {
          exerciseId: ex.exerciseId,
          name: String(ex.name ?? ""),
          image: String(ex.image ?? ""),
          muscleGroup: String(ex.muscleGroup ?? ""),
          ...(typeof ex.sets === "number" ? { sets: ex.sets } : {}),
          ...(typeof ex.reps === "string" ? { reps: ex.reps } : {}),
          ...(typeof ex.duration === "string" ? { duration: ex.duration } : {}),
          ...(typeof ex.restSeconds === "number" ? { restSeconds: ex.restSeconds } : {}),
          order: typeof ex.order === "number" ? ex.order : idx,
          ...(typeof ex.videoUrl === "string" ? { videoUrl: ex.videoUrl } : {}),
        };
      }
      // OLD shape: convert {id, sets:string, rest:string, ...} -> canonical
      const parsedSets = parseInt(String(ex.sets ?? ""), 10);
      const parsedRest = parseInt(String(ex.rest ?? ""), 10);
      return {
        exerciseId: String(ex.id ?? ""),
        name: String(ex.name ?? ""),
        image: String(ex.image ?? ""),
        muscleGroup: "",
        ...(Number.isFinite(parsedSets) ? { sets: parsedSets } : {}),
        ...(typeof ex.reps === "string" ? { reps: ex.reps } : {}),
        ...(Number.isFinite(parsedRest) ? { restSeconds: parsedRest } : {}),
        order: idx,
      };
    });
    
    // 4. Materialize as a workout entry for the client app.
    return await ctx.db.insert("workouts", {
      userId: args.clientId,
      title: template.title,
      subtitle: "Assigned program",
      exercises: canonicalExercises,
      completed: false,
      date: Date.now(),
      createdAt: Date.now(),
    });
  },
});
