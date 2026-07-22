# Exercise Detail Video Playback and Scrolling Implementation Plan

> **For Hermes:** Delegate implementation to a fresh OpenCode agent, verify the resulting diff/build/runtime independently, then hand the rendered application to `body-bridge-visual-qa`. OpenCode must not approve its own visual work.

**Goal:** Make the Exercise Library detail view clearly expose a usable Play Video action/player, allow users to scroll through all exercise details, and pass independent visual and functional QA on mobile, tablet, and desktop.

**Architecture:** Keep Convex as the source of truth for `videoUrl`. Improve the existing detail modal and shared video-player integration rather than creating another competing detail flow. The modal should use a viewport-bounded flex layout with one intentional vertical scroll container, accessible controls, clear video/no-video states, and responsive sizing. Preserve the existing Add to Workout flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Framer Motion, Convex, HTML5 video/iframe embeds, Playwright.

---

## Current Context and Risks Found During Planning

- Repository: `C:\Users\thebe\Downloads\Body-Bridge`
- Branch: `main`
- The worktree is already heavily modified and contains untracked UI files. OpenCode must preserve unrelated work, must not reset/clean/stash the tree, and must keep its edits tightly scoped.
- `src/screens/ExercisesView.tsx` already maps Convex `ex.videoUrl` into the frontend `Exercise` and opens `ExerciseDetailModal` when a card is selected.
- `src/components/ExerciseDetailModal.tsx` is currently untracked and already attempts to render `VideoPlayer`, but it does not provide the explicit, visually obvious Play Video affordance requested by the user.
- The current detail modal intends to scroll using `flex-1 overflow-y-auto`, but its outer dimensions and mobile/desktop height rules need rendered verification; the user reports that details cannot be comfortably continued/scrolled.
- `ExerciseDetailModal` currently calls `useState` only after `if (!exercise) return null;`. OpenCode must review and fix hook ordering so opening/closing the modal cannot trigger a React hooks-order runtime error.
- `VideoPlayer` currently uses callback props through `any`; its declared prop type does not include the callbacks already being passed by the detail modal. OpenCode should normalize the typed interface without broad refactoring.
- A separate `VideoPreviewModal` and a card-level play overlay already exist. Avoid duplicating player behavior or creating conflicting nested modals unless OpenCode can justify it.
- `videoUrl` is optional. A visible Play Video control can only play when the selected Convex record has a valid URL. URLs must never be hardcoded in React code.
- Existing `tests/qa-verify-exercises.spec.ts` uses `networkidle`, which is unreliable for this Convex app. New/updated targeted tests should use `domcontentloaded` plus a concrete UI-ready locator.

## Acceptance Criteria

1. Selecting an exercise card opens a polished detail view.
2. For an exercise with a valid Convex `videoUrl`, the detail view visibly presents a labeled Play Video control—not only an ambiguous icon or hidden hover interaction.
3. Activating Play Video starts or reveals playable media with visible controls; the user can pause, seek where supported, and use fullscreen where supported.
4. YouTube/Vimeo/embed and direct HTML5 video sources continue to use the existing source-resolution path.
5. If `videoUrl` is absent or invalid, the UI shows an honest, intentional “Video unavailable” state and does not render a dead play button.
6. The detail view has a single predictable vertical scrolling region. Users can reach every instruction, metadata section, and the Add to Workout action with wheel, touch, trackpad, and keyboard scrolling.
7. Close remains reachable and usable while content is scrolled; Escape closes the modal; backdrop click behavior is deliberate and does not close when interacting inside the dialog.
8. Background-page scrolling is prevented while the detail modal is open and restored on close.
9. Focus enters the dialog, interactive controls have accessible names, and focus returns to the originating card when closed.
10. Layout has no clipping, overlap, off-screen controls, double-scroll trap, or obscured final content at the required viewports.
11. Existing card selection, filters, pagination, and Add to Workout behavior remain intact.
12. `npm run build` succeeds, targeted Playwright coverage passes, and the browser console has no relevant uncaught errors.
13. Independent `body-bridge-visual-qa` returns PASS with screenshots and interaction evidence.

---

## Task 1: OpenCode Analysis and Scope Lock

**Objective:** Have a fresh OpenCode agent inspect the live implementation and produce a short execution checklist before modifying files.

**Files to inspect:**
- `src/screens/ExercisesView.tsx`
- `src/components/ExerciseDetailModal.tsx`
- `src/components/VideoPreviewModal.tsx`
- `src/components/VideoPlayer.tsx`
- `src/utils/videoSource.ts`
- `src/types.ts`
- `src/index.css`
- `convex/schema.ts`
- `convex/exercises.ts`
- `tests/qa-verify-exercises.spec.ts`
- `playwright.config.*`

**OpenCode delegation command:** Run a fresh bounded agent from the repository with `opencode run --pure '<full task prompt>'`. Do not use a second concurrent OpenCode session in the same worktree.

**Required OpenCode prompt content:**

```text
Goal: Repair and improve the Body Bridge Exercise Library detail experience so a user can clearly play an exercise video and scroll through all details. Work only in C:\Users\thebe\Downloads\Body-Bridge.

First inspect the listed files and current git diff. Report the smallest safe implementation approach, then implement it in this same run.

Constraints:
- Preserve all existing uncommitted and untracked work. Never reset, clean, stash, or overwrite unrelated changes.
- Keep URLs and external references in Convex; never hardcode a sample video URL in React or tests.
- Reuse the existing ExerciseDetailModal/VideoPlayer architecture; avoid adding another duplicate modal.
- Preserve Add to Workout, filters, pagination, and card selection.
- Fix React hook ordering and TypeScript callback typing if confirmed.
- Use accessible dialog/media controls and responsive styling.
- Do not commit or push.
- OpenCode may provide implementation evidence but must not claim final visual approval.

Validation:
- Verify at least one selected Jasmine Hensley exercise has a valid Convex videoUrl using a read-only query.
- Run npm run build.
- Add/run focused Playwright tests for detail opening, visible Play Video control, playback evidence, scrolling to the final action, closing, and the no-video state where reproducible.
- Use domcontentloaded plus concrete UI locators, not networkidle.
- Print exact files changed, exact commands/results, and the final git diff for only the files touched.
```

**Coordinator verification after OpenCode:**
- Compare `git status --short` before/after.
- Inspect `git diff --` for each claimed file.
- Reject broad unrelated formatting or generated-artifact changes.

---

## Task 2: Stabilize the Shared Video Player Contract

**Objective:** Ensure direct videos and embeds expose predictable, typed readiness/error/playback behavior.

**Likely files:**
- Modify: `src/components/VideoPlayer.tsx`
- Modify only if necessary: `src/utils/videoSource.ts`
- Modify only if necessary: `src/types.ts`

**Implementation requirements:**
1. Declare supported callbacks in the `VideoPlayer` prop type instead of casting callback access through `any`.
2. Provide a way for the detail modal to distinguish initial, loading, ready, playing, and error/unavailable states.
3. Preserve the existing resolver for HTML5, YouTube, Vimeo, and iframe sources.
4. Use stable accessible titles/labels that include the exercise name where practical.
5. Do not infer successful playback merely from iframe load; tests and UI must distinguish “embed rendered” from stronger playback evidence when browser/provider limitations apply.

**Validation:**
- TypeScript/build catches no prop mismatch.
- Direct-video controls are visible.
- Embed source renders without a duplicate player.
- Invalid/empty source reaches a non-broken fallback state.

---

## Task 3: Build the Detail-View Play Experience

**Objective:** Add a clearly visible Play Video experience inside the selected exercise detail view.

**Likely files:**
- Modify: `src/components/ExerciseDetailModal.tsx`
- Modify only if integration requires it: `src/screens/ExercisesView.tsx`
- Reuse: `src/components/VideoPlayer.tsx`

**Implementation requirements:**
1. Move all hooks above conditional returns or render the modal shell in a hook-safe pattern.
2. Add semantic dialog attributes (`role="dialog"`, `aria-modal`, labelled title) and accessible close/play controls.
3. When a valid `videoUrl` exists, show an obvious labeled Play Video button with a play icon and strong contrast before playback.
4. On activation, reveal/start the resolved media player with controls. If autoplay is blocked, keep the player and native/provider controls usable rather than reporting false success.
5. Add clear loading and media-error feedback.
6. When no URL exists, show an intentional Video unavailable presentation; no dead button.
7. Preserve exercise image/poster where it improves the pre-play state.
8. Keep the Add to Workout action available after the detail content.
9. Remove unused state/imports and debugging `console.log` statements related to this flow.

**Validation:**
- Play is visible without hover.
- Play activation visibly changes state.
- Media controls are not covered by close/difficulty overlays.
- No React hook-order errors occur when opening, closing, and opening a different exercise.

---

## Task 4: Fix Scrolling, Responsive Layout, and Modal Interaction

**Objective:** Make all detail content reachable and visually clean across phone, tablet, and desktop.

**Likely files:**
- Modify: `src/components/ExerciseDetailModal.tsx`
- Modify only if shared utility is needed: `src/index.css`

**Implementation requirements:**
1. Bound the dialog to the visual viewport (`100dvh`-aware on mobile) with safe outer spacing.
2. Use one `min-h-0 flex-1 overflow-y-auto overscroll-contain` content region or an equivalent proven layout.
3. Ensure the final content has enough bottom padding for mobile browser chrome and app navigation/safe areas.
4. Keep close accessible while scrolled, either in a sticky header or fixed within the dialog without covering media controls.
5. Prevent document/body scroll while open and restore it during cleanup.
6. Support wheel, touch, PageDown/arrow-key scrolling, Escape close, and focus return.
7. Avoid nested `<button>` structures and invalid interactive-element nesting.
8. Verify long instructions, short details, and no-video states.

**Required viewports:**
- Mobile: `390x844`
- Small mobile: `360x800`
- Tablet: `768x1024`
- Desktop: `1440x900`

---

## Task 5: Add Focused Automated Coverage

**Objective:** Prove the requested interaction and scrolling behavior without depending only on screenshots.

**Files:**
- Prefer create: `tests/exercise-detail-video.e2e.spec.ts`
- Modify existing exercise test only if shared setup makes that safer: `tests/qa-verify-exercises.spec.ts`

**Test cases:**
1. Navigate/authenticate to Exercise Library and wait for a concrete library-ready anchor.
2. Select an exercise known from live Convex data to have `videoUrl`.
3. Assert the dialog, exercise title, and labeled Play Video control are visible.
4. Click Play Video and assert a visible `video` or `iframe` player with controls/usable embed state.
5. For direct HTML5 media, call `play()` only when browser policy permits and assert `paused === false` or advancing `currentTime`; otherwise record the exact browser limitation and verify manual controls remain available.
6. Scroll the modal content container to the bottom and assert the last instruction/final Add to Workout control is visible.
7. Assert the background page does not scroll while the dialog is open.
8. Close via Escape and verify focus returns to the selected card.
9. Open/close/open again to catch hook-order or stale-state errors.
10. Verify a no-video exercise has the unavailable state and no Play Video button, if such a record exists in live seed data.
11. Capture console/page errors and fail on relevant uncaught exceptions.

**Commands:**
```bash
npm run build
npx playwright test tests/exercise-detail-video.e2e.spec.ts --project=chromium
```

**Expected:** Exit code `0`; all targeted assertions pass. A test may not hardcode an external media URL into frontend code or mutate production data.

---

## Task 6: Coordinator Runtime and Diff Verification

**Objective:** Independently verify OpenCode’s implementation evidence before visual acceptance.

**Steps:**
1. Inspect touched files and diff; confirm unrelated dirty files were preserved.
2. Run `npm run build` independently.
3. Start Body Bridge as separate managed services when needed:
   - `npm run dev:server`
   - `npm run dev:convex`
   - `npm run dev:client`
4. Verify live endpoints:
   - Client: `http://localhost:7770/` returns `200`.
   - Convex: `http://127.0.0.1:3210/version` returns `200`.
   - Express: port `3001` is listening; `/` may validly return `404`.
5. Run the focused Playwright spec against the live stack.
6. Query live local Convex data read-only to confirm at least one Jasmine exercise has a non-empty `videoUrl`; do not claim a playback feature is verified using a record without video data.
7. Inspect browser console/runtime failures during the flow.

**Status after this task:** `IMPLEMENTED — VISUAL QA PENDING`

---

## Task 7: Independent Visual QA Handoff

**Objective:** Dispatch the implemented revision to the independent `body-bridge-visual-qa` profile. OpenCode cannot perform this acceptance step.

Use this handoff after implementation details are known; replace every bracketed field with real evidence.

```text
Perform independent visual and functional acceptance testing for the following Body Bridge change.

Parent implementation task: exercise-detail-video-scroll-[timestamp]
Feature: Exercise Detail Play Video control, media playback, and scrollable responsive details
Repository: C:\Users\thebe\Downloads\Body-Bridge
Branch or revision: main, dirty worktree; inspect the exact supplied diff/revision [revision or diff artifact]
Files changed: [exact files]
Implementation summary: [exact summary]

Install command: npm install (only if dependencies are missing; no new dependency is expected)
Start commands:
- npm run dev:server
- npm run dev:convex
- npm run dev:client
Preview URL: http://localhost:7770/
Backend requirements: Express on 3001; local Convex backend on 3210 with functions/client connectivity on the configured local port
Authentication or seed-data requirements: Use the available local test account/auth flow. Jasmine Hensley exercise records must be present. Select at least one exercise confirmed to have a valid Convex videoUrl and one without videoUrl if available. Do not expose secrets.
Platform requirement: Browser only unless a Capacitor-specific regression is discovered. Test Chromium at minimum.

Routes to inspect:
1. Exercise Library reached through the application’s Exercises navigation
2. Selected exercise detail modal

Required user flow:
1. Load the live application and navigate to Exercise Library.
2. Select an exercise card that has a confirmed videoUrl.
3. Verify a clear labeled Play Video control is visible in the detail view without hover.
4. Activate Play Video and verify the actual rendered player/controls and the strongest playback evidence available.
5. Scroll from the top of the detail view to its final details/Add to Workout action.
6. Close with Escape and the visible close control; verify focus/interaction remains usable.
7. Repeat with long content and, if available, an exercise without videoUrl.

Required states:
- Default detail view
- Pre-play
- Video loading
- Playing or provider-ready/manual-play state
- Video error/unavailable
- Long-content scrolled top/middle/bottom
- No-video fallback
- Focused controls
- Mobile
- Tablet
- Desktop

Viewports:
- Small mobile: 360x800
- Mobile: 390x844
- Tablet: 768x1024
- Desktop: 1440x900

Expected visual result:
1. Play Video is obvious, labeled, high-contrast, and not dependent on hover.
2. Media/player controls are visible, legible, and not overlapped by close/badges.
3. Modal hierarchy, spacing, typography, and dark premium styling are coherent.
4. The user can visually and physically reach every detail and the final action.
5. There is no clipping, overflow, double-scroll trap, off-screen content, or obscured safe-area content.
6. The no-video state looks intentional and has no dead action.

Expected functional result:
1. Card selection opens the correct exercise detail.
2. Play activation produces usable media playback/player controls from the Convex URL.
3. Scroll works with wheel/touch/keyboard as appropriate.
4. Background page remains locked while the modal is open.
5. Close and Escape work; no relevant console/runtime errors occur.
6. Existing Add to Workout behavior remains available.

Reference design or screenshots:
- No external mockup supplied. Compare against existing Body Bridge premium dark-theme components and the acceptance criteria above.
- Existing screenshots/evidence: [paths]

Acceptance criteria:
1. Address all 13 acceptance criteria in the implementation plan individually.
2. Capture screenshots at top and bottom of the detail modal for every required viewport.
3. Capture pre-play and post-play/player-visible evidence for the video exercise.
4. Record browser-console and runtime findings.
5. Do not infer playback from source code or DOM presence alone.

Known risks:
1. The worktree contains unrelated existing modifications and untracked files.
2. iframe providers may restrict autoplay; distinguish a provider policy limitation from a broken player.
3. Convex `videoUrl` is optional and live data must be selected deliberately.
4. Mobile viewport height and nested flex overflow are the highest-risk visual areas.

Build results: [real output]
Automated-test results: [real output]
Relevant logs: [real output]
Known limitations: [real limitations]
Previous QA failures/corrections: [if any]

Inspect the actual rendered application. Check interactions, browser console, runtime behavior, responsive layouts, accessibility/DOM evidence, and visual presentation. Capture evidence. Return PASS, FAIL, or BLOCKED with route, viewport, reproduction steps, expected/actual results, severity, screenshot paths, and criterion-by-criterion findings.
```

**Decision loop:**
- PASS → Coordinator validates coverage/evidence and reports `VISUAL QA PASSED — READY FOR HUMAN REVIEW`.
- FAIL → Preserve the entire defect report, delegate exact defects back to a fresh OpenCode correction run, rebuild/retest, and dispatch a new independent visual review.
- BLOCKED → Report the exact blocker, resolve the smallest prerequisite, and rerun visual QA.
- If `body-bridge-visual-qa` cannot be dispatched → use auxiliary browser/image vision for interim evidence and report `IMPLEMENTED — INDEPENDENT VISUAL QA BLOCKED`; do not declare completion.

---

## Files Likely to Change

- `src/components/ExerciseDetailModal.tsx`
- `src/components/VideoPlayer.tsx`
- `src/screens/ExercisesView.tsx` only if required for focus return/integration
- `src/index.css` only if a reusable scrollbar/safe-area utility is required
- `tests/exercise-detail-video.e2e.spec.ts` (new, preferred)

Avoid schema/data changes unless read-only verification proves the selected local Jasmine records lack expected URLs and a separate, explicitly approved data task is required.

## Final Human Gate

Even after independent visual PASS, the state is `VISUAL QA PASSED — READY FOR HUMAN REVIEW`. Only the human’s approval changes the state to `HUMAN APPROVED — COMPLETE`.
