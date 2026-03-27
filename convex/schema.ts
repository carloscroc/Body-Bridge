import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    authSource: v.union(v.literal("client"), v.literal("trainer")),
    onboardingComplete: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
    migratedFromLocal: v.optional(v.boolean()),
    goal: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    trainingDaysPerWeek: v.optional(v.number()),
    sortPreference: v.optional(v.union(v.literal("popular"), v.literal("difficulty"), v.literal("alphabetical"))),
    equipmentAccess: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    units: v.optional(v.any()),
    subscription: v.optional(v.any()),
    createdAt: v.number(),
    planSummaryLastShown: v.optional(v.string()), // YYYY-MM-DD
    subRenewalLastShown: v.optional(v.string()), // YYYY-MM-DD
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_authSource", ["authSource"])
    .index("by_email_authSource", ["email", "authSource"]),

  exercises: defineTable({
    libraryId: v.string(),
    name: v.string(),
    category: v.string(),
    muscleGroup: v.string(),
    primaryMuscles: v.array(v.string()),
    secondaryMuscles: v.array(v.string()),
    equipment: v.array(v.string()),
    overview: v.string(),
    instructions: v.array(v.string()),
    benefits: v.array(v.string()),
    videoUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageMetadata: v.optional(v.any()),
    difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
    sets: v.string(),
    reps: v.string(),
    tags: v.array(v.string()),
    tempo: v.optional(v.string()),
    rest: v.optional(v.string()),
    weight: v.optional(v.string()),
    notes: v.optional(v.string()),
    duration: v.optional(v.string()),
    distance: v.optional(v.string()),
    rpe: v.optional(v.number()),
    power: v.optional(v.string()),
    cadence: v.optional(v.string()),
    heartRate: v.optional(v.string()),
    load: v.optional(v.string()),
    speed: v.optional(v.string()),
    bpm: v.optional(v.number()),
    calories: v.optional(v.number()),
    metadata: v.optional(v.any()),
    coachId: v.optional(v.id("profiles")),
    createdAt: v.optional(v.number()),
    difficultyOrder: v.optional(v.number()),
    workoutCount: v.optional(v.number()),
  })
    .index("by_libraryId", ["libraryId"])
    .index("by_category", ["category"])
    .index("by_muscle", ["muscleGroup"])
    .index("by_difficulty", ["difficulty"])
    .index("by_difficulty_order", ["difficultyOrder"])
    .index("by_name", ["name"])
    .index("by_difficultyOrder_name", ["difficultyOrder", "name"])
    .index("by_workoutCount", ["workoutCount"])
    .index("by_coach", ["coachId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "muscleGroup", "difficulty", "coachId"],
    }),

  workouts: defineTable({
    userId: v.id("profiles"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    duration: v.optional(v.string()),
    format: v.optional(v.union(v.literal("follow_along"), v.literal("user_paced"), v.literal("both"))),
    exercises: v.array(v.any()),
    completed: v.boolean(),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  exerciseUsage: defineTable({
    userId: v.id("profiles"),
    exerciseId: v.id("exercises"),
    count: v.number(),
  })
    .index("by_user_exercise", ["userId", "exerciseId"])
    .index("by_user_count", ["userId", "count"]),

  meals: defineTable({
    userId: v.id("profiles"),
    title: v.string(),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    calories: v.optional(v.number()),
    macros: v.optional(v.object({ p: v.number(), c: v.number(), f: v.number() })),
    completed: v.boolean(),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  userSchedule: defineTable({
    userId: v.id("profiles"),
    itemType: v.union(v.literal("WORKOUT"), v.literal("NUTRITION")),
    workoutId: v.optional(v.id("workouts")),
    mealId: v.optional(v.id("meals")),
    scheduledDate: v.number(),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "scheduledDate"]),

  coachClientRelationships: defineTable({
    coachId: v.id("profiles"),
    clientId: v.id("profiles"),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_client", ["clientId"])
    .index("by_pair", ["coachId", "clientId"]),

  calendarEvents: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_relationship", ["relationshipId"]).index("by_assignedTo", ["assignedTo"]),

  messages: defineTable({
    senderId: v.union(v.id("profiles"), v.string()),
    receiverId: v.union(v.id("profiles"), v.string()),
    content: v.string(),
    read: v.boolean(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_conversation", ["senderId", "receiverId"]),

  workoutPrograms: defineTable({
    coachId: v.id("profiles"),
    title: v.string(),
    content: v.string(),
    difficulty: v.union(v.literal("Beginner"), v.literal("Intermediate"), v.literal("Advanced")),
    tags: v.optional(v.array(v.string())),
    coverImage: v.optional(v.string()),
    exercises: v.optional(v.array(v.union(
      // OLD shape (back-compat with previously stored exercises)
      v.object({
        id: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
        sets: v.optional(v.string()),
        reps: v.optional(v.string()),
        weight: v.optional(v.string()),
        rest: v.optional(v.string()),
        notes: v.optional(v.string()),
        completed: v.optional(v.boolean()),
      }),
      // NEW shape (canonical frontend WorkoutExercise from types.ts)
      v.object({
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
      }),
    ))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_coach", ["coachId"]).searchIndex("search_title", { searchField: "title" }),

  courses: defineTable({
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
    modules: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        order: v.number(),
        lessons: v.array(
          v.object({
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
          }),
        ),
      }),
    ),
    enrolledCount: v.number(),
    rating: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_coach_and_updatedAt", ["coachId", "updatedAt"])
    .index("by_coach_and_isPublished", ["coachId", "isPublished"]),

  programAssignments: defineTable({
    programId: v.id("workoutPrograms"),
    clientId: v.id("profiles"),
    coachId: v.id("profiles"),
    assignedDate: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_program", ["programId"])
    .index("by_coach", ["coachId"]),

  progressEntries: defineTable({
    userId: v.id("profiles"),
    date: v.number(),
    weight: v.optional(v.number()),
    bodyFat: v.optional(v.number()),
    measurements: v.optional(v.any()),
    photos: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  workoutLogs: defineTable({
    userId: v.id("profiles"),
    date: v.number(),
    exercises: v.array(v.any()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  socialPosts: defineTable({
    authorId: v.id("profiles"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    authorRole: v.union(v.literal("trainer"), v.literal("client")),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    isPinned: v.boolean(),
    isDeleted: v.boolean(),
    likeCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_isDeleted", ["isDeleted"])
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),

  socialComments: defineTable({
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
  }).index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),

  socialLikes: defineTable({
    userId: v.id("profiles"),
    postId: v.optional(v.id("socialPosts")),
    commentId: v.optional(v.id("socialComments")),
    createdAt: v.number(),
  }).index("by_post_user", ["postId", "userId"])
    .index("by_comment_user", ["commentId", "userId"])
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  socialFollows: defineTable({
    followerId: v.id("profiles"),
    followingId: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_both", ["followerId", "followingId"])
    .index("by_createdAt", ["createdAt"]),

  socialAnalytics: defineTable({
    date: v.number(),
    totalPosts: v.number(),
    totalLikes: v.number(),
    totalComments: v.number(),
    activeUsers: v.number(),
    newFollowers: v.number(),
    engagementRate: v.number(),
  }).index("by_date", ["date"]),

  groupMembers: defineTable({
    userId: v.id("profiles"),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("trainer"), v.literal("client")),
    joinedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_active_lastActiveAt", ["isActive", "lastActiveAt"])
    .index("by_lastActiveAt", ["lastActiveAt"]),
  
  userPlans: defineTable({
    userId: v.id("profiles"),
    type: v.union(v.literal("meal"), v.literal("workout")),
    item: v.any(), 
    scheduledDate: v.string(), 
    scheduledTime: v.optional(v.string()),
    mealType: v.optional(v.string()),
    notes: v.optional(v.string()),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "scheduledDate"]),

  // Notifications table: user-centric notifications for various events
  notifications: defineTable({
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
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_isRead_createdAt", ["userId", "isRead", "createdAt"]),
  classroomProgress: defineTable({
    userId: v.id("profiles"),
    progress: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
