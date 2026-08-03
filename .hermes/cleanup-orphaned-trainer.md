# Manual Cleanup Mission — Remove Orphaned Test Trainer

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- Target deployment: `--deployment upbeat-chickadee-781`
- This is a source modification — requires authorization
- Create minimal internalMutation to delete orphaned trainer
- Run cleanup, then verify database state
- Do NOT touch production or local Convex

---

## OBJECTIVE

Remove the orphaned test trainer created during authorization tests.

**Orphaned trainer identifier:**
- Email: `test_auth_1784825588282@test.local`
- ID: `n977r4sybkbsz238a37sytrv3d8b3szr`

---

## STEPS

1. Create internalMutation in `convex/internal/` (e.g., `deleteTrainerByEmail.ts`)
2. The mutation should:
   - Accept an email argument
   - Query the trainers table by email
   - Delete the matching trainer record
   - Return confirmation
3. Push the mutation to the deployment
4. Run the mutation to delete the orphaned trainer
5. Verify final database counts are zero (0/0/0)

---

## REQUIRED REPORT

Return:
1. Created file path
2. Mutation code (sanitized, no secrets)
3. Convex command used to deploy mutation
4. Command used to run cleanup
5. Exit codes
6. Database counts before cleanup
7. Database counts after cleanup
8. Confirmation that orphaned trainer was removed

---

## VERDICT

Write to `.hermes/cleanup-report.md`:

`CLEANUP: PASS` — if final counts are 0/0/0

`CLEANUP: FAIL` — if orphaned trainer remains