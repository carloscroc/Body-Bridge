# Mission 3 — Cleanup and Authorization Execution

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## MODEL
zai-coding-plan/glm-5.2

## OBJECTIVE

Execute the complete authorization matrix and cleanup verification on the authoritative development deployment.

## DEPLOYMENT
`--deployment upbeat-chickadee-781` (every command)

## STEPS

### Step 1: Record current counts
Run: `npx convex run test_internal_harness:getDatabaseCounts --deployment upbeat-chickadee-781`

### Step 2: Run the complete createTrainer authorization matrix
Test these 4 conditions via CLI:

1. Missing secret:
   `npx convex run trainers:createTrainer --deployment upbeat-chickadee-781 '{"firstName":"TestAuth","lastName":"Missing","email":"test_auth_missing@test.local","isActive":true}'`

2. Empty secret:
   `npx convex run trainers:createTrainer --deployment upbeat-chickadee-781 '{"firstName":"TestAuth","lastName":"Empty","email":"test_auth_empty@test.local","isActive":true,"adminSecret":""}'`

3. Incorrect secret:
   `npx convex run trainers:createTrainer --deployment upbeat-chickadee-781 '{"firstName":"TestAuth","lastName":"Wrong","email":"test_auth_wrong@test.local","isActive":true,"adminSecret":"WRONG_SECRET"}'`

4. Correct secret:
   Load ADMIN_SCRIPT_SECRET from environment variables on the deployment (use `npx convex env list --deployment upbeat-chickadee-781` to confirm it exists, then use it in the command).
   `npx convex run trainers:createTrainer --deployment upbeat-chickadee-781 '{"firstName":"TestAuth","lastName":"Correct","email":"test_auth_correct_MARKER@test.local","isActive":true,"adminSecret":"<REDACTED>"}'`
   Use a unique timestamp marker for the email.

For each: capture exit code, error/result, whether record was created.

### Step 3: Clean up the successful createTrainer test record
Use the new cleanup function:
`npx convex run test_internal_harness:cleanupTestTrainerByMarker --deployment upbeat-chickadee-781 '{"testMarker":"<MARKER>"}'`

### Step 4: Verify counts return to 0/0/0
Run: `npx convex run test_internal_harness:getDatabaseCounts --deployment upbeat-chickadee-781`

### Step 5: Run the complete assignment authorization matrix
Use the new harness function:
`npx convex run test_internal_harness:testAssignmentAuthorization --deployment upbeat-chickadee-781 '{"testMarker":"<unique-timestamp>"}'`

This tests: missing/empty/incorrect/correct secret + idempotency, with built-in cleanup.

### Step 6: Verify counts after assignment matrix
Run: `npx convex run test_internal_harness:getDatabaseCounts --deployment upbeat-chickadee-781`

### Step 7: Final counts
Run: `npx convex run test_internal_harness:getDatabaseCounts --deployment upbeat-chickadee-781`

## REPORT

Write to `.hermes/mission-3-report.md`:

1. Counts before createTrainer matrix
2. createTrainer authorization matrix (4 conditions, exit codes, results)
3. Cleanup result for createTrainer
4. Counts after createTrainer cleanup
5. Assignment authorization matrix (all 5 conditions from harness)
6. Idempotency evidence (first=created, second=updated, same ID)
7. Counts after assignment matrix
8. Final counts
9. Exact commands with secrets replaced by <REDACTED>
10. Exit codes for each command
11. Confirmation only test records were deleted
12. Confirmation production and local Convex untouched
13. Confirmation no secret exposed

## VERDICT

`ADMIN AUTHORIZATION: PASS — DATABASE CLEAN — READY FOR BROWSER AUTH VERIFICATION`

or

`ADMIN AUTHORIZATION: FAIL — CORRECTIONS REQUIRED`