# Milestone 2A — Database Baseline

Repository: Body-Bridge
Target: --deployment dev/thebest-croc

## Command
```powershell
npx convex run test_internal_harness:getDatabaseCounts --deployment dev/thebest-croc
```

## Execution
1. Run baseline count query
2. Confirm deployment selected
3. Verify no local endpoint contacted
4. Verify no mutation occurred

## Expected Baseline
- exercises: 0
- trainers: 0
- trainerExercises: 0

## Reporting
Report:
- Exit code
- Exact counts returned
- Confirmation of deployment target
- Confirmation of read-only nature

## If NONZERO
STOP and report exact counts. Do NOT delete anything.

## Verdict
Write to .hermes/authorization-report.md:
- `DATABASE BASELINE: PASS` (if all zero)
- `DATABASE BASELINE: FAIL — NONZERO RECORDS` (if any nonzero)

Then proceed to Milestone 2B if baseline passes.