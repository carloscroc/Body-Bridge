# Body Bridge Coder Loop — Implementation Phases

> **Status**: Ready for Execution  
> **Created**: June 19, 2026  
> **Parent Plan**: `docs/project/CODER-LOOP-PLAN.md`  
> **Purpose**: Detailed breakdown of all implementation phases with checklists, dependencies, and success criteria.

---

## Phase Overview

| Phase | Name | Files Created | Estimated Effort | Dependencies | Status |
|-------|------|---------------|------------------|--------------|--------|
| **Phase 1** | Full Foundation | 23 | High | None | ⏳ Pending |
| **Phase 2** | Memory & Learning | 5 (updates) | Medium | Phase 1 complete | ⏸️ Not started |
| **Phase 3** | Hermes Integration | 1-2 | Medium | Phase 1 complete | ⏸️ Not started |
| **Phase 4** | Advanced Features | 3-5 | Low | Phase 1 complete | ⏸️ Not started |

**Total files**: ~33 (some are updates to existing files)

---

## Phase 1: Full Foundation (All Commands + All Checks)

**Goal**: Create complete, testable loop system with all commands and validation checks.

**Success Criteria**:
- [ ] All 9 loop commands exist and are syntactically valid
- [ ] All 9 validation checks exist and reference correct project commands
- [ ] Mission template exists and produces clear acceptance criteria
- [ ] Folder structure is complete
- [ ] Each loop can be invoked without errors
- [ ] Reports are generated in correct format and location

**Estimated Effort**: 2-3 hours

**Dependencies**: None

---

### Phase 1.1: Create Folder Structure

**Files to create** (folders only):

```
.coder-loop/
├─ missions/
├─ checks/
├─ reports/
└─ memory/
```

**Commands**:
```bash
cd C:\Users\thebe\Downloads\Body-Bridge
mkdir -p .coder-loop/missions
mkdir -p .coder-loop/checks
mkdir -p .coder-loop/reports
mkdir -p .coder-loop/memory
```

**Verification**:
```bash
ls -la .coder-loop/
# Should show: missions/, checks/, reports/, memory/
```

**Completion Checklist**:
- [ ] `.coder-loop/missions/` created
- [ ] `.coder-loop/checks/` created
- [ ] `.coder-loop/reports/` created
- [ ] `.coder-loop/memory/` created
- [ ] Folders are in correct location (repo root)

---

### Phase 1.2: Create Shared Validation Logic

**File**: `.coder-loop/checks/_common.md`

**Purpose**: Reusable validation steps referenced by all task-type-specific checks.

**Content**:

```markdown
# Common Validation Steps

These steps are shared across all task types. Import via markdown reference in task-specific checks.

## Type Checking

### Command
```bash
npx tsc -p tsconfig.json --noEmit
```

### Interpretation
- **Exit 0**: No TypeScript errors
- **Non-zero**: TypeScript errors found — report first error, file:line

### Notes
- `npm run type-check` does NOT exist in this repo (per AGENTS.md)
- Use `npx tsc` directly
- Some `scripts/**/*.js` files have known errors — ignore if unrelated to task

---

## Build Verification

### Command
```bash
npm run build
```

### Interpretation
- **Exit 0**: Build successful
- **Non-zero**: Build failed — apply first-real-error rule

### First-Real-Error Rule
Read output top-down. The **first** error message that is not:
- "Could not resolve import" (cascade)
- "Module not found" (cascade)
- "FilteredError" tail messages

---

## Dead Code Detection

### Command
```bash
npx knip
```

### Interpretation
- **Exit 0**: No unused files/exports
- **Non-zero**: Unused files/exports found — review if related to task

### Notes
- Config in `knip.json`
- Only flag unused code that relates to the task being worked on
- Ignore false positives for third-party dependencies

---

## Environment Variable Check

### For local development:
- `.env.local` exists
- `VITE_CONVEX_URL` is set
- `VITE_CONVEX_SITE_URL` is set
- `CONVEX_SITE_URL` is set (for local dev server)
- `JWT_SECRET` is set

### For production deployment:
- `.env.production` exists
- All required production vars are set

### Command
```bash
cat .env.local | grep -E "VITE_CONVEX_URL|VITE_CONVEX_SITE_URL|JWT_SECRET"
```

### Interpretation
- **All present**: Environment is configured
- **Missing**: Report missing variables, block deployment

---

## Convex Development Server

### Start (local mode)
```bash
npm run dev:convex
```

### Interpretation
- **Starts without errors**: Convex dev server running on port 3211
- **Errors**: Check `CONVEX_SITE_URL` and auth config

### Notes
- If `CONVEX_DEPLOYMENT` is unset, runs local Convex
- If `CONVEX_DEPLOYMENT` is set, keeps process alive but no local server

---

## Express Backend Server

### Start
```bash
npm run dev:server
```

### Interpretation
- **Starts without errors**: Backend running on port 3001
- **Errors**: Check `JWT_SECRET` and port availability

---

## Vite Frontend Dev Server

### Start
```bash
npm run dev:client
```

### Interpretation
- **Starts without errors**: Frontend running on port 7770
- **Errors**: Check dependencies and Vite config

### Browser Console Check
After server starts, open browser to `http://127.0.0.1:7770`:
- Open DevTools → Console
- No red errors
- No TypeScript/React warnings related to task

---

## Playwright Test (if applicable)

### Run all tests
```bash
npm run test
```

### Run single spec
```bash
npx playwright test tests/<file>.spec.ts
```

### Interpretation
- **Exit 0**: All tests pass
- **Non-zero**: Tests failed — report first failure

### Notes
- Test discovery is broken for `imageResolver.spec.ts` (per AGENTS.md)
- Manually specify test file to avoid discovery bug

---

## Android Build (if applicable)

### Sync Capacitor
```bash
npx cap sync android
```

### Build debug APK
```bash
cd android && ./gradlew assembleDebug
```

### Interpretation
- **Exit 0**: Android build successful
- **Non-zero**: Build failed — apply first-real-error rule

### Notes
- Only run if Android-related files were changed
- Signing config in `android/keystore.properties` (for release)

---

## Clean Install (for CI/verification)

### Command
```bash
npm ci
```

### Interpretation
- **Exit 0**: Dependencies installed cleanly
- **Non-zero**: Lockfile mismatch or dependency issue

### Notes
- CI uses `npm ci` (per AGENTS.md)
- Use `npm install` for local development
```

**Verification**:
- [ ] File created at `.coder-loop/checks/_common.md`
- [ ] All commands reference correct project commands from AGENTS.md
- [ ] Notes include project-specific quirks (e.g., missing `npm run lint`)

---

### Phase 1.3: Create Task-Type-Specific Validation Checks

**Files to create** (8 files):

1. `.coder-loop/checks/frontend.md`
2. `.coder-loop/checks/backend.md`
3. `.coder-loop/checks/bugfix.md`
4. `.coder-loop/checks/error-fix.md`
5. `.coder-loop/checks/feature-add.md`
6. `.coder-loop/checks/feature-delete.md`
7. `.coder-loop/checks/deployment.md`
8. `.coder-loop/checks/refactor.md`

Each check should:
- Reference relevant steps from `_common.md`
- Add task-type-specific steps
- Include success criteria
- Include failure escalation rules

---

#### 1. Frontend Validation

**File**: `.coder-loop/checks/frontend.md`

**Purpose**: Validate frontend-only changes (UI, components, screens, styling).

**Validation Steps** (in order):

1. **Pre-validation**: Type check
   - Run: `npx tsc -p tsconfig.json --noEmit`
   - Pass → continue; Fail → fix errors and retry

2. **Primary validation**: Start dev server and check console
   - Run: `npm run dev:client`
   - Wait for server to start (port 7770)
   - Open browser to `http://127.0.0.1:7770`
   - Open DevTools → Console
   - Check for red errors
   - Check for TypeScript warnings related to task

3. **Post-validation**: Visual verification (manual)
   - Inspect the changed component/screen
   - Verify visual acceptance criteria from mission/brief
   - Test on different screen sizes (if responsive work)

**Success Criteria**:
- [ ] Type check passes
- [ ] Dev server starts without errors
- [ ] Browser console has no red errors
- [ ] No TypeScript warnings related to task
- [ ] Visual acceptance criteria met

**Failure Handling**:
- Type check fails → Fix type errors, re-run
- Dev server fails → Check dependencies, Vite config
- Console errors → Identify error, fix, reload
- Visual criteria not met → Adjust styles, verify again

**Report Content**:
```
Frontend Validation Results:
- Type check: PASS (exit 0)
- Dev server: PASS (started on port 7770)
- Console errors: 0
- Visual verification: PASS
```

---

#### 2. Backend Validation

**File**: `.coder-loop/checks/backend.md`

**Purpose**: Validate backend-only changes (Convex functions, Express routes, database).

**Validation Steps** (in order):

1. **Pre-validation**: Type check
   - Run: `npx tsc -p tsconfig.json --noEmit`
   - Pass → continue; Fail → fix errors and retry

2. **Primary validation**: Start backend and verify functionality
   - Run: `npm run dev:server` (for Express)
   - OR run: `npm run dev:convex` (for Convex)
   - Wait for server to start
   - Test the modified endpoint/function
   - Check server logs for errors

3. **Post-validation**: Verify database changes (if any)
   - If schema changed: verify migration impact
   - If function changed: test with sample inputs
   - Check Convex dashboard if applicable

**Success Criteria**:
- [ ] Type check passes
- [ ] Backend server starts without errors
- [ ] Modified endpoint/function works correctly
- [ ] No errors in server logs
- [ ] Database changes (if any) are correct

**Failure Handling**:
- Type check fails → Fix type errors, re-run
- Server fails → Check `JWT_SECRET`, port availability
- Function fails → Check function logic, dependencies
- Database issues → Verify schema, test migration

**Report Content**:
```
Backend Validation Results:
- Type check: PASS (exit 0)
- Server: PASS (started on port 3001)
- Endpoint/function test: PASS
- Server logs: 0 errors
- Database changes: N/A or [description]
```

---

#### 3. Bugfix Validation

**File**: `.coder-loop/checks/bugfix.md`

**Purpose**: Validate bug fixes (reproduce → fix → verify).

**Validation Steps** (in order):

1. **Reproduce bug** (before fix)
   - Identify steps to reproduce
   - Run the failing path
   - Capture the error/behavior

2. **Apply fix** (done by loop command)

3. **Verify fix** (after fix)
   - Run: `npx tsc -p tsconfig.json --noEmit` (if code changed)
   - Re-run the failing path
   - Verify the bug is no longer present

4. **Regression check**
   - Run: `npm run build`
   - Ensure no new errors introduced

**Success Criteria**:
- [ ] Bug was reproduced before fix
- [ ] Fix was applied
- [ ] Bug is no longer present
- [ ] Type check passes (if code changed)
- [ ] Build passes (no regressions)

**Failure Handling**:
- Cannot reproduce → Report "BLOCKED — bug cannot be reproduced"
- Fix doesn't work → Re-examine root cause, try alternative fix
- New errors introduced → Fix regressions, re-verify

**Report Content**:
```
Bugfix Validation Results:
- Bug reproduced: YES (steps: [steps])
- Fix applied: YES
- Bug verified fixed: YES
- Type check: PASS (exit 0)
- Regression check: PASS (build)
```

---

#### 4. Error-Fix Validation

**File**: `.coder-loop/checks/error-fix.md`

**Purpose**: Validate error fixes (build errors, type errors, runtime errors).

**Validation Steps** (in order):

1. **Run the failing command**
   - Identify the command that's failing (from user input)
   - Run it and capture the error
   - Apply first-real-error rule

2. **Apply fix** (done by loop command)

3. **Re-run the same command**
   - Run the exact same command again
   - Verify it passes

4. **Regression check**
   - Run: `npm run build`
   - Ensure no new errors introduced

**Success Criteria**:
- [ ] Original error was captured
- [ ] Fix was applied
- [ ] Failing command now passes
- [ ] Build passes (no regressions)

**Failure Handling**:
- Command still fails → Re-examine error, try alternative fix
- New errors introduced → Fix regressions, re-verify

**Report Content**:
```
Error-Fix Validation Results:
- Original error: [error message]
- Fix applied: YES
- Failing command now: PASS
- Regression check: PASS (build)
```

---

#### 5. Feature-Add Validation

**File**: `.coder-loop/checks/feature-add.md`

**Purpose**: Validate new features (end-to-end testing).

**Validation Steps** (in order):

1. **Pre-validation**: Build check
   - Run: `npm run build`
   - Pass → continue; Fail → fix errors and retry

2. **Primary validation**: End-to-end feature test
   - Run: `npm run dev:all` (Convex + Express + Vite)
   - Wait for all servers to start
   - Navigate to feature location
   - Test all feature functionality
   - Test edge cases

3. **Post-validation**: Related flows
   - Test related features (ensure no breakage)
   - Check data persistence (if applicable)
   - Run Playwright tests if relevant

**Success Criteria**:
- [ ] Build passes
- [ ] Feature works end-to-end
- [ ] Edge cases handled
- [ ] Related features still work
- [ ] Data persists correctly (if applicable)
- [ ] Playwright tests pass (if relevant)

**Failure Handling**:
- Build fails → Fix build errors, re-run
- Feature doesn't work → Debug, fix, re-test
- Related features break → Fix regressions, re-verify

**Report Content**:
```
Feature-Add Validation Results:
- Build: PASS (exit 0)
- Feature test: PASS
- Edge cases: PASS (tested: [list])
- Related features: PASS (tested: [list])
- Playwright: PASS/N/A
```

---

#### 6. Feature-Delete Validation

**File**: `.coder-loop/checks/feature-delete.md`

**Purpose**: Validate feature deletions (no dead code, no broken imports).

**Validation Steps** (in order):

1. **Pre-validation**: Dead code scan
   - Run: `npx knip`
   - Review unused files/exports related to deleted feature

2. **Primary validation**: Build check
   - Run: `npm run build`
   - Pass → continue; Fail → fix broken imports, retry

3. **Post-validation**: Import check
   - Search for broken imports: `grep -r "deleted-feature" src/`
   - Verify no files import deleted components
   - Check for broken routes (if route deleted)

**Success Criteria**:
- [ ] Dead code scan shows expected unused files
- [ ] Build passes
- [ ] No broken imports
- [ ] No broken routes
- [ ] No references to deleted feature in code

**Failure Handling**:
- Build fails → Fix broken imports, remove references
- Broken imports found → Remove imports, re-verify
- Broken routes found → Remove routes from router config

**Report Content**:
```
Feature-Delete Validation Results:
- Dead code scan: PASS (expected unused files: [list])
- Build: PASS (exit 0)
- Broken imports: 0
- Broken routes: 0
- References to deleted feature: 0
```

---

#### 7. Deployment Validation

**File**: `.coder-loop/checks/deployment.md`

**Purpose**: Validate production deployment builds.

**Validation Steps** (in order):

1. **Pre-validation**: Environment check
   - Verify `.env.production` exists
   - Check all required production variables are set
   - Verify secrets/tokens are not placeholder values

2. **Primary validation**: Production build
   - Run: `npm run build`
   - Verify dist/ folder is created
   - Check build output for errors

3. **Post-validation**: Android build (if applicable)
   - Run: `npx cap sync android`
   - Run: `cd android && ./gradlew assembleDebug`
   - Verify APK is created

**Success Criteria**:
- [ ] Environment variables are set correctly
- [ ] Production build succeeds
- [ ] Dist folder contains expected files
- [ ] Android build succeeds (if applicable)
- [ ] APK is created (if applicable)

**Failure Handling**:
- Missing env vars → Report "BLOCKED — missing production environment variables"
- Build fails → Fix build errors, re-run
- Android build fails → Check signing, dependencies, AGENTS.md for quirks

**Report Content**:
```
Deployment Validation Results:
- Environment check: PASS (all vars set)
- Production build: PASS (exit 0)
- Dist folder: Created with expected files
- Android sync: PASS
- Android build: PASS (APK created at [path])
```

---

#### 8. Refactor Validation

**File**: `.coder-loop/checks/refactor.md`

**Purpose**: Validate refactor work (no behavioral changes).

**Validation Steps** (in order):

1. **Pre-validation**: Build check
   - Run: `npm run build`
   - Pass → continue; Fail → fix errors, retry

2. **Primary validation**: Test relevant functionality
   - Identify affected components/functions
   - Test each manually
   - Verify behavior is unchanged

3. **Post-validation**: Type check
   - Run: `npx tsc -p tsconfig.json --noEmit`
   - Ensure no new type errors

**Success Criteria**:
- [ ] Build passes
- [ ] All affected functionality works as before
- [ ] No behavioral changes introduced
- [ ] Type check passes

**Failure Handling**:
- Build fails → Fix errors, re-run
- Behavior changed → Revert changes, reconsider refactor
- Type errors → Fix type issues, re-verify

**Report Content**:
```
Refactor Validation Results:
- Build: PASS (exit 0)
- Functionality tested: PASS (tested: [list])
- Behavioral changes: None confirmed
- Type check: PASS
```

---

**Verification for All Checks**:
- [ ] All 8 check files created
- [ ] Each check references relevant `_common.md` steps
- [ ] Each check has clear success criteria
- [ ] Each check has failure handling rules
- [ ] Each check has report content format

---

### Phase 1.4: Create Mission Template

**File**: `.coder-loop/missions/MISSION_TEMPLATE.md`

**Purpose**: Structured format for complex tasks requiring clear acceptance criteria.

**Content**:

```markdown
# Mission

## Goal

[What should be done? Be specific and actionable.]

## Task Type

Choose one (for auto-classification reference):
- [ ] frontend
- [ ] backend
- [ ] feature-add
- [ ] feature-delete
- [ ] bugfix
- [ ] error-fix
- [ ] deployment
- [ ] refactor

## Scope

[Files, screens, routes, APIs, or features likely involved.]

## Context / Background

[Why is this task needed? What problem does it solve?]

## Acceptance Criteria

[The task is done when:]
- [ ] [Specific criterion 1]
- [ ] [Specific criterion 2]
- [ ] [Specific criterion 3]

## Validation Commands

[Use project commands when known:]
- typecheck: `npx tsc -p tsconfig.json --noEmit`
- build: `npm run build`
- dev: [relevant dev command]
- test: [relevant test command]

## Do Not Touch

[List anything that must NOT be changed.]

## Risk Assessment

[What could go wrong? How risky is this change?]

## Expected Changes

[List files you expect to be changed.]

## Final Report Required

- [ ] Files changed
- [ ] Commands run
- [ ] Validation result
- [ ] Remaining risks
- [ ] Manual testing needed
```

**Verification**:
- [ ] File created at `.coder-loop/missions/MISSION_TEMPLATE.md`
- [ ] Template includes all required sections
- [ ] Template is clear and easy to fill out

---

### Phase 1.5: Create Universal Loop Command

**File**: `.opencode/commands/coder-loop.md`

**Purpose**: Auto-classifying loop that delegates to appropriate validation and workflow.

**Content**:

```markdown
---
description: Universal auto-classifying loop for all coding tasks. Classifies task type, runs appropriate validation, generates report.
---

You are the Body Bridge Coder.

Your job is to complete coding missions by following a controlled engineering loop with automatic task classification.

## Task Classification

For every task `$ARGUMENTS`, classify it into one of these types:

| Type | Triggers |
|------|----------|
| **frontend** | "screen", "UI", "component", "layout", "style", "mobile", "responsive", "visual" |
| **backend** | "API", "endpoint", "function", "schema", "database", "auth", "Convex", "server" |
| **feature-add** | "add", "new", "create", "implement", "build" |
| **feature-delete** | "remove", "delete", "clean up", "old", "unused" |
| **bugfix** | "fix bug", "broken", "crash", "wrong data", "not working" |
| **error-fix** | "build error", "type error", "runtime error", "TS error" |
| **deployment** | "deploy", "release", "production", "build for prod" |
| **refactor** | "refactor", "clean up", "organize", "improve code" |

If multiple types match, choose the one that best describes the PRIMARY intent.

## Complexity Detection

Determine if this task requires a mission template:

**Mission required if:**
- Task mentions "feature", "add", "new" + involves 2+ files
- Task involves database schema changes
- Task involves auth, payments, or user data
- Task involves deployment
- User explicitly requested mission-based approach

**Ad-hoc accepted if:**
- Single file fix
- Clear, bounded scope with obvious acceptance criteria

If mission required but not provided, ask the user to create a mission using `.coder-loop/missions/MISSION_TEMPLATE.md`.

## Operating Loop

### Step 1: Read Project Rules
- Read `docs/project/AGENTS.md`
- Note project commands, quirks, forbidden actions

### Step 2: Read Task
- Read `$ARGUMENTS`
- If mission is provided, read `.coder-loop/missions/[mission-name].md`

### Step 3: Classify Task
- Determine task type from triggers
- Determine complexity (mission vs. ad-hoc)

### Step 4: Inspect Before Changing
- Read relevant files
- Do not make random changes
- Understand existing code structure

### Step 5: Plan (brief)
- Write 2-3 sentences describing what you'll do
- Identify files to change

### Step 6: Make Changes
- Make the smallest safe change
- Edit one file at a time if possible

### Step 7: Validate
- Read the appropriate validation check: `.coder-loop/checks/[task-type].md`
- Run validation steps in order
- Capture exit codes

### Step 8: Fix if Validation Fails
- Apply first-real-error rule
- Fix the cause
- Re-run validation
- Max 3 attempts, then escalate

### Step 9: Write Report
- Generate report in `.coder-loop/reports/`
- Filename format: `YYYY-MM-DD-HHMM-[task-type]-brief-name.md`
- Use standard report format (see below)

### Step 10: Suggest Next Step
- Ready to commit
- Needs manual testing
- Blocked by X

## Behavior Rules

- Do not guess project commands — find them in AGENTS.md
- Do not claim success without running real validation
- Do not hide errors — report them clearly
- Do not make unrelated improvements
- Do not delete files unless the mission asks for deletion
- Do not touch forbidden areas (see AGENTS.md)
- Keep changes scoped

## Report Format

```markdown
# Coder Loop Report

## Classification
[frontend | backend | feature-add | feature-delete | bugfix | error-fix | deployment | refactor]

## Original Goal
[Verbatim from $ARGUMENTS or mission brief]

## Root Cause / Main Reason
[Why was this change needed? What was the cause?]

## Files Changed
- `path/to/file1.ts` — [change description]
- `path/to/file2.ts` — [change description]

## What Changed
[Brief description: what you did and why]

## Validation Commands Run
1. `[command]` — **[PASS/FAIL]** (exit [code])
2. `[command]` — **[PASS/FAIL]** (exit [code])

## Errors Fixed
- [Error 1] — [how fixed]
- [Error 2] — [how fixed]

## Remaining Risks
- [Risk 1]
- [Risk 2]

## Manual Testing Needed
- [ ] [Test 1]
- [ ] [Test 2]

## Next Step
[Ready to commit / Needs manual testing / Blocked by X]

## Suggested Commit Message
[Conventional commit message referencing this report]

## Status
✅ Complete — validated and ready | ⚠️ Complete — requires manual testing | ❌ Blocked — [reason]
```

## Forbidden Actions (per AGENTS.md)

Do NOT perform these unless explicitly approved in the mission:
- Release signing of Android app
- Edits to `android/keystore.properties` or store credentials
- Deploys to Play Store / App Store
- Edits to `.env.production`, `.env.prod.jwt`, or production secrets
- Changes to `applicationId` or `CFBundleIdentifier`
- Edits to Plane.so workspace configuration

## Report Path

Save report to:
```
.coder-loop/reports/YYYY-MM-DD-HHMM-[task-type]-brief-name.md
```

Example: `.coder-loop/reports/2026-06-19-1430-frontend-fix-mobile-login-button.md`

## Done-When Checklist

Before reporting complete, ensure:
- [ ] AGENTS.md read
- [ ] Task classified correctly
- [ ] Files inspected before editing
- [ ] Changes made (smallest safe change)
- [ ] Validation run (per check file)
- [ ] Report written to correct path
- [ ] Suggested commit message included
```

**Verification**:
- [ ] File created at `.opencode/commands/coder-loop.md`
- [ ] Classification logic is clear
- [ ] Complexity detection rules are defined
- [ ] All 10 loop steps are documented
- [ ] Behavior rules are clear
- [ ] Report format is complete
- [ ] Forbidden actions are listed

---

### Phase 1.6: Create Specialized Loop Commands

**Files to create** (7 files):

1. `.opencode/commands/frontend-loop.md`
2. `.opencode/commands/backend-loop.md`
3. `.opencode/commands/bugfix-loop.md`
4. `.opencode/commands/error-fix-loop.md`
5. `.opencode/commands/feature-add-loop.md`
6. `.opencode/commands/feature-delete-loop.md`
7. `.opencode/commands/deployment-loop.md`
8. `.opencode/commands/refactor-loop.md`

Each specialized loop follows the same pattern as `coder-loop.md` but:
- **Does NOT classify task type** (assumes known type)
- **Uses task-type-specific validation check directly**
- **Simpler workflow** (one less inference step)

---

#### General Pattern for Specialized Loops

Each specialized loop should have:

```markdown
---
description: [Task type] loop for [brief description].
---

You are the Body Bridge [Task Type] Coder.

Your job is to complete [task type] missions by following a controlled engineering loop.

## Task Type

**This loop assumes task type is: [task type]**

## Operating Loop

[Same 10 steps as coder-loop.md, but skip Step 3 (classification)]

### Step 1: Read Project Rules
### Step 2: Read Task
### Step 3: (SKIP — task type is known)
### Step 4: Inspect Before Changing
### Step 5: Plan (brief)
### Step 6: Make Changes
### Step 7: Validate (use .coder-loop/checks/[task-type].md)
### Step 8: Fix if Validation Fails
### Step 9: Write Report
### Step 10: Suggest Next Step

## [Task Type]-Specific Notes

[Any notes specific to this task type]

## Behavior Rules, Forbidden Actions, Report Format, Report Path, Done-When Checklist
[Same as coder-loop.md]
```

---

#### 1. Frontend Loop

**File**: `.opencode/commands/frontend-loop.md`

**Frontend-specific notes**:
- Always check browser console for errors
- Test on different screen sizes for responsive work
- Visual verification is critical
- Use `npm run dev:client` for validation

---

#### 2. Backend Loop

**File**: `.opencode/commands/backend-loop.md`

**Backend-specific notes**:
- Test endpoints/functions manually
- Check server logs for errors
- Verify database changes if schema modified
- Use `npm run dev:server` or `npm run dev:convex` for validation

---

#### 3. Bugfix Loop

**File**: `.opencode/commands/bugfix-loop.md`

**Bugfix-specific notes**:
- Reproduce bug before fixing
- Identify root cause, not just symptom
- Verify exact broken path is fixed
- Check for regressions

---

#### 4. Error-Fix Loop

**File**: `.opencode/commands/error-fix-loop.md`

**Error-fix-specific notes**:
- Run the failing command first
- Apply first-real-error rule
- Re-run same command after fix
- Check for new errors

---

#### 5. Feature-Add Loop

**File**: `.opencode/commands/feature-add-loop.md`

**Feature-add-specific notes**:
- Test feature end-to-end
- Test edge cases
- Verify related features still work
- Consider using mission template for complex features

---

#### 6. Feature-Delete Loop

**File**: `.opencode/commands/feature-delete-loop.md`

**Feature-delete-specific notes**:
- Run `npx knip` to detect dead code
- Check for broken imports
- Check for broken routes
- Verify no references remain

---

#### 7. Deployment Loop

**File**: `.opencode/commands/deployment-loop.md`

**Deployment-specific notes**:
- Check environment variables carefully
- Verify production build succeeds
- Run `npx cap sync android` and `./gradlew assembleDebug`
- DO NOT deploy to stores without explicit approval

---

#### 8. Refactor Loop

**File**: `.opencode/commands/refactor-loop.md`

**Refactor-specific notes**:
- Build must pass
- No behavioral changes allowed
- Test affected functionality manually
- Type check must pass

---

**Verification for All Specialized Loops**:
- [ ] All 8 specialized loop files created
- [ ] Each loop follows the general pattern
- [ ] Each loop has task-type-specific notes
- [ ] Each loop references the correct validation check
- [ ] Each loop has the same report format as `coder-loop.md`

---

### Phase 1.7: Phase 1 Completion Checklist

Before declaring Phase 1 complete, verify:

**Folder Structure**:
- [ ] `.coder-loop/missions/` exists
- [ ] `.coder-loop/checks/` exists
- [ ] `.coder-loop/reports/` exists
- [ ] `.coder-loop/memory/` exists

**Validation Checks** (9 files):
- [ ] `_common.md` created
- [ ] `frontend.md` created
- [ ] `backend.md` created
- [ ] `bugfix.md` created
- [ ] `error-fix.md` created
- [ ] `feature-add.md` created
- [ ] `feature-delete.md` created
- [ ] `deployment.md` created
- [ ] `refactor.md` created

**Mission Template**:
- [ ] `MISSION_TEMPLATE.md` created

**Loop Commands** (9 files):
- [ ] `coder-loop.md` created (universal)
- [ ] `frontend-loop.md` created
- [ ] `backend-loop.md` created
- [ ] `bugfix-loop.md` created
- [ ] `error-fix-loop.md` created
- [ ] `feature-add-loop.md` created
- [ ] `feature-delete-loop.md` created
- [ ] `deployment-loop.md` created
- [ ] `refactor-loop.md` created

**Syntactic Validation**:
- [ ] All markdown files are valid
- [ ] All file references are correct
- [ ] No broken links or paths

**Initial Test**:
- [ ] `/coder-loop "Test command"` runs without errors
- [ ] Report is generated in `.coder-loop/reports/`
- [ ] Report format matches template

**Phase 1 Status**: ✅ Complete | ⚠️ Partial | ❌ Failed

---

## Phase 2: Memory & Learning

**Goal**: Add persistent memory for decisions, bugs, lessons, and deployment notes.

**Success Criteria**:
- [ ] All memory template files created
- [ ] All loop commands updated to save to memory
- [ ] Memory save logic is tested
- [ ] Memory files are git-tracked

**Estimated Effort**: 1-2 hours

**Dependencies**: Phase 1 complete

---

### Phase 2.1: Create Memory Templates

**Files to create** (5 files):

1. `.coder-loop/memory/_template.md`
2. `.coder-loop/memory/decisions.md`
3. `.coder-loop/memory/bugs.md`
4. `.coder-loop/memory/lessons.md`
5. `.coder-loop/memory/deploy-notes.md`

---

#### 1. Memory Template

**File**: `.coder-loop/memory/_template.md`

**Purpose**: Standard format for all memory entries.

**Content**:

```markdown
# Memory Entry Template

Use this template for all memory entries.

## Entry Header

```markdown
## [YYYY-MM-DD] [Title]

**Context**: [What situation led to this entry?]

**Content**: [The actual content of this entry]

**Applicable To**: [What areas does this apply to?]

**Reference**: [Related files, commits, or reports]
```

## Guidelines

- Keep entries concise and focused
- Include dates for all entries
- Reference relevant code/files/commits
- Categorize clearly (decision, bug, lesson, deploy-note)
- Use consistent formatting

## When to Create Memory Entries

**Decisions**: When you make an architectural or design decision that should be remembered.

**Bugs**: When you encounter and fix a non-trivial bug that could recur.

**Lessons**: When you learn something that should be applied to future work.

**Deploy Notes**: When you deploy and encounter issues or gotchas.

## When NOT to Create Memory Entries

- Trivial one-liner fixes
- Typos or minor styling
- Well-known best practices
- Duplicated information

## Git Tracking

Memory files are git-tracked. Commit memory entries with prefix:
```
[memory] Add decision about X
[memory] Document bug Y and fix
[memory] Capture lesson Z
```
```

---

#### 2. Decisions Memory

**File**: `.coder-loop/memory/decisions.md`

**Purpose**: Key architectural, design, or strategic decisions.

**Format for each entry**:

```markdown
## [YYYY-MM-DD] [Decision Title]

**Context**: [What situation led to this decision?]

**Decision**: [What was decided?]

**Rationale**: [Why was this decision made?]

**Alternatives Considered**: 
- [Alternative 1] — [reason rejected]
- [Alternative 2] — [reason rejected]

**Impact**: [What parts of the system does this affect?]

**Revisable**: Yes/No — [if yes, when to revisit?]

**Reference**: [Related files, commits, or reports]
```

---

#### 3. Bugs Memory

**File**: `.coder-loop/memory/bugs.md`

**Purpose**: Bugs encountered, their root causes, and fixes.

**Format for each entry**:

```markdown
## [YYYY-MM-DD] [Bug Title]

**Symptom**: [What was the bug?]

**Root Cause**: [What caused it?]

**Fix**: [How was it fixed?]

**Files Changed**: 
- `file1.ts` — [change description]
- `file2.ts` — [change description]

**Prevention**: [How to avoid this in the future?]

**Reference**: [Related report or commit]
```

---

#### 4. Lessons Memory

**File**: `.coder-loop/memory/lessons.md`

**Purpose**: Lessons learned and patterns to apply or avoid.

**Format for each entry**:

```markdown
## [YYYY-MM-DD] [Lesson Learned]

**Context**: [What happened?]

**Lesson**: [What did we learn?]

**Applicable To**: [What areas does this apply to?]

**Example**: [Concrete example of when to apply this]

**Anti-Pattern**: [What to avoid (if applicable)]

**Reference**: [Related files, commits, or reports]
```

---

#### 5. Deploy Notes Memory

**File**: `.coder-loop/memory/deploy-notes.md`

**Purpose**: Deployment gotchas, issues encountered, and resolutions.

**Format for each entry**:

```markdown
## [YYYY-MM-DD] [Deploy Title]

**Environment**: [prod/staging/dev]

**Steps Taken**:
1. [Step 1]
2. [Step 2]

**Issues Encountered**: [Any problems?]

**Resolution**: [How were they fixed?]

**Post-Deploy Checks**:
- [ ] Check 1 — [status]
- [ ] Check 2 — [status]

**Rollback Plan**: [How to revert if needed]

**Reference**: [Related commit or report]
```

---

**Verification**:
- [ ] All 5 memory files created
- [ ] Each file has correct format
- [ ] Template includes guidelines
- [ ] Formats are consistent across files

---

### Phase 2.2: Update Loop Commands to Save to Memory

**Files to update**: All 9 loop commands (1 universal + 8 specialized)

**Changes needed**:

Add to each loop command, after Step 9 (Write Report):

```markdown
### Step 10: Save to Memory (if applicable)

Save to memory files if task warrants:

**Save to `decisions.md` if:**
- Architectural or design decision made
- Trade-off considered and chosen
- Strategy or pattern decided

**Save to `bugs.md` if:**
- Non-trivial bug fixed
- Bug had interesting root cause
- Fix is reusable pattern

**Save to `lessons.md` if:**
- Learned something new about codebase
- Discovered pattern to avoid
- Found better way to do something

**Save to `deploy-notes.md` if:**
- Task involved deployment
- Deploy had issues or gotchas
- Rollback was needed

**Memory save format**:
- Use the format from `.coder-loop/memory/_template.md`
- Include date (YYYY-MM-DD)
- Reference the report filename
- Be concise and focused

**Example decision entry**:
```markdown
## 2026-06-19 Use Convex for user state

**Context**: Need to sync user data across devices

**Decision**: Use Convex for all user state (workouts, progress, settings)

**Rationale**: Real-time sync, offline support, simple API

**Alternatives Considered**:
- Local storage only — no sync across devices
- Custom backend — too much work

**Impact**: User data now synced across all devices

**Revisable**: No — this is core architecture

**Reference**: coder-loop-report-2026-06-19-1430-feature-add-user-sync.md
```

Do NOT save to memory for:
- Trivial fixes
- Typos
- Minor styling
- Well-known patterns
```

Then renumber Step 10 → Step 11 (Suggest Next Step) and Done-When checklist accordingly.

---

**Verification**:
- [ ] All 9 loop commands updated with memory save step
- [ ] Memory save logic is consistent across loops
- [ ] Examples included in each loop
- [ ] Done-when checklists updated

---

### Phase 2.3: Test Memory Save Logic

**Test scenario**:

```
/feature-add-loop Add a simple decision-saving test. Make a minor architectural decision and save it to memory.
```

**Verification**:
- [ ] Memory entry is created in correct file
- [ ] Entry format matches template
- [ ] Entry references report filename
- [ ] Entry is concise and focused

---

### Phase 2.4: Phase 2 Completion Checklist

Before declaring Phase 2 complete, verify:

**Memory Templates**:
- [ ] `_template.md` created
- [ ] `decisions.md` created (with format only, no entries yet)
- [ ] `bugs.md` created (with format only, no entries yet)
- [ ] `lessons.md` created (with format only, no entries yet)
- [ ] `deploy-notes.md` created (with format only, no entries yet)

**Loop Commands Updated**:
- [ ] All 9 loop commands have memory save step
- [ ] Memory save logic is consistent
- [ ] Examples included
- [ ] Checklists updated

**Testing**:
- [ ] Memory save tested with real task
- [ ] Memory entry format verified
- [ ] Memory files are git-tracked

**Phase 2 Status**: ✅ Complete | ⚠️ Partial | ❌ Failed

---

## Phase 3: Hermes Integration

**Goal**: Enable Hermes runner to trigger loops and capture reports.

**Success Criteria**:
- [ ] Hermes runner can invoke `/coder-loop` via `$ARGUMENTS`
- [ ] Reports respect `$REPORT_PATH` environment variable
- [ ] Integration documented in AGENTS.md

**Estimated Effort**: 1-2 hours

**Dependencies**: Phase 1 complete

---

### Phase 3.1: Add Report Path Detection to Loop Commands

**Files to update**: All 9 loop commands

**Changes needed**:

Add to each loop command, in the "Report Path" section:

```markdown
## Report Path

**Default path** (manual runs):
```
.coder-loop/reports/YYYY-MM-DD-HHMM-[task-type]-brief-name.md
```

**Hermes path** (if `REPORT_PATH` env var is set):
```
$REPORT_PATH/report.md
```

**Detection logic**:
If `$REPORT_PATH` environment variable is set (e.g., `C:\Users\thebe\agent-system\runs\<runId>\report.md`):
- Use Hermes path instead of default path
- Do NOT generate filename with timestamp/task-type
- Write to `report.md` in the run folder

**Why two paths?**
- Manual runs: git-tracked, history in repo
- Hermes runs: outside repo, matches runner pattern

**Example manual run**:
```
Report path: .coder-loop/reports/2026-06-19-1430-frontend-fix-mobile-login-button.md
```

**Example Hermes run**:
```
REPORT_PATH=C:\Users\thebe\agent-system\runs\active\<runId>
Report path: C:\Users\thebe\agent-system\runs\active\<runId>\report.md
```
```

---

**Verification**:
- [ ] All 9 loop commands updated with report path detection
- [ ] Logic handles both manual and Hermes runs
- [ ] Examples included
- [ ] No broken paths

---

### Phase 3.2: Document Hermes Integration in AGENTS.md

**File to update**: `docs/project/AGENTS.md`

**Add new section** (after "Hermes Runner Contract"):

```markdown
## Coder Loop Commands (added 2026-06)

The repo includes auto-classifying loop commands for manual coding work and Hermes automation.

### Available Commands

| Command | Purpose | Location |
|---------|---------|----------|
| `/coder-loop` | Universal auto-classifying loop | `.opencode/commands/coder-loop.md` |
| `/frontend-loop` | Frontend-specific loop | `.opencode/commands/frontend-loop.md` |
| `/backend-loop` | Backend-specific loop | `.opencode/commands/backend-loop.md` |
| `/bugfix-loop` | Bugfix-specific loop | `.opencode/commands/bugfix-loop.md` |
| `/error-fix-loop` | Error-fix-specific loop | `.opencode/commands/error-fix-loop.md` |
| `/feature-add-loop` | Feature-add-specific loop | `.opencode/commands/feature-add-loop.md` |
| `/feature-delete-loop` | Feature-delete-specific loop | `.opencode/commands/feature-delete-loop.md` |
| `/deployment-loop` | Deployment-specific loop | `.opencode/commands/deployment-loop.md` |
| `/refactor-loop` | Refactor-specific loop | `.opencode/commands/refactor-loop.md` |

### Hermes Runner Integration

The Hermes runner can invoke `/coder-loop` by passing task details via `$ARGUMENTS`:

```powershell
# In run-opencode-project.ps1
$task = Get-Content "runs/$runId/task.md"
$env:REPORT_PATH = "runs/$runId"
opencode /coder-loop $task
```

**Report storage**:
- Hermes runner sets `REPORT_PATH` environment variable
- Loop commands detect `$REPORT_PATH` and write to `report.md` in the run folder
- Manual runs (no `$REPORT_PATH`) write to `.coder-loop/reports/` (git-tracked)

**Full documentation**: See `docs/project/CODER-LOOP-PLAN.md` for complete loop documentation.

### Relationship to Existing Hermes Commands

| Command | Use Case | Report Location |
|---------|----------|-----------------|
| `/fix-bug` | Hermes runner strict workflow | `runs/<runId>/report.md` |
| `/build-check` | Hermes runner validation | `runs/<runId>/report.md` |
| `/review-change` | Hermes runner pre-review | `runs/<runId>/report.md` |
| `/coder-loop` | Manual OR Hermes flexible workflow | `.coder-loop/reports/` OR `runs/<runId>/report.md` |

The new loop commands are **independent** of the existing Hermes runner commands but can be used by Hermes for flexible workflows.
```

---

**Verification**:
- [ ] New section added to AGENTS.md
- [ ] All 9 commands documented
- [ ] Hermes runner integration documented
- [ ] Relationship to existing commands documented
- [ ] Reference to CODER-LOOP-PLAN.md included

---

### Phase 3.3: Test Hermes Integration

**Test scenario** (if Hermes runner available):

1. Create a test run folder
2. Set `REPORT_PATH` environment variable
3. Run `/coder-loop "Test Hermes integration"`
4. Verify report is written to correct path

**Verification**:
- [ ] Report written to `runs/<runId>/report.md`
- [ ] Report format matches template
- [ ] Environment variable detection works

---

### Phase 3.4: Phase 3 Completion Checklist

Before declaring Phase 3 complete, verify:

**Loop Commands Updated**:
- [ ] All 9 loop commands have `$REPORT_PATH` detection
- [ ] Both manual and Hermes paths handled
- [ ] Examples included

**Documentation**:
- [ ] AGENTS.md updated with new section
- [ ] All 9 commands documented
- [ ] Hermes integration documented
- [ ] Relationship to existing commands clear

**Testing** (if Hermes available):
- [ ] Hermes runner can invoke loops
- [ ] Reports written to correct path
- [ ] Report format verified

**Phase 3 Status**: ✅ Complete | ⚠️ Partial | ❌ Failed

---

## Phase 4: Advanced Features (Optional, Later)

**Goal**: Add advanced features based on usage patterns and needs.

**Success Criteria** (varies per feature):
- [ ] Feature implemented and tested
- [ ] Documentation updated
- [ ] User can use feature effectively

**Estimated Effort**: 2-4 hours (varies)

**Dependencies**: Phase 1 complete

---

### Phase 4.1: Automated Report Summarization

**Goal**: Generate weekly/monthly summaries of all reports.

**Implementation**:
- Create script to scan `.coder-loop/reports/`
- Extract key metrics (task types, common errors, etc.)
- Generate summary markdown file
- Schedule via cron or manual run

**Files to create**:
- `scripts/generate-loop-summary.js`
- `.coder-loop/reports/SUMMARY-YYYY-MM.md`

---

### Phase 4.2: Plane.so Integration

**Goal**: Auto-create tickets for missions and link reports.

**Implementation**:
- Detect mission-based tasks
- Call Plane.so API to create ticket
- Link report to ticket
- Update ticket status on completion

**Files to create**:
- `.opencode/plugins/plane-integration.md`
- Update loop commands to call Plane.so

---

### Phase 4.3: Visual Testing Hooks

**Goal**: Add screenshot capture and comparison for frontend validation.

**Implementation**:
- Integrate Playwright/Puppeteer
- Capture screenshots before/after changes
- Compare for visual regressions
- Store screenshots in `.coder-loop/screenshots/`

**Files to create**:
- `.coder-loop/checks/_visual-testing.md`
- Update `frontend.md` to use visual testing

---

### Phase 4.4: Loop Versioning and Migration

**Goal**: Support breaking changes in loop formats.

**Implementation**:
- Add version to loop commands
- Create migration guide for old reports
- Update report format with version field

**Files to create**:
- `.coder-loop/CHANGELOG.md`
- Update all loop commands with version field

---

### Phase 4.5: Phase 4 Completion Checklist

**Per feature**:
- [ ] Feature implemented
- [ ] Feature tested
- [ ] Documentation updated
- [ ] User can use feature

**Phase 4 Status**: ✅ Complete | ⚠️ Partial | ❌ Failed | ⏸️ Skipped

---

## Overall Completion Checklist

**After all phases**:

**Phase 1**:
- [ ] All 23 files created
- [ ] All loops tested
- [ ] All validation checks verified

**Phase 2**:
- [ ] All 5 memory files created
- [ ] All loops updated to save to memory
- [ ] Memory save tested

**Phase 3**:
- [ ] All loops support `$REPORT_PATH`
- [ ] AGENTS.md updated
- [ ] Hermes integration tested (if available)

**Phase 4**:
- [ ] Selected features implemented
- [ ] Documentation updated
- [ ] Features tested

**Overall Status**: ✅ Complete | ⏳ In Progress | ⚠️ Partial | ❌ Failed

---

## Rollback Plan

If any phase fails or needs rollback:

**Phase 1**:
- Delete `.coder-loop/` folder
- Delete `.opencode/commands/coder-loop.md` and specialized loops
- Restore from git if committed

**Phase 2**:
- Delete `.coder-loop/memory/` folder
- Revert loop command updates
- Restore from git if committed

**Phase 3**:
- Revert AGENTS.md changes
- Revert loop command `$REPORT_PATH` changes
- Restore from git if committed

**Phase 4**:
- Delete feature-specific files
- Revert loop command updates
- Restore from git if committed

---

## Next Steps

1. **Start Phase 1** — Create folder structure and all files
2. **Test Phase 1** — Verify all loops work
3. **Proceed to Phase 2** — Add memory system
4. **Proceed to Phase 3** — Hermes integration
5. **Proceed to Phase 4** — Advanced features (as needed)

**Current Phase**: Phase 1 — Full Foundation

**Ready to begin?** Start with Phase 1.1 (Create Folder Structure).