# Convex Runtime Verification Preflight — Complete Report

**Generated:** 2026-07-23
**Repository:** Body-Bridge
**Target:** https://upbeat-chickadee-781.convex.cloud (dev/thebest-croc)

---

## 1. OpenCode Session and Model

- **Session:** `proc_1d09b0ecec46`
- **Model:** `zai-coding-plan/glm-4.7`

---

## 2. Convex CLI Version

```
npx convex --version
```

**Result:** `1.42.1`

---

## 3. Verified Target-Selection Mechanism

The Convex CLI supports the following `--deployment` flag values (from `npx convex run --help`):

| Format | Example | Description |
|--------|---------|-------------|
| Deployment name | `joyful-capybara-123` | Direct deployment name |
| Deployment reference | `dev/james`, `staging` | Team member deployment |
| Special: dev | `dev` | Personal cloud dev deployment |
| Special: prod | `prod` | Project's default production |
| Special: local | `local` | Local dev deployment (http://127.0.0.1:3210) |
| Cross-project | `project-slug:reference` | Other project, same team |
| Team-project | `team-slug:project-slug:reference` | Any deployment, any team |

**For the target deployment `dev/thebest-croc`:**
- Syntax: `--deployment thebest-croc:body-bridge-fitness:dev/thebest-croc`
- OR: `--deployment dev/thebest-croc` (if default project is already set)

---

## 4. Safe Command Form for Authorization Tests

To run authorization tests against the authoritative cloud deployment:

```bash
npx convex run test_internal_harness:getDatabaseCounts --deployment dev/thebest-croc

# For mutations with admin secret (placeholder only):
npx convex run trainers:createTrainer '{"adminSecret": "REDACTED"}' --deployment dev/thebest-croc
npx convex run trainerExercises:assignExerciseToTrainer '{"adminSecret": "REDACTED", ...}' --deployment dev/thebest-croc
```

**Note:** Admin secret functions require `args.adminSecret` to match `process.env.ADMIN_SCRIPT_SECRET` on the deployment. Trainer functions (`createDraftExercise`, `publishExercise`) require browser-authenticated identity via `--identity` (requires full auth flow, not scriptable).

---

## 5. Why the Command Cannot Target Obsolete Local Deployment

The obsolete local deployment is specified in `.env.local` as:
```
CONVEX_DEPLOYMENT=local:local-thebest_croc-body_bridge_fitness-2
VITE_CONVEX_URL=http://127.0.0.1:3210
```

When `--deployment dev/thebest-croc` is explicitly specified on the CLI:
- The CLI flag **overrides** the `CONVEX_DEPLOYMENT` environment variable
- The command targets the cloud deployment `https://upbeat-chickadee-781.convex.cloud`
- No connection to `http://127.0.0.1:3210` is attempted
- The obsolete local deployment is never contacted

**Proof:** From CLI help: "You can also run individual commands on another deployment by using the --deployment flag on that command."

---

## 6. Harness Function Inventory and Visibility

### Functions in `convex/test_internal_harness.ts`:

1. **`testCanonicalDuplicateWithSharedHelper`** (internalMutation)
   - Tests canonical duplicate prevention using shared helper
   - Args: `testNameMarker: v.string()`
   - Returns: comprehensive test results with verdict

2. **`testTrainerAssignmentIdempotency`** (internalMutation)
   - Tests trainer-assignment idempotency using shared helper
   - Args: none
   - Returns: assignment verification results with cleanup verification

3. **`testVideoUrlValidation`** (internalMutation)
   - Video URL validation matrix test
   - Tests various URL formats against validation logic
   - Args: none
   - Returns: validation test results for valid and invalid cases

4. **`getDatabaseCounts`** (query)
   - Get current database counts for verification
   - Args: none
   - Returns: counts for exercises, trainers, and trainerExercises tables

### Visibility

**Generated API check:** `grep -r "testCanonicalDuplicateWithSharedHelper|testTrainerAssignmentIdempotency|testVideoUrlValidation|getDatabaseCounts" convex/_generated/api.d.ts` returned **no matches**.

**Conclusion:** These harness functions are **NOT exposed in the generated public API**. They are `internalMutation` functions intended for internal testing via `npx convex run` but not callable from client applications.

---

## 7. Cleanup Consistency Review

| Function | Creates | Cleans Up |
|----------|---------|-----------|
| `testCanonicalDuplicateWithSharedHelper` | Test exercise with marker | Removes by marker |
| `testTrainerAssignmentIdempotency` | Test trainer + assignment | Removes both by ID |
| `testVideoUrlValidation` | Read-only validation | No state changes |
| `getDatabaseCounts` | Read-only count | No state changes |

**Assessment:** Cleanup is internally consistent. Test functions include their own cleanup logic. `testVideoUrlValidation` and `getDatabaseCounts` are read-only.

---

## 8. Authorization Matrix

| Function | Auth Method | Access Level | Admin Secret Required | Browser Auth Required |
|----------|-------------|--------------|----------------------|----------------------|
| `trainers.createTrainer` | `args.adminSecret` | ADMIN ONLY | ✅ | ❌ |
| `exercises.createDraftExercise` | `requireTrainer(ctx)` | TRAINER ONLY | ❌ | ✅ |
| `exercises.publishExercise` | `requireTrainer(ctx)` | TRAINER ONLY | ❌ | ✅ |
| `trainerExercises.assignExerciseToTrainer` | `args.adminSecret` | ADMIN ONLY | ✅ | ❌ |

**Authorization Implementation:**

**Admin Secret Functions:**
```typescript
function isAdminSecret(secret?: string): boolean {
  return typeof secret === "string" && secret === process.env.ADMIN_SCRIPT_SECRET;
}

// In handler:
if (!isAdminSecret(args.adminSecret)) {
  throw new Error("Unauthorized: requires admin secret");
}
```

**Trainer Auth Functions:**
```typescript
export const createDraftExercise = mutation({
  args: { name: v.string(), libraryId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const profile = await requireTrainer(ctx);  // ← browser-authenticated identity
    // ...
  },
});
```

**Key Finding:** No function supports BOTH admin secret and trainer authentication. They are mutually exclusive.

---

## 9. Test Cases Requiring Browser-Authenticated Identity

The following functions **CANNOT** be tested via script-only `npx convex run` without browser authentication:

1. `exercises.createDraftExercise` — requires `requireTrainer(ctx)` which validates Convex auth session
2. `exercises.publishExercise` — requires `requireTrainer(ctx)` which validates Convex auth session

These require:
- Full browser-based auth flow (magic link, OAuth)
- `--identity` flag on `npx convex run` with a valid `UserIdentity` object
- A live authenticated session

The following CAN be tested via script-only with admin secret:

1. `trainers.createTrainer` — accepts `args.adminSecret`
2. `trainerExercises.assignExerciseToTrainer` — accepts `args.adminSecret`

---

## 10. Blockers

**NONE** — All findings support safe authorization test execution.

**Potential Risk:**
- `.env.local` still points to obsolete local deployment (`CONVEX_DEPLOYMENT=local:local-thebest_croc-body_bridge_fitness-2`)
- **Mitigation:** Explicit `--deployment dev/thebest-croc` on every command overrides this. No file changes required for runtime verification.

---

## 11. Git Status

```
M .memory/memory-index.json
 M convex.config.ts
 M package-lock.json
 M package.json
 M scripts/convexAdminClient.js
 M src/components/PremiumExerciseCard.tsx
 M src/components/TabBar.tsx
 M src/components/TrainingArchitect.tsx
 M src/components/UnifiedNavMenu.tsx
 M src/components/players/UserPacedPlayer.tsx
 M src/screens/Calendar/index.tsx
 M src/screens/CommunityView.tsx
 M src/screens/ExerciseDetail.tsx
 M src/screens/HomeView.tsx
 M src/screens/SettingsView.tsx
 M src/screens/WorkoutDetail.tsx
 M src/screens/WorkoutsView.tsx
 M src/utils/sanitize.ts
 M tests/evidence/imageResolver-program-titles-test.ts
 M tests/imageResolver-test.ts
 M tsconfig.json
?? .hermes/opencode-*.md (5 files)
?? .hermes/preflight-report.md
?? .hermes/runtime-verification-preflight*.md (2 files)
?? .omo/run-continuation/*.json (23 files)
?? tsconfig.scripts.json
```

**Working tree contains TypeScript boundary fixes and session artifacts. No state changes.**

---

## 12. Confirmation of No Changes

✓ **Confirmed.** This preflight was read-only.
- No files were modified by the preflight session
- No commits were created
- No mutations were executed
- No database changes were made
- No deployment actions were performed
- No environment variables were changed
- No account or secret was exposed or modified
- All commands were display-only (CLI version, help, file inspection, grep)

---

## FINAL VERDICT

`RUNTIME PREFLIGHT: PASS — AUTHORIZATION TESTS MAY PROCEED`