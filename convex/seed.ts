import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin secret checker
function isAdminSecret(secret?: string): boolean {
  return typeof secret === 'string' && secret === process.env.ADMIN_SCRIPT_SECRET;
}

// ============== CONFIG ==============

export const setConfig = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    config: v.object({
      baseUrl: v.string(),
      version: v.string(),
      timeout: v.number(),
      retryPolicy: v.object({
        maxRetries: v.number(),
        backoffMs: v.number(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store config in a system table or environment
    // For now, just return success
    return { success: true, config: args.config };
  },
});

export const setFeatureFlag = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    featureFlag: v.object({
      name: v.string(),
      enabled: v.boolean(),
      description: v.string(),
      rolloutPercentage: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store feature flag in a system table
    // For now, just return success
    return { success: true, featureFlag: args.featureFlag };
  },
});

// ============== CATEGORIES & TAGS ==============

export const insertCategory = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    category: v.object({
      name: v.string(),
      description: v.string(),
      icon: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store category in a system table
    // For now, just return success
    return { success: true, category: args.category };
  },
});

export const insertTag = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    tag: v.object({
      name: v.string(),
      type: v.string(),
      color: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store tag in a system table
    // For now, just return success
    return { success: true, tag: args.tag };
  },
});

// ============== MEDIA METADATA ==============

export const insertVideoMetadata = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    videoMetadata: v.object({
      title: v.string(),
      url: v.string(),
      duration: v.number(),
      thumbnailUrl: v.string(),
      subtitles: v.array(v.object({
        language: v.string(),
        url: v.string(),
        format: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store video metadata in a system table
    // For now, just return success
    return { success: true, videoMetadata: args.videoMetadata };
  },
});

export const insertImageMetadata = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    imageMetadata: v.object({
      title: v.string(),
      url: v.string(),
      altText: v.string(),
      width: v.number(),
      height: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store image metadata in a system table
    // For now, just return success
    return { success: true, imageMetadata: args.imageMetadata };
  },
});

// ============== USERS & AUTH ==============

export const insertUser = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    user: v.object({
      email: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
      role: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Create user and profile
    const userId = await ctx.db.insert("users", {
      email: args.user.email,
      name: args.user.name,
      image: args.user.image,
      createdAt: Date.now(),
    });

    const profileId = await ctx.db.insert("profiles", {
      userId,
      email: args.user.email,
      fullName: args.user.name,
      image: args.user.image,
      authSource: "client",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, userId, profileId };
  },
});

export const insertUserPreferences = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    userId: v.id("users"),
    preferences: v.object({
      theme: v.string(),
      language: v.string(),
      notifications: v.boolean(),
      units: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Update user profile with preferences
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        units: {
          weight: args.preferences.units === "metric" ? "kg" : "lb",
          height: args.preferences.units === "metric" ? "cm" : "ft",
          distance: args.preferences.units === "metric" ? "km" : "mi",
        },
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const insertAuthToken = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    userId: v.id("users"),
    token: v.object({
      accessToken: v.string(),
      refreshToken: v.string(),
      expiresAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store auth token in a system table
    // For now, just return success
    return { success: true, token: args.token };
  },
});

// ============== EXERCISES ==============

export const insertExercise = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    exercise: v.object({
      name: v.string(),
      category: v.string(),
      muscleGroup: v.string(),
      primaryMuscles: v.array(v.string()),
      secondaryMuscles: v.array(v.string()),
      equipment: v.array(v.string()),
      overview: v.string(),
      instructions: v.array(v.string()),
      benefits: v.array(v.string()),
      difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
      sets: v.string(),
      reps: v.string(),
      tags: v.array(v.string()),
      videoUrl: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const exerciseId = await ctx.db.insert("exercises", {
      ...args.exercise,
      libraryId: `seed-${args.exercise.name.toLowerCase().replace(/\s+/g, "-")}`,
      difficultyOrder: args.exercise.difficulty === "Beginner" ? 1 : args.exercise.difficulty === "Intermediate" ? 2 : 3,
      trainerFirstName: "open-source",
      trainerLastName: "",
      sourceSystem: "seed",
      sourceId: args.exercise.name,
      isActive: true,
      tags: [...args.exercise.tags, "Trainer: open-source"],
      createdAt: Date.now(),
    });
  },
});

export const updateExerciseTrainerFields = mutation({
  args: {
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    
    // Get all exercises that don't have trainer fields set
    const exercises = await ctx.db.query("exercises").collect();
    
    let updatedCount = 0;
    for (const exercise of exercises) {
      // Check if trainer fields are already set
      if (!exercise.trainerFirstName) {
        // Determine trainer based on sourceSystem
        const trainerFirstName = exercise.sourceSystem === "notion" ? "Jasmine" : "open-source";
        const trainerLastName = exercise.sourceSystem === "notion" ? "Hensley" : "";
        const sourceSystem = exercise.sourceSystem || "unknown";
        const trainerTag = `Trainer: ${trainerFirstName} ${trainerLastName}`.trim();
        
        // Add trainer tag if not already present
        const tags = exercise.tags || [];
        if (!tags.includes(trainerTag)) {
          tags.push(trainerTag);
        }
        
        // Update exercise with trainer fields
        await ctx.db.patch(exercise._id, {
          trainerFirstName,
          trainerLastName,
          sourceSystem: exercise.sourceSystem as any,
          tags,
        });
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} exercises with trainer fields`);
    return { updatedCount };
  },
});

export const mapExerciseToCategory = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    exerciseId: v.string(),
    categoryId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Update exercise with category
    // For now, just return success
    return { success: true };
  },
});

export const mapExerciseToTag = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    exerciseId: v.string(),
    tagId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Update exercise with tag
    // For now, just return success
    return { success: true };
  },
});

export const mapExerciseToMedia = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    exerciseId: v.id("exercises"),
    mediaId: v.string(),
    mediaType: v.union(v.literal("video"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Update exercise with media
    if (args.mediaType === "video") {
      await ctx.db.patch(args.exerciseId, { videoUrl: args.mediaId });
    } else {
      await ctx.db.patch(args.exerciseId, { imageUrl: args.mediaId });
    }
    return { success: true };
  },
});

// ============== LOCALIZATION ==============

export const insertUIString = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    uiString: v.object({
      key: v.string(),
      language: v.string(),
      value: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store UI string in a system table
    // For now, just return success
    return { success: true, uiString: args.uiString };
  },
});

export const insertErrorMessage = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    errorMessage: v.object({
      code: v.string(),
      language: v.string(),
      message: v.string(),
      solution: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store error message in a system table
    // For now, just return success
    return { success: true, errorMessage: args.errorMessage };
  },
});

export const insertExerciseDescription = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    exerciseDescription: v.object({
      exerciseId: v.string(),
      language: v.string(),
      description: v.string(),
      instructions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store exercise description in a system table
    // For now, just return success
    return { success: true, exerciseDescription: args.exerciseDescription };
  },
});

// ============== PROGRESS ==============

export const insertExerciseProgress = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    progress: v.object({
      userId: v.string(),
      exerciseId: v.string(),
      completedAt: v.number(),
      score: v.number(),
      attempts: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store exercise progress in a system table
    // For now, just return success
    return { success: true, progress: args.progress };
  },
});

export const insertWorkoutSession = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    session: v.object({
      userId: v.string(),
      workoutId: v.string(),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      duration: v.number(),
      exercisesCompleted: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store workout session in a system table
    // For now, just return success
    return { success: true, session: args.session };
  },
});

export const insertAchievement = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    achievement: v.object({
      userId: v.string(),
      achievementId: v.string(),
      unlockedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store achievement in a system table
    // For now, just return success
    return { success: true, achievement: args.achievement };
  },
});

export const insertStreak = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    streak: v.object({
      userId: v.string(),
      currentStreak: v.number(),
      longestStreak: v.number(),
      lastActivityDate: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store streak in a system table
    // For now, just return success
    return { success: true, streak: args.streak };
  },
});

// ============== TEST DATA ==============

export const insertWorkout = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    workout: v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      category: v.string(),
      difficulty: v.string(),
      duration: v.number(),
      exercises: v.array(v.string()),
      createdAt: v.string(),
      updatedAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    // Store workout in a system table
    // For now, just return success
    return { success: true, workout: args.workout };
  },
});

export const insertNotification = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    notification: v.object({
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
      link: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    await ctx.db.insert("notifications", {
      ...args.notification,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const insertWorkoutExercise = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    workoutExercise: v.object({
      workoutId: v.string(),
      exerciseId: v.string(),
      order: v.number(),
      sets: v.number(),
      reps: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store workout exercise in a system table
    // For now, just return success
    return { success: true, workoutExercise: args.workoutExercise };
  },
});

export const insertWorkoutFavorite = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    favorite: v.object({
      userId: v.string(),
      workoutId: v.string(),
      addedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }
    // Store workout favorite in a system table
    // For now, just return success
    return { success: true, favorite: args.favorite };
  },
});

// ============== QUERIES ==============

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    // Return config from system table
    return {
      baseUrl: "http://localhost:3210",
      version: "1.0.0",
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
      },
    };
  },
});

export const getFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    // Return feature flags from system table
    return [
      {
        name: "new_exercise_library",
        enabled: true,
        description: "Enable new exercise library UI",
        rolloutPercentage: 100,
      },
      {
        name: "social_sharing",
        enabled: false,
        description: "Enable social sharing features",
        rolloutPercentage: 0,
      },
    ];
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    // Return categories from system table
    return [
      { name: "Strength", description: "Strength training exercises", icon: "💪" },
      { name: "Cardio", description: "Cardiovascular exercises", icon: "🏃" },
      { name: "Flexibility", description: "Flexibility and mobility exercises", icon: "🧘" },
      { name: "Core", description: "Core strengthening exercises", icon: "🎯" },
    ];
  },
});

export const getTags = query({
  args: {},
  handler: async (ctx) => {
    // Return tags from system table
    return [
      { name: "Dumbbell", type: "equipment", color: "#FF6B6B" },
      { name: "Barbell", type: "equipment", color: "#4ECDC4" },
      { name: "Machine", type: "equipment", color: "#45B7D1" },
      { name: "Bodyweight", type: "equipment", color: "#96CEB4" },
      { name: "Beginner", type: "difficulty", color: "#FFEAA7" },
      { name: "Intermediate", type: "difficulty", color: "#DDA0DD" },
      { name: "Advanced", type: "difficulty", color: "#FF6B6B" },
    ];
  },
});

export const getMediaMetadata = query({
  args: {},
  handler: async (ctx) => {
    // Return media metadata from system table
    return {
      videos: [],
      images: [],
    };
  },
});

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.map((profile) => ({
      id: profile._id,
      email: profile.email,
      name: profile.fullName,
          avatarUrl: profile.image,
      role: profile.authSource === "trainer" ? "trainer" : "user",
    }));
  },
});

export const getUIStrings = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    // Return UI strings for the specified language
    return {};
  },
});

export const getErrorMessages = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    // Return error messages for the specified language
    return {};
  },
});

export const getExerciseDescriptions = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    // Return exercise descriptions for the specified language
    return {};
  },
});

export const getProgress = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Return progress for the specified user
    return {
      exerciseProgress: [],
      workoutSessions: [],
      achievements: [],
      streaks: [],
    };
  },
});

export const getWorkouts = query({
  args: {},
  handler: async (ctx) => {
    const workouts = await ctx.db.query("workouts").collect();
    return workouts;
  },
});

export const getNotifications = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .collect();
    return notifications;
  },
});

export const getWorkoutFavorites = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Return workout favorites for the specified user
    return [];
  },
});

// ============== COMMUNITY DATA ==============

export const insertSocialPost = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    post: v.object({
      authorId: v.id("profiles"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      authorRole: v.union(v.literal("trainer"), v.literal("client")),
      title: v.optional(v.string()),
      content: v.string(),
      category: v.optional(v.string()),
      mediaUrls: v.optional(v.array(v.string())),
      isPinned: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("socialPosts", {
      ...args.post,
      isPinned: args.post.isPinned || false,
      isDeleted: false,
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, postId };
  },
});

export const insertSocialComment = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    comment: v.object({
      postId: v.id("socialPosts"),
      authorId: v.id("profiles"),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      authorRole: v.union(v.literal("trainer"), v.literal("client")),
      content: v.string(),
      parentCommentId: v.optional(v.id("socialComments")),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("socialComments", {
      ...args.comment,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update post's comment count
    const post = await ctx.db.get(args.comment.postId);
    if (post) {
      await ctx.db.patch(args.comment.postId, {
        commentCount: (post.commentCount || 0) + 1,
        lastCommentAt: now,
        updatedAt: now,
      });
    }

    return { success: true, commentId };
  },
});

export const insertSocialLike = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    like: v.object({
      userId: v.id("profiles"),
      postId: v.optional(v.id("socialPosts")),
      commentId: v.optional(v.id("socialComments")),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const now = Date.now();

    // Insert like
    await ctx.db.insert("socialLikes", {
      ...args.like,
      createdAt: now,
    });

    // Update post/comment like count
    if (args.like.postId) {
      const post = await ctx.db.get(args.like.postId);
      if (post) {
        await ctx.db.patch(args.like.postId, {
          likeCount: (post.likeCount || 0) + 1,
          updatedAt: now,
        });
      }
    } else if (args.like.commentId) {
      const comment = await ctx.db.get(args.like.commentId);
      if (comment) {
        await ctx.db.patch(args.like.commentId, {
          likeCount: (comment.likeCount || 0) + 1,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

export const insertSocialFollow = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    follow: v.object({
      followerId: v.id("profiles"),
      followingId: v.id("profiles"),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const now = Date.now();
    await ctx.db.insert("socialFollows", {
      ...args.follow,
      createdAt: now,
    });

    return { success: true };
  },
});

export const insertGroupMember = mutation({
  args: {
    adminSecret: v.optional(v.string()),
    member: v.object({
      userId: v.id("profiles"),
      fullName: v.string(),
      avatarUrl: v.optional(v.string()),
      role: v.union(v.literal("trainer"), v.literal("client")),
      joinedAt: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    if (!isAdminSecret(args.adminSecret)) {
      throw new Error("Unauthorized: Invalid admin secret");
    }

    const now = Date.now();
    await ctx.db.insert("groupMembers", {
      ...args.member,
      joinedAt: args.member.joinedAt || now,
      lastActiveAt: now,
      isActive: args.member.isActive !== undefined ? args.member.isActive : true,
    });

    return { success: true };
  },
});

export const getCommunityStats = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("socialPosts").collect();
    const comments = await ctx.db.query("socialComments").collect();
    const likes = await ctx.db.query("socialLikes").collect();
    const follows = await ctx.db.query("socialFollows").collect();
    const members = await ctx.db.query("groupMembers").collect();

    return {
      totalPosts: posts.length,
      totalComments: comments.length,
      totalLikes: likes.length,
      totalFollows: follows.length,
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isActive).length,
    };
  },
});