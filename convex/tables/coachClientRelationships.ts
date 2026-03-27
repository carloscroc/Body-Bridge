import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireProfileId } from "../lib/auth";

const profileValidator = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  userId: v.id("users"),
  email: v.string(),
  fullName: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  authSource: v.union(v.literal("client"), v.literal("trainer")),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const statusValidator = v.union(
  v.literal("active"),
  v.literal("pending"),
  v.literal("completed"),
  v.literal("cancelled"),
);

const relationshipValidator = v.object({
  _id: v.id("coachClientRelationships"),
  _creationTime: v.number(),
  coachId: v.id("profiles"),
  clientId: v.id("profiles"),
  status: statusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getClientsWithProfiles = query({
  args: {
    coachId: v.id("profiles"),
    status: v.optional(statusValidator),
  },
  returns: v.array(
    v.object({
      relationship: relationshipValidator,
      profile: profileValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const coachProfileId = await requireProfileId(ctx);
    if (args.coachId !== coachProfileId) {
      throw new Error("Unauthorized");
    }

    const rels = await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_coach", (q) => q.eq("coachId", args.coachId))
      .collect();

    const filtered = args.status ? rels.filter((r) => r.status === args.status) : rels;

    const results = [];
    for (const rel of filtered) {
      const profile = await ctx.db.get(rel.clientId);
      if (!profile) continue;
      results.push({ relationship: rel, profile });
    }
    return results;
  },
});

export const create = mutation({
  args: {
    coachId: v.id("profiles"),
    clientId: v.id("profiles"),
    status: statusValidator,
  },
  returns: v.id("coachClientRelationships"),
  handler: async (ctx, args) => {
    const coachProfileId = await requireProfileId(ctx);
    if (args.coachId !== coachProfileId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_pair", (q) => q.eq("coachId", args.coachId).eq("clientId", args.clientId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("coachClientRelationships", {
      coachId: args.coachId,
      clientId: args.clientId,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getByPair = query({
  args: {
    coachId: v.id("profiles"),
    clientId: v.id("profiles"),
  },
  returns: v.union(relationshipValidator, v.null()),
  handler: async (ctx, args) => {
    const coachProfileId = await requireProfileId(ctx);
    if (args.coachId !== coachProfileId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_pair", (q) => q.eq("coachId", args.coachId).eq("clientId", args.clientId))
      .first();
  },
});

export const getRelationship = query({
  args: {
    coachId: v.id("profiles"),
    clientId: v.id("profiles"),
  },
  returns: v.union(relationshipValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_pair", (q) => q.eq("coachId", args.coachId).eq("clientId", args.clientId))
      .first();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("coachClientRelationships"),
    status: statusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const coachProfileId = await requireProfileId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    if (existing.coachId !== coachProfileId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});

export const getStats = query({
  args: { coachId: v.id("profiles") },
  returns: v.object({
    total: v.number(),
    active: v.number(),
    pending: v.number(),
    completed: v.number(),
    cancelled: v.number(),
  }),
  handler: async (ctx, args) => {
    const coachProfileId = await requireProfileId(ctx);
    if (args.coachId !== coachProfileId) {
      throw new Error("Unauthorized");
    }

    const rels = await ctx.db
      .query("coachClientRelationships")
      .withIndex("by_coach", (q) => q.eq("coachId", args.coachId))
      .collect();

    const counts = { active: 0, pending: 0, completed: 0, cancelled: 0 };
    for (const rel of rels) {
      if (rel.status === "active") counts.active += 1;
      else if (rel.status === "pending") counts.pending += 1;
      else if (rel.status === "completed") counts.completed += 1;
      else if (rel.status === "cancelled") counts.cancelled += 1;
    }

    return {
      total: rels.length,
      active: counts.active,
      pending: counts.pending,
      completed: counts.completed,
      cancelled: counts.cancelled,
    };
  },
});
