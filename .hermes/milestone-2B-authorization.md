# Milestone 2B — Admin-Secret Authorization Tests

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- Target deployment: `--deployment upbeat-chickadee-781` (authoritative development)
- Load admin secret from the existing secure environment mechanism
- NEVER expose the secret value — replace with `<REDACTED>` in all output
- Do NOT modify source files
- Do NOT run convex deploy, dev, codegen
- Do NOT start Playwright yet
- Do NOT create permanent accounts

---

## TEST FUNCTIONS

1. `trainers.createTrainer`
2. `trainerExercises.assignExerciseToTrainer`

---

## TEST CONDITIONS

For each function, test:

1. **Missing secret** — argument omitted (when schema permits reaching authorization)
2. **Empty secret** — `adminSecret: ""`
3. **Incorrect secret** — `adminSecret: "WRONG_SECRET"`
4. **Correct secret** — loaded from existing secure environment

---

## `trainers.createTrainer` Tests

### Expected Behavior
- missing secret: rejected
- empty secret: rejected
- incorrect secret: rejected
- correct secret: accepted and creates exactly one temporary trainer

### Execution
Use unique temporary test marker (timestamp-based, clearly identifiable).

For each test, capture:
- Command form with secret replaced by `<REDACTED>`
- Exit code
- Exact rejection category or sanitized error
- Whether a record was created
- Created record ID internally (do NOT expose unless needed for cleanup)

---

## `trainerExercises.assignExerciseToTrainer` Tests

### Prerequisites
This test requires:
- A valid temporary trainer record
- A valid temporary exercise record

### Harness Inspection
Before running, inspect `convex/test_internal_harness.ts` to determine:
- Can it safely create required temporary exercise?
- Can it perform complete cleanup?

### Do NOT Use
- Legacy seeds
- Migrations
- Notion imports
- Production records
- Existing real trainer records

### Expected Behavior
- missing secret: rejected
- empty secret: rejected
- incorrect secret: rejected
- correct secret: accepted
- Repeated correct assignment is idempotent
- Cleanup removes the assignment, exercise, and trainer

### If Harness Gap
If the current harness cannot safely establish and clean up prerequisites:
- STOP
- Report: `AUTHORIZATION HARNESS GAP — CORRECTIONS REQUIRED`
- Do NOT improvise manual database cleanup commands

---

## CLEANUP VERIFICATION

After all admin authorization tests, run:

```powershell
npx convex run test_internal_harness:getDatabaseCounts --deployment upbeat-chickadee-781
```

### Required Final Counts
- exercises: 0
- trainers: 0
- trainerExercises: 0

### If Cleanup Fails
- STOP
- Report exact residual counts
- Do NOT proceed to browser tests
- Do NOT hide or manually delete records outside the approved cleanup path

---

## REQUIRED REPORT

Return:
1. Baseline database counts (already completed: all zeros)
2. Authorization result matrix for `createTrainer` (4 test conditions)
3. Authorization result matrix for `assignExerciseToTrainer` (4 test conditions)
4. Idempotency result
5. Cleanup result
6. Final database counts
7. Exact deployment target used: `--deployment upbeat-chickadee-781`
8. Sanitized command evidence (secrets replaced with `<REDACTED>`)
9. OpenCode session and model
10. Git status
11. Confirmation that no secret was exposed
12. Confirmation that obsolete local Convex and production were untouched

---

## FINAL VERDICT (exactly one):

`ADMIN AUTHORIZATION: PASS — READY FOR BROWSER AUTH VERIFICATION`

`ADMIN AUTHORIZATION: FAIL — CORRECTIONS REQUIRED`

`AUTHORIZATION HARNESS GAP — CORRECTIONS REQUIRED`

`DATABASE BASELINE: FAIL — NONZERO RECORDS`