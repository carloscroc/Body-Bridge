# Body Bridge Coder Loop Plan

> **Status**: Draft for Review  
> **Created**: June 19, 2026  
> **Purpose**: Create a unified coder loop for frontend, backend, bugs, errors, features, and deployment work.

---

## Executive Summary

You want a **single flexible loop** that can handle any coding task you throw at it:
- Frontend work (UI, components, screens, styling)
- Backend work (API routes, Convex functions, database logic)
- Adding features
- Deleting features
- Fixing bugs
- Fixing errors (build, type, runtime)
- Deployment tasks

The plan is to **augment your existing OpenCode setup** with:
1. A new `coder-loop` command that wraps and extends your current commands
2. Task classification logic built into the loop
3. Validation checks for each task type
4. Standardized reporting format
5. Simple mission templates for structured requests

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

✅ Tech stack documented:
- React 19 + Vite frontend (`src/`)
- Express API (`server/`)
- Convex backend (`convex/`)
- Android via Capacitor

### What's missing (GAPS):

❌ No **universal task classifier** — each command assumes one task type
❌ No **frontend-specific validation** (run app, check console, visual verification)
❌ No **backend-specific validation** (test Convex functions, verify API endpoints)
❌ No **feature-add validation** (end-to-end feature testing)
❌ No **feature-delete validation** (check for dead imports, broken routes)
❌ No **deployment validation** (env variables, production build, deploy command verification)
❌ No **mission template** — requests are ad-hoc, not structured
❌ No **memory of past decisions** — bugs, lessons learned, deploy notes

---

## Proposed Loop Architecture

### The Loop Flow

```
Receive task → Classify → Read rules → Inspect → Plan → Edit → Validate → Fix if needed → Report → Remember
```

### Task Types (auto-detected)

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
│  ├─ AGENTS.md                          # ✅ exists
│  └─ CODER-LOOP-PLAN.md                 # ← this file
├─ .opencode/
│  ├─ commands/
│  │  ├─ fix-bug.md                      # ✅ exists
│  │  ├─ build-check.md                  # ✅ exists
│  │  ├─ review-change.md                # ✅ exists
│  │  ├─ collect-evidence.md             # ✅ exists
│  │  ├─ create-ticket.md                # ✅ exists
│  │  ├─ start-symphony.md               # ✅ exists
│  │  └─ coder-loop.md                   # ← NEW: universal loop command
│  ├─ skills/                            # ✅ exists (keep)
│  └─ plugins/                           # ✅ exists (keep)
└─ .coder-loop/                          # ← NEW folder
   ├─ missions/
   │  └─ MISSION_TEMPLATE.md             # ← NEW: structured task format
   ├─ checks/
   │  ├─ frontend.md                     # ← NEW: frontend validation
   │  ├─ backend.md                      # ← NEW: backend validation
   │  ├─ bugfix.md                       # ← NEW: bugfix validation
   │  ├─ error-fix.md                    # ← NEW: error-fix validation
   │  ├─ feature-add.md                  # ← NEW: feature-add validation
   │  ├─ feature-delete.md               # ← NEW: feature-delete validation
   │  └─ deployment.md                   # ← NEW: deployment validation
   ├─ reports/                           # ← NEW: reports stored here
   └─ memory/
      ├─ decisions.md                    # ← NEW: key decisions made
      ├─ bugs.md                         # ← NEW: bugs encountered + fixes
      ├─ lessons.md                      # ← NEW: lessons learned
      └─ deploy-notes.md                 # ← NEW: deployment gotchas
```

---

## Implementation Plan

### Phase 1: Foundation (Start Here)

Create the minimal working loop first:

1. **Create `.coder-loop/` folder structure**
2. **Create `MISSION_TEMPLATE.md`** — simple mission format
3. **Create `coder-loop.md` command** — main loop with classification
4. **Create one check file** — `checks/frontend.md` (most common task type)

Test with: `/coder-loop Fix one small frontend issue. Inspect, plan, fix, validate, report.`

### Phase 2: Validation Checks

Add specialized validation:

5. **Create `checks/backend.md`** — for Convex/Express work
6. **Create `checks/bugfix.md`** — for bug reproduction + root cause
7. **Create `checks/error-fix.md`** — for build/type errors
8. **Create `checks/feature-add.md`** — end-to-end feature testing
9. **Create `checks/feature-delete.md`** — dead code cleanup validation

### Phase 3: Memory & Learning

Add persistent memory:

10. **Create `memory/` template files**
11. **Update `coder-loop.md`** to save decisions/lessons after each task

### Phase 4: Advanced Features (Later)

12. **Create `checks/deployment.md`** — production deployment validation
13. **Add automated report summarization**
14. **Optional: Split into `/frontend-loop`, `/backend-loop`, etc.** (only if needed)

---

## Key Design Decisions (Open for Review)

### Decision 1: One universal loop vs. multiple specialized loops

**My recommendation**: Start with **one universal loop** (`/coder-loop`).

**Why**:
- Your work varies constantly (frontend today, backend tomorrow, bugfix later)
- Single loop reduces context switching
- Easier to maintain and iterate
- Can always split later if patterns emerge

**Alternative** (if you disagree):
- Create `/frontend-loop`, `/backend-loop`, `/bugfix-loop`, `/deploy-loop`
- Each has specialized validation steps built-in
- More upfront work but less conditional logic

**Your call**: Which approach do you prefer?

---

### Decision 2: Where to store reports

**Option A**: `.coder-loop/reports/` (in repo, git-tracked)
- Pros: History in git, easy to review, can reference in commit messages
- Cons: Repo grows over time, may include sensitive info

**Option B**: Outside repo (`C:\Users\thebe\agent-system\runs\`, as AGENTS.md suggests)
- Pros: Keeps repo clean, matches existing Hermes runner pattern
- Cons: Not in git, harder to find old reports

**My recommendation**: **Option B** — follow the Hermes runner pattern.

**Why**: You already have `C:\Users\thebe\agent-system\runs\` for Hermes-launched work. Keep manual `coder-loop` runs there too for consistency.

---

### Decision 3: Mission-based vs. ad-hoc prompts

**Option A**: Require missions (structured template)
- Pros: Clear acceptance criteria, less ambiguity, better tracking
- Cons: More overhead for quick fixes

**Option B**: Accept ad-hoc prompts (what you use now)
- Pros: Fast, less friction
- Cons: Higher risk of misunderstanding, unclear success criteria

**My recommendation**: **Hybrid**:
- Use `MISSION_TEMPLATE.md` for complex tasks (features, multi-file changes, deployment)
- Allow ad-hoc prompts for quick fixes (single-file bugs, simple UI tweaks)
- The `coder-loop` command detects complexity and auto-prompts for a mission if needed

---

### Decision 4: How to integrate with existing OpenCode commands

**Option A**: `coder-loop.md` calls existing commands as sub-steps
- Example: `/coder-loop` → internally runs `/fix-bug` for bugs
- Pros: Reuses existing work, single source of truth
- Cons: May be overkill for simple tasks

**Option B**: `coder-loop.md` is independent, existing commands stay as-is
- Pros: Clean separation, can use either
- Cons: Some logic duplication

**My recommendation**: **Option B** (independent, complementary).
- `/fix-bug` is for Hermes runner (strict workflow)
- `/coder-loop` is for your manual interactive sessions (flexible)
- They can share logic via `.coder-loop/checks/*.md`

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

---

## Report Format (Standardized)

Every `coder-loop` run ends with a report:

```markdown
# Coder Loop Report

## Classification
frontend | backend | feature-add | feature-delete | bugfix | error-fix | deployment | refactor

## Original Goal
[Verbatim from user input]

## Files Changed
- `src/components/LoginScreen.tsx` — added responsive padding
- `src/styles/globals.css` — updated button height

## What Changed
[Brief description: what you did and why]

## Validation Commands Run
1. `npx tsc -p tsconfig.json --noEmit` — **PASS**
2. `npm run dev:client` — **PASS** (no console errors)
3. Manual check — button now properly sized on mobile

## Errors Fixed
- Build error: "Type 'string' is not assignable to type 'number'"

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

## What I Need From You

Before I create the files, please confirm or adjust:

1. **One universal loop or multiple?**
   - [ ] One loop (`/coder-loop`) with auto-classification
   - [ ] Multiple loops (`/frontend-loop`, `/backend-loop`, etc.)

2. **Report storage location?**
   - [ ] In repo (`.coder-loop/reports/`)
   - [ ] Outside repo (`C:\Users\thebe\agent-system\runs\`)

3. **Mission requirement?**
   - [ ] Always require mission template
   - [ ] Hybrid (complex = mission, simple = ad-hoc)

4. **Integration with existing commands?**
   - [ ] `coder-loop` calls existing commands as sub-steps
   - [ ] Independent, complementary approach

5. **Priority for Phase 1?**
   - [ ] Start with just `coder-loop.md` + `MISSION_TEMPLATE.md`
   - [ ] Add all checks in Phase 1 (more upfront work)
   - [ ] Focus on frontend validation first (your most common task type)

6. **Anything else?**
   - Any task type I missed?
   - Any project-specific quirks not in AGENTS.md?
   - Any tools I should know about (Convex CLI, Playwright, etc.)?

---

## Next Steps (Once You Approve)

1. I'll create the folder structure
2. I'll create the files based on your choices above
3. I'll provide the file paths so you can review them
4. You can test with: `/coder-loop Fix one small issue` (or whatever you prefer)

---

## File Paths After Creation

Once you approve, the files will be at:

- `C:\Users\thebe\Downloads\Body-Bridge\.opencode\commands\coder-loop.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\missions\MISSION_TEMPLATE.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\frontend.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\backend.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\bugfix.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\error-fix.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\feature-add.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\feature-delete.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\checks\deployment.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\decisions.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\bugs.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\lessons.md`
- `C:\Users\thebe\Downloads\Body-Bridge\.coder-loop\memory\deploy-notes.md`

---

## Questions for You

1. **One loop or many?** Which approach feels right for how you actually work?

2. **Where should reports go?** Do you want them in git or outside the repo?

3. **Do you want to test this now** or review the plan more first?

4. **Any specific task type** you work on most often that I should prioritize in the checks?

5. **Do you want me to challenge any assumptions** here, or does this plan align with your needs?

---

**Reply with your choices and I'll start creating the files.**