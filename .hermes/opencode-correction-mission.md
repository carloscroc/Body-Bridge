# OpenCode Correction Mission — TypeScript Project Boundaries

REPOSITORY: C:\Users\thebe\Downloads\Body-Bridge

TARGET STATE: READY FOR SINGLE-RECORD END-TO-END TEST

DO NOT:
- Approximate diagnostic counts (use exact numbers)
- Blame React 19 without proof
- Implement speculative fixes
- Create invalid tsconfig.scripts.json that excludes its own files
- Assume CommonJS/JavaScript need no validation
- Modify Convex environment configuration (.env.local, .env.production)
- Run npx convex deploy, npx convex dev, or deployment commands
- Reconnect to local Convex
- Modify production or secrets

---

## SCOPE A — Establish Explicit Active Application Ownership

Replace the root project's implicit repository-wide inclusion with an explicit `include`.

### Task A1: Inspect and document all potential active paths

Before editing, you must inspect and document:

1. **Frontend application source:**
   - Which files in `src/` are actually imported by the app entry points?
   - What does `vite.config.ts` actually include via its build process?
   - Are there any subdirectories in `src/` that are not used?

2. **Express/server source:**
   - Which files in `server/` are actually imported by `server/server.js`?
   - Are there any unused server files?

3. **Active tests:**
   - Which test files are actually executed by `npm run test:playwright`?
   - Are there any test files that are not executed?

4. **Active root configuration files:**
   - `vite.config.ts`
   - `playwright.config.ts`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `capacitor.config.json`
   - `components.json`
   - `knip.json`
   - Any other configuration files that affect the build or runtime

5. **Required declarations:**
   - What type declaration files exist in the root?
   - Are they actually used?

### Task A2: Create exact proposed root include list

Based on your inspection, create a table:

| Path | Include? | Evidence of Active Use | Reason for Exclusion (if excluded) |

Only paths with EVIDENCE of active use should be included.

### Task A3: Update tsconfig.json

Replace any implicit `include` with the EXACT list from Task A2.

Do NOT use new broad exclusions as the primary boundary mechanism.

Archived, backup, experimental, Convex, and tooling sources should remain outside the active root project because they are owned by other scopes, not merely because they currently fail.

---

## SCOPE B — Create a Valid Active Tooling Project

### Task B1: Identify active scripts that benefit from TypeScript validation

Inspect ALL scripts referenced by package.json scripts.

For each script, report:

| Script | Package Reference | File Type | Import TypeScript Types? | Should Be in tsconfig.scripts.json? | Why or Why Not? |

Only include scripts when TypeScript can meaningfully check them.

### Task B2: Create tsconfig.scripts.json

Requirements:

1. Do NOT exclude its own included scripts (no `exclude: ["scripts/**/*"]`)
2. Use Node-appropriate compiler options
3. Do NOT inherit browser-only options unless justified
4. Include ONLY current build, development, verification, or administration scripts
5. Include JavaScript, CommonJS, or ESM files only when TypeScript can meaningfully check them
6. Set `checkJs` explicitly according to the intended policy
7. Report active scripts intentionally outside TypeScript validation and explain why

### Task B3: Validate tsconfig.scripts.json

Run: `npx tsc --noEmit -p tsconfig.scripts.json`

Report:
- Working directory
- Exact command
- Configuration (show the created tsconfig.scripts.json content)
- Included files (list first 50 if more)
- Exit code
- Exact first diagnostic if failing
- Exact total diagnostics
- PASS or FAIL

---

## SCOPE C — Legacy and Experimental Ownership

### Task C1: Evaluate legacy and experimental scripts

For scripts classified as OBSOLETE, EXPERIMENTAL, or LEGACY:

1. Should they have their own tsconfig.legacy-scripts.json?
2. Is static checking practical for them?
3. Or should they remain outside all TypeScript validation?

Create `tsconfig.legacy-scripts.json` ONLY if:
- Scripts are intentionally retained
- Static checking is practical
- There is value in validating them

Do NOT force obsolete scripts to pass.

For obsolete files:
- Do NOT archive them in this mission
- Record them for a later explicit archival decision
- Keep `tools/plane-testing` isolated from active validation

---

## SCOPE D — Fix Genuine Active Diagnostics

### Task D0: Create exact baseline diagnostic table

Before fixing anything, run: `npx tsc --noEmit -p tsconfig.json`

Create a table with EXACT information:

| File | Line | Diagnostic Code | Message | Project Ownership | Category |
|------|------|-----------------|---------|-------------------|----------|

Categories:
- Frontend source
- Server source
- Tests
- Root configuration
- Active tooling
- Legacy/obsolete
- Experimental

Total diagnostics per file and per category must be exact.

### Task D1: Investigate ErrorBoundary.tsx

DO NOT assume React 19 is the cause.

Inspect:
1. The import statement
2. The class declaration (extends what?)
3. Generic props and state types (if any)
4. Conflicting local declarations
5. The installed React type versions (check package.json or package-lock.json)

Run: `npm list react @types/react`

Report:
- Exact React version installed
- Exact @types/react version installed
- The actual class definition
- Why `this.props` and `this.setState` are not available

Fix the issue based on ACTUAL evidence, not speculation.

### Task D2: Investigate CommunityView.tsx table name errors

Verify table names against the CURRENT generated Convex data model.

Run: `cat convex/_generated/dataModel.d.ts | grep -E "(socialPosts|posts|socialComments|comments)"`

Report:
- What tables actually exist in the data model
- Whether `posts` or `socialPosts` is correct
- Whether `comments` or `socialComments` is correct

Fix based on ACTUAL data model, not assumption.

### Task D3: Fix remaining active diagnostics

For each of these files, investigate and fix:

- `src/screens/Calendar/index.tsx`
- `src/components/UnifiedNavMenu.tsx`
- `src/screens/WorkoutsView.tsx`
- `src/components/LoadingSkeleton.tsx`
- `src/screens/ExercisesView.tsx`
- `src/utils/sanitize.ts`
- `tests/evidence/imageResolver-program-titles-test.ts`
- `tests/imageResolver-test.ts`
- `convex.config.ts`

For every fix:

1. Preserve runtime behavior unless correcting a demonstrated bug
2. Do NOT fabricate missing modules merely to satisfy TypeScript
3. Do NOT use `any`, `@ts-ignore`, or broad assertions unless technically justified and documented
4. Verify table names against current generated Convex data model
5. Use the correct Convex `Id` import already established by repository conventions
6. Verify installed package APIs before changing configuration code

For src/utils/sanitize.ts:
- Check the installed DOMPurify version
- Check the actual DOMPurify type definitions
- Verify the correct config property name

For convex.config.ts:
- Check the installed Convex version
- Check the actual Convex type definitions
- Verify the correct import

### Task D4: Validate fixes

After all fixes, run: `npx tsc --noEmit -p tsconfig.json`

Create after-fix table with same format as baseline.

Report:
- Diagnostics fixed
- Diagnostics remaining
- PASS or FAIL

---

## SCOPE E — Validate Separately

Run EACH command separately and report:

### Command 1: Root application type check
```
npx tsc --noEmit -p tsconfig.json
```

Report:
- Working directory
- Exact command
- Exit code
- Exact total diagnostics
- Exact first diagnostic if failing
- PASS or FAIL

### Command 2: Active tooling type check (if tsconfig.scripts.json created)
```
npx tsc --noEmit -p tsconfig.scripts.json
```

Report:
- Working directory
- Exact command
- Exit code
- Exact total diagnostics
- Exact first diagnostic if failing
- PASS or FAIL

### Command 3: Convex type check
```
npx tsc --noEmit -p convex/tsconfig.json
```

Report:
- Working directory
- Exact command
- Exit code
- Exact total diagnostics
- Exact first diagnostic if failing
- PASS or FAIL

### Command 4: Convex CLI type check
```
npx convex typecheck
```

Report:
- Working directory
- Exact command
- Exit code
- Exact total diagnostics
- Exact first diagnostic if failing
- PASS or FAIL

### Command 5: Build
```
npm run build
```

Report:
- Working directory
- Exact command
- Exit code
- PASS or FAIL

### Command 6: Legacy/experimental scripts (if tsconfig.legacy-scripts.json created)
```
npx tsc --noEmit -p tsconfig.legacy-scripts.json
```

Report:
- Working directory
- Exact command
- Exit code
- Exact total diagnostics
- Exact first diagnostic if failing
- PASS or FAIL

---

## DO NOT RUN

- npx convex codegen
- npx convex dev
- npx convex dev --once
- Convex mutations
- Browser tests
- Playwright
- Android builds
- Migrations
- Seeds
- Notion imports
- Deployment commands

---

## REQUIRED FINAL REPORT

Return with exact headings:

### 1. FILES MODIFIED

List every file modified with a brief description of the change.

### 2. EXACT ROOT INCLUDE LIST

The complete include list for tsconfig.json.

### 3. EXACT ACTIVE TOOLING INCLUDE LIST

The complete include list for tsconfig.scripts.json (if created).

### 4. LEGACY OR EXPERIMENTAL OWNERSHIP DECISIONS

What was decided for legacy/experimental scripts and why.

### 5. BEFORE-AND-AFTER DIAGNOSTIC TABLE

Exact counts before and after fixes.

### 6. EXPLANATION FOR EVERY ACTIVE-SOURCE FIX

For each fixed file, explain:
- The exact error
- The root cause (with evidence)
- The fix applied
- Why this fix preserves runtime behavior

### 7. EVERY VALIDATION COMMAND AS SEPARATE EVIDENCE

Each command from Scope E with its full report.

### 8. REMAINING FAILURES

Any remaining diagnostics without hiding them.

### 9. GIT STATUS AFTER IMPLEMENTATION

Run: `git status --short`

Report exact output.

### 10. CONFIRMATION OF NO CONVEX/ENVIRONMENT CHANGES

Confirm that:
- NO Convex target was changed
- NO database was modified
- NO deployment was executed
- NO .env.local was modified
- NO .env.production was modified
- NO environment variables were changed
- NO secrets were exposed

---

## FINAL VERDICT LABELS

Use these EXACT labels:

ACTIVE APPLICATION TYPE CHECK: PASS | FAIL

ACTIVE TOOLING TYPE CHECK: PASS | FAIL

CONVEX TYPE CHECK: PASS | FAIL

LEGACY/EXPERIMENTAL SCRIPTS: PASS | FAIL | OUTSIDE ACTIVE VALIDATION

Final verdict for this mission:

TYPE SCRIPT BOUNDARIES COMPLETE — READY FOR NEXT VERIFICATION MISSION

or

PARTIAL — CORRECTIONS REQUIRED

Do NOT claim repository-wide TypeScript is clean unless every intentionally maintained TypeScript project passes.