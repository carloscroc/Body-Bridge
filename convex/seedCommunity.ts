import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin secret checker
function isAdminSecret(secret?: string): boolean {
  return typeof secret === 'string' && secret === process.env.ADMIN_SCRIPT_SECRET;
}

// ============== SEEDING MUTATIONS ==============

export const seedCommunityData = mutation({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const now = Date.now();

    // First, check if we already have data
    const existingPosts = await ctx.db.query("socialPosts").collect();
    if (existingPosts.length > 0) {
      return { success: true, message: "Community data already seeded", count: existingPosts.length };
    }

    // Get existing profiles to use as authors
    const profiles = await ctx.db.query("profiles").collect();

    if (profiles.length < 2) {
      return { success: false, message: "Need at least 2 profiles to seed community data" };
    }

    const clientProfile = profiles.find(p => p.authSource === "client") || profiles[0];
    const trainerProfile = profiles.find(p => p.authSource === "trainer") || profiles[1];

    if (!clientProfile || !trainerProfile) {
      return { success: false, message: "Need both client and trainer profiles" };
    }

    // Sample posts with different categories
    const samplePosts = [
      {
        authorId: clientProfile._id,
        authorName: clientProfile.fullName || "Community Member",
        authorAvatar: clientProfile.image,
        authorRole: "client" as const,
        title: "Just hit a new PR on bench press! 💪",
        content: "After months of training, I finally hit my goal of 225 lbs on bench press! The programming from the coaches here really paid off. Thanks everyone for the support!",
        category: "PR",
        mediaUrls: [],
        isPinned: true,
      },
      {
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Coach Sarah",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        title: "Weekly Training Tip: Rest & Recovery",
        content: "Don't underestimate the power of proper rest! 🛌 I've seen too many athletes overtraining because they think more is always better. Quality > Quantity. Aim for 7-9 hours of sleep and take at least 1-2 rest days per week. Your muscles grow during recovery, not during training!",
        category: "General Discussion",
        mediaUrls: [],
        isPinned: true,
      },
      {
        authorId: clientProfile._id,
        authorName: clientProfile.fullName || "Mike F.",
        authorAvatar: clientProfile.image,
        authorRole: "client" as const,
        title: "Need help with squat form",
        content: "I've been working on my squat form but I feel like my knees might be caving in. Any tips from the coaches here? I'm trying to maintain proper depth without sacrificing form. 🏋️‍♂️",
        category: "Form Check",
        mediaUrls: [],
        isPinned: false,
      },
      {
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Coach Mike",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        title: "Client Transformation Spotlight - John's Journey",
        content: "In just 3 months, John has completely transformed his physique and strength! Down 15 lbs of body fat while maintaining muscle mass. His dedication to the nutrition plan and consistent training schedule is inspiring. Keep it up, John! 🏆",
        category: "Wins",
        mediaUrls: [],
        isPinned: true,
      },
      {
        authorId: clientProfile._id,
        authorName: clientProfile.fullName || "Emma L.",
        authorAvatar: clientProfile.image,
        authorRole: "client" as const,
        title: "Question about workout timing",
        content: "What's the best time of day to train for strength gains? I've been training in the mornings but wondering if evenings might be better for hypertrophy. Also, does it matter if I train fasted? ⏰",
        category: "Ask",
        mediaUrls: [],
        isPinned: false,
      },
      {
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Nutrition Coach Lisa",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        title: "Meal Prep Sunday Tips 🥗",
        content: "Happy Sunday everyone! Here's how I tackle meal prep efficiently: 1) Batch cook proteins (chicken, turkey, eggs) 2) Pre-portion rice and veggies 3) Use quality containers 4) Prep healthy fats (avocado, nuts) 5) Make it enjoyable with spices! Consistency is key to hitting your nutrition goals.",
        category: "Meal",
        mediaUrls: [],
        isPinned: false,
      },
      {
        authorId: clientProfile._id,
        authorName: clientProfile.fullName || "Tom R.",
        authorAvatar: clientProfile.image,
        authorRole: "client" as const,
        title: "Finally hit 300 lb deadlift! 🎯",
        content: "After 8 months of progressive overload and proper recovery, I finally pulled 300 lbs! The key was focusing on hip hinge mechanics and not rushing the progression. Thanks to this community for keeping me accountable. Special thanks to Coach Sarah for the programming advice!",
        category: "PR",
        mediaUrls: [],
        isPinned: false,
      },
      {
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Strength Coach Alex",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        title: "Progressive Overload Explained",
        content: "One of the most important principles for building strength and muscle is progressive overload - gradually increasing the weight, frequency, or number of repetitions in your strength training routine. 🔥 Key principles: 1) Start lighter than you think 2) Increase by 2.5-10% weekly 3) Don't sacrifice form for weight 4) Track everything!",
        category: "General Discussion",
        mediaUrls: [],
        isPinned: false,
      },
    ];

    // Insert posts
    const createdPosts = [];
    for (const post of samplePosts) {
      const postId = await ctx.db.insert("socialPosts", {
        ...post,
        isDeleted: false,
        likeCount: 0,
        commentCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      createdPosts.push(postId);
    }

    // Add some comments to posts
    const sampleComments = [
      {
        postId: createdPosts[0],
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Coach Sarah",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        content: "Incredible progress! 🙌 All that hard work is paying off. Keep crushing it!",
        parentCommentId: undefined,
      },
      {
        postId: createdPosts[0],
        authorId: profiles.find(p => p._id !== trainerProfile._id)?._id || clientProfile._id,
        authorName: "Client Dave",
        authorAvatar: undefined,
        authorRole: "client" as const,
        content: "Congrats! That's amazing progress. What's your next goal? 💪",
        parentCommentId: undefined,
      },
      {
        postId: createdPosts[2],
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Coach Sarah",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        content: "Great question! Make sure your knees are tracking over your toes and keep your chest up. Film yourself to check your form! 📹",
        parentCommentId: undefined,
      },
      {
        postId: createdPosts[4],
        authorId: trainerProfile._id,
        authorName: trainerProfile.fullName || "Coach Mike",
        authorAvatar: trainerProfile.image,
        authorRole: "trainer" as const,
        content: "Great question! For hypertrophy, the research shows both morning and evening can work well. The key is consistency with your timing. Training fasted vs fed doesn't significantly impact muscle growth for most people. Just pick a time you can stick to! 💪",
        parentCommentId: undefined,
      },
    ];

    const createdComments = [];
    for (const comment of sampleComments) {
      const commentId = await ctx.db.insert("socialComments", {
        ...comment,
        likeCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      createdComments.push(commentId);

      // Update post comment count
      if (comment.postId) {
        const post = await ctx.db.get(comment.postId);
        if (post) {
          await ctx.db.patch(comment.postId, {
            commentCount: (post.commentCount || 0) + 1,
            lastCommentAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // Add some likes
    const sampleLikes = [
      { postId: createdPosts[0], userId: trainerProfile._id },
      { postId: createdPosts[1], userId: clientProfile._id },
      { postId: createdPosts[2], userId: trainerProfile._id },
      { postId: createdPosts[4], userId: trainerProfile._id },
      { postId: createdPosts[6], userId: trainerProfile._id },
    ];

    for (const like of sampleLikes) {
      await ctx.db.insert("socialLikes", {
        ...like,
        createdAt: now,
      });

      // Update post like count
      if (like.postId) {
        const post = await ctx.db.get(like.postId);
        if (post) {
          await ctx.db.patch(like.postId, {
            likeCount: (post.likeCount || 0) + 1,
            updatedAt: now,
          });
        }
      }
    }

    // Add some follows
    const clientProfiles = profiles.filter(p => p.authSource === "client");
    const trainerProfiles = profiles.filter(p => p.authSource === "trainer");

    const sampleFollows = [];
    // Have clients follow trainers
    for (const client of clientProfiles) {
      for (const trainer of trainerProfiles) {
        if (client._id !== trainer._id) {
          await ctx.db.insert("socialFollows", {
            followerId: client._id,
            followingId: trainer._id,
            createdAt: now,
          });
          sampleFollows.push({ follower: client._id, following: trainer._id });
        }
      }
    }

    // Add group members
    for (const profile of profiles) {
      const existingMember = await ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", profile._id))
        .first();

      if (!existingMember) {
        await ctx.db.insert("groupMembers", {
          userId: profile._id,
          fullName: profile.fullName || "Member",
          avatarUrl: profile.image,
          role: profile.authSource,
          joinedAt: now,
          lastActiveAt: now,
          isActive: true,
        });
      }
    }

    return {
      success: true,
      message: "Community data seeded successfully",
      stats: {
        postsCreated: createdPosts.length,
        commentsCreated: createdComments.length,
        likesCreated: sampleLikes.length,
        followsCreated: sampleFollows.length,
        membersAdded: profiles.length,
      },
    };
  },
});

export const clearCommunityData = mutation({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    // Delete all social posts
    const posts = await ctx.db.query("socialPosts").collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // Delete all social comments
    const comments = await ctx.db.query("socialComments").collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete all social likes
    const likes = await ctx.db.query("socialLikes").collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete all social follows
    const follows = await ctx.db.query("socialFollows").collect();
    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }

    // Delete all group members
    const members = await ctx.db.query("groupMembers").collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    return {
      success: true,
      message: "Community data cleared",
      stats: {
        postsDeleted: posts.length,
        commentsDeleted: comments.length,
        likesDeleted: likes.length,
        followsDeleted: follows.length,
        membersDeleted: members.length,
      },
    };
  },
});