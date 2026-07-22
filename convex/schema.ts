import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// ============== Shared Validators ==============

const unitsValidator = v.object({
  weight: v.union(v.literal("lb"), v.literal("kg")),
  height: v.union(v.literal("cm"), v.literal("ft")),
  distance: v.union(v.literal("mi"), v.literal("km")),
});

const subscriptionValidator = v.object({
  plan: v.union(v.literal("Free"), v.literal("Pro"), v.literal("Elite")),
  status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("expired")),
  renewalDate: v.optional(v.string()),
});

const exerciseItemValidator = v.any();

/** Body measurements for progress entries */
const measurementsValidator = v.object({
  chest: v.optional(v.number()),
  waist: v.optional(v.number()),
  hips: v.optional(v.number()),
  biceps: v.optional(v.number()),
  thighs: v.optional(v.number()),
  neck: v.optional(v.number()),
  shoulders: v.optional(v.number()),
  calves: v.optional(v.number()),
  forearms: v.optional(v.number()),
});

/** Plan item payload — discriminated by type field on the parent */
const planItemValidator = v.any();

// ============== Schema ==============

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  }),

  profiles: defineTable({
    userId: v.id("users"),
    email: v.string(),
    fullName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    image: v.optional(v.string()),
    avatarUrl: v.optional(v.string()), // TODO: Remove after data migration (Phase 1 legacy)
    lastName: v.optional(v.string()),
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
    units: v.optional(unitsValidator),
    subscription: v.optional(subscriptionValidator),
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
    lifecycle: v.union(v.literal("draft"), v.literal("ready"), v.literal("archived")),
    // Required for minimal draft
    // Optional fields for incremental completion
    category: v.optional(v.string()),
    bodyRegion: v.optional(v.string()), // Renamed from muscleGroup for clarity
    primaryMuscles: v.optional(v.array(v.string())),
    secondaryMuscles: v.optional(v.array(v.string())),
    equipment: v.optional(v.array(v.string())),
    overview: v.optional(v.string()),
    instructions: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    // createdAt removed - use Convex _creationTime
  })
    .index("by_libraryId", ["libraryId"])
    .index("by_lifecycle", ["lifecycle"])
    .index("by_category", ["category"])
    .index("by_bodyRegion", ["bodyRegion"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "bodyRegion", "lifecycle"],
    }),

  trainers: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    fullName: v.string(),
    email: v.optional(v.string()),
    notionDatabaseId: v.optional(v.string()),
    profileId: v.optional(v.id("profiles")),
    // createdAt removed - use Convex _creationTime
    updatedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_fullName", ["fullName"])
    .index("by_active", ["isActive"])
    .index("by_profile", ["profileId"]),

  // Trainer → Exercise many-to-many relationship.
  // A row here means "trainer X has made canonical exercise Y available,
  // playable at `videoUrl`." Visibility for a trainer is driven ENTIRELY
  // by this table — an exercise with no assignment row for the active
  // trainer is hidden, regardless of what is in the `exercises` table.
  // The canonical `exercises.videoUrl` is NEVER used as a fallback.
  trainerExercises: defineTable({
    trainerId: v.id("trainers"),
    exerciseId: v.id("exercises"),
    // Trainer-specific playable URL. Required; empty/whitespace is treated
    // as "not available" and the exercise is hidden.
    videoUrl: v.string(),
    // Simplified source metadata: only origin system and optional external ID
    sourceSystem: v.union(v.literal("notion"), v.literal("manual")),
    sourceId: v.optional(v.string()),
    isActive: v.boolean(),
    assignedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"])
    .index("by_trainer_exercise", ["trainerId", "exerciseId"])
    .index("by_exercise", ["exerciseId"]),
  workouts: defineTable({
    userId: v.id("profiles"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    duration: v.optional(v.string()),
    format: v.optional(v.literal("user_paced")),
    exercises: v.array(exerciseItemValidator),
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
    exercises: v.optional(v.array(exerciseItemValidator)),
    mealData: v.optional(v.record(v.string(), v.any())),
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
    exercises: v.optional(v.array(v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_coach", ["coachId"]).searchIndex("search_title", { searchField: "title" }),

  

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
    measurements: v.optional(measurementsValidator),
    photos: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  workoutLogs: defineTable({
    userId: v.id("profiles"),
    date: v.number(),
    exercises: v.array(exerciseItemValidator),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  socialPosts: defineTable({
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
  }).index("by_isDeleted", ["isDeleted"])
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_category", ["category", "createdAt"])
    .index("by_isPinned", ["isPinned", "createdAt"]),

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

   recipes: defineTable({
     source_site: v.string(),
     source_url: v.string(),
     recipe_title: v.string(),
     short_description: v.optional(v.string()),
     category: v.optional(v.string()),
     tags: v.optional(v.array(v.string())),
     ingredients: v.optional(v.array(v.object({
       name: v.string(),
       amount: v.optional(v.string()),
       unit: v.optional(v.string()),
       raw: v.optional(v.string())
     }))),
     instructions: v.optional(v.array(v.string())),
     prep_time: v.optional(v.string()),
     cook_time: v.optional(v.string()),
     total_time: v.optional(v.string()),
     servings: v.optional(v.string()),
     nutrition_info: v.optional(v.any()),
     diet_type: v.optional(v.array(v.union(
       v.literal("plant_based"),
       v.literal("minimally_processed_with_meat"),
       v.literal("cancer"),
       v.literal("heart_health"),
       v.literal("diabetes"),
       v.literal("kidney_disease")
     ))),
     disease_focus: v.optional(v.string()),
     image_url: v.optional(v.string()),
     createdAt: v.number(),
     updatedAt: v.number()
   })
   .index("by_source_url", ["source_url"])
   .index("by_recipe_title", ["recipe_title"])
   .index("by_source_site", ["source_site"]),

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
    item: planItemValidator, 
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
  
  // Migration state tracking for long-running data migrations
  migrationState: defineTable({
    migrationName: v.string(),
    planHash: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("blocked"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    totalGroups: v.number(),
    completedGroupIds: v.array(v.string()),
    completedBatchIds: v.array(v.string()),
    blockedGroupIds: v.optional(v.array(v.string())),
    lockToken: v.string(),
    lockOwnerId: v.optional(v.string()),
    lockAcquiredAt: v.optional(v.number()),
    lockExpiresAt: v.optional(v.number()),
    operatorId: v.optional(v.string()),
    preflightHash: v.optional(v.string()),
    batchManifest: v.optional(v.any()),
    totalBatches: v.number(),
    currentBatchId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    errorDetails: v.optional(v.any()),
  })
    .index("by_name_status", ["migrationName", "status"])
    .index("by_lock_expires", ["lockExpiresAt"]),
  
});
