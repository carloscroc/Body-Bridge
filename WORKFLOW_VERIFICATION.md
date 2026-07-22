# One-Record Trainer-Exercise Workflow Documentation

## Overview
This document describes the complete workflow for creating a trainer, publishing an exercise, assigning it to the trainer, and querying the trainer's exercise library.

## Prerequisites
- Schema is already defined with `trainers`, `exercises`, and `trainerExercises` tables
- All required indexes are configured in schema.ts

## 5-Step Workflow

### Step 1: Create a Trainer
**File:** `convex/trainers.ts`  
**Function:** `createTrainer`  
**Type:** Mutation

```typescript
const trainer = await api.trainers.createTrainer({
  firstName: "Jasmine",
  lastName: "Trainer",
  email: "jasmine@example.com",
  notionDatabaseId: "optional-notion-db-id"
});
```

**Requirements:**
- `firstName` (required): string
- `lastName` (required): string  
- `email` (optional): string
- `notionDatabaseId` (optional): string

**Returns:** Created trainer document with `_id`, `firstName`, `lastName`, `fullName`, `email`, `notionDatabaseId`, `isActive` (default: false), `updatedAt`, and Convex `_creationTime`

**Note:** Trainer starts with `isActive: false`. Must be activated via `updateTrainer`.

---

### Step 2: Create a Draft Exercise
**File:** `convex/exercises.ts`  
**Function:** `createDraftExercise`  
**Type:** Mutation

```typescript
const draftExercise = await api.exercises.createDraftExercise({
  name: "Push-up",
  libraryId: "push-up" // optional, auto-generated from name if omitted
});
```

**Requirements:**
- `name` (required): string
- `libraryId` (optional): string - auto-normalized if provided

**Returns:** Created exercise document with `lifecycle: "draft"`

**Note:** Draft exercises are not visible in the main library until published.

---

### Step 3: Publish the Exercise
**File:** `convex/exercises.ts`  
**Function:** `publishExercise`  
**Type:** Mutation

```typescript
const publishedExercise = await api.exercises.publishExercise({
  exerciseId: draftExercise._id,
  publicationData: {
    category: "strength",
    bodyRegion: "upper",
    primaryMuscles: ["chest", "triceps"],
    secondaryMuscles: ["shoulders", "core"],
    equipment: ["none"],
    instructions: [
      "Start in a plank position",
      "Lower your body until chest nearly touches the floor",
      "Push back up to starting position"
    ],
    overview: "Classic bodyweight exercise for upper body strength",
    benefits: ["Builds chest and triceps strength", "Improves core stability"],
    tags: ["bodyweight", "compound"],
    imageUrl: "https://example.com/pushup.jpg" // optional
  }
});
```

**Requirements:**
- `exerciseId` (required): Id<"exercises"> - the draft exercise ID
- `publicationData.category` (required): string
- `publicationData.bodyRegion` (required): string
- `publicationData.primaryMuscles` (required): string[]
- `publicationData.secondaryMuscles` (required): string[]
- `publicationData.equipment` (required): string[]
- `publicationData.instructions` (required): string[]
- `publicationData.overview` (optional): string
- `publicationData.benefits` (optional): string[]
- `publicationData.tags` (optional): string[]
- `publicationData.imageUrl` (optional): string

**Returns:** Updated exercise document with `lifecycle: "ready"`

**Validation:**
- Exercise must exist
- Exercise must be in `draft` lifecycle

---

### Step 4: Assign Exercise to Trainer
**File:** `convex/trainerExercises.ts`  
**Function:** `assignExerciseToTrainer`  
**Type:** Mutation

```typescript
const assignment = await api.trainerExercises.assignExerciseToTrainer({
  trainerId: trainer._id,
  exerciseId: publishedExercise._id,
  videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
  sourceSystem: "notion", // or "manual"
  sourceId: "notion-page-id-123", // required if sourceSystem is "notion"
  adminSecret: process.env.ADMIN_SCRIPT_SECRET // required for admin-gated mutations
});
```

**Requirements:**
- `trainerId` (required): Id<"trainers">
- `exerciseId` (required): Id<"exercises">:
  - Non-empty after trim
  - Valid URL syntax
  - HTTPS protocol only (no HTTP, javascript:, data:, file:)
  - Must NOT contain "notion.so"
  - Accepted domains: youtube.com, youtu.be, vimeo.com, or direct .mp4/.webm files
- `sourceSystem` (required): "notion" | "manual"
- `sourceId` (optional): string - required if `sourceSystem` is "notion"`
- `adminSecret` (optional): string - for admin authentication

**Returns:** Assignment result with `_id` and `status` ("created" or "updated")

**Validation:**
- Admin secret authentication (temporary for migration)
- Video URL validation via `isValidVideoUrl()` helper
- Trainer must exist
- Exercise must exist
- If `sourceSystem === "notion"`, `sourceId` is required

**Idempotency:** If assignment already exists for (trainerId, exerciseId), it updates the existing record instead of creating a duplicate.

---

### Step 5: List Exercises for Trainer
**File:** `convex/trainerExercises.ts`  
**Function:** `listExercisesForTrainer`  
**Type:** Query

```typescript
const result = await api.trainerExercises.listExercisesForTrainer({
  query: "push", // optional text search
  category: "strength", // optional filter
  difficulty: "intermediate", // optional filter (if applicable)
  equipment: ["none"], // optional filter
  limit: 20, // optional, defaults to 20
  cursor: null, // optional for pagination
  paginationOpts: { // optional pagination
    cursor: null,
    numItems: 20
  }
});
```

**Requirements:**
- All arguments are optional
- Automatically resolves the active trainer via `getActiveTrainer(ctx)` - client does not provide trainerId

**Returns:** Paginated result object:
```typescript
{
  exercises: Array<MergedExercise>,
  page: Array<MergedExercise>, // alias
  isDone: boolean,
  continueCursor: string | null,
  cursor: string | null, // alias
  status: "Exhausted" | "CanLoadMore",
  numItems: number
}
```

**Filtering Logic:**
1. Resolves active trainer (`isActive: true`)
2. Queries trainer's assignments via `by_trainer` index
3. Filters visible assignments: `isActive === true` AND non-empty `videoUrl`
4. Joins with canonical `exercises` table for metadata
5. Applies in-memory filters: query (text), category, equipment
6. Returns paginated results

**Visibility Rules:**
- ONLY shows exercises assigned to the active trainer
- Exercise is visible ONLY if assignment has `isActive: true` AND non-empty `videoUrl`
- Canonical `exercises.videoUrl` is NEVER used as fallback
- No global exercise leakage - filters are applied only to trainer's assigned set

---

## Complete Example Flow

```typescript
// Step 1: Create trainer
const trainer = await api.trainers.createTrainer({
  firstName: "Jasmine",
  lastName: "Trainer",
  email: "jasmine@example.com"
});

// Activate the trainer (required before exercises are visible)
await api.trainers.updateTrainer({
  trainerId: trainer._id,
  isActive: true
});

// Step 2: Create draft exercise
const draftExercise = await api.exercises.createDraftExercise({
  name: "Push-up"
});

// Step 3: Publish exercise
const publishedExercise = await api.exercises.publishExercise({
  exerciseId: draftExercise._id,
  publicationData: {
    category: "strength",
    bodyRegion: "upper",
    primaryMuscles: ["chest", "triceps"],
    secondaryMuscles: ["shoulders", "core"],
    equipment: ["none"],
    instructions: [
      "Start in a plank position",
      "Lower your body until chest nearly touches the floor",
      "Push back up to starting position"
    ]
  }
});

// Step 4: Assign to trainer with video URL
await api.trainerExercises.assignExerciseToTrainer({
  trainerId: trainer._id,
  exerciseId: publishedExercise._id,
  videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
  sourceSystem: "manual",
  adminSecret: process.env.ADMIN_SCRIPT_SECRET
});

// Step 5: Query trainer's exercise library
const exercises = await api.trainerExercises.listExercisesForTrainer({
  query: "push",
  category: "strength"
});

console.log(exercises.exercises); // Array of trainer-scoped exercises
```

---

## Verification Summary

### Required Mutations (✓ All Present)
1. ✅ `createTrainer` - `convex/trainers.ts`
2. ✅ `createDraftExercise` - `convex/exercises.ts`
3. ✅ `publishExercise` - `convex/exercises.ts`
4. ✅ `assignExerciseToTrainer` - `convex/trainerExercises.ts`

### Required Queries (✓ All Present)
1. ✅ `listExercisesForTrainer` - `convex/trainerExercises.ts` (filters by trainer and isActive)

### Key Validation Features
1. ✅ Video URL validation with security checks (HTTPS only, rejects Notion URLs)
2. ✅ Trainer-scoped visibility (active trainer only)
3. ✅ Assignment-based filtering (isActive + non-empty videoUrl)
4. ✅ Idempotent assignment creation/update

### Schema Requirements (✓ All Met)
1. ✅ `trainers` table with `isActive`, `updatedAt` fields
2. ✅ `exercises` table with `lifecycle` field
3. ✅ `trainerExercises` table with `trainerId`, `exerciseId`, `videoUrl`, `isActive` fields
4. ✅ Required indexes: `by_active`, `by_trainer`, `by_trainer_exercise`

---

## Files Created/Modified

### Created
- `convex/trainers.ts` - Trainer mutations and queries

### Modified
- `convex/trainerExercises.ts` - Added inline test examples to `isValidVideoUrl()` function

### Verified (No Changes Needed)
- `convex/exercises.ts` - Contains `createDraftExercise` and `publishExercise`
- `convex/schema.ts` - Schema already has all required tables and indexes

---

## Notes
- Admin secret authentication is temporary for migration; future trainer-write paths will use `requireTrainer()` + profile verification
- The active trainer is resolved on the backend; clients cannot choose which trainer to view
- Video URLs are validated comprehensively to prevent XSS and ensure only legitimate video sources
- The workflow is idempotent - re-running the same steps will not create duplicates