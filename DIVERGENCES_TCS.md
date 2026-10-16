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
