# OpenCode Delegation — TypeScript Diagnostics FIX (Continuation)

REPOSITORY: C:\Users\thebe\Downloads\Body-Bridge

PROHIBITED: Do NOT modify .env.local, .env.production, deployment commands, commit, push, or use @ts-ignore/any without technical justification.

## PRE-GATHERED EVIDENCE (from Hermes investigation)

@types/react and @types/react-dom have already been installed. ErrorBoundary errors (4) are now GONE. LoadingSkeleton (1) is STILL failing — investigate why.

### Remaining 28 active diagnostics (grouped by root cause):

**GROUP 1 — CommunityView.tsx (10 errors: lines 760,761,803,803,808,808,814,814,816,816)**
- Root cause: Uses `Id<"posts">` and `Id<"comments">` but Convex schema defines `socialPosts` and `socialComments`
- Evidence: grep convex/schema.ts shows `socialPosts: defineTable(...)` and `socialComments: defineTable(...)`
- Fix: Replace ALL `Id<"posts">` → `Id<"socialPosts">` and `Id<"comments">` → `Id<"socialComments">` in CommunityView.tsx
- The file already imports `Id` from `@convex/_generated/dataModel` — just change the type parameter strings

**GROUP 2 — WorkoutsView.tsx (2 errors: lines 74,139)**
- Line 74: Cannot find name 'Id' — missing import
- Line 139: Property 'bodyRegion' missing — the code maps to `muscleGroup` but Exercise type expects `bodyRegion`
- Fix line 74: Add `import { Id } from '@convex/_generated/dataModel'` (same as CommunityView)
- Fix line 139: Change `muscleGroup:` to `bodyRegion:` in the mapped object (Exercise type uses bodyRegion not muscleGroup)

**GROUP 3 — sanitize.ts (1 error: line 9)**
- Root cause: `uponSanitizeAttribute` is a HOOK NAME (used with `addHook()`), NOT a Config property
- DOMPurify 3.4.9 Config interface does NOT have `uponSanitizeAttribute`
- Fix: Use `DOMPurify.addHook('uponSanitizeAttribute', callback)` BEFORE calling `sanitize()`, or restructure
- The callback should be: `(node: any, data: { attrName: string; attrValue: string }) => {}`

**GROUP 4 — UnifiedNavMenu.tsx (1 error: line 152)**
- Root cause: `CheckCircle` is not imported from lucide-react
- Fix: Add CheckCircle to the lucide-react import (currently line 2)

**GROUP 5 — Calendar/index.tsx (1 error: line 62)**
- Root cause: PlanItem type requires `id` field but the data from useQuery has `_id` from userPlans table
- Evidence: PlanItem interface in src/types.ts has `id: string` but Convex userPlans table has `_id`
- Fix: Map `_id` to `id` when passing to `generateCalendarEvents()`, or update PlanItem to use `_id` as `id`

**GROUP 6 — ExercisesView.tsx (1 error: line 205)**
- Root cause: Property 'id' does not exist on type 'unknown' — type narrowing issue
- The line is: `(ex as any).exercises.find((e: any) => e.id === ...)`
- Fix: Use `(ex as any).id` or add proper type assertion. The `ex` variable is typed as `unknown`

**GROUP 7 — convex.config.ts (1 error: line 1)**
- Root cause: `defineConvexConfig` does NOT exist in convex 1.42.1. The function is `defineApp` from `convex/server`
- Evidence: grep shows convex/dist/cjs-types/server/index.d.ts exports `defineApp, defineComponent, ...` but NOT `defineConvexConfig`
- Fix: Replace `import { defineConvexConfig } from "convex"` with `import { defineApp } from "convex/server"` and update the default export to use `defineApp({ ... })` instead of `defineConvexConfig({ ... })`. Research the correct convex 1.42.1 API for this.

**GROUP 8 — test/imageResolver paths (2 errors)**
- tests/evidence/imageResolver-program-titles-test.ts:1 — imports `../../utils/imageResolver`
- tests/imageResolver-test.ts:1 — imports `../utils/imageResolver`
- But src/utils/imageResolver.ts EXISTS
- Fix for tests/evidence/imageResolver-program-titles-test.ts: change `../../utils/imageResolver` to `../../src/utils/imageResolver`
- Fix for tests/imageResolver-test.ts: change `../utils/imageResolver` to `../../src/utils/imageResolver`

**GROUP 9 — Newly revealed errors (9) — fix these too:**

1. `src/components/players/UserPacedPlayer.tsx(74)` — 'source' property doesn't exist on video element props. The prop is likely `src` not `source`
2. `src/components/PremiumExerciseCard.tsx(152)` — MouseEvent type mismatch. The component expects MouseEvent<HTMLDivElement> but receives MouseEvent<HTMLButtonElement>
3. `src/components/PremiumExerciseCard.tsx(176)` and `src/components/PremiumExerciseCard.tsx(452)` — Animation `type: string` not assignable to `AnimationGeneratorType`. Use `as const` or cast
4. `src/components/TabBar.tsx(30)` — 'size' prop doesn't exist on MotionProps. Check if `size` should be passed differently
5. `src/components/TrainingArchitect.tsx(122)` — WorkoutExercise[] missing `muscleGroup` property needed by the assigned-to type
6. `src/screens/ExerciseDetail.tsx(435)` — 'source' prop doesn't exist (same as UserPacedPlayer — use `src` not `source` for video)
7. `src/screens/HomeView.tsx(254)` — TimelineEvent[] type mismatch. The mapped data uses `id` instead of required fields
8. `src/screens/SettingsView.tsx(353)` — Spread types error. Something is spreading a non-object type
9. `src/screens/WorkoutDetail.tsx(160)` — Property 'notes' does not exist on type 'Exercise'. Check if this is the wrong type or wrong property access

## IMPLEMENTATION STEPS

1. Fix Group 1 (CommunityView) — table name corrections
2. Fix Group 2 (WorkoutsView) — Id import + bodyRegion
3. Fix Group 3 (sanitize) — addHook approach
4. Fix Group 4 (UnifiedNavMenu) — CheckCircle import
5. Fix Group 5 (Calendar) — _id to id mapping
6. Fix Group 6 (ExercisesView) — type narrowing
7. Fix Group 7 (convex.config.ts) — replace defineConvexConfig with correct convex API
8. Fix Group 8 (test paths) — correct imageResolver import paths
9. Investigate and fix Group 9 (all 9 newly revealed errors)

After all fixes:
- Run `npx tsc --noEmit -p tsconfig.json` and verify errors
- Count remaining diagnostics (target: 0)
- Run Scope E commands:
  1. `npx tsc --noEmit -p tsconfig.json` (report exit code, count)
  2. `npx tsc --noEmit -p tsconfig.scripts.json` (should still pass with 0)
  3. `npx tsc --noEmit -p convex/tsconfig.json` (report)
  4. `npx convex typecheck` (report)
  5. `npm run build` (report exit code, any errors)
  6. Legacy scripts (OUTSIDE ACTIVE VALIDATION)

## FINAL REPORT
Return the 10 required sections from the delegation file.

FINAL VERDICT LABELS:
ACTIVE APPLICATION TYPE CHECK: PASS | FAIL
ACTIVE TOOLING TYPE CHECK: PASS | FAIL
CONVEX TYPE CHECK: PASS | FAIL
LEGACY/EXPERIMENTAL SCRIPTS: OUTSIDE ACTIVE VALIDATION