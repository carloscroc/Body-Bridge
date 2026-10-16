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
