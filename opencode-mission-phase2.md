# OPENCODE MISSION: Complete Verification - Phase 2

## STATUS: PARTIAL — CORRECTIONS REQUIRED

## DEPLOYMENT TARGET
- Team: `thebest-croc`
- Project: `body-bridge-fitness`
- Development: `dev/thebest-croc`
- Deployment name: `upbeat-chickadee-781`
- URL: `https://upbeat-chickadee-781.convex.cloud`
- Repository: `C:\Users\thebe\Downloads\Body-Bridge`

---

## 1. REPLACE FLAWED DUPLICATE TEST ARCHITECTURE

### Current Problem
Internal test harness uses `ctx.db.insert()` which bypasses mutation logic.

### Solution: Extract Shared Helpers

#### A. Canonical Exercise Helper

Extract canonical creation transaction from `createDraftExercise` into a shared server-only helper.

**Helper requirements:**
1. Accept `MutationCtx` and validated arguments
2. Normalize `libraryId`
3. Reject empty normalized identifier
4. Query `by_libraryId`
5. Throw when existing record found
6. Insert only when absent
7. Return created record ID

**Public mutation must:**
1. Perform its existing authorization
2. Call the shared helper

**Internal test mutation must:**
1. Call the same helper (NOT duplicate logic)

#### B. Assignment Helper

Extract assignment creation/update behavior into shared server-only helper.

**Helper requirements:**
1. Query `by_trainer_exercise`
2. When assignment exists:
   - Patch that exact row
   - Reactivate if needed
   - Return same ID with status `updated`
3. Otherwise:
   - Insert one row
   - Return status `created`

**Public mutation:**
1. Perform authorization
2. Call helper

**Internal test:**
1. Call same helper

---

## 2. EXECUTE VALID CANONICAL DUPLICATE TEST

Using the shared helper:

1. Record initial count
2. Create one temporary draft exercise via helper
3. Call same helper again with input normalizing to same `libraryId`
4. Verify second call throws intended duplicate error
5. Query `by_libraryId`
6. Verify exactly ONE record exists
7. Clean up
8. Verify count returns to initial state

**Return:**
- Normalized ID
- First result
- Exact second-call error
- Matching record count
- Final count

---

## 3. EXECUTE VALID ASSIGNMENT IDEMPOTENCY TEST

Using shared assignment helper:

1. Create temporary trainer and exercise fixtures
2. Call assignment once
3. Call assignment again for same pair with changed safe test metadata
4. Verify:
   - First status is `created`
   - Second status is `updated`
   - Both results return same assignment ID
   - Exactly one row exists
   - Updated values were persisted
5. Clean up all fixtures
6. Verify counts return to initial state

**Document:** Behavior as idempotent update-or-insert, NOT duplicate rejection.

---

## 4. COMPLETE AUTHORIZATION AUDIT

Audit every mutation in single-record workflow:
- `trainers.createTrainer`
- `exercises.createDraftExercise`
- `exercises.publishExercise`
- `trainerExercises.assignExerciseToTrainer`

**For each mutation, report exact authorization paths.**

**Test cases:**
- Unauthenticated, secret omitted
- Unauthenticated, empty secret
- Unauthenticated, incorrect secret
- Unauthenticated, correct secret
- Authenticated authorized trainer without secret
- Authenticated unauthorized user

**Required rule:**
`adminSecret` may be optional as argument ONLY when another legitimate authenticated authorization path exists.

**Omitting the secret must NEVER authorize an unauthenticated caller.**

**Do not expose the configured secret.**

**If secure string comparison available, use it. Otherwise document current comparison and residual risk.**

---

## 5. VERIFY CONVEX AUTH CONFIGURATION

**Do NOT treat environment-variable presence as proof of valid authentication.**

**Inspect:**
- Exact installed `@convex-dev/auth` version
- Project setup requirements
- Required variables and formats from package documentation

**Verify:**
- `JWT_PRIVATE_KEY` has expected key format
- Any required public-key or JWKS variable is configured
- No placeholder value is used
- Signup/sign-in works
- Session can be established
- Authenticated identity reaches Convex functions
- Sign-out invalidates/clears session

**Do NOT print key material.**

**If current value is placeholder, replace it through package-supported secure generation procedure.**

---

## 6. PRESERVE PASSING VIDEO TESTS, REMOVE TEST-ONLY API

The 19-case URL matrix reportedly passed.

**Return:**
- Actual executed output OR structured results
- Verify tested code is same helper used by assignment mutations

**After validation:**
- Remove any public test mutation
- Remove or archive temporary test-only deployed functions
- Retain normal non-deployed test file when practical

**Regenerate Convex API and prove test-only public exports are absent.**

---

## 7. COMPLETE TYPESCRIPT EVIDENCE BY SCOPE

### Frontend
- Exact command
- Exact tsconfig
- Included paths
- Result

### Express/server
- Exact command
- Exact tsconfig
- Included paths
- Result

### Convex
- codegen command
- Convex compilation/typecheck command
- Result

### Playwright
- Command
- Configuration
- Result

### Production build
- Command
- Environment supplied
- Result

### Utility scripts and tools
- Diagnostic count
- Whether any failing file is called by active package scripts
- Accurate classification

**Do NOT label `npx convex typecheck` as frontend validation.**

---

## 8. COMPLETE FRONTEND BODYREGION VALIDATION

Backend-only inspection is insufficient.

**Trace active frontend calls and verify:**
- Arguments use `bodyRegion`
- Obsolete `muscleGroup` is NOT sent
- Obsolete `muscle` is NOT sent
- Exercise Library filter maps UI selection to `bodyRegion`
- Filtering produces expected result

**Use temporary test fixtures if necessary.**

**Run Playwright and capture:**
- Unfiltered state
- Selected body-region filter
- Filtered results
- Network or function argument evidence
- Console status

**Clean up temporary fixtures afterward.**

**Return screenshots to Hermes auxiliary vision.**

---

## 9. COMPLETE ANDROID DEBUG BUILD

Run established Capacitor and Gradle workflow.

**Verify:**
- Debug APK is produced
- Report exact APK path
- Packaged assets contain `upbeat-chickadee-781`
- Packaged assets do NOT contain:
  - `groovy-pig-414`
  - `127.0.0.1:3210`
  - `10.0.0.112:3210`

**Do NOT treat source assets or Gradle cache alone as APK verification.**

---

## 10. FINAL CLEANUP

After all tests:

1. Remove temporary records
2. Remove temporary deployed test harness functions
3. Remove public diagnostic mutations
4. Regenerate Convex APIs
5. Run Convex typecheck
6. Run frontend/server validation
7. Run Playwright
8. Run production build
9. Run `npx convex dev --once`

**Verify target:**
- `dev/thebest-croc`
- `https://upbeat-chickadee-781.convex.cloud`

**Final counts:**
- exercises: 0
- trainers: 0
- trainerExercises: 0

**Confirm:**
- No Notion import
- No production deployment
- No seed or migration
- Old local database untouched
- No secret values exposed

---

## CONSTRAINTS

- Do NOT modify production
- Do NOT expose secrets
- Do NOT delete unrelated data
- Do NOT commit/push/PR unless explicitly authorized
- Do NOT exceed authorized scope
- Do NOT ask for routine approval