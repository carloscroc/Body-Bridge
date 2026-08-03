# Mission 1b — Fix 8 TypeScript Errors in test_internal_harness.ts

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## SCOPE
Modify ONLY: `convex/test_internal_harness.ts`
Do NOT push, deploy, or run Convex functions.

## CURRENT 8 ERRORS

All errors are in `convex/test_internal_harness.ts` (lines 434-619):

### Error Group 1: FilterBuilder doesn't expose `email` (5 errors, lines 434-438)
```
convex/test_internal_harness.ts(434,24): error TS2339: Property 'email' does not exist on type 'FilterBuilder<...>'
```

**Root Cause:** Convex's `.filter()` callback receives a `FilterBuilder` which does NOT expose document fields directly. You cannot do `t.email.includes(...)`.

**Fix:** Collect all trainers first, then filter in JavaScript:
```typescript
const allTrainers = await ctx.db.query("trainers").collect();
const trainer = allTrainers.find(t => 
  t.email === `test_auth_${testMarker}@test.local` ||
  t.email === `test_${testMarker}@test.local` ||
  t.email === `test${testMarker}@verification.local` ||
  t.email === `test${testMarker}@test.local`
);
```

**IMPORTANT:** Use exact equality (`===`) not `.includes()` for safety.

### Error Group 2: Wrong index name `by_trainerId` (2 errors, lines 463, 619)
```
error TS2345: Argument of type '"by_trainerId"' is not assignable to parameter of type '"by_trainer" | "by_trainer_exercise" | "by_exercise" | keyof SystemIndexes'
```

**Root Cause:** The schema defines the index as `by_trainer`, NOT `by_trainerId`.

**Fix:** Replace all `"by_trainerId"` with `"by_trainer"`:
```typescript
// Line 463 and 619: Change
.withIndex("by_trainerId", (q) => q.eq("trainerId", trainer._id))
// To:
.withIndex("by_trainer", (q) => q.eq("trainerId", trainer._id))
```

### Error Group 3: Type `string | number` not assignable to `number` (1 error, line 530)
```
convex/test_internal_harness.ts(530,7): error TS2322: Type 'string | number' is not assignable to type 'number'.
```

**Root Cause:** `args.testMarker` is `v.optional(v.string())` and `Date.now()` is `number`. The `||` produces `string | number`, but `updatedAt` requires `number`.

**Fix:** Force the timestamp to a number:
```typescript
// Line 516: Change
const timestamp = args.testMarker || Date.now();
// To:
const timestamp = Number(args.testMarker || Date.now());
```

## ADDITIONAL REQUIRED FIXES (beyond typecheck)

### Fix A: Complete authorization matrix

The current harness only tests the correct-secret case. It must test ALL 5 conditions:
- Missing secret (rejected)
- Empty secret (rejected)
- Incorrect secret (rejected)
- Correct secret first (created)
- Correct secret second (updated, same ID)

The shared helper `assignExerciseToTrainerHelper` does NOT do authorization — it only creates/updates assignments. The authorization check is in the public mutation `assignExerciseToTrainer` in `convex/trainerExercises.ts` (line 321):
```typescript
if (!isAdminSecret(args.adminSecret)) {
  throw new Error("Unauthorized: assignExerciseToTrainer requires admin secret.");
}
```

Since you cannot call a public mutation from an internalMutation, you have two options:
1. Export `isAdminSecret` from `convex/trainerExercises.ts` (or from wherever it's defined) and call it in the harness
2. Import the auth check function and call it before each `assignExerciseToTrainerHelper` call

**Preferred:** Find where `isAdminSecret` is defined, export it if needed, and call it directly in the harness. This tests the REAL authorization logic, not a copy.

### Fix B: Cleanup safety — use exact equality

Replace the loose `.includes()` email check with exact `===` equality:
```typescript
// Instead of:
const isTestRecord = trainer.email && (
  trainer.email.startsWith('test_') ||
  trainer.email.startsWith('test_auth_') ||
  trainer.email.includes('verification.local')
);

// Use exact equality:
const expectedEmails = [
  `test_auth_${testMarker}@test.local`,
  `test_${testMarker}@test.local`,
  `test${testMarker}@verification.local`,
  `test${testMarker}@test.local`,
];
const isTestRecord = trainer.email && expectedEmails.includes(trainer.email);
```

## VERIFICATION

After fixes, run:
```powershell
npx tsc --noEmit -p convex/tsconfig.json
npx convex typecheck
```

Both must exit 0.

## Nodemailer diagnostics

The nodemailer errors do NOT appear in `convex/tsconfig.json` typecheck — `skipLibCheck: true` in the convex tsconfig handles them. No action needed for nodemailer.

## REPORT

Write to `.hermes/mission-1b-report.md`:
1. Files modified
2. Each error fixed (before/after)
3. Authorization matrix implemented (all 5 conditions)
4. Proof real auth logic is used
5. Exact cleanup safety rules
6. Typecheck evidence (both commands, exit codes)
7. Git status
8. Confirmation no database/deployment touched

Verdict:
`HARNESS LOCAL VALIDATION: PASS — READY TO PUSH TO DEVELOPMENT`
or
`HARNESS LOCAL VALIDATION: FAIL — CORRECTIONS REQUIRED`