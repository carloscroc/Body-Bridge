# Body Bridge Coder Loop Plan

> **Status**: ✅ All Decisions Confirmed — Ready for Implementation
> **Created**: June 19, 2026
> **Last Updated**: June 19, 2026
> **Purpose**: Create a unified coder loop system for frontend, backend, bugs, errors, features, and deployment work.

---

## Executive Summary

You want a **flexible loop system** that can handle any coding task you throw at it:
- Frontend work (UI, components, screens, styling)
- Backend work (API routes, Convex functions, database logic)
- Adding features
- Deleting features
- Fixing bugs
- Fixing errors (build, type, runtime)
- Deployment tasks

The plan is to **augment your existing OpenCode setup** with:
1. **Two tiers of loop commands**: Universal auto-classifying loop + specialized task-type-specific loops
2. Task classification logic built into the universal loop
3. Validation checks for each task type
4. Standardized reporting format
5. Simple mission templates for structured requests
6. Persistent memory for decisions, bugs, and lessons learned

---

## Current State Analysis

### What you already have (GOOD):

✅ `.opencode/commands/` exists with useful commands:
- `fix-bug.md` — bug fixing workflow
- `build-check.md` — build validation
- `review-change.md` — code review workflow
- `collect-evidence.md`, `create-ticket.md`, `start-symphony.md` — Plane.so integration

✅ `docs/project/AGENTS.md` exists with:
- Project commands and quirks
- Validation chain (`npm ci` → `npm run build` → `npx cap sync android` → `./gradlew assembleDebug`)
- Forbidden actions list
- Reporting shape
- First-real-error rule
- Hermes runner contract

✅ Tech stack documented:
- React 19 + Vite frontend (`src/`)
- Express API (`server/`)
- Convex backend (`convex/`)
- Android via Capacitor
- Plane.so integration for ticket management

### What's missing (GAPS):

❌ No **universal task classifier** — each command assumes one task type
❌ No **frontend-specific validation** (run app, check console, visual verification)
❌ No **backend-specific validation** (test Convex functions, verify API endpoints)
❌ No **feature-add validation** (end-to-end feature testing)
❌ No **feature-delete validation** (check for dead imports, broken routes)
❌ No **deployment validation** (env variables, production build, deploy command verification)
❌ No **mission template** — requests are ad-hoc, not structured
❌ No **memory of past decisions** — bugs, lessons learned, deploy notes
❌ No **Hermes automation integration** — loops work manually but need runner hook points

---

## Proposed Loop Architecture

### The Loop Flow (Universal)

```
Receive task → Classify → Read rules → Inspect → Plan → Edit → Validate → Fix if needed → Report → Remember
```

### Two-Tier Command Structure

| Command | When to Use | Auto-classifies? | Specialized Validation |
|---------|-------------|------------------|----------------------|
| `/coder-loop` | Quick fixes, mixed tasks, unsure of type | ✅ Yes | Dynamic based on classification |
| `/frontend-loop` | Pure frontend work | ❌ No (assumes frontend) | Frontend-specific |
| `/backend-loop` | Pure backend work | ❌ No (assumes backend) | Backend-specific |
| `/bugfix-loop` | Bug investigation and fixing | ❌ No (assumes bugfix) | Bugfix-specific |
| `/feature-add-loop` | Adding new features | ❌ No (assumes feature-add) | Feature-specific |
| `/feature-delete-loop` | Removing features/components | ❌ No (assumes feature-delete) | Delete-specific |
| `/error-fix-loop` | Fixing build/type/runtime errors | ❌ No (assumes error-fix) | Error-specific |
| `/deployment-loop` | Production deployment | ❌ No (assumes deployment) | Deploy-specific |
| `/refactor-loop` | Code cleanup and reorganization | ❌ No (assumes refactor) | Refactor-specific |

### Task Types (auto-detected by `/coder-loop`)

| Task type | Triggers in request | Required validation |
|-----------|---------------------|---------------------|
| **frontend** | "screen", "UI", "component", "layout", "style", "mobile", "responsive", "visual" | typecheck → dev server → console check → visual |
| **backend** | "API", "endpoint", "function", "schema", "database", "auth", "Convex", "server" | backend/dev server → test function → check logs |
| **feature-add** | "add", "new", "create", "implement", "build" | feature works end-to-end → test related flows |
| **feature-delete** | "remove", "delete", "clean up", "old", "unused" | no dead imports → no broken routes → build passes |
| **bugfix** | "fix bug", "broken", "crash", "wrong data", "not working" | reproduce → fix → verify exact broken path |
| **error-fix** | "build error", "type error", "runtime error", "TS error" | run failing command → fix → re-run command |
| **deployment** | "deploy", "release", "production", "build for prod" | production build → env check → deploy command |
| **refactor** | "refactor", "clean up", "organize", "improve code" | build → tests → no behavioral changes |

---

## Folder Structure (adds to existing)

```
Body-Bridge/
├─ docs/project/
│  ├─ AGENTS.md                              # ✅ exists (includes Hermes runner contract)
│  └─ CODER-LOOP-PLAN.md                     # ← this file
├─ .opencode/
│  ├─ commands/
│  │  ├─ fix-bug.md                          # ✅ exists (Hermes runner only)
│  │  ├─ build-check.md                      # ✅ exists (Hermes runner only)
│  │  ├─ review-change.md                    # ✅ exists (Hermes runner only)
│  │  ├─ collect-evidence.md                 # ✅ exists (Plane.so)
│  │  ├─ create-ticket.md                    # ✅ exists (Plane.so)
│  │  ├─ start-symphony.md                   # ✅ exists (Plane.so)
│  │  ├─ coder-loop.md                       # ← NEW: universal auto-classifying loop
│  │  ├─ frontend-loop.md                    # ← NEW: specialized frontend loop
│  │  ├─ backend-loop.md                     # ← NEW: specialized backend loop
│  │  ├─ bugfix-loop.md                      # ← NEW: specialized bugfix loop
│  │  ├─ error-fix-loop.md                   # ← NEW: specialized error-fix loop
│  │  ├─ feature-add-loop.md                 # ← NEW: specialized feature-add loop
│  │  ├─ feature-delete-loop.md              # ← NEW: specialized feature-delete loop
│  │  ├─ deployment-loop.md                  # ← NEW: specialized deployment loop
│  │  └─ refactor-loop.md                    # ← NEW: specialized refactor loop
│  ├─ skills/                                # ✅ exists (keep)
│  └─ plugins/                               # ✅ exists (keep)
└─ .coder-loop/                              # ← NEW folder
   ├─ missions/
   │  └─ MISSION_TEMPLATE.md                 # ← NEW: structured task format
   ├─ checks/
   │  ├─ _common.md                          # ← NEW: shared validation logic
   │  ├─ frontend.md                         # ← NEW: frontend validation
   │  ├─ backend.md                          # ← NEW: backend validation
   │  ├─ bugfix.md                           # ← NEW: bugfix validation
   │  ├─ error-fix.md                        # ← NEW: error-fix validation
   │  ├─ feature-add.md                      # ← NEW: feature-add validation
   │  ├─ feature-delete.md                   # ← NEW: feature-delete validation
   │  ├─ deployment.md                       # ← NEW: deployment validation
   │  └─ refactor.md                         # ← NEW: refactor validation
   ├─ reports/                               # ← NEW: reports stored here (git-tracked)
   └─ memory/
      ├─ _template.md                        # ← NEW: memory entry format
      ├─ decisions.md                        # ← NEW: key decisions made
      ├─ bugs.md                             # ← NEW: bugs encountered + fixes
      ├─ lessons.md                          # ← NEW: lessons learned
      └─ deploy-notes.md                     # ← NEW: deployment gotchas
```

---

## User Decisions (CONFIRMED)

### ✅ Decision 1: Loop Structure

**Confirmed**: **BOTH** — Universal loop + specialized loops

- Universal `/coder-loop` with auto-classification for quick/mixed tasks
- Specialized loops (`/frontend-loop`, `/backend-loop`, etc.) for focused work
- Universal loop can redirect to specialized loop if confidence is high
- User can choose either based on preference

**Rationale**: 
- Quick fixes: use `/coder-loop` (one-shot, auto-classifies)
- Deep work: use specialized loop (clear intent, focused validation)
- Mixed tasks (frontend + backend): `/coder-loop` handles classification
- Pure tasks: specialized loop saves one inference step

---

### ✅ Decision 2: Report Storage Location

**Confirmed**: **In repo** (`.coder-loop/reports/`) — git-tracked

- All `/coder-loop` and specialized loop reports stored in `.coder-loop/reports/`
- Reports are git-tracked, providing history in commits
- Can reference reports in commit messages and pull requests
- Manual and automated runs use same location

**Rationale**: 
- Easy to review work history without leaving the repo
- Reports travel with the codebase
- Git history provides timeline of changes
- Can correlate commits with reports using commit hashes

**Note**: Hermes runner runs that use `/fix-bug`, `/build-check`, `/review-change` still store reports in `C:\Users\thebe\agent-system\runs\` (per AGENTS.md). Only the new loop commands store in repo.

---

### ✅ Decision 3: Mission Requirement

**Confirmed**: **Hybrid** — Missions for complex tasks, ad-hoc for simple fixes

- Complex tasks (features, multi-file changes, deployment): use `MISSION_TEMPLATE.md`
- Simple tasks (single-file bugs, UI tweaks, quick fixes): ad-hoc prompts accepted
- `/coder-loop` detects complexity and auto-prompts for mission if needed

**Complexity detection rules**:
- Mission required if:
  - Task mentions "feature", "add", "new" + involves 2+ files OR
  - Task involves database schema changes OR
  - Task involves auth, payments, or user data OR
  - Task involves deployment OR
  - User explicitly requests mission-based approach
- Ad-hoc accepted if:
  - Single file fix OR
  - Clear, bounded scope with obvious acceptance criteria

---

### ✅ Decision 4: Integration with Existing Commands

**Confirmed**: **Independent but complementary**

- `/fix-bug`, `/build-check`, `/review-change` remain for Hermes runner (strict workflow)
- `/coder-loop` and specialized loops are for manual interactive sessions (flexible)
- Both sets can share validation logic via `.coder-loop/checks/*.md`
- No calling one from the other — clean separation

**Rationale**:
- Hermes runner needs strict, predictable workflows
- Manual sessions need flexibility and speed
- Shared checks avoid duplication without coupling

---

### ✅ Decision 5: Phase 1 Priority

**Confirmed**: **Full Phase 1** — Add all checks upfront

- Create all loop commands in Phase 1
- Create all validation checks in Phase 1
- Create mission template in Phase 1
- Memory system can be Phase 2 (non-critical for first run)

**Trade-off**: More upfront work, but immediate full coverage.

---

## Implementation Plan

### Phase 1: Full Foundation (All Commands + All Checks)

**Goal**: Complete, testable loop system in one phase.

#### 1. Create folder structure
```
.coder-loop/
├─ missions/
├─ checks/
├─ reports/
└─ memory/
```

#### 2. Create shared validation logic
- `.coder-loop/checks/_common.md` — reusable validation steps (build, typecheck, etc.)

#### 3. Create all validation checks (8 files)
- `frontend.md` — UI, components, screens, styling
- `backend.md` — Convex functions, Express routes, database
- `bugfix.md` — reproduction, root cause, verification
- `error-fix.md` — build/type/runtime errors
- `feature-add.md` — end-to-end feature testing
- `feature-delete.md` — dead code, broken imports
- `deployment.md` — production build, env check, deploy
- `refactor.md` — build, tests, behavior verification

#### 4. Create mission template
- `.coder-loop/missions/MISSION_TEMPLATE.md` — structured task format

#### 5. Create universal loop command
- `.opencode/commands/coder-loop.md` — auto-classifies and delegates

#### 6. Create all specialized loop commands (7 files)
- `frontend-loop.md`
- `backend-loop.md`
- `bugfix-loop.md`
- `error-fix-loop.md`
- `feature-add-loop.md`
- `feature-delete-loop.md`
- `deployment-loop.md`
- `refactor-loop.md`

**Test checklist for Phase 1**:
- [ ] `/coder-loop` classifies frontend → runs frontend validation
- [ ] `/coder-loop` classifies backend → runs backend validation
- [ ] `/frontend-loop` runs frontend validation (no classification)
- [ ] `/backend-loop` runs backend validation (no classification)
- [ ] Mission template produces clear acceptance criteria
- [ ] All validation checks reference correct project commands

---

### Phase 2: Memory & Learning

#### 7. Create memory templates
- `.coder-loop/memory/_template.md` — standard entry format

#### 8. Create memory files
- `decisions.md` — architectural decisions, trade-offs
- `bugs.md` — bugs encountered, root causes, fixes
- `lessons.md` — patterns to avoid, best practices
- `deploy-notes.md` — deployment gotchas, env issues

#### 9. Update loop commands
- Add memory saving step to all loop commands
- Decide what to remember (e.g., always remember bugs, optionally remember decisions)

---

### Phase 3: Hermes Integration

#### 10. Add Hermes runner hook points
- Document how Hermes can trigger `/coder-loop` via arguments
- Add `REPORT_PATH` environment variable support (matches AGENTS.md pattern)
- Ensure reports can be written to `C:\Users\thebe\agent-system\runs\`

#### 11. Add Hermes-specific command (optional)
- Consider `/hermes-coder-loop.md` that enforces stricter reporting
- Or reuse existing `/fix-bug` for Hermes and keep `/coder-loop` for manual

---

### Phase 4: Advanced Features (Later)

#### 12. Automated report summarization
- Weekly/monthly summary of all reports
- Common patterns, recurring issues

#### 13. Integration with Plane.so
- Auto-create tickets for complex missions
- Link reports to tickets

#### 14. Visual testing hooks
- Screenshot comparison (if Playwright/Puppeteer available)
- Visual regression detection

---

## Validation Command Mapping

Here's how each task type maps to your project commands:

| Task type | Pre-validation | Primary validation | Post-validation |
|-----------|---------------|--------------------|-----------------|
| **frontend** | `npx tsc -p tsconfig.json --noEmit` (if passes) | `npm run dev:client` → check browser console | visual verification (manual) |
| **backend** | `npx tsc -p tsconfig.json --noEmit` | `npm run dev:server` / `npm run dev:convex` | test endpoint/function manually |
| **feature-add** | `npm run build` | full stack: `npm run dev:all` → test feature | run Playwright if relevant |
| **feature-delete** | `npx knip` (dead code scan) | `npm run build` | check for broken imports in src/ |
| **bugfix** | reproduce bug | fix → re-run failing path | `npm run build` (regression check) |
| **error-fix** | run failing command | fix → re-run same command | `npm run build` (no new errors) |
| **deployment** | check `.env.production` | `npm run build` | `npx cap sync android` → `./gradlew assembleDebug` |
| **refactor** | `npm run build` | run relevant tests | manual behavior check |

**Note on missing commands** (from AGENTS.md):
- `npm run lint` and `npm run type-check` do NOT exist in package.json
- Use `npx tsc -p tsconfig.json --noEmit` for type checking
- Use `npx knip` for dead code detection

---

## Report Format (Standardized)

Every loop run ends with a report following AGENTS.md reporting shape:

```markdown
# [Loop Name] Report

## Classification
frontend | backend | feature-add | feature-delete | bugfix | error-fix | deployment | refactor

## Original Goal
[Verbatim from user input or mission brief]

## Root Cause / Main Reason
[Brief explanation of why the change was needed or what caused the issue]

## Files Changed
- `src/components/LoginScreen.tsx` — added responsive padding
- `src/styles/globals.css` — updated button height

## What Changed
[Brief description: what you did and why]

## Validation Commands Run
1. `npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0)
2. `npm run dev:client` — **PASS** (no console errors)
3. Manual check — button now properly sized on mobile

## Errors Fixed
- Build error: "Type 'string' is not assignable to type 'number'" in `src/components/LoginScreen.tsx:42`

## Remaining Risks
- None identified

## Manual Testing Needed
- [ ] Test on real Android device (checked emulator only)
- [ ] Verify login flow still works with updated layout

## Next Step
Ready to commit. Suggested commit message: "Fix mobile login button layout"

## Status
✅ Complete — validated and ready
```

---

## Memory File Structure

### `.coder-loop/memory/decisions.md`
Format for each entry:
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
```

### `.coder-loop/memory/bugs.md`
Format for each entry:
```markdown
## [YYYY-MM-DD] [Bug Title]

**Symptom**: [What was the bug?]

**Root Cause**: [What caused it?]

**Fix**: [How was it fixed?]

**Files Changed**: 
- `file1.ts` — change description
- `file2.ts` — change description

**Prevention**: [How to avoid this in the future?]
```

### `.coder-loop/memory/lessons.md`
Format for each entry:
```markdown
## [YYYY-MM-DD] [Lesson Learned]

**Context**: [What happened?]

**Lesson**: [What did we learn?]

**Applicable To**: [What areas does this apply to?]

**Example**: [Concrete example of when to apply this]
```

### `.coder-loop/memory/deploy-notes.md`
Format for each entry:
```markdown
## [YYYY-MM-DD] [Deploy Title]

**Environment**: [prod/staging/dev]

**Steps Taken**:
1. [Step 1]
2. [Step 2]

**Issues Encountered**: [Any problems?]

**Resolution**: [How were they fixed?]

**Post-Deploy Checks**:
- [ ] Check 1 — status
- [ ] Check 2 — status

**Rollback Plan**: [How to revert if needed]
```

---

## Error Handling and Escalation

### When validation fails:

1. **First failure**: Fix and retry (max 3 attempts)
2. **After 3 attempts**: Report "BLOCKED — requires manual review" with:
   - All error messages
   - Steps taken
   - Suggested next action
3. **Forbidden action encountered**: Stop immediately, report "BLOCKED — approval required"

### When to escalate to human:

- Forbidden action would be required (per AGENTS.md)
- Validation fails 3+ times
- Task brief is unclear or ambiguous
- Production secrets or credentials would need editing
- Database schema migration without clear impact analysis

---

## Integration with Hermes Runner

### How Hermes can trigger loops:

Hermes runner can invoke `/coder-loop` by passing task details via `$ARGUMENTS`:

```powershell
# In run-opencode-project.ps1
$task = Get-Content "runs/$runId/task.md"
$env:REPORT_PATH = "runs/$runId/report.md"
opencode /coder-loop $task
```

### Report storage for Hermes:

- Hermes runner runs → reports go to `C:\Users\thebe\agent-system\runs\<runId>\report.md`
- Manual `/coder-loop` runs → reports go to `.coder-loop/reports/` (git-tracked)
- Loop commands detect `REPORT_PATH` env var and use Hermes path if set

### Compatibility with existing Hermes commands:

- `/fix-bug` → remains for Hermes runner (strict AGENTS.md compliance)
- `/build-check` → remains for Hermes runner
- `/review-change` → remains for Hermes runner
- `/coder-loop` → available for both Hermes and manual (flexible)

---

## When to Use Which Command

| Situation | Recommended Command | Why |
|-----------|---------------------|-----|
| Quick single-file fix | `/coder-loop "Fix X in Y"` | One-shot, auto-classifies |
| Multi-file feature work | `/feature-add-loop "Add feature Z"` | Clear intent, feature-specific validation |
| Bug investigation | `/bugfix-loop "Reproduce and fix bug A"` | Bug-specific workflow (reproduce → root cause) |
| Frontend-only work | `/frontend-loop "Update screen B layout"` | Skips classification step |
| Backend-only work | `/backend-loop "Add endpoint C"` | Skips classification step |
| Build error | `/error-fix-loop "Fix TS error in D"` | Error-specific workflow |
| Deployment prep | `/deployment-loop "Prepare prod build"` | Deployment-specific validation |
| Mixed frontend + backend | `/coder-loop "Add feature E (UI + API)"` | Auto-classifies, handles both |
| Unsure of task type | `/coder-loop "Make this change"` | Auto-classifies |
| Hermes automation | `/fix-bug` (existing) or `/coder-loop` | Depends on strictness needed |

---

## Testing Strategy

### Testing the loops themselves:

1. **Unit test each validation check**:
   - Does `frontend.md` reference the correct commands?
   - Does `backend.md` reference the correct commands?
   - Are commands actually runnable?

2. **Integration test each loop command**:
   - `/coder-loop` with simple task → report generated?
   - `/frontend-loop` with frontend task → report generated?
   - All loops produce reports in correct format?

3. **End-to-end test with real repo**:
   - `/coder-loop "Fix one small frontend issue"` → verify report
   - `/feature-add-loop "Add a simple button"` → verify validation runs
   - `/error-fix-loop "Fix one TS error"` → verify error is fixed

### Test file locations:

Create test reports in `.coder-loop/reports/test/` for verification.

---

---

## Git Workflow Integration

### Commit-report correlation:

Every report includes a suggested commit message. When committing:

1. Run the loop: `/coder-loop "Make this change"`
2. Review the report in `.coder-loop/reports/`
3. Copy the suggested commit message from the report
4. Commit with: `git commit -am "[report-name] suggested message"`
5. Report filename format: `YYYY-MM-DD-HHMM-[task-type]-brief-name.md`

Example:
```
.coder-loop/reports/2026-06-19-1430-frontend-fix-mobile-login-button.md
```

### Commit message convention:

```
[loop-name] [brief description]

Loop report: .coder-loop/reports/2026-06-19-1430-frontend-fix-mobile-login-button.md
Classification: frontend
Files: src/components/LoginScreen.tsx, src/styles/globals.css
Validation: tsc (PASS), dev:client (PASS)
```

### Reviewing historical work:

To see what was done for a specific change:
1. Find commit: `git log --all --oneline | grep "frontend"`
2. Find report filename in commit message
3. Read report: `cat .coder-loop/reports/2026-06-19-1430-frontend-fix-mobile-login-button.md`

---

## Continuous Improvement

### Updating the loops themselves:

1. If a validation check is wrong: edit `.coder-loop/checks/[type].md`
2. If a loop workflow is inefficient: edit `.opencode/commands/[loop].md`
3. Commit loop changes with prefix: `[loop-improvement]`
4. Document lessons in `.coder-loop/memory/lessons.md`

### Signs a loop needs improvement:

- Same validation step keeps failing for unrelated reasons
- Agent keeps asking the same clarifying questions
- Reports are too long or missing key information
- User consistently has to override a validation step

### Loop versioning (optional):

If loops need breaking changes:
1. Tag the plan file: Update "Last Updated" with version note
2. Document breaking changes in a `CHANGELOG.md` in `.coder-loop/`
3. Migration guide for old reports to new format

---

## Documentation Updates

### Keeping AGENTS.md in sync:

The new loops reference AGENTS.md for project commands. If AGENTS.md changes:

1. Update validation command mappings in CODER-LOOP-PLAN.md
2. Update check files that reference specific commands
3. Test affected loops with a real task

### New AGENTS.md section (optional):

Add to AGENTS.md under "Hermes Runner Contract":

```markdown
## Coder Loop Commands (added 2026-06)

The repo includes auto-classifying loop commands for manual coding work:

| Command | Purpose | Location |
|---------|---------|----------|
| `/coder-loop` | Universal auto-classifying loop | `.opencode/commands/coder-loop.md` |
| `/frontend-loop` | Frontend-specific loop | `.opencode/commands/frontend-loop.md` |
| `/backend-loop` | Backend-specific loop | `.opencode/commands/backend-loop.md` |
| ... | ... | ... |

See `docs/project/CODER-LOOP-PLAN.md` for full documentation.
```

---

## First-Time Setup

### Initial run to learn the repo:

After files are created, run this first:

```
/coder-loop Inspect this repo and create a short report of the available build, dev, lint, test, Android, backend, and deployment commands. Do not edit code yet.
```

This lets the coder learn your project structure before making any changes.

### First real task:

```
/coder-loop Fix one small visible frontend issue. Inspect first, make the smallest safe change, run validation, and report files changed.
```

Choose an obvious, low-risk issue (e.g., typo, spacing, minor styling).

### First feature (after testing simple fixes):

```
/feature-add-loop Add a simple test component to src/components/. Display "Test Component" and center it on screen.
```

This tests the full feature-add workflow with minimal risk.

---

## What We've Addressed (vs. Original Plan)

| Original | Updated | Why |
|----------|---------|-----|
| One loop or multiple? | **Both** — user wants flexibility | Quick fixes need speed; deep work needs focus |
| Report storage? | **In repo** confirmed | Git-tracked, history in commits |
| Mission requirement? | **Hybrid** confirmed | Complex = mission; simple = ad-hoc |
| Integration approach? | **Independent** confirmed | Clean separation from Hermes commands |
| Phase 1 scope? | **Full Phase 1** confirmed | All checks upfront, immediate full coverage |
| Missing: When to use which command | **Added**: Decision matrix | User needs guidance on loop selection |
| Missing: Error handling | **Added**: Escalation rules | Clear path when things go wrong |
| Missing: Hermes integration | **Added**: Runner hook points | How automation connects to loops |
| Missing: Memory structure | **Added**: File formats | Standardize memory entries |
| Missing: Testing strategy | **Added**: Test checklist | Verify loops work before relying on them |
| Missing: Git workflow | **Added**: Commit-report correlation | How reports connect to commits |
| Missing: Continuous improvement | **Added**: Loop update process | How to improve the system itself |
| Missing: Documentation updates | **Added**: AGENTS.md sync | Keep docs in sync |
| Missing: First-time setup | **Added**: Initial test commands | Safe way to start using loops |

---

## Summary of New Sections Added (vs. Original Plan)

1. **Two-tier command structure** — 9 commands total (1 universal + 8 specialized)
2. **When to use which command** — Decision matrix for command selection
3. **Git workflow integration** — Commit-report correlation, commit message conventions
4. **Continuous improvement** — How to update loops over time
5. **Documentation updates** — Keeping AGENTS.md in sync
6. **First-time setup** — Safe initial test commands
7. **Memory file structures** — Detailed formats for each memory type
8. **Error handling & escalation** — Clear rules for when to escalate to human

---

## Next Steps (Once Report Storage is Decided)

1. Create `.coder-loop/` folder structure
2. Create all 8 validation checks
3. Create mission template
4. Create all 9 loop commands (1 universal + 8 specialized)
5. Create memory templates
6. Test with real tasks in your repo
7. Iterate based on usage

---

## File Paths After Creation

Once approved, the files will be at:

**Commands** (9 files):
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\coder-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\frontend-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\backend-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\bugfix-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\error-fix-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\feature-add-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\feature-delete-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\deployment-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\refactor-loop.md`

**Missions** (1 file):
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\missions\MISSION_TEMPLATE.md`

**Checks** (9 files):
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\_common.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\frontend.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\backend.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\bugfix.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\error-fix.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\feature-add.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\feature-delete.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\deployment.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\refactor.md`

**Memory** (5 files):
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\_template.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\decisions.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\bugs.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\lessons.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\deploy-notes.md`

**Reports** (folder):
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\reports\`

---

## Approval Checklist

**All decisions confirmed — ready for implementation**

- [x] One universal loop + specialized loops
- [x] Report storage: in repo (.coder-loop/reports/)
- [x] Hybrid mission requirement
- [x] Independent integration with existing commands
- [x] Full Phase 1 with all checks

**Status**: ✅ All decisions made — ready to create files

---

**Once report storage is decided, I'll create all files in one batch.**