# OPENCODE DELEGATION: Complete Verification Mission

## STATUS: PARTIAL — CORRECTIONS REQUIRED

## HERMES COORDINATOR ROLE
- Define acceptance criteria
- Review evidence
- Send corrections back to OpenCode
- Report results and blockers

## OPENCODE RESPONSIBILITIES (YOU OWN THESE)
- Repository inspection
- Implementation
- Test execution
- Browser and Playwright execution
- Convex commands
- Android build execution
- Evidence collection
- Cleanup of temporary test data and test-only code

## COORDINATION RULE
Hermes will review your evidence and send corrections. You must implement corrections until every acceptance criterion passes or a genuine blocker is established.

---

## MISSION: Complete All Verification Tasks

### ACCEPTED AS COMPLETE (Do not re-verify)
- ✅ Shared canonical exercise helper created
- ✅ Shared trainer-assignment helper created
- ✅ Production mutations call those helpers
- ✅ Internal test harness calls the same helpers
- ✅ Convex typecheck passes
- ✅ Production build passes
- ✅ Browser bundle uses `https://upbeat-chickadee-781.convex.cloud`
- ✅ Obsolete `groovy-pig-414` URL is absent from active browser assets

---

## TASKS TO COMPLETE

### 1. Execute the Corrected Canonical Duplicate Test

**Run:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx convex run test_internal_harness:testCanonicalDuplicateWithSharedHelper '{"testNameMarker": "canonical_dup_test_final"}'
```

**Required evidence to return:**
- Initial exercise count
- Normalized test `libraryId`
- First helper result (exercise ID)
- Second helper result or exact thrown error
- Number of matching records after the second call
- Cleanup result
- Final exercise count

**Acceptance criteria:**
- ✅ First creation succeeds
- ✅ Second creation with the same normalized identifier fails
- ✅ Exactly one matching record exists before cleanup
- ✅ Final exercise count returns to the initial count

---

### 2. Execute the Corrected Assignment Idempotency Test

**Run:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx convex run test_internal_harness:testTrainerAssignmentIdempotency
```

**Required evidence to return:**
- Initial trainer, exercise, and assignment counts
- First assignment result (status, ID)
- Second assignment result (status, ID)
- Assignment IDs from both calls (must be identical)
- Persisted video URL after the second call
- Number of matching trainer/exercise rows (must be 1)
- Cleanup result
- Final counts (must equal initial)

**Acceptance criteria:**
- ✅ First call returns `created`
- ✅ Second call returns `updated`
- ✅ Both calls return the same assignment ID
- ✅ Exactly one trainer/exercise relationship exists
- ✅ Updated values persist
- ✅ All temporary records are removed afterward

---

### 3. Complete Authorization Audit and Tests

**Audit these public mutations:**
- `trainers.createTrainer`
- `exercises.createDraftExercise`
- `exercises.publishExercise`
- `trainerExercises.assignExerciseToTrainer`

**For each mutation, execute or otherwise reliably validate:**
1. Unauthenticated with secret omitted → MUST reject
2. Unauthenticated with empty secret → MUST reject
3. Unauthenticated with incorrect secret → MUST reject
4. Unauthenticated with correct secret → MUST permit (for admin operations)
5. Authenticated authorized trainer without secret → MUST permit (when allowed)
6. Authenticated unauthorized user → MUST reject

**Implementation options:**
- Create internal test functions that invoke public mutations with different auth contexts
- Use internal mutations to simulate auth states
- Analyze the actual authorization code and document the behavior

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

**Verify:**
1. The installed `@convex-dev/auth` configuration loads successfully
2. The key is in the expected format
3. Signup or account creation works
4. Sign-in works
5. Authenticated identity reaches a protected Convex function
6. Session persistence works across reload when intended
7. Sign-out clears the authenticated state

**Use a temporary test account and remove it afterward when practical.**

**Implementation options:**
- Create a test using Playwright that exercises the auth flow
- Use the browser automation tools to test signup, sign-in, sign-out
- Check the `convex/_generated/auth.d.ts` for auth configuration
- Inspect `convex/auth.ts` or equivalent auth setup file

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

**Execute:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx convex run test_internal_harness:testVideoUrlValidation
```

**Verify:** The test invokes the same validator used by `assignExerciseToTrainerHelper`.

**Return every test case with:**
- Input URL
- Expected result
- Actual result
- Actual error message (if any)
- Pass or fail
- Summary: valid passed/failed, invalid passed/failed

**After validation:**
1. Remove any public video diagnostic mutation
2. Remove temporary deployed test APIs (unless intentionally retained)
3. Run `npx convex codegen`
4. Verify test-only public exports are absent from `convex/_generated/api.d.ts`

**Check `convex/_generated/api.d.ts` for:**
```typescript
// Should NOT contain:
export const testVideoUrlValidation: FunctionReference<...>;

// Should only contain internal mutations (if any):
export const test_internal_harness: { ... }
```

---

### 6. Provide TypeScript Evidence by Scope

**Run these commands in sequence and report each:**

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
# Check if server/ directory exists
ls -la server/ 2>/dev/null || echo "No separate server directory"
# If exists, typecheck it
npx tsc --noEmit server/*.ts 2>/dev/null || echo "N/A"
```
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
# Check which scripts are failing
npx tsc --noEmit scripts/**/*.cjs 2>&1 | head -50

# Check if failing scripts are used in package.json
cat package.json | grep -E "backfillExerciseUsage|collectExerciseImages|collectVideoUrls|convexAdminClient"
```
Report:
- Command
- Remaining diagnostic count
- Which scripts are failing
- Whether any failing script is referenced by `package.json` scripts

### Experimental tools
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
ls -la | grep -E "experimental|exp"
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
1. Frontend query arguments use `bodyRegion` (or confirm it's used as `category`)
2. No obsolete `muscleGroup` or `muscle` in active frontend query arguments
3. Backend validators match what frontend sends
4. Exercise Library filtering works

**Use temporary records when needed:**
- Create 1-2 exercises with different `bodyRegion` values
- Test filtering in UI
- Clean up afterward

**Run Playwright:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
# Create test file if it doesn't exist
cat > tests/verify-bodyRegion.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('bodyRegion filtering', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Screenshot unfiltered state
  await page.screenshot({ path: 'test-screenshots/bodyRegion-unfiltered.png' });
  
  // Select body-region filter (adjust selector based on actual UI)
  // await page.click('[data-testid="filter-button"]');
  // await page.click('text=Chest');
  
  // Screenshot filtered state
  // await page.screenshot({ path: 'test-screenshots/bodyRegion-filtered.png' });
  
  // Check console for errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Check network for query arguments
  // page.waitForResponse(response => response.url().includes('listExercisesForTrainer'));
});
EOF

npx playwright test tests/verify-bodyRegion.spec.ts --project=chromium
```

**Capture:**
- Unfiltered results screenshot
- Selected body-region filter screenshot
- Filtered results screenshot
- Console errors (if any)
- Failed requests (if any)
- Network evidence showing query arguments

**Clean up temporary records afterward.**

**Send screenshots to Hermes for auxiliary vision analysis.**

**Report format:**
```
Frontend usage traced:
  - bodyRegion: [list of files and uses]
  - muscleGroup: [list of files - should be empty in queries]
  - muscle: [list of files - should be empty in queries]

Backend validator verification:
  - [convex/trainerExercises.ts] query args include bodyRegion: [YES/NO]
  - [convex/_generated/api.d.ts] exports correct query: [YES/NO]

Playwright test:
  - Unfiltered: [screenshot path, result]
  - Filter applied: [screenshot path, filter value]
  - Filtered results: [screenshot path, result]
  - Console errors: [none or details]
  - Network evidence: [query args observed]

Temporary records: [created/cleaned up]
```

---

### 8. Complete Android Debug Build

**Run Capacitor and Gradle workflow:**

```bash
cd C:/Users/thebe/Downloads/Body-Bridge

# 1. Web build
npm run build

# 2. Capacitor sync
npx cap sync android

# 3. Gradle debug build
cd android
./gradlew assembleDebug
cd ..
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

# List APK contents
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep -E "\.js|\.html"

# Extract JS content for verification
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

1. Remove temporary records:
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx convex run test_internal_harness:getDatabaseCounts
# If counts are not 0, 0, 0, manually clean up any remaining test data
```

2. Remove temporary test accounts (if any created)

3. Remove or archive temporary deployed test harnesses:
```bash
# Archive the test harness file
mv convex/test_internal_harness.ts convex/test_internal_harness.ts.archive
# Or delete if no longer needed
# rm convex/test_internal_harness.ts

# Regenerate APIs to remove internal exports
npx convex codegen
```

4. Remove public diagnostic mutations (if any exist)

5. Run final verification sequence:

```bash
cd C:/Users/thebe/Downloads/Body-Bridge

# 1. Regenerate APIs
npx convex codegen

# 2. Convex typecheck
npx convex typecheck

# 3. Frontend/server validation
npx tsc --noEmit -p tsconfig.json

# 4. Playwright
npx playwright test

# 5. Production build
export VITE_CONVEX_URL=https://upbeat-chickadee-781.convex.cloud
npm run build

# 6. Android build
npx cap sync android
cd android && ./gradlew assembleDebug && cd ..

# 7. Verify deployment target
npx convex dev --once

# 8. Final database counts
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

## FINAL REPORT FORMAT

After completing all tasks, return:

```text
OPENCODE FINAL VERIFICATION REPORT

TASKS COMPLETED:
1. Canonical Duplicate Test: [PASS/FAIL]
   [Full evidence]

2. Assignment Idempotency Test: [PASS/FAIL]
   [Full evidence]

3. Authorization Audit: [PASS/FAIL]
   [Full evidence for each mutation]

4. Convex Auth End to End: [PASS/FAIL/BLOCKED]
   [Full evidence]

5. Video Validator Evidence: [PRESERVED/REMOVED]
   [Full evidence]
   [Test-only public exports: present/absent]

6. TypeScript Evidence by Scope:
   - Frontend: [PASS/FAIL]
   - Express/server: [PASS/FAIL/N/A]
   - Convex: [PASS/FAIL]
   - Playwright: [PASS/FAIL]
   - Production build: [PASS/FAIL]
   - Utility scripts: [status, referenced by package.json: yes/no]
   - Experimental tools: [status, used in active code: yes/no]

7. Frontend bodyRegion Verification: [PASS/FAIL]
   [Full evidence]
   [Screenshots for Hermes auxiliary vision]

8. Android Debug Build: [PASS/FAIL/BLOCKED]
   [Full evidence]

9. Final Cleanup and Deployment Verification: [PASS/FAIL]
   [Full evidence]

DEPLOYMENT TARGET VERIFIED:
- Team: thebest-croc
- Deployment: dev/thebest-croc
- URL: https://upbeat-chickadee-781.convex.cloud

FINAL DATABASE COUNTS:
- exercises: 0
- trainers: 0
- trainerExercises: 0

CONFORMATIONS:
- No Notion import: [yes/no]
- No production deployment: [yes/no]
- No seed or migration: [yes/no]
- Old local Convex untouched: [yes/no]
- No secret value exposed: [yes/no]

FINAL VERDICT:
[READY FOR SINGLE-RECORD END-TO-END TEST / BLOCKED with exact reason]
```

---

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

If any task is blocked, report the exact blocker and continue with unblocked tasks.

Hermes will review your evidence and may request corrections. Implement all corrections until every acceptance criterion passes.