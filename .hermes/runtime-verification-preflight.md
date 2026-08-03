# Runtime Verification Milestone 1 — Target and Harness Preflight

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- This is a READ-ONLY preflight. Do NOT modify any files.
- Do NOT commit, push, or create a pull request.
- Do NOT run `npx convex run`, `npx convex dev`, `npx convex dev --once`, `npx convex codegen`, `npx convex deploy`
- Do NOT run mutations, queries against the database, browser or Playwright, builds, tests, or environment changes.
- You MAY run commands that only display CLI version, CLI help, Git status, file contents, generated API references, and package metadata.

## OBJECTIVE
Prove that OpenCode can safely run the upcoming authorization tests against only the authoritative cloud development deployment.

## AUTHENTIC TARGET
- Project: Body Bridge Fitness
- Team: thebest-croc
- Development deployment: dev/thebest-croc
- Deployment URL: https://upbeat-chickadee-781.convex.cloud

## OBSOLETE TARGETS (must remain untouched)
- Any `local:` Convex deployment
- http://127.0.0.1:3210
- 10.0.0.112:3210
- groovy-pig-414

## READ-ONLY INSPECTION

Inspect:
1. Installed Convex CLI version
2. Relevant CLI help
3. Convex project configuration
4. Package scripts and wrappers
5. Environment-variable names (without exposing values or secrets)
6. convex/test_internal_harness.ts
7. Current generated API declarations
8. Authorization implementations for:
   - trainers.createTrainer
   - exercises.createDraftExercise
   - exercises.publishExercise
   - trainerExercises.assignExerciseToTrainer

## DETERMINE

1. The exact supported CLI mechanism for selecting dev/thebest-croc
2. Whether that mechanism avoids .env.local and the obsolete local deployment
3. Whether --url is actually supported for each intended command
4. Whether an environment-file option is supported by the installed CLI
5. Whether a safe existing repository wrapper already exists
6. Whether the test harness is included in generated APIs
7. Whether any harness function is public
8. Whether the harness cleanup logic is internally consistent
9. Whether authorization tests can be executed without exposing the admin secret
10. Which test cases require browser-authenticated identity rather than an admin secret

Do NOT guess command flags. Use installed CLI help and package source/type declarations as evidence.

## REQUIRED OUTPUT

Return:
1. Exact OpenCode session and model
2. Exact installed Convex CLI version
3. Verified target-selection mechanism
4. Exact safe command form proposed for later runtime tests, with secret values represented only as placeholders
5. Explanation of why that command cannot target the obsolete local deployment
6. Harness function inventory and visibility
7. Cleanup consistency review
8. Authorization matrix showing which identity or secret context each function accepts
9. Any blocker that must be fixed before state-changing runtime tests
10. Git status
11. Confirmation that no file, database, deployment, environment, account, or secret was changed

Final verdict must be exactly one of:

`RUNTIME PREFLIGHT: PASS — AUTHORIZATION TESTS MAY PROCEED`

`RUNTIME PREFLIGHT: FAIL — CORRECTIONS REQUIRED`