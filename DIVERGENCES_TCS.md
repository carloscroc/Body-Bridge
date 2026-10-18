# DIVERGENCES_TCS.md — Premium Exercise Sources (worktree t_c52ff168)

Phase commits: P1 `3ebd46e7` · P2 `77783976` · P3 `8b9191ea` · P4 `55b330cf` · P5 `be886f20` · P6 this file.
Scope: every intentional divergence vs the CONTRACT_TCS.md mockups/instructions, plus anything that
could not be matched or verified, per P6.

## Intentional divergences vs the mockups

1. **Active source-pill color follows `gc.ember`.** The active segment fill uses the ember accent
   token (per verify-screen1 guidance) rather than the mockup's darker pill, staying consistent with
   the app's existing SegToggle accent treatment.
2. **Pallof Press duration differs between list and player.** The library card pill shows the list
   `durationLabel`; the video scrubber shows `playerLabel` from `playerDurationSec` (catalog carries
   both; `playerDurationSec ?? durationSec` is the fallback). Matches the mockup's mismatched
   durations for the setup session.
3. **Add to workout is snackbar-only.** The video screen's PrimaryButton surfaces `t.addedToWorkout`
   as a snackbar; it does not navigate into a training session.
4. **Video action row order.** Bookmark toggle is a RoundAction beside the back button in the header
   row (mockup shows it ambiguously); sets/reps steppers sit below the cues exactly as specified.

## Structural divergence vs contract wording

5. **"fit_core hooks" live in `library_state.dart`.** The route hooks `goTrainerLibrary`,
   `goTrainerVideo(sessionId)`, `goTrainerAssigned` were added to the LibraryState mixin that
   `fit` mixes in, not to `fit_core.dart` itself. Public API is exactly as contracted
   (`fit.goTrainer*`); only the file differs. The `app_shell.dart` route cases were added as
   specified (additive only).

## Process notes

6. **P2 committed twice.** First attempt `ddb29875` swept `dart format` noise into files the phase
   did not touch (violates the additive-only rule); it was discarded and redone as `77783976`.
7. **P2 shipped placeholder bodies** for the three trainer screens so routes/app_shell compile;
   P4 replaced the bodies with the real screens. The phase ordering in the contract implies this.

## Could not verify

8. **Mockup PNGs were never visually inspected.** `look_at` errored on 3 attempts and the vision
   subagent timed out twice in this environment. Fidelity was implemented from the written
   mockup-detail list in CONTRACT_TCS.md (badge/padlock placement inside segments, dark 9:16 video
   surface in both themes, 2-row chip wrap, italic prescription line, DUE TODAY on the first row
   only, sage '+ FROM YOUR TRAINER' pill, drag handle, no prices, ↗ arrow on the CTA). All of those
   are implemented; a pixel-level comparison against the PNGs remains outstanding.

## Test-harness notes (not UI divergences)

9. `trainer_source_test.dart` pumps a tall surface (411x1700 logical) so all six grid cards and the
   full video screen are built and findable without scrolling; the catalog is fixed (6 sessions,
   4 assignments) so this stays deterministic.
10. Padlock assertions are scoped with `find.descendant(of: find.byType(PremiumSourceTabs), ...)`
    because `exercises_screen.dart` carries an unrelated pre-existing 26px `lockSimple` icon.
11. The lock overlay hides via `AnimatedOpacity` (its text stays in the tree at opacity 0), so the
    "Not now" test asserts sheet dismissal and list intactness instead of text removal.
12. The capture harness loads Nunito from `assets/fonts` and MaterialIcons from the Flutter SDK
    cache (`$FLUTTER_ROOT/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf`, failing
    loudly when missing); the RepaintBoundary wraps the whole MaterialApp so the upsell sheet —
    which lives in the navigator overlay — is inside `exercises-locked` captures.

## Full-suite classification (acceptance criterion 4)

- **Result:** 588 passed, ~5 skipped, 1 failed.
- **Failure:** `test/smoke_test.dart` — "the share sheet builds a card for every kind":
  `FlutterError: A RenderFlex overflowed by 6.4 pixels on the right` on the `ShareKind.streak` card.
- **Classification: PRE-EXISTING (not introduced by TCS).** Evidence: the identical failure
  reproduces at the pre-TCS commit `24629cfd` in a clean throwaway worktree (fresh `pub get`,
  single test run). No TCS phase touches `lib/widgets/share_cards.dart`, `lib/screens/share_sheet.dart`,
  or `smoke_test.dart`. Likely cause: date-dependent card content (the `t.shortDateYear(DateTime.now())`
  header and streak rows) overflows its Row on today's date; the share cards predate this contract.

## Verification summary at P6

- `flutter gen-l10n` — run after P1 ARB edits.
- `flutter analyze` — No issues found.
- `flutter test test/i18n_test.dart test/trainer_source_test.dart` — all pass (16-ARB parity,
  literal scanner clean; 9/9 source tests).
- `flutter test` (full) — 588 passed, ~5 skipped, 1 pre-existing failure (classified above).
- `BB_CAPTURES=1 flutter test test/trainer_captures_test.dart` — 20/20, 20 PNGs under
  `build/captures/trainer/` (5 screens x dark/light x 411/360; gitignored, not committed).
- `dart format` — run on every file created/edited (P4 screens + app_shell edit + both test files).
- Working tree clean at end of P6 except gitignored `build/` artifacts.

## FIX1 checkpoint (capture-review fidelity repairs)

Supervisor review of the 20 PNGs raised six fidelity defects (CONTRACT_TCS_FIX1.md). The FIX1 set
below was applied and committed as one checkpoint on `wt/t_c52ff168`.

- **F1 tab strip:** equal-flex segments with tightened metrics in `source_tabs.dart` (label
  11 w600, padlock 9, badge 7.5 w800 ls 0.2, badge hPad 3, segment hPad 4) so all three labels +
  padlocks + the ADVANCED badge fit at 360 and 411; widget test pumps 360x800 AND 411x914 and
  asserts the full `t.sourceTrainer` label renders without ellipsis.
- **F2 video fold:** the video surface in `trainer_video_screen.dart` is width-constrained
  (9:16, rounded) so title, cues, sets/reps steppers and the add-to-workout CTA all fit the fold
  at 411x914; test asserts on-screen visibility.
- **F3 lock overlay:** shown-state opacity target pinned to 1.0 in `lock_overlay.dart`; test
  asserts the AnimatedOpacity target.
- **F4 assignment durations:** `TrainerAssignment` now carries its own `durationSec`/label in
  `trainer_catalog.dart`, seeded to the mockup values 0:50 / 1:15 / 1:45 / 1:20; row thumbs render
  them; the asserting test was updated.
- **F5 assigned date:** weekday added via the locale-aware `t.longDate` helper in
  `custom_assigned_screen.dart`. Renders the full weekday name ("Monday, Oct 12") vs the mockup's
  abbreviated "Mon, Oct 12" — kept as a documented minor divergence (non-blocking).
- **F6 captures:** the capture harness `setUpAll` FontLoader-loads the six Phosphor weight TTFs
  from the pub cache (test-only; no pub-cache paths in lib/).
- Harness fix in the same commit: `trainer_source_test.dart` intrinsic-width probe uses
  `paragraph.getMaxIntrinsicWidth(double.infinity)` — `paragraph.maxIntrinsicWidth` is not a real
  RenderBox getter and the staged-only tree did not compile without it.

**Re-review (verifier t_dbd7d0d1): FAIL.** F1 still ellipsizes at 360 on the Exercises hub
(needs 36.60px, has 34.01px — capture `exercises-free-dark-360.png`); F6 glyphs are still tofu in
all 20 captures (phosphoricons_flutter is a package font — families resolve as
`packages/phosphoricons_flutter/<Family>`, the harness registers bare names); F3 lock circle +
message still composite blurred/dim under the upsell sheet's scrim in both themes, and the
blur/scrim covers the header + tab strip which the mockup keeps crisp. Repairs tracked on card
t_f3664735 (FIX2).

## FIX2 — repair cycle 1 (verifier R1–R3) — commit `54e72322`

- **R1 / F1 — tab fit at 360:** `source_tabs.dart` segment hPad 4→2, label↔badge gap 2→1, badge
  hPad 3→2 (no font-size changes; SegToggle look intact). F1 test green at BOTH sizes:
  360 → avail 41.01 vs need 36.60 (~4.4px margin), 411 → avail 58.01. Capture
  `exercises-free-dark-360.png` shows the full "Trainer" label + padlock + ADVANCED badge with no
  ellipsis (vision-verified at full resolution).
- **R2 / F6 — phosphor glyphs:** root cause was the harness registering family `'Phosphor'` for
  `Phosphor.ttf`, while the package pubspec declares **`PhosphorRegular`** (so the name matched
  nothing). The capture harness now FontLoader-loads each of the six weight files under BOTH the
  bare pubspec family name and the package-resolved `packages/phosphoricons_flutter/<Family>`
  name. Regenerated captures vision-verified: real play triangle, minus/plus steppers, bookmark,
  tab/overlay padlocks and sheet checkCircles — no tofu anywhere.
- **R3 / F3 — lock composite:** root cause was TWO stacked scrims: the overlay's own full-screen
  BackdropFilter(blur 7)+dim (covering header + tabs) AND the sheet route's `_BlurBarrier`
  (BackdropFilter blur 14 + black@0.32 wrapped around the modal barrier — blurring/dimming the
  whole screen below, lock content included). Restructured: new `TrainerLockScrim` (blur 7 +
  bg@0.78, AnimatedOpacity-gated) is scoped to the list region only (Stack inside the list's
  Expanded); `TrainerLockOverlay` now renders only the circle + message above the scrim;
  `showAppSheet` gained additive `blurBarrier` / `modalBarrierColor` params (defaults preserve
  every existing caller) and `showTrainerUpsellSheet` opens with a transparent, non-blur barrier,
  so the visible dim comes solely from the list scrim. Captures
  `exercises-locked-dark-411.png` / `exercises-locked-light-411.png` vision-verified: header +
  tab strip crisp, list dimmed/blurred, circle + padlock + message crisp and legible, sheet crisp
  — in BOTH themes, matching mockup 5.
- **F3 test strengthened:** the locked-tab test now asserts composite legibility structurally —
  every `ModalBarrier` carries no dim color (alpha 0), no `RenderOpacity`/`RenderAnimatedOpacity`
  below 1.0 sits above the message, the scrim starts at/below the tab strip's bottom edge, and
  every `BackdropFilter` in the tree lives inside `TrainerLockScrim` (no route-level blur).
- **Gates at `54e72322`:** `flutter analyze` — No issues found (0 findings). Tier tests 49/49
  (trainer_source + paywall_gating + i18n, incl. F1 at both sizes). `BB_CAPTURES=1` — 20/20 PNGs
  regenerated. Full suite 588 passed / ~5 skipped / 3 failed — all three pre-existing: the smoke
  share-sheet overflow documented above, plus auth_form + delete_account ink_sparkle
  shader-decode host flakes ("Unsupported runtime stages format version. Expected 1, got 2" — the
  exact signature the verifier reclassified clean after flutter clean; zero file overlap with
  FIX2).
- Minor divergences unchanged and non-blocking: F5 full weekday name, "ADVANCED" without the "+"
  prefix, library chips mixed-case, dark ember=white token (documented #1 above).

## REWORK — trainer exercises folded into the existing flow (Carlos directive) — commits `7f6ab6ac`…`cda3b488`

Product-owner revision (2026-10-16): "the flow is the same… we should not change anything other
than adding new exercises through the personal trainer." The approved mockups' SEPARATE screens are
RETIRED for flow (spec supersession, not a defect cycle). CONTRACT_TCS_REWORK.md governs.

- **Removed entirely:** `trainer_library_screen.dart`, `trainer_video_screen.dart`,
  `custom_assigned_screen.dart`, their `app_shell.dart` route cases + imports, and the
  `goTrainerLibrary/Assigned/Video` + `activeTrainerSessionId` state hooks (items 3–4 of the
  divergences above describe retired surfaces; they remain true only for the pre-rework history).
  `lib/screens/trainer/` retains only `source_tabs.dart` + `lock_overlay.dart` (gate UX).
- **Integration:** trainer sessions/assignments become real `Exercise` objects
  (`lib/catalog/trainer_exercises.dart`) with stable ids `tr-<sessionId>` / `as-<sessionId>-<k>`;
  equipment mapped Band→Band, Kettlebell→Kettlebell, Mat/Bench/Wall→Bodyweight; category becomes
  `primary`; difficulty added to `TrainerSession` seeds; steps = cues (+ prescription for
  assignments). `exercisesMatching(q, {source})` is source-aware; trainer/custom pools group by
  category (`kTrainerCategories` order); `exerciseById` + `similarExercises` resolve trainer ids so
  detail/routines/sessions treat them exactly like free exercises.
- **Surfaces:** Exercises screen Trainer/Custom tabs switch IN PLACE (gating unchanged:
  lock scrim + upsell, zero prices); trainer rows = identical row anatomy + video-poster thumbnail
  (`TrainerExerciseMedia`) + ADVANCED badge; detail screen renders the host-driven player in the
  media slot (no edit/media buttons for trainer ids); routine editor picker gains the same tabs
  (LOCAL state — does not touch the global `exSource`). Workout flow untouched.
- **i18n:** +5 keys × 16 ARBs (`trainerCat*`); removed 9 keys used only by the deleted screens;
  gen-l10n tree-neutral.
- **New divergences by directive:** coach-profile card, DUE TODAY chips, prescription italics,
  session steppers and the standalone add-to-workout CTA are gone with their screens (assignment
  prescriptions survive as the first how-to step); assigned rows carry the ADVANCED badge.
- **Validator-caught fix (F1', commit `cda3b488`):** picker row subtitles used `t.muscle()` on the
  category id → raw English fallback; now `exerciseSectionLabel` for trainer-sourced rows.
- **OpenCode deviation worth noting:** fixed a pre-existing product bug found during CP3 —
  `_onSourceTap` mutated `fit.exSource` without `setState`, so tab taps never re-rendered the list.
- **Gates at `cda3b488` (operator-run, cold):** `flutter analyze` 0 issues; `flutter gen-l10n`
  tree-neutral; full `flutter test` 596 passed / ~5 skipped / 1 failed — the documented pre-existing
  smoke share-sheet overflow (reproduced at pre-rework `9444607b` in this worktree; 6 more passing
  than the pre-rework baseline from the new trainer tests); `BB_CAPTURES=1` 12/12 PNGs (3 scenarios
  × dark/light × 411/360), vision-verified incl. tab fit at 360 and light-theme legibility.
