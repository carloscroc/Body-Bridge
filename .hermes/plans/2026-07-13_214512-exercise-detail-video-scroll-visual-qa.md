# Exercise Detail Video Playback and Scrollable Layout Implementation Plan

> **For Hermes:** Coordinate implementation through a fresh OpenCode worker, then require independent acceptance from `body-bridge-visual-qa`. OpenCode must not approve its own visual work.

**Goal:** Make selecting an exercise-library card open a polished, scrollable exercise-detail experience with a clearly visible play control and a video player that actually plays the exercise’s Convex-sourced video.

**Architecture:** Keep Convex as the source of truth for `videoUrl`, use one canonical exercise-detail presentation rather than competing detail/video modals, and make the details body independently scrollable while essential controls remain reachable. The implementation worker must first audit the existing partial/uncommitted video work, preserve unrelated changes, then repair or consolidate it. Automated checks prove compilation and covered behavior; `body-bridge-visual-qa` independently proves rendered visibility, usability, playback, scrolling, and responsiveness.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Convex, Playwright, browser visual QA.

---

## Current Context Discovered

- Repository: `C:\Users\thebe\Downloads\Body-Bridge`
- Primary integration: `src/screens/ExercisesView.tsx`
- Existing detail implementations:
  - `src/components/ExerciseDetailModal.tsx`
  - `src/screens/ExerciseDetail.tsx`
  - `src/components/VideoPreviewModal.tsx`
  - `src/components/VideoPlayer.tsx`
  - `src/utils/videoSource.ts`
- `ExercisesView.tsx` already maps Convex `ex.videoUrl` into the frontend `Exercise` model.
- The worktree is already dirty and contains overlapping, uncommitted exercise/video changes. OpenCode must inspect `git status` and `git diff` first and must not reset, discard, or overwrite unrelated human/agent work.
- There are signs of incomplete or conflicting partial implementation: multiple video/detail modal paths, duplicate backup/new files, mismatched video-player prop usage, and detail layouts whose scroll/play behavior has not been independently verified.
- Video URLs must remain in Convex. Do not hardcode external URLs in React code.

## Acceptance Criteria

1. Selecting an exercise card opens the intended exercise-detail UI.
2. An exercise with a valid `videoUrl` shows an obvious, labeled, accessible play/watch control without requiring hover.
3. Activating the control opens or starts the video and the video visibly plays with usable native/embed controls.
4. YouTube, Vimeo, and direct video-file URLs supported by `resolveVideoSource()` render through the correct player mode.
5. Exercises without `videoUrl` do not show a broken player or dead play button; they show an intentional image/fallback state.
6. The detail content can be scrolled to the final detail/action on mobile, tablet, and desktop without clipping or trapping content.
7. Close/back controls remain reachable; keyboard Escape and focus behavior are handled for modal presentation where applicable.
8. Opening/closing details or playback does not leave body scrolling locked.
9. No nested interactive controls, React hook-order violations, TypeScript errors, console errors, or obvious runtime errors remain.
10. Existing “Add to Workout,” search, sorting, category, pagination, and exercise-card behavior continue to work.
11. Video URLs are read from Convex only; no production data is modified and no URL is hardcoded in UI source.
12. Independent visual QA returns PASS at the required viewports before the status can become ready for human review.

---

## Phase 0: Safe Baseline and Ownership Audit

### Task 0.1: Inspect the dirty worktree before editing

**Owner:** OpenCode

**Files/commands:**
- Run `git status --short --branch`.
- Run focused diffs for:
  - `src/screens/ExercisesView.tsx`
  - `src/components/ExerciseDetailModal.tsx`
  - `src/components/VideoPreviewModal.tsx`
  - `src/components/VideoPlayer.tsx`
  - `src/screens/ExerciseDetail.tsx`
  - `src/utils/videoSource.ts`
  - relevant tests

**Requirements:**
- Identify which edits are pre-existing.
- Do not use `git reset`, `git checkout --`, `git clean`, or destructive equivalents.
- Do not delete `.backup`/`.new` files until their contents are compared and the correct canonical implementation is known.
- Report the baseline and proposed ownership boundary before implementation.

### Task 0.2: Trace the actual card-to-detail route

**Owner:** OpenCode

**Inspect:**
- `src/screens/ExercisesView.tsx`
- `src/App.tsx`
- `src/screens/ExerciseDetail.tsx`
- `src/components/ExerciseDetailModal.tsx`
- `src/components/VideoPreviewModal.tsx`

**Output:**
- Document what currently opens on a card click.
- Determine whether the canonical UX should be the existing full detail screen or the detail modal.
- Choose one detail path for library-card selection and one playback mechanism; remove duplicate/conflicting runtime paths only when safe.

---

## Phase 1: OpenCode Planning (`/gplan`)

### Task 1.1: Produce a focused implementation checklist

**Owner:** Fresh OpenCode worker

**Planning requirements:**
- Inventory existing player source handling and supported URL types.
- Identify current TypeScript/React defects before feature changes.
- Define the scroll container and height strategy for each viewport.
- Define play-control placement, label, hit target, loading state, playback error state, and no-video state.
- Define modal accessibility: dialog semantics, close control, Escape, focus entry/return, backdrop behavior, and body-scroll cleanup.
- Specify the smallest set of files to modify; avoid introducing another detail/player component unless existing components cannot be safely repaired.
- Specify Playwright coverage and test selectors.

**Gate:** Hermes reviews the plan against all acceptance criteria before allowing `/geng`.

---

## Phase 2: OpenCode Implementation (`/geng`)

### Task 2.1: Repair and standardize the reusable video player

**Likely file:** `src/components/VideoPlayer.tsx`

**Requirements:**
- Use one typed prop API consistently (`videoUrl` or another single canonical name).
- Type all playback lifecycle callbacks instead of accessing them through `any`.
- Keep YouTube/Vimeo/embed sources in an iframe and direct file sources in `<video>`.
- Preserve `playsInline`, controls, and fullscreen capability.
- Provide observable loading/ready/error behavior to the detail UI.
- Remove temporary debug logging from final production code.
- Add accessible titles/labels that include the exercise name where practical.

### Task 2.2: Consolidate exercise-detail and playback behavior

**Likely files:**
- Modify: `src/components/ExerciseDetailModal.tsx`
- Modify: `src/screens/ExercisesView.tsx`
- Possibly modify: `src/screens/ExerciseDetail.tsx`
- Possibly remove from runtime: `src/components/VideoPreviewModal.tsx` if it is redundant

**Requirements:**
- Card selection opens the canonical detail UI.
- Add a highly visible play/watch-demo control within the detail UI for records with `videoUrl`.
- The play control must remain visible on touch devices and must not depend on hover.
- Clicking the control must start/open playback; do not require a second hidden action.
- Avoid nested `<button>` elements on exercise cards.
- Reset loading/error/play state when changing or closing the selected exercise.
- Correct any conditional-hook or prop-contract problems found in the partial implementation.
- Preserve “Add to Workout” behavior.

### Task 2.3: Make the detail UI genuinely scrollable

**Likely file:** `src/components/ExerciseDetailModal.tsx` or the selected canonical detail screen

**Requirements:**
- Use a viewport-safe outer container (`100dvh`/bounded modal height as appropriate).
- Use `min-h-0` on flex ancestors and `overflow-y-auto` on the intended content pane so scrolling works rather than being clipped.
- Account for mobile safe areas and the app’s bottom navigation/action area.
- Keep the close control reachable.
- Ensure the final instructions and “Add to Workout” action can be reached by scrolling.
- Prevent horizontal overflow and preserve readable spacing at narrow widths.
- Restore body scroll after all close/unmount paths.

### Task 2.4: Handle no-video and playback-error states

**Likely files:**
- `src/components/ExerciseDetailModal.tsx`
- `src/components/VideoPlayer.tsx`

**Requirements:**
- No `videoUrl`: show image/fallback and omit or disable the play control with clear intent.
- Invalid/unplayable URL: show a visible error message and a retry/close path rather than a permanent spinner or blank region.
- Never substitute a hardcoded sample URL in UI code.

---

## Phase 3: Automated QA by OpenCode (`/gqa`)

### Task 3.1: Add focused tests

**Likely tests:**
- Create or modify a focused Playwright spec such as `tests/exercise-detail-video.e2e.spec.ts`.
- Add a focused unit test for `resolveVideoSource()` if current coverage is absent and the project test setup supports it.

**Scenarios:**
1. Open Library and select a card with a valid Convex `videoUrl`.
2. Verify detail opens and the play/watch control is visible without hover.
3. Activate play and verify the actual video/iframe is visible and enters a playable/playing state using source-appropriate evidence.
4. Scroll from the top of details to the final instruction/action and verify it becomes visible.
5. Close playback and details; verify the Library remains usable and body scrolling is restored.
6. Exercise without video: verify no broken player/dead control.
7. Verify Add to Workout still invokes the existing flow.
8. Exercise modal keyboard behavior: Escape and focus return.
9. Run at mobile and desktop viewport sizes.

**Data rule:**
- Use an existing local Convex exercise with a real `videoUrl` where possible.
- If local seed data lacks one, add test/seed data through the approved local Convex path only. Do not touch production and do not hardcode the URL in React components.

### Task 3.2: Run quality gates

**Commands:**
- `npm run build`
- Focused Playwright spec for exercise detail/video
- Any focused source-resolution/unit test
- Start local stack with `npm run dev` and verify ports/endpoints are genuinely reachable

**Evidence required from OpenCode:**
- Exact files changed
- Exact commands and exit codes
- Focused test counts
- Build output summary
- Test exercise name/ID and confirmation that its `videoUrl` came from local Convex
- Browser console/runtime errors observed
- Remaining limitations

**Status after this phase:** `IMPLEMENTED — VISUAL QA PENDING`

---

## Phase 4: Hermes Independent Verification

### Task 4.1: Review OpenCode’s real changes

**Owner:** Hermes

**Checks:**
- Inspect `git diff` for touched files.
- Confirm no unrelated work was overwritten.
- Confirm no URL is hardcoded in frontend code.
- Confirm one coherent detail/playback path remains.
- Independently rerun `npm run build` and focused tests.
- Start the app and verify live health from reachable ports/endpoints rather than relying on stale process notifications.
- Use browser console and accessibility/DOM snapshots to correlate runtime behavior.

### Task 4.2: Immediate auxiliary visual inspection

**Owner:** Hermes auxiliary vision

**Evidence to capture:**
- Detail default state
- Play control visible
- Playback active
- Scrolled-to-bottom state
- No-video state
- Mobile and desktop screenshots

**Required visual-analysis prompt:**

> Analyze this visual artifact as a strict UI and application reviewer. Report the visible screen/state, all major elements, missing expected elements, hierarchy, spacing/alignment defects, clipping/overflow, typography, color/contrast/icon/media problems, responsive concerns, interactive state shown, whether it meets the supplied acceptance criteria, evidence for each finding, and uncertainties. Do not claim functionality works from a static screenshot.

**Status:** Auxiliary vision is supporting evidence only, not final acceptance.

---

## Phase 5: Independent Visual QA Handoff

### Task 5.1: Dispatch `body-bridge-visual-qa`

**Dependency:** Phase 3 implementation and Phase 4 Hermes verification must finish first.

**Assignment:** `body-bridge-visual-qa` (never the implementation worker)

**Task body:**

```text
Perform independent visual and functional acceptance testing for the following Body Bridge change.

Parent implementation task: [insert task ID]
Feature: Exercise detail video playback and scrollable detail layout
Repository: C:\Users\thebe\Downloads\Body-Bridge
Branch or revision: [insert branch/commit or explicit dirty-worktree revision description]
Files changed: [insert verified file list]
Implementation summary: [insert verified summary]

Install command: npm install (only if dependencies are missing)
Start command: npm run dev
Preview URL: http://localhost:5173
Backend requirements: local Convex on 3211 and Express on 3001
Environment variables: existing local environment; do not expose secrets
Authentication/seed data: use an authorized local test account and at least one local Convex exercise with a valid videoUrl plus one without a videoUrl
Expected ports: 5173, 3001, 3211
Platform requirement: Browser at minimum; add Android emulator if implementation or findings implicate Capacitor/safe-area/native behavior

Routes to inspect:
1. Exercise Library
2. Exercise detail opened from a library card
3. Video playback state from the exercise detail

Required user flow:
1. Navigate/authenticate to the Exercise Library.
2. Select a card that has a Convex videoUrl.
3. Confirm detail opens and a visible play/watch control is present without hover.
4. Activate the control and verify visible playback/player controls.
5. Close playback, scroll through all details to the final action, and use/inspect close behavior.
6. Repeat with an exercise that has no videoUrl.

Required states:
- Default detail
- Video loading
- Video playing/ready
- Video error if reproducible
- No-video fallback
- Scrolled to bottom
- Close/return state
- Mobile
- Tablet
- Desktop

Viewports:
- Mobile: 390x844
- Tablet: 768x1024
- Desktop: 1440x900

Expected visual result:
1. Play/watch control is obvious, labeled, unobstructed, and touch-accessible.
2. Video is fully visible with usable controls and no clipping/overlap.
3. Detail hierarchy is polished and all content/actions are reachable by scrolling.
4. No horizontal overflow, trapped scroll, off-screen close button, or bottom-navigation collision.
5. No-video state looks intentional and has no broken media surface.

Expected functional result:
1. Card selection opens the correct detail.
2. Play action starts/opens the Convex-sourced video.
3. Scrolling reaches the last detail/action.
4. Close/Escape restores the previous usable Library state and body scrolling.
5. Existing Add to Workout flow remains usable.

Reference design/screenshots:
- User requirement: visible play button, playable video, polished detail layout, and continued scrolling for additional details.
- Attach implementation screenshots and auxiliary-vision findings from Phase 4.

Acceptance criteria:
1. Address every acceptance criterion in the parent plan individually.
2. Inspect the actual rendered app and perform interactions; screenshots alone are insufficient.
3. Inspect browser console/runtime errors.
4. Capture screenshot evidence for each viewport and key state.

Known risks:
1. Existing dirty worktree contains multiple partial detail/video components.
2. Video source types may differ (YouTube/Vimeo/direct file), and iframe readiness differs from HTML5 playback events.
3. Mobile flex/min-height and body-scroll locking may cause clipped or trapped content.

Return PASS, FAIL, or BLOCKED with route, viewport, reproduction steps, screenshots, console/runtime findings, and criterion-by-criterion evidence.
```

**Status while running:** `VISUAL QA RUNNING`

---

## Phase 6: Correction Loop

### If Visual QA returns FAIL

1. Set status to `VISUAL QA FAILED — CORRECTION REQUIRED`.
2. Preserve the complete report and screenshot paths.
3. Send a fresh correction prompt to OpenCode containing each defect’s route, viewport, reproduction steps, expected result, actual result, severity, screenshot, and console/runtime evidence.
4. OpenCode implements only the required corrections and reruns build/focused tests.
5. Hermes independently verifies the new diff and execution.
6. Dispatch a new `body-bridge-visual-qa` inspection; never reuse an earlier PASS.
7. Repeat until PASS or a genuine blocker.

### If Visual QA returns BLOCKED

- Set status to `VISUAL QA BLOCKED`.
- Report the exact blocker (startup, backend, auth, seed data, route, browser automation, Android availability, or contradictory criteria).
- Create the smallest implementation/environment task that removes it, then resume QA.

### If Visual QA returns PASS

Hermes must verify that all routes, viewports, interactions, screenshots, console checks, and acceptance criteria are covered. Then report exactly:

`VISUAL QA PASSED — READY FOR HUMAN REVIEW`

Only after the human approves may the status become:

`HUMAN APPROVED — COMPLETE`

---

## OpenCode Delegation Prompt

```text
Goal: Repair and finish the Body Bridge Exercise Library detail experience so selecting a card opens a polished, scrollable detail UI with an obvious play/watch button that visibly plays the exercise’s Convex-sourced video.

Repository: C:\Users\thebe\Downloads\Body-Bridge

Use phased execution: /gplan -> Hermes review -> /geng -> /gqa.

Inspect first:
- src/screens/ExercisesView.tsx
- src/components/ExerciseDetailModal.tsx
- src/components/VideoPreviewModal.tsx
- src/components/VideoPlayer.tsx
- src/screens/ExerciseDetail.tsx
- src/utils/videoSource.ts
- src/types.ts
- src/App.tsx
- relevant Playwright tests
- convex/schema.ts and convex/exercises.ts only as needed to verify data contracts

Important baseline: the worktree is already dirty and includes overlapping partial exercise/video work. Run git status and focused git diffs first. Do not reset, clean, discard, or overwrite unrelated changes. Compare duplicate .new/.backup files before changing or removing anything.

Requirements:
1. Card selection opens one canonical exercise-detail experience.
2. A valid videoUrl produces a clearly visible, labeled play/watch control that does not depend on hover.
3. Activating it opens/starts a functional player for YouTube, Vimeo, or direct files as supported by resolveVideoSource().
4. Detail content scrolls to the final details/action on 390x844, 768x1024, and 1440x900.
5. No-video and playback-error states are intentional and usable.
6. Preserve Add to Workout and existing Library features.
7. Fix React/TypeScript/accessibility issues in the touched path, including hook order, typed player callbacks, nested buttons, dialog semantics, Escape/focus behavior, and body-scroll restoration.
8. Video URLs stay in Convex. Never hardcode a URL in React code and never modify production data.
9. Add focused Playwright coverage and run npm run build plus focused tests.
10. Report exact files, commands, exit codes, test exercise ID/name, Convex video-data evidence, console findings, and limitations.

Do not provide final visual approval. Your terminal state is IMPLEMENTED — VISUAL QA PENDING. Hermes will verify your work and dispatch body-bridge-visual-qa independently.
```

## Key Risks and Tradeoffs

- **Dirty-worktree collision:** Highest risk. Implementation must be additive/careful and diff-scoped.
- **Duplicate UI paths:** Keeping both a detail modal and a separate preview modal can create inconsistent states; favor one coherent flow unless routing requirements prove otherwise.
- **Iframe versus HTML5 playback:** Automated “playing” evidence differs by source. Tests must use source-appropriate checks and rendered evidence.
- **Mobile scrolling:** Flex containers require correct `min-h-0`, bounded height, safe-area padding, and body-lock cleanup.
- **Test data:** A UI cannot prove playback if local Convex records lack valid videos. Verify database data before diagnosing the UI; do not hardcode samples in frontend code.
- **Android:** Browser QA is the initial requirement. Escalate to Android emulator testing if safe-area, native back, keyboard, or Capacitor presentation is affected.
