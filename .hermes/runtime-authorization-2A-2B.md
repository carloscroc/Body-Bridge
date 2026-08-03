# Runtime Authorization Verification — Milestone 2A and 2B

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- DO NOT ask the human to reveal the admin secret
- Use the existing secure environment mechanism to load the admin secret
- The secret value must NEVER appear in:
  - prompts
  - commands shown in reports
  - stdout
  - stderr
  - screenshots
  - generated files
  - mission reports
- Replace secret values with `<REDACTED>` in all output
- Target explicitly: `--deployment dev/thebest-croc`
- Do NOT modify source files unless a genuine harness blocker is found and separately reported
- Do NOT run `npx convex deploy`, production commands, obsolete local Convex, Notion imports, seeds, migrations
- Do NOT start Playwright yet
- Do NOT create permanent accounts

---

## MILESTONE 2A — Database Baseline

Run:
```powershell
npx convex run test_internal_harness:getDatabaseCounts --deployment dev/thebest-croc
```

Report:
1. Exact command (already known, just confirm)
2. Deployment selected (confirm dev/thebest-croc)
3. Exit code
4. Returned counts for:
   - exercises
   - trainers
   - trainerExercises
5. Confirmation that no local endpoint was contacted
6. Confirmation that no database mutation occurred

**Expected baseline:**
- exercises: 0
- trainers: 0
- trainerExercises: 0

**If any count is nonzero:** STOP and report exact records/categories requiring investigation WITHOUT deleting anything.

**Verdict options:**
- `DATABASE BASELINE: PASS`
- `DATABASE BASELINE: FAIL — NONZERO RECORDS`

---

## MILESTONE 2B — Admin-Secret Authorization Tests

**Proceed ONLY if milestone 2A passes.**

### Test Functions:
- `trainers.createTrainer`
- `trainerExercises.assignExerciseToTrainer`

### Test Conditions for Each Function:
1. Argument omitted (when schema permits reaching authorization)
2. Empty secret
3. Incorrect secret
4. Correct secret loaded securely from existing environment

### `trainers.createTrainer` Tests

**Expected behavior:**
- missing secret: rejected
- empty secret: rejected
- incorrect secret: rejected
- correct secret: accepted and creates exactly one temporary trainer

**Use unique temporary test markers** (e.g., timestamp-based, clearly identifiable)

**Capture for each test:**
- Command form with secret replaced by `<REDACTED>`
- Exit code
- Exact rejection category or sanitized error
- Whether a record was created
- Created record ID internally (do NOT expose unless needed for cleanup evidence)

### `trainerExercises.assignExerciseToTrainer` Tests

**This test requires valid temporary trainer and exercise records.**

Before running:
1. Inspect existing internal harness
2. Determine if it can safely create required temporary exercise
3. Determine if it can perform complete cleanup

**Do NOT use:**
- legacy seeds
- migrations
- Notion imports
- production records
- existing real trainer records

**Expected behavior:**
- missing secret: rejected
- empty secret: rejected
- incorrect secret: rejected
- correct secret: accepted
- repeated correct assignment is idempotent
- cleanup removes the assignment, exercise, and trainer

**If the current harness cannot safely establish and clean up prerequisites:**
- STOP
- Report: `AUTHORIZATION HARNESS GAP — CORRECTION REQUIRED`
- Do NOT improvise manual database cleanup commands

---

## Cleanup Verification

After all admin authorization tests, run:
```powershell
npx convex run test_internal_harness:getDatabaseCounts --deployment dev/thebest-croc
```

**Required final counts:**
- exercises: 0
- trainers: 0
- trainerExercises: 0

**If cleanup fails:**
- STOP
- Report exact residual counts
- Do NOT proceed to browser tests
- Do NOT hide or manually delete records outside the approved cleanup path

---

## REQUIRED REPORT

Return:
1. Baseline database counts
2. Authorization result matrix for `createTrainer`
3. Authorization result matrix for `assignExerciseToTrainer`
4. Idempotency result
5. Cleanup result
6. Final database counts
7. Exact deployment target used
8. Sanitized command evidence (secrets replaced with `<REDACTED>`)
9. OpenCode session and model
10. Git status
11. Confirmation that no secret was exposed
12. Confirmation that obsolete local Convex and production were untouched

---

## FINAL VERDICT (exactly one):

`ADMIN AUTHORIZATION: PASS — READY FOR BROWSER AUTH VERIFICATION`

`ADMIN AUTHORIZATION: FAIL — CORRECTIONS REQUIRED`

`AUTHORIZATION HARNESS GAP — CORRECTION REQUIRED`

`DATABASE BASELINE: FAIL — NONZERO RECORDS`