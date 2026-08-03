# Cleanup Ownership Audit and Harness Correction

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## AUTHORITATIVE DEPLOYMENT
`upbeat-chickadee-781`

## CRITICAL CONSTRAINTS
- Hermes must NOT edit files or execute repository/Convex commands
- All work must be done by OpenCode
- Target deployment explicitly: `--deployment upbeat-chickadee-781`
- Do NOT proceed to browser authentication tests
- Do NOT expose secrets or real-user data
- Do NOT delete records without proving they are test records
- Do NOT delete all records in a table
- Do NOT run migrations, seeds, Notion imports
- Do NOT touch production or obsolete local Convex
- Do NOT commit or push

---

## PHASE 1 — READ-ONLY DIAGNOSIS

### Files to Inspect
1. `convex/test_internal_harness.ts` — test harness functions
2. `convex/trainers.ts` — `createTrainer` implementation
3. `convex/trainerExercises.ts` — `assignExerciseToTrainer` implementation
4. Shared trainer and exercise creation helpers
5. Every available trainer deletion or cleanup helper
6. Authorization-test command history and returned record identifiers
7. Current database counts
8. The remaining trainer's non-secret identifying fields

### Determinations Required

For every temporary record involved, report:

| Table | Safe Test Marker | Creating Function | Creating Test Case | Record ID | Expected Cleanup Owner | Actual Cleanup Result | Evidence |

**Determine separately:**
1. Which test created the orphaned trainer (`test_auth_1784825588282@test.local`)
2. Whether `testTrainerAssignmentIdempotency` restored the database to its own starting counts
3. Whether the direct `createTrainer` test lacked cleanup
4. Whether a safe internal deletion helper already exists
5. Whether cleanup can be restricted to records with unique test markers
6. Whether the assignment authorization test needs a dedicated fixture harness

### Phase 1 Constraint
**Do NOT delete anything during Phase 1.**

---

## PHASE 2 — IMPLEMENT SMALLEST SAFE CORRECTION

**Proceed ONLY after Phase 1 establishes record ownership.**

---

### A. Test-Specific Trainer Cleanup

Add or extend an `internalMutation` in `convex/test_internal_harness.ts` that:
- Accepts a specific temporary trainer ID or unique test marker
- Verifies the record is unmistakably a test record (e.g., email contains `test_` or has test marker)
- Refuses to delete non-test trainers
- Checks for dependent `trainerExercises` rows
- Removes only the intended test record and its test dependencies
- Returns structured before-and-after cleanup evidence

**Constraints:**
- Do NOT add a public cleanup mutation
- Do NOT create a broad "delete all trainers" function

---

### B. Assignment Authorization Harness

Create one internal test harness operation that:

1. Records starting table counts
2. Creates a uniquely marked temporary trainer
3. Creates a uniquely marked temporary exercise
4. Tests `assignExerciseToTrainer` with:
   - Missing secret (when argument validation permits)
   - Empty secret
   - Incorrect secret
   - Correct secret
5. Verifies rejected cases create no assignment
6. Verifies the correct-secret case creates one assignment
7. Repeats the correct assignment and verifies idempotency:
   - First result: `created`
   - Second result: `updated`
   - Same assignment ID
8. Cleans up the assignment, exercise, and trainer in dependency-safe order
9. Verifies final counts equal starting counts
10. Throws a test failure if cleanup is incomplete

**Constraint:** Use the real shared authorization and assignment implementation. Do NOT duplicate or simulate the authorization logic inside the harness.

---

### C. Direct `createTrainer` Test Lifecycle

Ensure the `createTrainer` authorization test has an explicit cleanup step for its successful case.

**Requirement:** Cleanup must be tied to the exact created test record and must NOT depend only on an email search when an ID is available.

---

## VALIDATION SEQUENCE

After the correction is available on the authoritative development deployment, run these steps separately:

1. Record current counts
2. Safely remove only the confirmed orphaned test trainer
3. Verify counts return to:
   - exercises: 0
   - trainers: 0
   - trainerExercises: 0
4. Re-run the complete `createTrainer` authorization matrix
5. Clean up its successful test record
6. Verify counts return to 0/0/0
7. Run the complete `assignExerciseToTrainer` authorization matrix and idempotency test
8. Verify its internal cleanup
9. Run final database counts

**Every Convex command must explicitly target:** `--deployment upbeat-chickadee-781`

---

## SOURCE VALIDATION

Run separately:
```powershell
npx tsc --noEmit -p convex/tsconfig.json
npx convex typecheck
```

If generated APIs must be refreshed, use the verified development-safe mechanism only. Do NOT use `npx convex deploy`.

---

## RESTRICTIONS

Do NOT:
- Continue with browser tests
- Create a public cleanup endpoint
- Delete records without first proving they are test records
- Delete all records in a table
- Run migrations
- Run seeds
- Run Notion imports
- Touch production
- Contact obsolete local Convex
- Expose the admin secret
- Commit or push

---

## REQUIRED REPORT

Return:
1. Proven cause of the orphan
2. Whether the prior idempotency harness actually failed cleanup
3. Files modified
4. Exact harness changes
5. Safety guards on cleanup
6. `createTrainer` authorization matrix (4 conditions)
7. `assignExerciseToTrainer` authorization matrix (4 conditions)
8. Idempotency evidence
9. Counts before and after every test group
10. Final counts
11. Typecheck evidence
12. Deployment target used
13. Git status
14. Confirmation that only identified test records were removed
15. Confirmation that no public diagnostic or cleanup mutation was added

---

## FINAL VERDICT (exactly one):

`ADMIN AUTHORIZATION: PASS — DATABASE CLEAN — READY FOR BROWSER AUTH VERIFICATION`

`ADMIN AUTHORIZATION: FAIL — CORRECTIONS REQUIRED`

`CLEANUP SAFETY BLOCKER — MANUAL REVIEW REQUIRED`