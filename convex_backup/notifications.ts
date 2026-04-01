import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfileId, getMaybeProfileId } from "./lib/auth";
import { paginationOptsValidator } from "convex/server";

export const createNotification = mutation({
  args: {
    userId: v.id("profiles"),
    type: v.union(
      v.literal("message"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("like"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    payload: v.optional(v.any()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      payload: args.payload,
      link: args.link,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const createSelfNotification = mutation({
  args: {
    type: v.union(
      v.literal("message"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("like"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    payload: v.optional(v.any()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireProfileId(ctx);
    return await ctx.db.insert("notifications", {
      userId,
      type: args.type,
      title: args.title,
      message: args.message,
      payload: args.payload,
      link: args.link,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const getNotifications = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const profileId = await getMaybeProfileId(ctx);
    if (!profileId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", profileId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const profileId = await getMaybeProfileId(ctx);
    if (!profileId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead_createdAt", (q) =>
        q.eq("userId", profileId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== profileId) {
      throw new Error("Notification not found or access denied");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const profileId = await requireProfileId(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead_createdAt", (q) =>
        q.eq("userId", profileId).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== profileId) {
      throw new Error("Notification not found or access denied");
    }

    await ctx.db.delete(args.notificationId);
  },
});
