# OPENCODE MISSION: Phase 3 - Complete Verification

## STATUS: PARTIAL — CORRECTIONS REQUIRED

## COMPLETED (Accepted)
- Shared canonical exercise helper created
- Shared trainer-assignment helper created
- Production mutations call those helpers
- Internal test harness calls the same helpers
- Convex typecheck passes
- Production build passes
- Browser bundle uses `https://upbeat-chickadee-781.convex.cloud`
- Obsolete `groovy-pig-414` URL is absent from active browser assets

## REMAINING TASKS

### 1. Execute Corrected Canonical Duplicate Test

Run: `npx convex run test_internal_harness:testCanonicalDuplicateWithSharedHelper '{"testNameMarker": "canonical_dup_test"}'`

**Required evidence:**
- Initial exercise count (before any operations)
- Normalized test `libraryId`
- First helper result (exercise ID)
- Second helper result or exact thrown error message
- Number of matching records after the second call
- Cleanup result (records deleted)
- Final exercise count (should equal initial)

**Acceptance criteria:**
- First creation succeeds
- Second creation with the same normalized identifier throws error
- Exactly one matching record exists before cleanup
- Final exercise count equals initial count

---

### 2. Execute Corrected Assignment Idempotency Test

Run: `npx convex run test_internal_harness:testTrainerAssignmentIdempotency`

**Required evidence:**
- Initial trainer, exercise, and assignment counts
- First assignment result (status, ID)
- Second assignment result (status, ID)
- Assignment IDs from both calls (should be identical)
- Persisted video URL after second call
- Number of matching trainer/exercise rows (must be 1)
- Cleanup result
- Final counts (should equal initial)

**Acceptance criteria:**
- First call returns `created`
- Second call returns `updated`
- Both calls return the same assignment ID
- Exactly one trainer/exercise relationship exists
- Updated video URL persists in the database
- All temporary records are removed

---

### 3. Complete Authorization Audit

Audit these public mutations:

Files to inspect:
- `convex/trainers.ts` - `createTrainer`
- `convex/exercises.ts` - `createDraftExercise`, `publishExercise`
- `convex/trainerExercises.ts` - `assignExerciseToTrainer`

For each mutation, execute validation using internal test or direct invocation:

**Test matrix:**
1. Unauthenticated with secret omitted → MUST reject
2. Unauthenticated with empty secret → MUST reject
3. Unauthenticated with incorrect secret → MUST reject
4. Unauthenticated with correct secret → MUST permit (for admin operations)
5. Authenticated authorized trainer without secret → MUST permit (when allowed)
6. Authenticated unauthorized user → MUST reject

**Critical rule:**
Making `adminSecret` optional in the validator must NOT make authorization optional.

**Do NOT expose the configured secret.**

**Report format for each mutation:**
```
Mutation: [name]
Authorization paths:
  - Admin secret: [present/absent, exact behavior]
  - Authenticated trainer: [present/absent, exact behavior]
  - Other: [describe]

Test results:
  - Unauthenticated no secret: [PASS/FAIL, exact error]
  - Unauthenticated empty secret: [PASS/FAIL, exact error]
  - Unauthenticated wrong secret: [PASS/FAIL, exact error]
  - Unauthenticated correct secret: [PASS/FAIL, result]
  - Auth trainer no secret: [PASS/FAIL, result]
  - Auth unauthorized: [PASS/FAIL, exact error]

Authorization safety: [SAFE/WEAKENED, explanation]
```

---

### 4. Verify Convex Auth End to End

**Do NOT treat JWT_PRIVATE_KEY presence as sufficient evidence.**

Verify the complete authentication flow:

**Required verification:**
1. Installed `@convex-dev/auth` configuration loads successfully
2. Key is in expected format (PEM, JWK, etc.)
3. Signup or account creation works
4. Sign-in works
5. Authenticated identity reaches a protected Convex function
6. Session persistence works across reload (when intended)
7. Sign-out clears authenticated state

**Use a temporary test account and remove it afterward.**

**Capture exact failures without exposing credentials or signing material.**

**Report format:**
```
@convex-dev/auth version: [version number]
Configuration: [where auth config lives, provider setup]
Key format: [verified format]
Key status: [valid placeholder / generated secure key / other]

Flow test results:
  - Signup: [PASS/FAIL, exact error if failed]
  - Sign-in: [PASS/FAIL, exact error if failed]
  - Identity reaches protected function: [PASS/FAIL, evidence]
  - Session persistence: [PASS/FAIL, tested how]
  - Sign-out: [PASS/FAIL, evidence]

Test account: [created / removed]
```

---

### 5. Preserve and Finalize Video Validator Evidence

Execute: `npx convex run test_internal_harness:testVideoUrlValidation`

**Required evidence:**
- Every test case with:
  - Input URL
  - Expected result
  - Actual result
  - Actual error message (if any)
  - Pass or fail
- Summary: valid passed/failed, invalid passed/failed

**Verify:** The test invokes the same validator used by `assignExerciseToTrainerHelper`.

**After validation:**
1. Remove any public video diagnostic mutation
2. Remove temporary deployed test APIs (unless intentionally retained)
3. Run `npx convex codegen`
4. Verify test-only public exports are absent from `convex/_generated/api.d.ts`

---

### 6. Provide TypeScript Evidence by Scope

**Run these commands in sequence:**

### Frontend
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx tsc --noEmit -p tsconfig.json
```
Report:
- Command
- tsconfig.json contents (paths, compiler options)
- Included directories
- Result (PASS/FAIL, exact errors if any)

### Express/server
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx tsc --noEmit server/*.ts
```
Or identify server tsconfig if it exists.
Report:
- Command
- tsconfig (or confirm using tsconfig.json)
- Included directories
- Result

### Convex
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx convex codegen
npx convex typecheck
```
Report:
- codegen command output
- typecheck command output
- Result

### Playwright
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx playwright test
```
Report:
- Command
- Playwright config location
- Test result (PASS/FAIL, which tests failed)

### Production build
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
export VITE_CONVEX_URL=https://upbeat-chickadee-781.convex.cloud
npm run build
```
Report:
- Command with explicit VITE_CONVEX_URL
- Build result
- Bundle verification (grep results)

### Utility scripts
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx tsc --noEmit scripts/**/*.cjs scripts/*.js 2>&1 | head -50
```
Report:
- Command
- Remaining diagnostic count
- Which scripts are failing
- Whether any failing script is referenced by `package.json` scripts

### Experimental tools
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
grep -r "experimental" package.json scripts/ 2>/dev/null | head -20
```
Report:
- Status of experimental directories
- Whether any are used in:
  - development (package.json scripts)
  - deployment
  - migration scripts
  - imports in main code

**Do NOT describe repository-wide TypeScript as clean while known directories still fail.**

---

### 7. Complete Frontend bodyRegion Verification

**Trace active frontend use:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
grep -r "bodyRegion\|muscleGroup\|muscle" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Verify:**
1. Frontend query arguments use `bodyRegion`
2. No obsolete `muscleGroup` or `muscle` in active frontend code
3. Backend validators match (`convex/exercises.ts` query args)
4. Exercise Library filtering works

**Use temporary records when needed:**
- Create 1-2 exercises with different `bodyRegion` values
- Test filtering in UI
- Clean up afterward

**Run Playwright:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx playwright test tests/verify-bodyRegion.spec.ts --project=chromium
```

**Capture screenshots:**
- Unfiltered results
- Selected body-region filter
- Filtered results
- Console errors (if any)
- Failed requests (if any)
- Network evidence showing query arguments

**Send screenshots to Hermes auxiliary vision for verdict.**

**Report format:**
```
Frontend usage traced:
  - bodyRegion: [list of files and uses]
  - muscleGroup: [list of files - should be empty]
  - muscle: [list of files - should be empty]

Backend validator verification:
  - [convex/exercises.ts] query args include bodyRegion: [YES/NO]
  - [convex/_generated/api.d.ts] exports correct query: [YES/NO]

Playwright test:
  - Unfiltered: [screenshot path, result]
  - Filter applied: [screenshot path, filter value]
  - Filtered results: [screenshot path, result]
  - Console errors: [none or details]
  - Network evidence: [query args observed]

Hermes auxiliary vision verdict: [PASS/FAIL/INCONCLUSIVE]

Temporary records: [created/cleaned up]
```

---

### 8. Complete Android Debug Build

**Run Capacitor and Gradle workflow:**

```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

**Required evidence:**
- Web build result
- Capacitor sync result
- Gradle debug build result
- APK exact path (usually `android/app/build/outputs/apk/debug/app-debug.apk`)
- Packaged asset inspection

**Verify APK contents:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep -E "\.js|\.html"
```

Then inspect relevant JS files:
```bash
unzip -p android/app/build/outputs/apk/debug/app-debug.apk assets/public/index.html > /tmp/apk-index.html
# Extract and inspect JS bundles
```

**Search for URLs:**
```bash
# Extract JS content to temp file
unzip -p android/app/build/outputs/apk/debug/app-debug.apk assets/public/assets/*.js > /tmp/apk-js.txt

# Verify correct URL
grep -c "upbeat-chickadee-781" /tmp/apk-js.txt

# Verify NO old URLs
grep -c "groovy-pig-414" /tmp/apk-js.txt  # Should be 0
grep -c "127.0.0.1:3210" /tmp/apk-js.txt  # Should be 0
grep -c "10.0.0.112:3210" /tmp/apk-js.txt  # Should be 0
```

**Do NOT use stale Gradle cache files as proof of APK contents.**

**Report format:**
```
Web build: [PASS/FAIL]
Capacitor sync: [PASS/FAIL]
Gradle build: [PASS/FAIL]
APK path: [exact path]

APK URL verification:
  - upbeat-chickadee-781: [count] ✓
  - groovy-pig-414: [count] ✓ (must be 0)
  - 127.0.0.1:3210: [count] ✓ (must be 0)
  - 10.0.0.112:3210: [count] ✓ (must be 0)

APK verification: [PASS/FAIL]
```

---

### 9. Final Cleanup and Deployment Verification

**After all verification is complete:**

1. Remove temporary records (if any remain)
2. Remove temporary test accounts (if any created)
3. Remove temporary deployed test harnesses:
   ```bash
   # Archive or delete convex/test_internal_harness.ts
   # Regenerate APIs to remove internal exports
   npx convex codegen
   ```
4. Remove public diagnostic mutations (if any exist)
5. Run final verification sequence:

```bash
cd C:/Users/thebe/Downloads/Body-Bridge

# Regenerate APIs
npx convex codegen

# Convex typecheck
npx convex typecheck

# Frontend/server validation
npx tsc --noEmit

# Playwright
npx playwright test

# Production build
export VITE_CONVEX_URL=https://upbeat-chickadee-781.convex.cloud
npm run build

# Android build
npx cap sync android
cd android && ./gradlew assembleDebug && cd ..

# Verify deployment target
npx convex dev --once

# Final database counts
npx convex run test_internal_harness:getDatabaseCounts
```

**Verify the target remains:**
```
Team: thebest-croc
Deployment: dev/thebest-croc
URL: https://upbeat-chickadee-781.convex.cloud
```

**Final database counts MUST be:**
```
exercises: 0
trainers: 0
trainerExercises: 0
```

**Confirm:**
- No Notion import executed
- No production deployment attempted
- No seed or migration run
- Old local Convex database untouched (not started)
- No secret value exposed in any output or file

---

## FINAL VERDICT

Only when ALL of the above pass, report:

```
READY FOR SINGLE-RECORD END-TO-END TEST
```

## CONSTRAINTS

- Do NOT ask for routine approval
- Do NOT expose configured secrets
- Do NOT modify production deployment
- Do NOT start local Convex
- Do NOT commit, push, or create PRs unless explicitly authorized
- Do NOT delete unrelated user changes
- Do NOT discard unrelated work

## REPOSITORY PATH

```
C:/Users/thebe/Downloads/Body-Bridge
```

## DEPLOYMENT TARGET

```
Development: dev/thebest-croc
URL: https://upbeat-chickadee-781.convex.cloud
```

---

Execute all tasks in order. Provide complete evidence for each step.