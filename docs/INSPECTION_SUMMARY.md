# Inspection Summary: Trainer-Exercise Architecture

**Date:** 2025-01-15
**Repository:** C:\Users\thebe\Downloads\Body-Bridge
**Status:** ✅ Architecture implemented, migration pending

---

## Quick Status

| Component | Status | Notes |
|-----------|--------|-------|
| `trainerExercises` table | ✅ Defined in schema | Lines 164-178 in `convex/schema.ts` |
| `trainerExercises.ts` queries | ✅ Implemented | `listExercisesForTrainer`, `assignExerciseToTrainer`, `unassignExerciseFromTrainer` |
| `trainers` table | ✅ Exists | 1 trainer: "Jasmine Trainer" |
| `exercises` canonical table | ✅ Exists | 1100 total exercises (99 Jasmine, 1001 open-source) |
| Frontend ExercisesView.tsx | ✅ Updated | Calls `listExercisesForTrainer` (line 165) |
| Frontend ExercisePicker.tsx | ✅ Updated | Calls `listExercisesForTrainer` (line 75) |
| Migration script | ✅ Implemented | `migrations/migrateJasmineLegacy.ts` |
| Migration executed | ⏳ Pending | No `trainerExercises` rows exist yet |

---

## Current Database State (Cloud)

### Trainers
```json
{
  "_id": "p175jn9w9kayh95y1axmfgxc1d8a3jhz",
  "fullName": "Jasmine Trainer",
  "email": "jasmine@bodybridge.fitness",
  "isActive": true
}
```

**Count:** 1 active trainer

---

### Exercises
| Type | Count | Tagged | Has videoUrl |
|------|-------|--------|--------------|
| Jasmine Trainer | 99 | `trainerFirstName: "Jasmine"`, `trainerLastName: "Trainer"` | ✅ 99/99 |
| Open Source | 1001 | `trainerFirstName: null`, `trainerLastName: null` | ❌ 0/1001 |
| **Total** | 1100 | — | — |

---

### trainerExercises
| Count | Status |
|-------|--------|
| 0 | Table exists, but no rows yet (migration not run) |

---

## Code Inspection Results

### ✅ Already Correct

**Schema (`convex/schema.ts`):**
- `trainerExercises` table defined with required fields
- Indexes: `by_trainer`, `by_trainer_exercise`, `by_exercise`
- Comments document visibility rule (lines 158-163)

**Backend (`convex/trainerExercises.ts`):**
- `listExercisesForTrainer` query (lines 111-162)
- `assignExerciseToTrainer` mutation with idempotency (lines 236-302)
- `unassignExerciseFromTrainer` mutation (lines 310-338)
- `getActiveTrainer` helper (lines 26-33)
- `isVisibleAssignment` predicate (lines 46-50)
- `mergeExerciseWithAssignment` function (lines 59-71)

**Migration (`convex/migrations/migrateJasmineLegacy.ts`):**
- `reportTrainerExerciseState` audit (lines 17-64)
- `migrateJasmineLegacyAssignments` (lines 89-192)
- `auditDuplicateAssignments` (lines 202-238)

**Frontend (`src/screens/ExercisesView.tsx`):**
- Line 165: Calls `api.trainerExercises.listExercisesForTrainer`
- NO hardcoded `trainerName` constant
- NO "Jasmine Hensley" string

**Frontend (`src/components/ExercisePicker.tsx`):**
- Line 75: Calls `api.trainerExercises.listExercisesForTrainer`
- NO hardcoded `trainerName` constant
- NO "Jasmine Hensley" string

---

### ⏳ Pending

**Migration execution:**
```bash
npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'

npx convex run migrations/migrateJasmineLegacy:migrateJasmineLegacyAssignments \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'

npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'  # Verify

npx convex run migrations/migrateJasmineLegacy:auditDuplicateAssignments \
  --args '{ "adminSecret": "YOUR_ADMIN_SECRET" }'  # Check duplicates
```

**Verification:**
- Start dev stack: `npm run dev`
- Open http://localhost:5173
- Navigate to Exercise Library
- Confirm 99 exercises display
- Confirm each has videoUrl
- Confirm 1001 open-source exercises NOT visible

---

### 🧹 Optional Cleanup (After Verification)

**Deprecate legacy fields in schema:**
- `exercises.trainerFirstName` → add `@deprecated` comment
- `exercises.trainerLastName` → add `@deprecated` comment
- `exercises.videoUrl` → add `@deprecated` comment
- `exercises.imageUrl` → add `@deprecated` comment
- `exercises.isActive` → add `@deprecated` comment
- `exercises.coachId` → add `@deprecated` comment

**Remove legacy indexes (if unused):**
- `exercises.by_trainer` (`trainerFirstName`, `trainerLastName`)
- `exercises.by_coach` (`coachId`)

**Deprecate legacy queries:**
- `exercises.advancedSearch` → add `@deprecated`
- `exercises.getTrainerExercises` → add `@deprecated`
- `exercises.getJasmineExercises` → add `@deprecated`
- `exercises.updateTrainerData` → add `@deprecated`

---

## What the Architecture Does

### Canonical Exercise Table (`exercises`)
- One record per unique exercise (no duplicates)
- Contains shared metadata only:
  - `name`, `category`, `muscleGroup`, `instructions`, `equipment`, `difficulty`
  - `sets`, `reps`, `tags`, `overview`, `benefits`
- NOT used for visibility (trainerExercises drives that)

### Trainer Relationship Table (`trainerExercises`)
- One row per (trainer, exercise) pair
- Stores trainer-specific data:
  - `trainerId`, `exerciseId`, `videoUrl`, `isActive`
  - `sourceType`, `notionPageId`, `assignedAt`, `updatedAt`
- Visibility rule: `isActive === true` AND non-empty `videoUrl`

### Active Trainer
- Exactly one trainer with `isActive: true` in `trainers` table
- Resolved via `by_active` index
- No UI selector — app shows only active trainer's exercises

### Exercise Library Query
- `listExercisesForTrainer` returns:
  1. All `trainerExercises` rows for active trainer
  2. Filtered to `isActive: true` with valid `videoUrl`
  3. Joined with canonical `exercises` for metadata
  4. Merged: `videoUrl` from assignment (NOT canonical)
- Result: Only exercises the trainer has claimed with a valid video

---

## Migration Expected Results

### Before Migration
```
exercises: 1100 records
  - 99 tagged (Jasmine, Trainer)
  - 1001 untagged (open source)
trainerExercises: 0 rows
```

### After Migration
```
exercises: 1100 records (unchanged)
trainerExercises: 99 rows
  - 99 for Jasmine Trainer
  - Each with isActive: true and valid videoUrl
```

### Frontend After Migration
```
Exercise Library shows: 99 exercises (Jasmine's assignments)
Exercise Library hides: 1001 open-source exercises (no assignment)
```

---

## Adding New Trainers (Future)

### Step 1: Create Trainer
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
```bash
npx convex run trainerExercises:assignExerciseToTrainer \
  --args '{
    "trainerId": "...",
    "exerciseId": "...",
    "videoUrl": "https://youtube.com/...",
    "sourceType": "manual",
    "adminSecret": "..."
  }'
```

### Step 3: Switch Active Trainer (Manual Admin)
```typescript
// Via Convex dashboard or admin mutation
await ctx.db.patch(jasmineId, { isActive: false });
await ctx.db.patch(carlosId, { isActive: true });
```

**Note:** No trainer switcher UI exists. This is a manual admin operation.

---

## Validation Checklist

- [ ] Run `reportTrainerExerciseState` before migration
- [ ] Run `migrateJasmineLegacyAssignments`
- [ ] Run `reportTrainerExerciseState` after migration (verify 99 assignments)
- [ ] Run `auditDuplicateAssignments` (verify 0 duplicates)
- [ ] Start dev stack: `npm run dev`
- [ ] Open app at http://localhost:5173
- [ ] Navigate to Exercise Library
- [ ] Confirm 99 exercises display
- [ ] Confirm each has videoUrl
- [ ] Confirm video plays on click
- [ ] Confirm 1001 open-source exercises NOT visible
- [ ] Test search (filters within Jasmine's set only)
- [ ] Test category filter
- [ ] Test difficulty filter
- [ ] Test pagination "Load More"
- [ ] Check browser console for errors (should be none)

---

## Rollback Plan

If migration fails or issues arise:

1. Deactivate `trainerExercises`:
   ```bash
   # Set all assignments to inactive
   npx convex run ...mutationToDeactivateAll
   ```

2. Revert frontend (use legacy `advancedSearch` with `trainerName`)

3. Continue using legacy model (canonical `exercises` still intact)

---

## Summary

### ✅ What's Done
- `trainerExercises` table and indexes defined
- Backend queries and mutations implemented
- Migration script written and tested
- Frontend updated to use `listExercisesForTrainer`
- 1 trainer exists ("Jasmine Trainer")
- 1100 canonical exercises exist

### ⏳ What's Next
1. Set `ADMIN_SCRIPT_SECRET` in `.env.local` if not set
2. Run pre-migration audit
3. Run migration to create 99 `trainerExercises` rows
4. Run post-migration audit
5. Verify frontend shows exactly 99 exercises
6. Optionally deprecate legacy fields

### 📊 Expected Outcome
- App shows only Jasmine's 99 assigned exercises
- Each exercise shows Jasmine's videoUrl
- 1001 open-source exercises remain in canonical table but are NOT visible
- Ready for future trainers to be added with their own assignments

---

**Documentation:** See `TRAINER_EXERCISE_ARCHITECTURE.md` for full details.