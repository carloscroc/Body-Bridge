import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ============ EVENT CRUD OPERATIONS ============

/**
 * Create a new calendar event (Internal/Action use)
 */
export const createEventInternal = internalMutation({
  args: {
    relationshipId: v.id("coachClientRelationships"),
    date: v.number(),
    eventType: v.union(v.literal("workout"), v.literal("meal"), v.literal("rest"), v.literal("other")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("missed"), v.literal("cancelled")),
    assignedBy: v.id("profiles"),
    assignedTo: v.id("profiles"),
    exercises: v.optional(v.array(v.any())),
    mealData: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // 1) Insert the calendar event and capture its generated id
    const eventId = await ctx.db.insert("calendarEvents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // 2) Create a system notification for the assigned user
    try {
      await ctx.db.insert("notifications", {
        userId: args.assignedTo,
        type: "system",
        title: "New scheduled event",
        // Human-friendly message including title and date
        message: `Event "${args.title}" scheduled for ${new Date(args.date).toLocaleString()}`,
        payload: {
          kind: 'calendar_event',
          eventId: eventId,
          eventType: args.eventType,
          date: args.date,
        },
        link: "/calendar",
        isRead: false,
        createdAt: now,
      });
    } catch {
      // If notification insertion fails, do not prevent event creation from succeeding
    }

    return eventId;
  },
});

/**
 * Create a new calendar event (Public)
 */
export const createEvent = mutation({
  args: {
    relationshipId: v.id("coachClientRelationships"),
    date: v.number(),
    eventType: v.union(v.literal("workout"), v.literal("meal"), v.literal("rest"), v.literal("other")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("missed"), v.literal("cancelled")),
    assignedBy: v.id("profiles"),
    assignedTo: v.id("profiles"),
    exercises: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // 1) Insert the calendar event and capture its generated id
    const eventId = await ctx.db.insert("calendarEvents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // 2) Create a system notification for the assigned user
    try {
      await ctx.db.insert("notifications", {
        userId: args.assignedTo,
        type: "system",
        title: "New scheduled event",
        message: `Event "${args.title}" scheduled for ${new Date(args.date).toLocaleString()}`,
        payload: {
          kind: 'calendar_event',
          eventId: eventId,
          eventType: args.eventType,
          date: args.date,
        },
        link: "/calendar",
        isRead: false,
        createdAt: now,
      });
    } catch {
      // Ignore notification failures to avoid blocking the operation
    }

    return eventId;
  },
});

/**
 * Get event by ID
 */
export const getEvent = query({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

/**
 * Update event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      date: v.optional(v.number()),
      status: v.optional(v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("missed"), v.literal("cancelled"))),
      exercises: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete event
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
  },
});

/**
 * List events for a client
 */
export const listEventsForClient = query({
  args: {
    clientId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.clientId))
      .collect();
  },
});

/**
 * List events for a relationship in a date range
 */
export const listEvents = query({
  args: {
    relationshipId: v.id("coachClientRelationships"),
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_relationship", (q) => q.eq("relationshipId", args.relationshipId))
      .filter((q) => q.and(
        q.gte(q.field("date"), args.start),
        q.lte(q.field("date"), args.end)
      ))
      .collect();
  },
});

// ============ SIDEBAR / LIBRARY OPERATIONS ============

export const listCalendarExercises = query({
  args: {
    category: v.optional(v.string()),
    bodyRegion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db.query("exercises")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(100);
    } 
    
    if (args.bodyRegion) {
      return await ctx.db.query("exercises")
        .withIndex("by_bodyRegion", (q) => q.eq("bodyRegion", args.bodyRegion!))
        .take(100);
    }

    return await ctx.db.query("exercises").take(100);
  },
});
