import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireTrainer } from "./lib/auth";

const lessonValidator = v.object({
  id: v.string(),
  title: v.string(),
  content: v.string(),
  type: v.union(
    v.literal("video"),
    v.literal("text"),
    v.literal("quiz"),
    v.literal("assignment"),
  ),
  duration: v.optional(v.string()),
  videoUrl: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  isPublished: v.boolean(),
  order: v.number(),
});

const moduleValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  order: v.number(),
  lessons: v.array(lessonValidator),
});

const coursePayloadValidator = v.object({
  title: v.string(),
  subtitle: v.string(),
  description: v.string(),
  coverImage: v.optional(v.string()),
  thumbnail: v.optional(v.string()),
  price: v.number(),
  currency: v.string(),
  isPublished: v.boolean(),
  visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
  category: v.string(),
  difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
  estimatedDuration: v.string(),
  tags: v.array(v.string()),
  modules: v.array(moduleValidator),
  enrolledCount: v.number(),
  rating: v.number(),
});

const courseDocValidator = v.object({
  _id: v.id("courses"),
  _creationTime: v.number(),
  coachId: v.id("profiles"),
  title: v.string(),
  subtitle: v.string(),
  description: v.string(),
  coverImage: v.optional(v.string()),
  thumbnail: v.optional(v.string()),
  price: v.number(),
  currency: v.string(),
  isPublished: v.boolean(),
  visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
  category: v.string(),
  difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
  estimatedDuration: v.string(),
  tags: v.array(v.string()),
  modules: v.array(moduleValidator),
  enrolledCount: v.number(),
  rating: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      subtitle: v.string(),
      isPublished: v.boolean(),
      visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
      category: v.string(),
      difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
      price: v.number(),
      currency: v.string(),
      moduleCount: v.number(),
      lessonCount: v.number(),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const trainer = await requireTrainer(ctx);
    const rows = await ctx.db
      .query("courses")
      .withIndex("by_coach", (q) => q.eq("coachId", trainer._id))
      .collect();

    const summaries = rows.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      title: c.title,
      subtitle: c.subtitle,
      isPublished: c.isPublished,
      visibility: c.visibility,
      category: c.category,
      difficulty: c.difficulty,
      price: c.price,
      currency: c.currency,
      moduleCount: c.modules.length,
      lessonCount: c.modules.reduce((acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0),
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    summaries.sort((a, b) => b.updatedAt - a.updatedAt);
    return summaries;
  },
});

export const getById = query({
  args: { id: v.id("courses") },
  returns: v.union(courseDocValidator, v.null()),
  handler: async (ctx, args) => {
    const trainer = await requireTrainer(ctx);
    const course = await ctx.db.get(args.id);
    if (!course) return null;
    if (course.coachId !== trainer._id) throw new Error("Unauthorized");
    return course;
  },
});

export const saveDraft = mutation({
  args: {
    id: v.optional(v.id("courses")),
    course: coursePayloadValidator,
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const trainer = await requireTrainer(ctx);
    const now = Date.now();

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Course not found");
      if (existing.coachId !== trainer._id) throw new Error("Unauthorized");

      await ctx.db.replace(args.id, {
        coachId: trainer._id,
        ...args.course,
        createdAt: existing.createdAt,
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert("courses", {
      coachId: trainer._id,
      ...args.course,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const publish = mutation({
  args: {
    id: v.id("courses"),
    visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const trainer = await requireTrainer(ctx);
    const course = await ctx.db.get(args.id);
    if (!course) throw new Error("Course not found");
    if (course.coachId !== trainer._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      isPublished: true,
      visibility: args.visibility,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("courses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const trainer = await requireTrainer(ctx);
    const course = await ctx.db.get(args.id);
    if (!course) return null;
    if (course.coachId !== trainer._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
