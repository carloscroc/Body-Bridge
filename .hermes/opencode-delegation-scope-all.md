# OpenCode Delegation — TypeScript Project Boundaries (Scopes A-E)

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## TARGET STATE
READY FOR SINGLE-RECORD END-TO-END TEST

## PROHIBITED ACTIONS
- Do NOT modify .env.local, .env.production, or any environment configuration
- Do NOT run npx convex deploy, npx convex dev, npx convex codegen, or deployment commands
- Do NOT reconnect to local Convex
- Do NOT commit, push, or create a pull request
- Do NOT modify production or expose secrets
- Do NOT delete data
- Do NOT use `any`, `@ts-ignore`, or broad assertions unless technically justified and documented
- Do NOT fabricate missing modules merely to satisfy TypeScript
- Do NOT archive or delete obsolete files in this mission
- Do NOT run browser tests, Playwright, Android builds, migrations, or seeds

## PRE-GATHERED EVIDENCE (Hermes has already investigated these — use directly)

### Current tsconfig.json (root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"],
      "@convex/*": ["./convex/*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "exclude": [
    "convex/**/*.ts",
    "convex/**/*.tsx",
    "tools/plane-testing/**/*",
    "scripts/**/*"
  ]
}
```
NOTE: There is NO `include` field — the project uses implicit repository-wide inclusion with `exclude`. This is what Scope A must fix.

### Installed Dependency Versions (verified)
- react: 19.2.7 (^19.2.4 in package.json)
- @types/react: **NOT INSTALLED** — not in package.json, not in package-lock.json, not in node_modules
- convex: 1.42.1 (^1.42.1 in package.json)
- dompurify: 3.4.9 (^3.3.1 in package.json)
- typescript: ~5.8.2
- @types/node: ^22.14.0

### ErrorBoundary.tsx Root Cause (VERIFIED)
- File: src/components/ErrorBoundary.tsx
- Class: `export class ErrorBoundary extends Component<Props, State>`
- The class is correctly typed with generic props and state
- ROOT CAUSE: @types/react is NOT installed. TypeScript resolves `react` to `index.js` (plain JS, no type declarations). The Component class imported from JS has no generic type parameters, so `this.props` and `this.setState` are not available on the typed class.
- FIX: Add `@types/react` and `@types/react-dom` as devDependencies and run `npm install`. This is the standard, correct approach — React 19 does not ship its own type definitions (types are maintained as @types/react).
- Do NOT speculate about React 19 breaking changes. The evidence is clear: types are simply missing.

### convex.config.ts Root Cause (VERIFIED)
- File: convex.config.ts (root)
- Current code: `import { defineConvexConfig } from "convex";`
- ROOT CAUSE: `defineConvexConfig` does NOT exist in convex 1.42.1. The exported function is `defineApp` from `convex/server` (or `defineComponent` for component definitions).
- Evidence: `grep -rn "defineConvexConfig" node_modules/convex/index.d.ts` returns nothing. The convex server index exports: `defineApp, defineComponent, componentsGeneric, createFunctionHandle`.
- There is also a convex.config.js (CommonJS) that works because it just exports a plain object.
- FIX: Investigate what the correct Convex configuration approach is for convex 1.42.1. Check if `defineApp` from `convex/server` is the right replacement, or if convex.config.ts should just export a plain object like convex.config.js does. Verify against actual convex type definitions.

### CommunityView.tsx Table Name Root Cause (VERIFIED)
- File: src/screens/CommunityView.tsx (lines 760, 761, 803, 808, 814, 816)
- ROOT CAUSE: Code uses `Id<"posts">` and `Id<"comments">` but the Convex schema defines tables as `socialPosts` and `socialComments`
- Evidence from convex/schema.ts: `socialPosts: defineTable(...)` and `socialComments: defineTable(...)`. There are NO tables named `posts` or `comments`.
- FIX: Replace all `Id<"posts">` with `Id<"socialPosts">` and all `Id<"comments">` with `Id<"socialComments">`.

### sanitize.ts DOMPurify Root Cause (VERIFIED)
- File: src/utils/sanitize.ts (line 9)
- Current code passes `uponSanitizeAttribute` as a config property to `DOMPurify.sanitize()`
- ROOT CAUSE: In DOMPurify 3.4.9, `uponSanitizeAttribute` is NOT a Config property — it is a HOOK EVENT NAME used with `DOMPurify.addHook('uponSanitizeAttribute', callback)`
- Evidence from node_modules/dompurify/dist/purify.cjs.d.ts: `Config` interface does not include `uponSanitizeAttribute`. Hooks are registered via `addHook(entryPoint: 'uponSanitizeAttribute', hookFunction: UponSanitizeAttributeHook): void`
- FIX: Replace the config property with a hook registered via `DOMPurify.addHook()` before calling `sanitize()`, or use the `RETURN_DOM_FRAGMENT` / `RETURN_DOM` approach to post-process the sanitized DOM. Research the correct DOMPurify 3.x API and implement it without changing runtime behavior.

### Remaining Active Diagnostics (need investigation by OpenCode)
- src/screens/WorkoutsView.tsx:74 — Cannot find name 'Id' (TS2304) — likely missing import
- src/screens/WorkoutsView.tsx:139 — `bodyRegion` missing in Exercise type (TS2322) — check Exercise type definition
- src/screens/Calendar/index.tsx:62 — `id` missing in PlanItem (TS2345) — check PlanItem type vs userPlans schema
- src/components/LoadingSkeleton.tsx:62 — `key` prop not in LoadingSkeletonProps (TS2322) — key is a React reserved prop, should not be in props type
- src/components/UnifiedNavMenu.tsx:152 — Cannot find name 'CheckCircle' (TS2304) — likely missing import from lucide-react
- src/screens/ExercisesView.tsx:205 — Property 'id' does not exist on type 'unknown' (TS2339) — typing issue
- tests/evidence/imageResolver-program-titles-test.ts — Cannot find module '../../utils/imageResolver' (TS2307) — check if file exists or test is obsolete
- tests/imageResolver-test.ts — Cannot find module '../utils/imageResolver' (TS2307) — same

### Baseline Diagnostic Counts (VERIFIED by Hermes)
Total: 56 diagnostics (not 57 — the handoff had a minor discrepancy)
- Legacy/obsolete: 32 (convex_backup: 21, project-archive: 11)
- Frontend source: 21
- Tests: 2
- Root config: 1
- Active-source total: 24

### Scripts Directory (for Scope B)
The scripts/ directory contains many .js, .cjs, and .mjs files. Key package.json scripts that reference them:
- config:generate → scripts/generateAppConfig.cjs
- postinstall → scripts/patch-capacitor-android.cjs
- dev:convex → scripts/runConvexDev.mjs
- dev:client → scripts/runViteDev.mjs
- dev:server → server/server.js
- deploy:convex → scripts/deployConvex.mjs
- build → scripts/ensureBuildEnv.cjs, scripts/postbuild-csp.mjs, scripts/postbuild-memory.js, scripts/verifyBuild.cjs
- test:playwright → npx playwright test
- capture-exercise-images → scripts/captureExerciseImages.js
- Various memory:* scripts → scripts/context-manager.js, scripts/mempalace-client.js, scripts/memory-hooks.js
- create-ticket → scripts/create-plane-ticket.cjs
- start-symphony → scripts/start-symphony-work.cjs
- security:scan → semgrep + scripts/security-memory.js

---

## SCOPE A — Establish Explicit Active Application Ownership

### Task A1: Inspect and document all potential active paths
Before editing, inspect and document:
1. Frontend application source: Which files in src/ are actually imported by the app entry points? What does vite.config.ts include?
2. Express/server source: Which files in server/ are imported by server/server.js?
3. Active tests: Which test files are executed by npm run test:playwright?
4. Active root configuration files: vite.config.ts, playwright.config.ts, tailwind.config.js, postcss.config.js, capacitor.config.json, components.json, knip.json
5. Required declarations: What .d.ts files exist in the root?

### Task A2: Create exact proposed root include list
Based on inspection, create a table with columns: Path | Include? | Evidence of Active Use | Reason for Exclusion

### Task A3: Update tsconfig.json
Replace implicit inclusion with explicit `include` array from Task A2.
Do NOT use broad exclusions as the primary boundary mechanism.
Exclude only paths owned by other scopes: convex/ (owned by convex/tsconfig.json), scripts/ (owned by tsconfig.scripts.json), tools/plane-testing/ (isolated), convex_backup/ (obsolete), project-archive/ (archived).

---

## SCOPE B — Create a Valid Active Tooling Project

### Task B1: Identify active scripts that benefit from TypeScript validation
Inspect ALL scripts referenced by package.json scripts. For each, report: Script | Package Reference | File Type | Import TypeScript Types? | Should Be in tsconfig.scripts.json? | Why or Why Not?

### Task B2: Create tsconfig.scripts.json
Requirements:
1. Do NOT exclude its own included scripts (no `exclude: ["scripts/**/*"]`)
2. Use Node-appropriate compiler options
3. Do NOT inherit browser-only options unless justified
4. Include ONLY current build, development, verification, or administration scripts
5. Include JavaScript, CommonJS, or ESM files only when TypeScript can meaningfully check them
6. Set `checkJs` explicitly according to the intended policy
7. Report scripts intentionally outside TypeScript validation and explain why

### Task B3: Validate tsconfig.scripts.json
Run: `npx tsc --noEmit -p tsconfig.scripts.json`
Report: working directory, exact command, config content, included files (first 50), exit code, first diagnostic, total diagnostics, PASS or FAIL.

---

## SCOPE C — Legacy and Experimental Ownership

### Task C1: Evaluate legacy and experimental scripts
For OBSOLETE, EXPERIMENTAL, or LEGACY scripts:
1. Should they have their own tsconfig.legacy-scripts.json?
2. Is static checking practical for them?
3. Or should they remain outside all TypeScript validation?

Create `tsconfig.legacy-scripts.json` ONLY if scripts are intentionally retained, static checking is practical, and there is value in validating them.
Do NOT force obsolete scripts to pass.
Do NOT archive obsolete files in this mission.
Keep tools/plane-testing isolated from active validation.
Record obsolete files for a later explicit archival decision.

---

## SCOPE D — Fix Genuine Active Diagnostics

### Task D0: Create exact baseline diagnostic table
Run: `npx tsc --noEmit -p tsconfig.json`
Create a table: File | Line | Diagnostic Code | Message | Project Ownership | Category

### Task D1: Fix ErrorBoundary.tsx
Add @types/react and @types/react-dom as devDependencies. Run npm install.
Verify the fix resolves all 4 ErrorBoundary errors (lines 40, 45, 46, 73).

### Task D2: Fix CommunityView.tsx table names
Replace all `Id<"posts">` with `Id<"socialPosts">` and `Id<"comments">` with `Id<"socialComments">`.
Verify the fix resolves all 10 CommunityView errors.

### Task D3: Fix remaining active diagnostics
For each file, investigate and fix:
- src/screens/Calendar/index.tsx — check PlanItem type vs userPlans schema
- src/components/UnifiedNavMenu.tsx — check if CheckCircle import is missing from lucide-react
- src/screens/WorkoutsView.tsx — add missing Id import; check Exercise type for bodyRegion
- src/components/LoadingSkeleton.tsx — key is a React reserved prop, not a component prop
- src/screens/ExercisesView.tsx — fix typing issue on line 205
- src/utils/sanitize.ts — move uponSanitizeAttribute from config to addHook() call
- tests/evidence/imageResolver-program-titles-test.ts — check if imageResolver module exists or test is obsolete
- tests/imageResolver-test.ts — same
- convex.config.ts — fix defineConvexConfig import to use correct convex 1.42.1 API

For every fix:
1. Preserve runtime behavior unless correcting a demonstrated bug
2. Do NOT fabricate missing modules merely to satisfy TypeScript
3. Do NOT use `any`, `@ts-ignore`, or broad assertions unless technically justified and documented
4. Verify table names against current generated Convex data model
5. Use the correct Convex Id import already established by repository conventions
6. Verify installed package APIs before changing configuration code

### Task D4: Validate fixes
Run: `npx tsc --noEmit -p tsconfig.json`
Create after-fix table with same format as baseline.
Report: diagnostics fixed, diagnostics remaining, PASS or FAIL.

---

## SCOPE E — Validate Separately

Run EACH command separately and report: working directory, exact command, exit code, total diagnostics, first diagnostic if failing, PASS or FAIL.

1. `npx tsc --noEmit -p tsconfig.json`
2. `npx tsc --noEmit -p tsconfig.scripts.json` (if created)
3. `npx tsc --noEmit -p convex/tsconfig.json`
4. `npx convex typecheck`
5. `npm run build`
6. `npx tsc --noEmit -p tsconfig.legacy-scripts.json` (if created)

---

## REQUIRED FINAL REPORT

Return with exact headings:

### 1. FILES MODIFIED
List every file modified with a brief description.

### 2. EXACT ROOT INCLUDE LIST
The complete include list for tsconfig.json.

### 3. EXACT ACTIVE TOOLING INCLUDE LIST
The complete include list for tsconfig.scripts.json (if created).

### 4. LEGACY OR EXPERIMENTAL OWNERSHIP DECISIONS
What was decided and why.

### 5. BEFORE-AND-AFTER DIAGNOSTIC TABLE
Exact counts before and after fixes.

### 6. EXPLANATION FOR EVERY ACTIVE-SOURCE FIX
For each fixed file: the exact error, root cause (with evidence), fix applied, why it preserves runtime behavior.

### 7. EVERY VALIDATION COMMAND AS SEPARATE EVIDENCE
Each Scope E command with full report.

### 8. REMAINING FAILURES
Any remaining diagnostics without hiding them.

### 9. GIT STATUS AFTER IMPLEMENTATION
Run: `git status --short`
Report exact output.

### 10. CONFIRMATION OF NO CONVEX/ENVIRONMENT CHANGES
Confirm: NO Convex target was changed, NO database modified, NO deployment executed, NO .env.local modified, NO .env.production modified, NO environment variables changed, NO secrets exposed.

## FINAL VERDICT LABELS
ACTIVE APPLICATION TYPE CHECK: PASS | FAIL
ACTIVE TOOLING TYPE CHECK: PASS | FAIL
CONVEX TYPE CHECK: PASS | FAIL
LEGACY/EXPERIMENTAL SCRIPTS: PASS | FAIL | OUTSIDE ACTIVE VALIDATION

Final verdict:
TYPESCRIPT BOUNDARIES COMPLETE — READY FOR NEXT VERIFICATION MISSION
or
PARTIAL — CORRECTIONS REQUIRED
