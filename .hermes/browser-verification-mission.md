# Browser Authentication and Single-Record Runtime Verification

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## MODEL
zai-coding-plan/glm-5.2

## AUTHORITATIVE DEPLOYMENT
* Name: `upbeat-chickadee-781`
* URL: `https://upbeat-chickadee-781.convex.cloud`

## CRITICAL CONSTRAINTS
- Hermes remains coordinator only — OpenCode performs all browser work
- Do NOT commit, push, deploy to production, run migrations, seeds, or Notion imports
- Do NOT start obsolete local Convex
- Do NOT allow any request to `http://127.0.0.1:3210`, `10.0.0.112:3210`, or `groovy-pig-414`
- Do NOT expose credentials or secrets in any report
- Use Playwright directly through OpenCode
- Report exact session ID and model
- Capture screenshots at every required state
- Send screenshots to Hermes for auxiliary vision analysis (save to accessible paths)

---

## Required Runtime Environment

Start the application through the repository's supported development commands.

OpenCode must determine and report:
* Frontend command (likely `npm run dev` or similar)
* Server command, if separate
* Convex target mechanism (should connect to `https://upbeat-chickadee-781.convex.cloud`)
* Local application URL (likely `http://localhost:5173`)
* Environment file used
* Whether the frontend connects to `https://upbeat-chickadee-781.convex.cloud`

**IMPORTANT:** The `.env.local` was modified during the push mission to point at `dev:upbeat-chickadee-781`. Verify this is correct before starting.

---

## Phase 1 — Startup and Connectivity

Verify:
1. Application loads successfully
2. No fatal console errors
3. No Convex connection failure
4. Network requests target `upbeat-chickadee-781`
5. No requests target obsolete local Convex (`127.0.0.1:3210`)
6. No requests target `groovy-pig-414`
7. Current route and page state are recorded
8. Browser viewport is recorded
9. Initial screenshot is captured

Capture: browser console, failed requests, relevant network requests, page URL, page title, screenshot, process logs.

---

## Phase 2 — Account Creation and Sign-In

Create ONE uniquely identified temporary test account through the real UI.

**Do NOT expose credentials in the report.**

Verify:
1. Account creation succeeds
2. Sign-in succeeds
3. Convex identity is propagated
4. A protected function recognizes the authenticated identity
5. Reloading the page preserves the session
6. Signing out removes the session
7. Protected access fails after sign-out

If the application distinguishes trainers from normal users, record the initial role and permissions.

**Do NOT assume that account creation automatically creates a trainer record.**

---

## Phase 3 — Unauthorized User Behavior

Using an authenticated account that is NOT an authorized trainer, attempt:
* `exercises.createDraftExercise`
* `exercises.publishExercise`

Expected result:
* Both operations are rejected
* No exercise record is created
* UI displays a controlled error or denial rather than silently failing
* No partial record remains

Capture console, network response, UI state, and screenshot.

---

## Phase 4 — Authorized Trainer Setup

Use ONLY the approved test mechanism to associate the temporary account with a temporary trainer.

**Do NOT use:** Notion import, legacy migration, seed data, production data.

Use the admin-secret mechanism via CLI:
```powershell
npx convex run trainers:createTrainer --deployment upbeat-chickadee-781 '{"firstName":"BrowserTest","lastName":"Trainer","email":"test_browser_<timestamp>@test.local","isActive":true,"adminSecret":"<REDACTED>"}'
```

Then link the trainer to the authenticated user's profile if the application requires it.

Verify:
* Test trainer marker
* Account-to-trainer linkage method
* Resulting access level
* Database counts before and after setup

---

## Phase 5 — Single-Record Workflow

Through the actual application UI, create exactly ONE draft exercise.

Verify:
1. Exercise Library loads
2. Draft creation succeeds for the authorized trainer
3. Exactly one exercise record is created
4. The exercise is visible only where trainer-scoped rules permit
5. No global catalog fallback appears
6. The exercise initially has expected draft state
7. Publishing succeeds
8. The same record changes to published state
9. No duplicate exercise is created
10. Refresh preserves the record
11. Trainer assignment behavior is correct
12. Cover image behavior: blank allowed, video fallback used when designed, no fabricated URL
13. Video URL behavior is correct
14. Play control appears inside exercise card, not as external overlay (if part of current implementation)

**Capture screenshots at:**
* Exercise Library before creation
* Draft form
* Draft record created
* Published record
* Refreshed state
* Any authorization denial
* Final cleanup state

Save all screenshots to `.hermes/screenshots/` with descriptive filenames.
These will be sent to Hermes auxiliary vision for visual analysis.

---

## Phase 6 — bodyRegion Truth

Determine from REAL UI behavior whether `bodyRegion` is:
* Descriptive metadata only; or
* An actual user-visible filter

**Verify using the UI, NOT source inspection alone.**

If no body-region filter exists:
* Report `bodyRegion` as metadata-only
* Do NOT claim filtering passed
* Remove body-region filtering from acceptance criteria

If a filter exists:
* Exercise it
* Verify correct filtering
* Capture evidence

---

## Phase 7 — Session Lifecycle

Verify:
* Session persists after reload
* Session does NOT persist after explicit sign-out
* Unauthorized access is blocked after sign-out
* Browser storage and cookies contain no obvious exposed secret
* No admin secret is present in browser bundle, requests, local storage, or session storage

**Do NOT report raw token values.**

---

## Phase 8 — Cleanup

Clean up ONLY the temporary records and account created by this mission.

Required final database counts:
* exercises: 0
* trainers: 0
* trainerExercises: 0

Also remove:
* Temporary test account (use `convex/internal/adminAuthReset.ts:deletePasswordUserByEmail`)
* Browser storage state
* Temporary Playwright authentication files

**Do NOT delete real data.**
**Do NOT remove screenshots needed as evidence.**

---

## Required Evidence

Return:
1. OpenCode session and model
2. Exact startup commands
3. Application URL
4. Convex deployment URL observed in network traffic
5. Console error summary
6. Failed request summary
7. Account creation result
8. Sign-in result
9. Identity propagation evidence
10. Unauthorized-user matrix
11. Authorized-trainer matrix
12. Draft creation result
13. Publish result
14. Record-count sequence
15. Refresh/session-persistence result
16. Sign-out result
17. `bodyRegion` conclusion
18. Exercise Library visual findings
19. Screenshot inventory (with paths)
20. Hermes auxiliary vision findings (pending Hermes review)
21. Final database counts
22. Temporary account cleanup result
23. Git status
24. Confirmation that:
    * Production was untouched
    * Obsolete local Convex was untouched
    * No migration, seed, import, deployment, commit, or push occurred
    * No secret or credential was exposed

---

## FINAL VERDICT (exactly one):

`BROWSER AUTH VERIFICATION: PASS — READY FOR ANDROID VERIFICATION`

`BROWSER AUTH VERIFICATION: FAIL — CORRECTIONS REQUIRED`

`BROWSER AUTH VERIFICATION: BLOCKED — <exact blocker>`

---

## REPORT

Write complete report to `.hermes/browser-verification-report.md`
Save all screenshots to `.hermes/screenshots/`