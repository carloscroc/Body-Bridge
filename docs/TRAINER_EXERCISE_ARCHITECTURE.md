# Trainer-Exercise Architecture & Migration Plan

## Locked Architecture

### Canonical Exercise Table (`exercises`)

`exercises` contains exactly one record for each canonical exercise.

**Shared fields only (trainer-agnostic):**
- `name`, `category`, `muscleGroup`, `primaryMuscles`, `secondaryMuscles`
- `equipment`, `difficulty`, `overview`, `instructions`, `benefits`
- `sets`, `reps`, `tempo`, `rest`, `tags`
- `libraryId`, `sourceSystem`, `sourceId`, `metadata`, `workoutCount`

**Removed from canonical model:**
- `trainerFirstName`, `trainerLastName` — moved to `trainerExercises` relationship
- `videoUrl`, `imageUrl` — trainer-specific, moved to `trainerExercises`
- `coachId` — deprecated (use `trainerExercises.trainerId` instead)
- `isActive` — visibility is now driven by `trainerExercises.isActive`

**Rule:** The `exercises` table is NEVER queried directly for the Exercise Library. Visibility is driven ENTIRELY by `trainerExercises` rows.

---

### Trainer Relationship Table (`trainerExercises`)

One row per trainer + canonical exercise pairing.

**Required fields:**
```typescript
trainerId: Id<"trainers">;
exerciseId: Id<"exercises">;
videoUrl: string;              // Non-empty, trainer-specific URL
sourceType: string | undefined; // "notion" | "seed" | "legacy" | "manual"
notionPageId: string | undefined;
isActive: boolean;             // Only `true` rows are visible
assignedAt: number;             // When the trainer claimed this exercise
updatedAt: number;
```

**Indexes:**
- `by_trainer` → `[trainerId]` — fetch all of a trainer's assignments
- `by_exercise` → `[exerciseId]` — fetch which trainers claim an exercise
- `by_trainer_exercise` → `[trainerId, exerciseId]` — uniqueness lookup

**Uniqueness constraint:** `(trainerId, exerciseId)` must be unique. Mutations are idempotent — duplicates are prevented via `unique()` lookup.

---

### Trainer Table (`trainers`)

Required fields:
```typescript
firstName: string;
lastName: string;
fullName: string;
email: string | undefined;
notionDatabaseId: string | undefined;
notionAccessToken: string | undefined;
profileId: Id<"profiles"> | undefined; // Links to auth profile (optional)
createdAt: number;
updatedAt: number;
isActive: boolean; // Only `isActive: true` trainers are queryable
```

**Indexes:**
- `by_fullName` → `[fullName]`
- `by_active` → `[isActive]` — resolves the active trainer for the app
- `by_profile` → `[profileId]`

---

### Library Behavior

#### Active Trainer Resolution
The app shows exercises for exactly one trainer: the unique row in `trainers` with `isActive: true`.

```typescript
// convex/trainerExercises.ts: getActiveTrainer()
const trainer = await ctx.db
  .query("trainers")
  .withIndex("by_active", (q) => q.eq("isActive", true))
  .order("asc") // If multiple exist, pick first by createdAt
  .first();
```

**No trainer switcher UI.** The trainer is never chosen by the end user.

---

#### Exercise Library Query

`api.trainerExercises.listExercisesForTrainer` returns ONLY exercises where:

1. A `trainerExercises` row exists for the active trainer (`trainerId` matches)
2. `trainerExercises.isActive === true`
3. `trainerExercises.videoUrl` is non-empty (trimmed)

**Do NOT:**
- Query `exercises` directly and hide rows in the UI
- Fall back to `exercises.videoUrl`
- Show exercises without a valid `trainerExercises` row
- Append open-source exercises as a fallback

**Response shape:**
```typescript
{
  exercises: Array<MergedExercise>;  // Combined canonical + trainer URL
  page: Array<MergedExercise>;       // Alias for pagination
  isDone: boolean;
  continueCursor: string | null;
  cursor: string | null;             // Alias
  status: "Exhausted" | "CanLoadMore";
  numItems: number;
}
```

**Merged exercise shape:**
```typescript
{
  ...canonicalExerciseFields...,    // name, category, instructions, etc.
  videoUrl: assignment.videoUrl,    // ALWAYS the trainer's URL (never canonical)
  trainerExerciseId: assignment._id,
  sourceType: assignment.sourceType,
}
```

---

## Data Migration Plan

### Step 0: Pre-Migration Audit

Run BEFORE migration to establish baseline:

```bash
npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'
```

**Expected output:**
```json
{
  "trainersCount": 1,
  "trainers": [{
    "_id": "...",
    "fullName": "Jasmine Trainer",
    "email": "jasmine@bodybridge.fitness",
    "isActive": true,
    "profileId": null
  }],
  "exercisesTotal": 1100,
  "jasmineCandidates": 99,
  "jasmineWithValidUrl": 99,
  "jasmineMissingUrl": 0,
  "openSourceUntagged": 1001,
  "trainerExercisesRowsExisting": 0
}
```

**Interpretation:**
- 1100 total exercises in `exercises` table
- 99 tagged `trainerFirstName: "Jasmine"`, `trainerLastName: "Trainer"`
- All 99 have valid `videoUrl` (will migrate)
- 1001 are untagged open-source (left untouched, unassigned)
- 0 existing `trainerExercises` rows (clean slate)

---

### Step 1: Run Legacy Migration

```bash
npx convex run migrations/migrateJasmineLegacy:migrateJasmineLegacyAssignments \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'
```

**What it does:**
1. Resolves the active trainer (`isActive: true`)
2. Queries all exercises tagged `(Jasmine, Trainer)` via `by_trainer` index
3. For each exercise with a non-empty `videoUrl`:
   - Checks for existing assignment via `by_trainer_exercise` index
   - If exists → patches `videoUrl`, `sourceType: "legacy"`, `isActive: true`
   - If not exists → inserts new row with `assignedAt` from exercise creation time
4. Skips exercises with no valid `videoUrl` (intentional — not visible)
5. Counts and reports results

**Idempotency:** Re-running never creates duplicates. Existing assignments are patched.

**Expected output:**
```json
{
  "ok": true,
  "trainerId": "...",
  "trainerFullName": "Jasmine Trainer",
  "jasmineCandidates": 99,
  "assignmentsCreated": 99,
  "assignmentsUpdated": 0,
  "missingUrlSkipped": 0,
  "ambiguousTrainerSkipped": 0,
  "openSourceExercisesLeftUnassigned: 1001
}
```

---

### Step 2: Post-Migration Audit

Run AFTER migration to verify results:

```bash
npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'
```

**Expected changes:**
- `jasmineWithValidUrl`: 99 (unchanged)
- `openSourceUntagged`: 1001 (unchanged)
- `trainerExercisesRowsExisting`: 99 (was 0, now 99)

---

### Step 3: Duplicate Detection Audit

Ensure no `(trainerId, exerciseId)` pairs have multiple rows:

```bash
npx convex run migrations/migrateJasmineLegacy:auditDuplicateAssignments \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'
```

**Expected output:**
```json
{
  "totalAssignments": 99,
  "duplicatePairs": 0,
  "duplicates": []
}
```

If `duplicatePairs > 0`, manual repair is needed (delete extra rows).

---

### Step 4: Frontend Verification

1. Start local dev stack:
   ```bash
   cd C:\Users\thebe\Downloads\Body-Bridge
   npm run dev
   ```

2. Open app at `http://localhost:5173`

3. Navigate to Exercise Library

4. Verify:
   - Exactly 99 exercises display (Jasmine's assignments)
   - Each exercise has a videoUrl (no empty URLs)
   - Clicking "Add to Workout" or opening detail shows the video
   - Open-source exercises (1001) are NOT visible
   - No "Jasmine Hensley" or trainer name filter in UI
   - Search, category, and difficulty filters work on Jasmine's set only

---

## Post-Migration Cleanup

### Deprecate Legacy Fields

After verifying the frontend works correctly, these fields in `exercises` can be marked as deprecated:

```typescript
// Marked as @deprecated in convex/schema.ts
trainerFirstName: v.optional(v.string()), // @deprecated — use trainerExercises.trainerId
trainerLastName: v.optional(v.string()),  // @deprecated — use trainerExercises.trainerId
videoUrl: v.optional(v.string()),        // @deprecated — use trainerExercises.videoUrl
imageUrl: v.optional(v.string()),        // @deprecated — trainer-specific, move to trainerExercises
isActive: v.optional(v.boolean()),       // @deprecated — use trainerExercises.isActive
coachId: v.optional(v.id("profiles")),   // @deprecated — use trainerExercises.trainerId
```

**Note:** Do not delete these fields yet. Some analytics or migration scripts may still reference them.

---

### Remove Legacy Indexes

After confirming no queries use them, remove these indexes from `exercises`:

```typescript
// Remove from convex/schema.ts
.index("by_trainer", ["trainerFirstName", "trainerLastName"])
.index("by_coach", ["coachId"])
```

---

### Deprecate Legacy Queries

Mark these queries in `convex/exercises.ts` as `@deprecated`:

- `advancedSearch` — replaced by `trainerExercises.listExercisesForTrainer`
- `getTrainerExercises` — replaced by `trainerExercises.listExercisesForTrainer`
- `getJasmineExercises` — replaced by `trainerExercises.listExercisesForTrainer`
- `updateTrainerData` — no longer needed

---

## Adding New Trainers

### Step 1: Create Trainer Record

```bash
npx convex run notion:upsertTrainer \
  --args '{
    "firstName": "Carlos",
    "lastName": "Crocs",
    "email": "carlos@bodybridge.fitness",
    "notionDatabaseId": "...",
    "notionAccessToken": "..."
  }'
```

### Step 2: Assign Exercises

For each exercise Carlos claims:

```bash
npx convex run trainerExercises:assignExerciseToTrainer \
  --args '{
    "trainerId": "...",
    "exerciseId": "...",
    "videoUrl": "https://youtube.com/...",
    "sourceType": "notion",
    "notionPageId": "...",
    "adminSecret": "..."
  }'
```

### Step 3: Activate Trainer (if switching)

```typescript
// Convex mutation
await ctx.db.patch(carlosTrainerId, { isActive: true });
await ctx.db.patch(jasmineTrainerId, { isActive: false });
```

**Note:** This is a manual admin operation. No UI for trainer switching exists.

---

## Canonical Exercise Management

### Adding New Canonical Exercises

1. Insert into `exercises` table:
   ```typescript
   const exerciseId = await ctx.db.insert("exercises", {
     name: "Bulgarian Split Squat",
     category: "Strength",
     muscleGroup: "Legs",
     primaryMuscles: ["Quadriceps", "Glutes"],
     secondaryMuscles: ["Hamstrings", "Calves"],
     equipment: ["Dumbbell", "Bench"],
     overview: "Single-leg strength exercise...",
     instructions: ["Stand in front of bench...", "Place one foot...", ...],
     difficulty: "Intermediate",
     sets: "3",
     reps: "12-15",
     tags: ["lower-body", "unilateral"],
     libraryId: "...",
     sourceSystem: "manual",
   });
   ```

2. Assign to active trainer:
   ```bash
   npx convex run trainerExercises:assignExerciseToTrainer \
     --args '{
       "trainerId": "...",
       "exerciseId": "'$exerciseId'",
       "videoUrl": "https://youtube.com/...",
       "sourceType": "manual",
       "adminSecret": "..."
     }'
   ```

**Result:** Exercise appears in the library ONLY if assigned to active trainer with valid videoUrl.

---

### Removing Trainer Access to Exercise

Soft delete the assignment (exercise stays in canonical library):

```bash
npx convex run trainerExercises:unassignExerciseFromTrainer \
  --args '{
    "trainerId": "...",
    "exerciseId": "...",
    "adminSecret": "..."
  }'
```

**Result:** Exercise disappears from trainer's library (no UI reference), but canonical exercise remains for other trainers.

---

## Indexes for Performance

### Existing Indexes (Already Defined)

**`trainerExercises.by_trainer`**
- Fields: `[trainerId]`
- Use: `listExercisesForTrainer` — paginate all assignments for active trainer

**`trainerExercises.by_trainer_exercise`**
- Fields: `[trainerId, exerciseId]`
- Use: `assignExerciseToTrainer` — unique lookup for idempotency

**`trainerExercises.by_exercise`**
- Fields: `[exerciseId]`
- Use: Future analytics — find which trainers claim an exercise

**`trainers.by_active`**
- Fields: `[isActive]`
- Use: `getActiveTrainer` — resolve the active trainer

---

## Validation Rules

### Assignment Visibility

```typescript
function isVisibleAssignment(assignment: Doc<"trainerExercises">): boolean {
  return assignment.isActive === true
    && typeof assignment.videoUrl === "string"
    && assignment.videoUrl.trim().length > 0;
}
```

**Implications:**
- Assignments with `isActive: false` are invisible
- Assignments with empty `videoUrl` are invisible
- Exercises with no assignment row for the active trainer are invisible
- Canonical `exercises.videoUrl` is NEVER consulted for visibility

---

### Idempotency

```typescript
// assignExerciseToTrainer — no duplicates possible
const existing = await ctx.db
  .query("trainerExercises")
  .withIndex("by_trainer_exercise", (q) =>
    q.eq("trainerId", trainerId).eq("exerciseId", exerciseId)
  )
  .unique();

if (existing) {
  // Patch in place
  await ctx.db.patch(existing._id, { ... });
} else {
  // Insert new
  await ctx.db.insert("trainerExercises", { ... });
}
```

**Result:** Re-running migration or `assignExerciseToTrainer` never creates duplicates.

---

## Error Handling

### No Active Trainer

`listExercisesForTrainer` returns empty result:
```json
{
  "exercises": [],
  "page": [],
  "isDone": true,
  "continueCursor": null,
  "cursor": null,
  "status": "Exhausted",
  "numItems": 0
}
```

Frontend displays: `"No exercises available yet for this trainer."`

---

### Broken Exercise Reference

Assignment row exists, but canonical exercise was deleted:
```typescript
for (const assignment of visibleAssignments) {
  const exercise = await ctx.db.get(assignment.exerciseId);
  if (!exercise) continue; // Skip silently
  exercises.push(mergeExerciseWithAssignment(exercise, assignment));
}
```

**Result:** Broken references are skipped (no crash, no empty rows).

---

### Duplicate Assignment Detected

`auditDuplicateAssignments` reports duplicates. Manual repair:
```bash
# Delete duplicate rows (keep first)
npx convex run ...mutationToDeleteDuplicates
```

---

## Testing Checklist

### Backend Tests

- [ ] `reportTrainerExerciseState` returns correct counts
- [ ] `migrateJasmineLegacyAssignments` creates exactly 99 assignments
- [ ] Re-running migration updates (does not duplicate)
- [ ] `listExercisesForTrainer` returns exactly 99 exercises
- [ ] `listExercisesForTrainer` returns empty when no active trainer
- [ ] `assignExerciseToTrainer` is idempotent
- [ ] `unassignExerciseFromTrainer` soft deletes (exercise remains)
- [ ] `auditDuplicateAssignments` reports zero duplicates
- [ ] Assignments with `isActive: false` are not returned
- [ ] Assignments with empty `videoUrl` are not returned

### Frontend Tests

- [ ] Exercise Library loads with 99 exercises
- [ ] Each exercise has a valid videoUrl
- [ ] Clicking exercise opens detail modal with video
- [ ] Search filters within Jasmine's set (does not show open-source)
- [ ] Category filter works
- [ ] Difficulty filter works
- [ ] Pagination "Load More" works
- [ ] "No exercises available" message when empty
- [ ] No trainer name hardcoded in UI
- [ ] No "Jasmine Hensley" constant in code

### Runtime Tests

- [ ] Vite dev server runs without errors
- [ ] Convex dev server runs without errors
- [ ] No console errors in browser
- [ ] Network requests to `trainerExercises.listExercisesForTrainer` succeed
- [ ] Video preview plays correct trainer URL

---

## Rollback Plan

If migration fails or issues arise:

### Step 1: Deactivate `trainerExercises`

```typescript
// Manually set all assignments to inactive
const assignments = await ctx.db.query("trainerExercises").collect();
for (const a of assignments) {
  await ctx.db.patch(a._id, { isActive: false });
}
```

### Step 2: Revert Frontend

Rollback `ExercisesView.tsx` and `ExercisePicker.tsx` to use `advancedSearch` with `trainerName` filter.

### Step 3: Continue Using Legacy Model

The canonical `exercises` table still contains all data and `by_trainer` index.

---

## Summary

**What changed:**
- Added `trainerExercises` many-to-many relationship table
- Trainer-specific `videoUrl` moved from `exercises` to `trainerExercises`
- Visibility driven by `trainerExercises.isActive` and non-empty `videoUrl`
- Frontend queries `listExercisesForTrainer` instead of `advancedSearch`

**What stayed:**
- Canonical `exercises` table with shared metadata
- All 1100 exercises remain (no deletion)
- Trainer table structure unchanged

**What's new:**
- Multi-trainer support via `trainerExercises` rows
- Idempotent assignment mutations
- Per-trainer exercise libraries
- Clear separation of canonical vs trainer-specific data

**Migration result:**
- 99 assignments created for Jasmine Trainer
- 1001 open-source exercises left unassigned (not visible)
- Frontend shows only Jasmine's 99 exercises
- Ready for future trainers to be added