import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Id, Doc } from "./_generated/dataModel";

// ============== POSTS ==============

export const getPosts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("socialPosts"),
      _creationTime: v.number(),
      authorId: v.id("profiles"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      authorRole: v.union(v.literal("trainer"), v.literal("client")),
      title: v.optional(v.string()),
      content: v.string(),
      category: v.optional(v.string()),
      mediaUrls: v.optional(v.array(v.string())),
      isPinned: v.boolean(),
      isDeleted: v.boolean(),
      likeCount: v.number(),
      commentCount: v.number(),
      lastCommentAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    // Fetch pinned posts first, then regular feed sorted by most recent activity
    const pinned = await ctx.db
      .query("socialPosts")
      .withIndex("by_isPinned", (q) => q.eq("isPinned", true))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .collect();

    const regular = await ctx.db
      .query("socialPosts")
      .withIndex("by_isDeleted", (q) => q.eq("isDeleted", false))
      .order("desc")
      .paginate(args.paginationOpts);

    // Merge pinned posts at the top of the first page
    const pinnedIds = new Set(pinned.map((p) => p._id));
    const filteredRegular = regular.page.filter((p) => !pinnedIds.has(p._id));
    const page = args.paginationOpts.cursor === null
      ? [...pinned, ...filteredRegular]
      : filteredRegular;

    return {
      page,
      isDone: regular.isDone,
      continueCursor: regular.continueCursor,
      pageStatus: regular.pageStatus,
      splitCursor: regular.splitCursor,
    };
  },
});

export const getPostById = query({
  args: {
    postId: v.id("socialPosts"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("socialPosts"),
      _creationTime: v.number(),
      authorId: v.id("profiles"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      authorRole: v.union(v.literal("trainer"), v.literal("client")),
      title: v.optional(v.string()),
      content: v.string(),
      category: v.optional(v.string()),
      mediaUrls: v.optional(v.array(v.string())),
      isPinned: v.boolean(),
      isDeleted: v.boolean(),
      likeCount: v.number(),
      commentCount: v.number(),
      lastCommentAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      return null;
    }
    return post;
  },
});

export const createPost = mutation({
  args: {
    authorId: v.id("profiles"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    authorRole: v.union(v.literal("trainer"), v.literal("client")),
    title: v.optional(v.string()),
    content: v.string(),
    category: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
  },
  returns: v.id("socialPosts"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("socialPosts", {
      authorId: args.authorId,
      authorName: args.authorName,
      authorAvatar: args.authorAvatar,
      authorRole: args.authorRole,
      title: args.title,
      content: args.content,
      category: args.category ?? "General",
      mediaUrls: args.mediaUrls,
      isPinned: false,
      isDeleted: false,
      likeCount: 0,
      commentCount: 0,
      lastCommentAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("socialPosts"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(args.postId, {
      content: args.content,
      mediaUrls: args.mediaUrls,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("socialPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(args.postId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const pinPost = mutation({
  args: {
    postId: v.id("socialPosts"),
    isPinned: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(args.postId, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// ============== COMMENTS ==============

export const getCommentsByPost = query({
  args: {
    postId: v.id("socialPosts"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("socialComments"),
      _creationTime: v.number(),
      postId: v.id("socialPosts"),
      authorId: v.id("profiles"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      authorRole: v.union(v.literal("trainer"), v.literal("client")),
      content: v.string(),
      parentCommentId: v.optional(v.id("socialComments")),
      likeCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createComment = mutation({
  args: {
    postId: v.id("socialPosts"),
    authorId: v.id("profiles"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    authorRole: v.union(v.literal("trainer"), v.literal("client")),
    content: v.string(),
    parentCommentId: v.optional(v.id("socialComments")),
  },
  returns: v.id("socialComments"),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      throw new Error("Post not found");
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("socialComments", {
      postId: args.postId,
      authorId: args.authorId,
      authorName: args.authorName,
      authorAvatar: args.authorAvatar,
      authorRole: args.authorRole,
      content: args.content,
      parentCommentId: args.parentCommentId,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
      lastCommentAt: now,
      updatedAt: now,
    });
    // Notify post owner about the new comment (if not commenting on own post)
    const postOwnerId = post.authorId;
    if (postOwnerId && postOwnerId !== args.authorId) {
      const owner = await ctx.db.get(postOwnerId);
      const ownerName = (owner as any)?.fullName ?? "User";
      // Notification already contains commentId from above
      await ctx.db.insert("notifications", {
        userId: postOwnerId as any,
        type: "comment",
        title: "New comment on your post",
        message: `${args.authorName} commented on your post`,
        payload: { postId: args.postId, commentId },
        link: `/posts/${args.postId}`,
        isRead: false,
        createdAt: now,
      });
    }

    return commentId;
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("socialComments"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("socialComments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, post.commentCount - 1),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.commentId);
    return null;
  },
});

// ============== LIKES ==============

export const getLikeStatus = query({
  args: {
    postId: v.optional(v.id("socialPosts")),
    commentId: v.optional(v.id("socialComments")),
    userId: v.id("profiles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let like: Doc<"socialLikes"> | null = null;
    if (args.postId) {
      like = await ctx.db
        .query("socialLikes")
        .withIndex("by_post_user", (q) =>
          q.eq("postId", args.postId).eq("userId", args.userId)
        )
        .unique();
    } else if (args.commentId) {
      like = await ctx.db
        .query("socialLikes")
        .withIndex("by_comment_user", (q) =>
          q.eq("commentId", args.commentId).eq("userId", args.userId)
        )
        .unique();
    }
    return !!like;
  },
});

export const toggleLike = mutation({
  args: {
    postId: v.optional(v.id("socialPosts")),
    commentId: v.optional(v.id("socialComments")),
    userId: v.id("profiles"),
  },
  returns: v.object({
    liked: v.boolean(),
    likeCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let existingLike: Doc<"socialLikes"> | null = null;

    if (args.postId) {
      existingLike = await ctx.db
        .query("socialLikes")
        .withIndex("by_post_user", (q) =>
          q.eq("postId", args.postId).eq("userId", args.userId)
        )
        .unique();
    } else if (args.commentId) {
      existingLike = await ctx.db
        .query("socialLikes")
        .withIndex("by_comment_user", (q) =>
          q.eq("commentId", args.commentId).eq("userId", args.userId)
        )
        .unique();
    } else {
      throw new Error("Must provide either postId or commentId");
    }

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);

      if (args.postId) {
        const post = await ctx.db.get(args.postId);
        if (post) {
          const newCount = Math.max(0, post.likeCount - 1);
          await ctx.db.patch(args.postId, {
            likeCount: newCount,
          });
          return { liked: false, likeCount: newCount };
        }
      } else if (args.commentId) {
        const comment = await ctx.db.get(args.commentId);
        if (comment) {
          const newCount = Math.max(0, comment.likeCount - 1);
          await ctx.db.patch(args.commentId, {
            likeCount: newCount,
          });
          return { liked: false, likeCount: newCount };
        }
      }
      return { liked: false, likeCount: 0 };
    } else {
      // Like
      const likeData: {
        userId: Id<"profiles">;
        createdAt: number;
        postId?: Id<"socialPosts">;
        commentId?: Id<"socialComments">;
      } = {
        userId: args.userId,
        createdAt: now,
      };
      
      if (args.postId) likeData.postId = args.postId;
      if (args.commentId) likeData.commentId = args.commentId;

      await ctx.db.insert("socialLikes", likeData);

      if (args.postId) {
        const post = await ctx.db.get(args.postId);
        if (post) {
          const newCount = post.likeCount + 1;
          await ctx.db.patch(args.postId, {
            likeCount: newCount,
          });

          // Notify post owner about the like (not self-like)
          if (post.authorId !== args.userId) {
            const actor = await ctx.db.get(args.userId);
            const actorName = (actor as any)?.fullName ?? "Someone";
            await ctx.db.insert("notifications", {
              userId: post.authorId as any,
              type: "like",
              title: "New like on your post",
              message: `${actorName} liked your post`,
              payload: { postId: args.postId },
              link: `/posts/${args.postId}`,
              isRead: false,
              createdAt: now,
            });
          }

          return { liked: true, likeCount: newCount };
        }
      } else if (args.commentId) {
        const comment = await ctx.db.get(args.commentId);
        if (comment) {
          const newCount = comment.likeCount + 1;
          await ctx.db.patch(args.commentId, {
            likeCount: newCount,
          });
          return { liked: true, likeCount: newCount };
        }
      }
      return { liked: true, likeCount: 1 };
    }
  },
});

// ============== CATEGORY FILTERED FEED ==============

export const getPostsByCategory = query({
  args: {
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("socialPosts"),
      _creationTime: v.number(),
      authorId: v.id("profiles"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      authorRole: v.union(v.literal("trainer"), v.literal("client")),
      title: v.optional(v.string()),
      content: v.string(),
      category: v.optional(v.string()),
      mediaUrls: v.optional(v.array(v.string())),
      isPinned: v.boolean(),
      isDeleted: v.boolean(),
      likeCount: v.number(),
      commentCount: v.number(),
      lastCommentAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    if (!args.category || args.category === "All") {
      // Delegate to getPosts logic (pinned first, then regular)
      const pinned = await ctx.db
        .query("socialPosts")
        .withIndex("by_isPinned", (q) => q.eq("isPinned", true))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .order("desc")
        .collect();

      const regular = await ctx.db
        .query("socialPosts")
        .withIndex("by_isDeleted", (q) => q.eq("isDeleted", false))
        .order("desc")
        .paginate(args.paginationOpts);

      const pinnedIds = new Set(pinned.map((p) => p._id));
      const filteredRegular = regular.page.filter((p) => !pinnedIds.has(p._id));
      const page = args.paginationOpts.cursor === null
        ? [...pinned, ...filteredRegular]
        : filteredRegular;

      return {
        page,
        isDone: regular.isDone,
        continueCursor: regular.continueCursor,
        pageStatus: regular.pageStatus,
        splitCursor: regular.splitCursor,
      };
    }

    // Filter by specific category
    const pinned = await ctx.db
      .query("socialPosts")
      .withIndex("by_isPinned", (q) => q.eq("isPinned", true))
      .filter((q) =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.eq(q.field("category"), args.category),
        )
      )
      .order("desc")
      .collect();

    const regular = await ctx.db
      .query("socialPosts")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .paginate(args.paginationOpts);

    const pinnedIds = new Set(pinned.map((p) => p._id));
    const filteredRegular = regular.page.filter((p) => !pinnedIds.has(p._id));
    const page = args.paginationOpts.cursor === null
      ? [...pinned, ...filteredRegular]
      : filteredRegular;

    return {
      page,
      isDone: regular.isDone,
      continueCursor: regular.continueCursor,
      pageStatus: regular.pageStatus,
      splitCursor: regular.splitCursor,
    };
  },
});

// ============== GROUP MEMBERS ==============

export const getGroupMembers = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("groupMembers"),
    _creationTime: v.number(),
    userId: v.id("profiles"),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("trainer"), v.literal("client")),
    joinedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
    isActive: v.boolean(),
  })),
  handler: async (ctx) => {
    return await ctx.db
      .query("groupMembers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(100);
  },
});

export const addGroupMember = mutation({
  args: {
    userId: v.id("profiles"),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("trainer"), v.literal("client")),
  },
  returns: v.id("groupMembers"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        lastActiveAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("groupMembers", {
      userId: args.userId,
      fullName: args.fullName,
      avatarUrl: args.avatarUrl,
      role: args.role,
      joinedAt: now,
      lastActiveAt: now,
      isActive: true,
    });
  },
});

export const removeGroupMember = mutation({
  args: {
    memberId: v.id("groupMembers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memberId, {
      isActive: false,
    });
    return null;
  },
});

export const updateMemberActivity = mutation({
  args: {
    userId: v.id("profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (member) {
      await ctx.db.patch(member._id, {
        lastActiveAt: Date.now(),
      });
    }
    return null;
  },
});

// ============== FOLLOW SYSTEM ==============

export const createFollow = mutation({
  args: {
    followerId: v.id("profiles"),
    followingId: v.id("profiles"),
  },
  returns: v.id("socialFollows"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already following
    const existing = await ctx.db
      .query("socialFollows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();

    if (existing) {
      throw new Error("Already following this user");
    }

    return await ctx.db.insert("socialFollows", {
      followerId: args.followerId,
      followingId: args.followingId,
      createdAt: now,
    });
  },
});

export const deleteFollow = mutation({
  args: {
    followId: v.id("socialFollows"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.followId);
    return null;
  },
});

export const isFollowing = query({
  args: {
    followerId: v.id("profiles"),
    followingId: v.id("profiles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("socialFollows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    return !!follow;
  },
});

export const getFollowers = query({
  args: {
    followingId: v.id("profiles"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("socialFollows"),
      _creationTime: v.number(),
      followerId: v.id("profiles"),
      followerName: v.string(),
      followerAvatar: v.optional(v.string()),
      followerRole: v.union(v.literal("trainer"), v.literal("client")),
      createdAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("socialFollows")
      .withIndex("by_following", (q) => q.eq("followingId", args.followingId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      follows.page.map(async (follow) => {
        const follower = await ctx.db.get(follow.followerId);
        return {
          ...follow,
          followerName: follower?.fullName || "Unknown",
          followerAvatar: follower?.avatarUrl,
          followerRole: follower?.authSource || "client",
        };
      })
    );

    return { ...follows, page };
  },
});

export const getFollowing = query({
  args: {
    followerId: v.id("profiles"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("socialFollows"),
      _creationTime: v.number(),
      followingId: v.id("profiles"),
      followingName: v.string(),
      followingAvatar: v.optional(v.string()),
      followingRole: v.union(v.literal("trainer"), v.literal("client")),
      createdAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("socialFollows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.followerId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      follows.page.map(async (follow) => {
        const following = await ctx.db.get(follow.followingId);
        return {
          ...follow,
          followingName: following?.fullName || "Unknown",
          followingAvatar: following?.avatarUrl,
          followingRole: following?.authSource || "client",
        };
      })
    );

    return { ...follows, page };
  },
});

export const getFollowersCount = query({
  args: {
    userId: v.id("profiles"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("socialFollows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    return count.length;
  },
});

export const getFollowingCount = query({
  args: {
    userId: v.id("profiles"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("socialFollows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return count.length;
  },
});

export const getTopFollowers = query({
  args: {
    limit: v.number(),
  },
  returns: v.array(v.object({
    userId: v.id("profiles"),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    userRole: v.union(v.literal("trainer"), v.literal("client")),
    followerCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("socialFollows")
      .withIndex("by_following")
      .collect();

    const counts = new Map();
    followers.forEach((follow) => {
      const count = counts.get(follow.followingId) || 0;
      counts.set(follow.followingId, count + 1);
    });

    const sorted = Array.from(counts.entries())
      .map(([userId, count]) => ({ userId, followerCount: count }))
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, args.limit)
      .map(async (item) => {
        const user = await ctx.db.get(item.userId);
        if (!user) return null;
        const profile = user as Doc<"profiles">;
        return {
          userId: profile._id,
          userName: profile.fullName || profile.email,
          userAvatar: profile.avatarUrl,
          userRole: profile.authSource,
          followerCount: item.followerCount,
        };
      });

    const results = await Promise.all(sorted);
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

// ============== ANALYTICS ==============

export const getCommunityAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalPosts: v.number(),
    totalMembers: v.number(),
    totalLikes: v.number(),
    totalComments: v.number(),
    totalFollowers: v.number(),
    activeUsers: v.number(),
    engagementRate: v.number(),
    newFollowers: v.number(),
    topContributors: v.array(v.object({
      userId: v.id("profiles"),
      userName: v.string(),
      userAvatar: v.optional(v.string()),
      postCount: v.number(),
    })),
    recentActivity: v.array(v.object({
      type: v.union(v.literal("post"), v.literal("like"), v.literal("comment"), v.literal("follow")),
      userId: v.id("profiles"),
      userName: v.string(),
      userAvatar: v.optional(v.string()),
      content: v.optional(v.string()),
      createdAt: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekAgo = args.endDate || (args.startDate || now) - 7 * 24 * 60 * 60 * 1000;
    const startOfDay = Math.floor(now / 86400000) * 86400000;

    // Total posts
    const allPosts = await ctx.db
      .query("socialPosts")
      .collect();
    const totalPosts = allPosts.length;

    // Total members (active)
    const activeMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const totalMembers = activeMembers.length;

    // Total likes
    const allLikes = await ctx.db
      .query("socialLikes")
      .collect();
    const totalLikes = allLikes.length;

    // Total comments
    const allComments = await ctx.db
      .query("socialComments")
      .collect();
    const totalComments = allComments.length;

    // Total followers
    const allFollows = await ctx.db
      .query("socialFollows")
      .collect();
    const totalFollowers = allFollows.length;

    // Active users this week
    const lastWeek = now - 7 * 24 * 60 * 60 * 1000;
    // groupMembers doesn't have by_lastActiveAt, but it's small enough for now
    // or I could add an index to it too
    const activeWeekUsers = await ctx.db
      .query("groupMembers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.gte(q.field("lastActiveAt"), lastWeek))
      .collect();
    const activeUsers = activeWeekUsers.length;

    // New followers this week
    const weekFollows = await ctx.db
      .query("socialFollows")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", lastWeek))
      .collect();
    const newFollowers = weekFollows.length;

    // Engagement rate
    const engagementRateStr = totalPosts > 0
      ? ((totalLikes + totalComments) / totalPosts * 100).toFixed(1)
      : "0";

    // Top contributors (most posts)
    const postCounts = new Map();
    allPosts.forEach((post) => {
      postCounts.set(post.authorId, (postCounts.get(post.authorId) || 0) + 1);
    });

    const contributorPromises = Array.from(postCounts.entries())
      .map(([userId, count]) => ({ userId, postCount: count }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5)
      .map(async (item) => {
        const user = await ctx.db.get(item.userId);
        if (!user) return null;
        const profile = user as Doc<"profiles">;
        return {
          userId: profile._id,
          userName: profile.fullName || profile.email,
          userAvatar: profile.avatarUrl,
          postCount: item.postCount,
        };
      });

    const topContributorsRaw = await Promise.all(contributorPromises);
    const topContributors = topContributorsRaw.filter((c): c is NonNullable<typeof c> => c !== null);

    // Recent activity (last 10)
    const recentActivity = await ctx.db
      .query("socialPosts")
      .order("desc")
      .take(5);

    const formattedActivity = await Promise.all(recentActivity.map(async (post) => {
      return {
        type: "post" as const,
        userId: post.authorId,
        userName: post.authorName,
        userAvatar: post.authorAvatar,
        content: post.content,
        createdAt: post.createdAt,
      };
    }));

    return {
      totalPosts,
      totalMembers,
      totalLikes,
      totalComments,
      totalFollowers,
      activeUsers,
      engagementRate: parseFloat(engagementRateStr),
      newFollowers,
      topContributors,
      recentActivity: formattedActivity,
    };
  },
});

export const getEngagementTrend = query({
  args: {
    days: v.number(),
  },
  returns: v.array(v.object({
    date: v.string(),
    posts: v.number(),
    likes: v.number(),
    comments: v.number(),
    engagement: v.number(),
  })),
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const trend = [];

    for (let i = args.days - 1; i >= 0; i--) {
      const date = new Date(now - i * oneDay);
      const startOfDay = Math.floor(date.getTime() / oneDay) * oneDay;
      const endOfDay = startOfDay + oneDay;

      // Posts
      const dayPosts = await ctx.db
        .query("socialPosts")
        .filter((q) =>
          q.and(
            q.gte(q.field("_creationTime"), startOfDay),
            q.lt(q.field("_creationTime"), endOfDay)
          )
        )
        .collect();

      // Likes
      const dayLikes = await ctx.db
        .query("socialLikes")
        .filter((q) =>
          q.and(
            q.gte(q.field("_creationTime"), startOfDay),
            q.lt(q.field("_creationTime"), endOfDay)
          )
        )
        .collect();

      // Comments
      const dayComments = await ctx.db
        .query("socialComments")
        .filter((q) =>
          q.and(
            q.gte(q.field("_creationTime"), startOfDay),
            q.lt(q.field("_creationTime"), endOfDay)
          )
        )
        .collect();

      const engagementStr = dayPosts.length > 0
        ? ((dayLikes.length + dayComments.length) / dayPosts.length * 100).toFixed(1)
        : "0";

      trend.push({
        date: date.toISOString().split('T')[0],
        posts: dayPosts.length,
        likes: dayLikes.length,
        comments: dayComments.length,
        engagement: parseFloat(engagementStr),
      });
    }

    return trend;
  },
});

export const getRecentActivity = query({
  args: {
    limit: v.number(),
  },
  returns: v.array(v.object({
    type: v.union(v.literal("post"), v.literal("like"), v.literal("comment"), v.literal("follow")),
    userId: v.id("profiles"),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    content: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get recent posts
    const recentPosts = await ctx.db
      .query("socialPosts")
      .order("desc")
      .take(args.limit);

    const activities = await Promise.all(recentPosts.map(async (post) => ({
      type: "post" as const,
      userId: post.authorId,
      userName: post.authorName,
      userAvatar: post.authorAvatar,
      content: post.content,
      createdAt: post.createdAt,
    })));

    return activities;
  },
});
