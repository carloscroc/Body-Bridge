# Migration Commands — Quick Reference

## Pre-Requisites

1. Ensure `.env.local` has `ADMIN_SCRIPT_SECRET` set:
   ```bash
   # Add to .env.local
   ADMIN_SCRIPT_SECRET=your-secure-secret-here
   ```

2. Restart Convex dev server if it was running:
   ```bash
   # Stop existing process, then:
   npx convex dev
   ```

---

## Step 0: Pre-Migration Audit

```bash
cd C:\Users\thebe\Downloads\Body-Bridge

npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "your-secure-secret-here" }'
```

**Expected output:**
```json
{
  "trainersCount": 1,
  "exercisesTotal": 1100,
  "jasmineCandidates": 99,
  "jasmineWithValidUrl": 99,
  "jasmineMissingUrl": 0,
  "openSourceUntagged": 1001,
  "trainerExercisesRowsExisting": 0
}
```

**Save this output for comparison.**

---

## Step 1: Run Migration

```bash
npx convex run migrations/migrateJasmineLegacy:migrateJasmineLegacyAssignments \
  --args '{ "adminSecret": "your-secure-secret-here" }'
```

**Expected output:**
```json
{
  "ok": true,
  "trainerId": "p175jn9w9kayh95y1axmfgxc1d8a3jhz",
  "trainerFullName": "Jasmine Trainer",
  "jasmineCandidates": 99,
  "assignmentsCreated": 99,
  "assignmentsUpdated": 0,
  "missingUrlSkipped": 0,
  "ambiguousTrainerSkipped": 0,
  "openSourceExercisesLeftUnassigned": 1001
}
```

---

## Step 2: Post-Migration Audit

```bash
npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "your-secure-secret-here" }'
```

**Expected changes:**
- `trainerExercisesRowsExisting`: 99 (was 0)
- Other counts unchanged

---

## Step 3: Duplicate Detection

```bash
npx convex run migrations/migrateJasmineLegacy:auditDuplicateAssignments \
  --args '{ "adminSecret": "your-secure-secret-here" }'
```

**Expected output:**
```json
{
  "totalAssignments": 99,
  "duplicatePairs": 0,
  "duplicates": []
}
```

If `duplicatePairs > 0`, manual repair needed.

---

## Step 4: Frontend Verification

```bash
# Terminal 1: Start dev stack
cd C:\Users\thebe\Downloads\Body-Bridge
npm run dev

# Terminal 2: Watch Convex logs (optional)
npx convex dev --tail
```

Then:
1. Open http://localhost:5173
2. Navigate to Exercise Library
3. Verify:
   - 99 exercises display
   - Each has a videoUrl
   - Clicking "Add to Workout" works
   - Video preview plays
   - 1001 open-source exercises NOT visible
   - Search, category, difficulty filters work

---

## Re-Running Migration (Idempotent)

Safe to re-run if needed:

```bash
npx convex run migrations/migrateJasmineLegacy:migrateJasmineLegacyAssignments \
  --args '{ "adminSecret": "your-secure-secret-here" }'
```

**Result:** 0 created, 99 updated (no duplicates).

---

## Rollback Commands

### Deactivate All Assignments

```bash
# Run via Convex dashboard or create a mutation script
npx convex run migrations/migrateJasmineLegacy:deactivateAll \
  --args '{ "adminSecret": "your-secure-secret-here" }'
```

*(Note: This mutation doesn't exist yet — would need to be added.)*

---

## Manual Convex Dashboard Inspection

1. Open Convex dashboard:
   ```bash
   npx convex dashboard
   ```

2. Inspect tables:
   - `trainers` → should see 1 row (Jasmine Trainer, isActive: true)
   - `exercises` → should see 1100 rows
   - `trainerExercises` → should see 99 rows after migration

3. Check an example assignment:
   - Find a `trainerExercises` row
   - Verify `trainerId` matches Jasmine Trainer
   - Verify `videoUrl` is non-empty
   - Verify `isActive: true`

4. Check linked canonical exercise:
   - Copy `exerciseId` from assignment
   - Find row in `exercises` table
   - Verify `name`, `category`, `instructions` are present

---

## Troubleshooting

### Error: "Unauthorized: admin secret required."

**Cause:** `ADMIN_SCRIPT_SECRET` not set or doesn't match.

**Fix:**
```bash
# Add to .env.local
ADMIN_SCRIPT_SECRET=your-secure-secret-here

# Restart Convex
npx convex dev
```

### Error: "No active trainer found in `trainers` table."

**Cause:** No trainer with `isActive: true`.

**Fix:**
```bash
# Via Convex dashboard, update Jasmine Trainer
await ctx.db.patch("p175jn9w9kayh95y1axmfgxc1d8a3jhz", { isActive: true });
```

### Frontend shows 0 exercises after migration

**Possible causes:**
1. Migration didn't run (check `trainerExercises` table in dashboard)
2. Active trainer not resolved (check `trainers` table)
3. Assignments have `isActive: false` (check in dashboard)
4. Assignments have empty `videoUrl` (check in dashboard)

**Debug:**
```bash
# Check active trainer
npx convex run --node -e 'console.log(await ctx.db.query("trainers").withIndex("by_active", (q) => q.eq("isActive", true)).collect())'

# Check assignment count
npx convex run --node -e 'console.log((await ctx.db.query("trainerExercises").collect()).length)'

# Check visible assignments
npx convex run --node -e '
  const all = await ctx.db.query("trainerExercises").collect();
  const visible = all.filter(a => a.isActive && a.videoUrl?.trim());
  console.log("Total:", all.length, "Visible:", visible.length);
'
```

### Duplicate assignments detected

**Cause:** Migration ran twice with race condition or manual inserts.

**Fix:**
1. Identify duplicate `trainerId` + `exerciseId` pairs via `auditDuplicateAssignments`
2. For each pair, delete all but one row (keep the one with earliest `assignedAt`)
3. Re-run migration to re-sync if needed

---

## Performance Notes

- Migration processes 99 exercises (should complete in < 1 second)
- `listExercisesForTrainer` uses `by_trainer` index (fast pagination)
- Assignment lookup uses `by_trainer_exercise` composite index (O(1) idempotency check)

---

## Next Steps After Success

1. ✅ Migration verified
2. ✅ Frontend shows 99 exercises
3. ⏳ Add new trainer (when ready)
4. ⏳ Optional: deprecate legacy fields in schema
5. ⏳ Optional: remove legacy indexes (after confirming no usage)

---

## Commands at a Glance

```bash
# Pre-migration audit
npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "..." }'

# Run migration
npx convex run migrations/migrateJasmineLegacy:migrateJasmineLegacyAssignments \
  --args '{ "adminSecret": "..." }'

# Post-migration audit
npx convex run migrations/migrateJasmineLegacy:reportTrainerExerciseState \
  --args '{ "adminSecret": "..." }'

# Check for duplicates
npx convex run migrations/migrateJasmineLegacy:auditDuplicateAssignments \
  --args '{ "adminSecret": "..." }'

# Start dev stack
npm run dev

# Open Convex dashboard
npx convex dashboard
```