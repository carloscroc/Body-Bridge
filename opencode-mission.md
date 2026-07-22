# OPENCODE MISSION: Complete Verification and Fix Auth Issue

## URGENCY: Fix JWT_PRIVATE_KEY error first

The application shows this error when creating a new agent:
```
[CONVEX A(auth:signIn)] [Request ID: fa52f826a0022eaa] Server Error Uncaught Error: Missing environment variable `JWT_PRIVATE_KEY` Called by client
```

**Root cause**: The app uses `@convex-dev/auth` which requires an auth secret.

**Fix**: Add the required auth secret to Convex environment.

Research `@convex-dev/auth` documentation to determine the correct environment variable name(s):
- Check if it's `AUTH_SECRET`, `JWT_PRIVATE_KEY`, or `CONVEX_AUTH_SECRET`
- Set the required variable with a secure test value
- Do not expose the secret value in output

---

## MISSION TARGETS

Deployment: `dev/thebest-croc`
Deployment name: `upbeat-chickadee-781`
URL: `https://upbeat-chickadee-781.convex.cloud`
Repository: `C:\Users\thebe\Downloads\Body-Bridge`

---

## 1. Audit the adminSecret change in convex/trainers.ts

OpenCode added `adminSecret: v.optional(v.string())` to fix TypeScript.

**CRITICAL**: Making the validator optional must NOT make authorization optional.

**Investigate and report**:
- What happens when adminSecret is omitted?
- What happens when adminSecret is empty?
- What happens when adminSecret is incorrect?
- What happens when adminSecret is correct?
- What happens when authenticated trainer calls without secret?
- What happens when authenticated non-admin calls it?

**Required rule**: Unauthenticated caller with no valid secret must be rejected.

**Fix if needed**:
- If secret is required for all callers: Make API contract honest (required, not optional)
- Add authorization tests covering all cases above
- Ensure ONE clearly defined authorization path: valid authenticated role OR valid server-side admin secret

---

## 2. Execute tests WITHOUT weakening production auth

Authentication is a real requirement but should not block safe backend verification.

**Preferred: Internal test harness**
Create temporary internalMutation or test functions that:
- Insert isolated test fixtures directly
- Invoke/reproduce same domain logic
- Verify duplicate behavior
- Clean up all temporary records
- Must NOT be publicly callable

Remove test functions after verification unless permanent.

**Alternative: Authenticated test session**
Use actual auth flow to create authorized test identity.

**Alternative: Secure admin-secret invocation**
Use ADMIN_SCRIPT_SECRET through local process or CLI without printing it.

---

## 3. Execute canonical duplicate test

Sequence:
1. Record starting exercise count
2. Create temporary draft exercise with unique test marker
3. Attempt second creation whose name/ID normalizes to same libraryId
4. Capture exact rejection
5. Query normalized ID
6. Verify exactly ONE record exists
7. Delete temporary record
8. Verify count returns to starting value

Report: first result, second result, exact error, matching count, cleanup result.

---

## 4. Execute trainer-assignment duplicate test

Sequence:
1. Create one temporary trainer
2. Create one temporary exercise
3. Assign exercise to trainer
4. Attempt same assignment again
5. Capture exact implemented behavior
6. Verify exactly ONE trainer/exercise relationship exists
7. Clean up assignment, exercise, trainer
8. Verify all counts return to starting values

Do NOT describe as "update-or-insert" if it rejects duplicates.

---

## 5. Execute video URL validation matrix

Authentication NOT required to test pure URL validator.

Prefer extracting validator into testable server-side helper.

Do NOT export to browser unless frontend genuinely needs it.

### Expected VALID cases
- Valid `youtube.com/watch?v=...`
- Valid `youtu.be/...`
- Supported Vimeo video URL
- Direct HTTPS pathname ending in `.mp4`
- Direct HTTPS pathname ending in `.webm`

### Expected INVALID cases
- Empty string
- Whitespace
- Malformed URL
- HTTP URL
- JavaScript scheme
- Data scheme
- File scheme
- Notion page URL
- Ordinary HTTPS webpage
- Unsupported host
- Deceptive subdomain (`youtube.com.attacker.example`)
- `.mp4` present only in query parameters
- Missing YouTube video identifier

Report actual result and error for EVERY case.

Static validation proves supported URL shape only (not that media exists or plays).

Remove or internalize any public diagnostic mutation after testing.

---

## 6. Document TypeScript validation by SCOPE

Return exact commands and configurations:

### Frontend
- Command
- tsconfig
- Included paths
- Result

### Express/server
- Command
- tsconfig
- Included paths
- Result

### Convex
- codegen command
- Convex TypeScript command
- Deployment compilation result

### Playwright tests
- Command
- Test configuration
- Result

### Production build
- Command
- Explicit Convex environment
- Result

### Utility scripts
- Current diagnostic count
- Whether any failing scripts are invoked by active package scripts

### Experimental tools
- Current status
- Whether they participate in development, deployment, migration, or import workflows

Do NOT label a Convex-only `tsc` command as frontend validation.

---

## 7. Complete Android debug build

Capacitor sync is insufficient.

1. Confirm active Android web assets contain `upbeat-chickadee-781`
2. Run established Android debug build
3. Report APK path
4. Inspect packaged/merged assets
5. Confirm APK does NOT package:
   - `groovy-pig-414`
   - `127.0.0.1:3210`
   - `10.0.0.112:3210`
6. Confirm it DOES package:
   - `upbeat-chickadee-781`

Do NOT manually edit generated Android assets.

If Gradle fails, preserve exact failure and correct when within scope.

---

## 8. Complete frontend bodyRegion verification

Current report only verified backend.

**Required**:
- Trace active frontend references
- Prove query arguments use `bodyRegion`
- Prove no active frontend request sends `muscleGroup`
- Prove no active frontend request sends obsolete `muscle`
- Prove Exercise Library filter behaves correctly when data exists

Use temporary data if necessary, then remove it.

This is visible application behavior: use Playwright, capture filtered state.

Return accessible screenshots to Hermes auxiliary vision.

---

## 9. Final cleanup and verification

After tests:
- Remove ALL temporary test records
- Remove temporary public diagnostic functions
- Regenerate Convex APIs
- Run `npx convex dev --once`
- Verify target `dev/thebest-croc`
- Run final build
- Verify final database counts

### Required final counts
- exercises: 0
- trainers: 0
- trainerExercises: 0

### Confirm
- No Notion import
- No production deployment
- No seed or migration
- Old local deployment untouched
- No secret exposed

---

## CONSTRAINTS

- Do NOT modify production
- Do NOT expose secrets
- Do NOT delete unrelated data
- Do NOT commit/push/PR unless explicitly authorized
- Do NOT exceed authorized scope