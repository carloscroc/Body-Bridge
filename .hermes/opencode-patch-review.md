# OpenCode Patch Review — Read-Only

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## CRITICAL CONSTRAINTS
- This is a READ-ONLY review. Do NOT modify any files.
- Do NOT commit, push, or create a pull request.
- Do NOT run Convex codegen, dev, mutations, deployment, browser tests, Playwright, Android, migrations, seeds, or Notion imports.
- You MAY run these read-only validation commands:
  - `npx tsc --noEmit -p tsconfig.json`
  - `npx tsc --noEmit -p tsconfig.scripts.json`
  - `npx tsc --noEmit -p convex/tsconfig.json`
  - `npx convex typecheck`
  - `npm run build`
- Report the exact model you are using.

## REVIEW SCOPE

Inspect the complete diff from HEAD 522c1593 to the current working tree.

Run these commands and analyze the output:
```bash
git status --short
git diff --stat
git diff -- tsconfig.json
git diff -- tsconfig.scripts.json
git diff -- package.json
git diff -- package-lock.json
git diff -- convex.config.ts
git diff -- scripts/convexAdminClient.js
git diff -- src
git diff -- tests
```

## REQUIRED TECHNICAL REVIEW

### 1. TypeScript project boundaries
Verify that tsconfig.json includes every active application path and does not omit active code.
Check specifically:
- frontend source
- server or Express source
- active tests
- Vite configuration
- Capacitor configuration
- Playwright configuration and tests
- root declarations
- any Electron or auxiliary application entry points
- active root TypeScript files

Identify any active file that now falls outside all TypeScript projects.

Verify that tsconfig.scripts.json actually includes all intended active scripts and does not accidentally inherit exclusions or browser-only assumptions.

### 2. Dependency changes
Verify that @types/react and @types/react-dom match the installed React and React DOM major versions.
Report whether installing them changed any dependency resolution beyond the intended type packages.
Do not accept "build passes" as proof that dependency changes are harmless.

### 3. convex.config.ts
Inspect the installed Convex package and type declarations.
Verify whether defineApp from convex/server is the correct API for this repository and Convex version.
Determine the actual purpose of convex.config.ts.
Check whether the new configuration changes runtime behavior, component registration, deployment behavior, or Convex CLI behavior.
Do not infer correctness only from TypeScript passing.

### 4. Source changes
Review every modified source file for behavioral regressions.
Check specifically:
- whether CommunityView now uses the correct current table IDs everywhere
- whether Calendar mapping preserves all expected plan fields
- whether bodyRegion replaced muscleGroup correctly or discarded information
- whether DOMPurify hook registration occurs globally on every render or module load and whether duplicate hook registration is possible
- whether the VideoPlayer prop change matches the component contract
- whether animation and event type fixes preserve runtime behavior
- whether React.cloneElement generic typing accurately represents the child
- whether Settings type narrowing is sound
- whether Home timeline changes preserve runtime data
- whether workout and exercise detail changes match current models

Flag any fix that merely satisfies TypeScript while changing semantics.

### 5. Tests
Verify that both image resolver import-path changes resolve to the intended current implementation.
Determine whether these tests are actually run by an existing package script or test runner.
Do not call tests active merely because they are included in TypeScript.

### 6. scripts/convexAdminClient.js
Review the removed return statement.
Confirm it was genuinely unreachable and that its removal cannot change error handling or administrative script behavior.

### 7. Working-tree integrity
Distinguish:
- intended source changes
- generated files
- memory files
- Hermes/OpenCode mission artifacts
- unrelated pre-existing changes

Do not include session artifacts in a future application commit unless explicitly justified.

## REQUIRED REPORT

Return:

1. Complete modified-file inventory.
2. Diff summary.
3. Findings grouped as:
   - BLOCKER
   - HIGH RISK
   - MEDIUM RISK
   - LOW RISK
   - VERIFIED CORRECT
4. Active files omitted from TypeScript validation.
5. Semantic regressions or suspicious type-only fixes.
6. Dependency compatibility result.
7. convex.config.ts API verification.
8. Test ownership and execution status.
9. Files that should be excluded from the eventual commit.
10. Validation command evidence.
11. Exact Git status.
12. Confirmation that no files or external state were changed during review.

Final verdict must be exactly one of:

`PATCH REVIEW: PASS — READY FOR RUNTIME VERIFICATION`

`PATCH REVIEW: FAIL — CORRECTIONS REQUIRED`
