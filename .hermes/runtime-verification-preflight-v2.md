# Runtime Verification Preflight — Focused Report

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- READ-ONLY — do NOT modify any files
- Do NOT run convex dev, deploy, mutations, queries, builds, tests

## REQUIRED FINDINGS — SAVE TO .hermes/preflight-report.md

After completing inspection, write a report to `.hermes/preflight-report.md` with:

1. **OpenCode session and model**
2. **Convex CLI version**
3. **Target-selection mechanism verified** — the exact `--deployment` syntax that selects dev/thebest-croc
4. **Safe command form** for running mutations against dev/thebest-croc
5. **Why local deployment is avoided** — explain why --deployment syntax cannot target obsolete local
6. **Harness function inventory** — list all functions in convex/test_internal_harness.ts
7. **Harness visibility** — which are public vs internal
8. **Cleanup consistency** — any create/delete pairs or orphaned functions
9. **Authorization matrix** for these functions:
   - trainers.createTrainer — what identity/secret required
   - exercises.createDraftExercise — what identity/secret required
   - exercises.publishExercise — what identity/secret required
   - trainerExercises.assignExerciseToTrainer — what identity/secret required
10. **Blockers** — any issue that must be fixed before state-changing tests
11. **Git status**
12. **Confirmation** that no file, database, deployment, environment, account, or secret was changed

## FINAL VERDICT (end of report)
Exactly one of:

`RUNTIME PREFLIGHT: PASS — AUTHORIZATION TESTS MAY PROCEED`

`RUNTIME PREFLIGHT: FAIL — CORRECTIONS REQUIRED`