---
name: start-symphony-work
description: Start Symphony workflow for a Plane.so ticket — creates branch, updates ticket state, collects evidence (tests, health, code quality, security, screenshots), and posts evidence report. Triggers on "start work", "symphony", "begin work", "work on ticket", "collect evidence", or "verify ticket".
---

# Start Symphony Work

Orchestrate the full Symphony workflow for a Plane.so ticket: branch creation, state management, evidence collection, and verification.

## When to Use

- User asks to start working on a ticket
- User wants to collect evidence for a ticket
- User says "start symphony", "begin work on BODYBRIDGE-X", "verify ticket"
- After completing work on a ticket, to collect and post evidence

## Workflow

### 1. Evidence-Only Mode (Safe, No Git Changes)

Use when you just want to check/collect evidence without creating branches or changing state:

```bash
# Collect all evidence (tests, health, code quality, security, screenshots)
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --evidence-only

# Skip tests (if dev server isn't running)
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --evidence-only --skip-tests

# Skip screenshots (no browser available)
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --evidence-only --skip-screenshots

# JSON output for programmatic use
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --evidence-only --skip-tests --json
```

### 2. Full Workflow (Branch + State + Evidence)

```bash
# Start work on a ticket — creates symphony/ branch, moves to In Progress
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7

# With custom branch name
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --branch symphony/exercise-filtering

# Skip tests during evidence (dev server not running)
node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-7 --skip-tests
```

### 3. What Happens

**Full workflow (`start-symphony-work`):**
1. Looks up ticket in Plane
2. Creates `symphony/<ticket-slug>` branch (or uses existing)
3. Moves ticket to "In Progress" state
4. Runs evidence collection
5. Posts evidence report as ticket comment
6. If all evidence passes → moves to "Review" (or "Todo" if no Review state)

**Evidence-only (`--evidence-only`):**
1. Looks up ticket in Plane
2. Runs evidence collection
3. Posts evidence report as ticket comment
4. If all evidence passes → moves to "Review" (or "Todo")
5. If any failures → ticket stays in current state

## Evidence Types

| Type | What It Checks | Skip Flag |
|------|---------------|-----------|
| Automated Tests | Playwright test run | `--skip-tests` |
| Health Check | `GET /api/health` on Express server | — |
| Code Quality | `npx knip` dead code scan | — |
| Security Scan | Dependency audit | `--skip-security` |
| Screenshots | Browser screenshots of app | `--skip-screenshots` |

## State Transitions

```
Backlog → Todo → In Progress → Review → Done
```

> **Note**: No "Review" state exists yet in this Plane project. When evidence passes, the ticket moves to "Todo" as a fallback. Create a "Review" state in Plane for proper flow.

## Key Rules

1. **Always run evidence-only first** to verify before making git changes.
2. **Use `--skip-tests`** if the dev server isn't running (Playwright needs the app at port 7770).
3. **Evidence failures keep the ticket in current state** — fix issues and re-run.
4. **Evidence reports are posted as comments** on the Plane ticket with pass/fail summary.
5. **Branch naming**: `symphony/<ticket-slug>` by default.

## Environment

Requires `.env.symphony` with:
- `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`
- `HEALTH_ENDPOINT` (default: `http://localhost:3001/api/health`)
- Dev server on port 7770 for Playwright tests
