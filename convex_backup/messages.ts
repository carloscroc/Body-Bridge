import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfileId, getMaybeProfileId } from "./lib/auth";


const AI_BOT_ID = "__ai__";

export const sendMessage = mutation({
  args: {
    receiverId: v.union(v.id("profiles"), v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);

    const message = await ctx.db.insert("messages", {
      senderId: profileId,
      receiverId: args.receiverId,
      content: args.content,
      read: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create a notification for the recipient about the new message
    await ctx.db.insert("notifications", {
      userId: args.receiverId as any,
      type: "message",
      title: "New message",
      message: "You have a new message.",
      payload: { messageId: (message as any)._id },
      link: "/messages",
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: { clientId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profileId = await getMaybeProfileId(ctx);
    if (!profileId) return [];

    const sent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", profileId).eq("receiverId", args.clientId)
      )
      .collect();

    const received = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.clientId).eq("receiverId", profileId)
      )
      .collect();

    return [...sent, ...received].sort(
      (a, b) => a._creationTime - b._creationTime
    );
  },
});

export const getConversationTail = query({
  args: {
    otherId: v.union(v.id("profiles"), v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profileId = await getMaybeProfileId(ctx);
    if (!profileId) return [];

    const limit = args.limit && args.limit > 0 ? Math.min(args.limit, 100) : 30;

    const sent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("senderId", profileId).eq("receiverId", args.otherId as any))
      .order("desc")
      .take(limit);

    const received = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("senderId", args.otherId as any).eq("receiverId", profileId))
      .order("desc")
      .take(limit);

    const merged = [...sent, ...received].sort((a, b) => a._creationTime - b._creationTime);
    return merged.length > limit ? merged.slice(merged.length - limit) : merged;
  },
});

export const insertAiReply = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);

    return await ctx.db.insert("messages", {
      senderId: AI_BOT_ID,
      receiverId: profileId,
      content: args.content,
      read: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { senderId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profileId = await getMaybeProfileId(ctx);
    if (!profileId) return;

    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.senderId).eq("receiverId", profileId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const msg of unread) {
      await ctx.db.patch(msg._id, { read: true, updatedAt: Date.now() });
    }
  },
});
