# CONTRACT_TCS_FIX2 — repair cycle 1 (verifier FAIL on t_dbd7d0d1): R1 tab fit at 360, R2 phosphor families, R3 lock scrim composite

Worktree: `C:\Users\thebe\.aa.StudioProjects\Body-Bridge\.worktrees\t_c52ff168`, branch
`wt/t_c52ff168`, HEAD = `68ca5f2a` (FIX1 checkpoint). Working tree is clean.

Rules (unchanged from CONTRACT_TCS.md): additive-only shared files, no new deps, l10n only via
`t.*`, NEVER push, `dart format` every file you touch, never stage or commit `pubspec.lock`
(`git checkout -- pubspec.lock` if a run churned it). Pub-cache paths stay out of `lib/`
(test-only).

---

## R1 — Trainer tab label truncates at 360dp (verifier R1 / mockup F1)

Evidence: `flutter test test/trainer_source_test.dart --plain-name "tab labels fit without ellipsis at 360x800 and 411x914"`
fails with `FIT360 avail=34.009 need=36.598` → `didExceedMaxLines` true on ExercisesScreen
(trainer-library already fits at 360 — do not touch it).

File: `lib/screens/trainer/source_tabs.dart`. Reclaim width in `_segment` WITHOUT changing any
font size:
- segment `AnimatedContainer` horizontal padding `4` → `2` (vertical stays `8`)
- gap between the label and the ADVANCED badge: `SizedBox(width: 2)` → `width: 1`
- badge `Container` horizontal padding `3` → `2` (vertical stays `2`)

Everything else stays identical: label 11 w600, padlock icon 9, badge 7.5 w800 letterSpacing 0.2,
track padding all(3), radius 100, ember active. Expected: avail ≈ 41.0 vs need ≈ 36.6 → ~4.4px
margin at 360; more room at 411.

Iterate: run the F1 test until BOTH sizes pass (it prints the FIT360 line). If still failing,
additionally reduce badge letterSpacing 0.2 → 0.1. Do NOT drop the label font below 11.

## R2 — Phosphor glyphs render tofu in all 20 captures (verifier R2 / mockup F6)

Cause: `test/trainer_captures_test.dart` maps `Phosphor.ttf` → family `'Phosphor'`, but the
package's pubspec declares family **`PhosphorRegular`** (verified at
`C:/Users/thebe/AppData/Local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/pubspec.yaml`:
families PhosphorRegular / PhosphorThin / PhosphorLight / PhosphorBold / PhosphorFill /
PhosphorDuotone; the IconData sources use the bare names, e.g. `fontFamily: 'PhosphorBold'`).
Because this is a package font, Flutter may also resolve it under
`packages/phosphoricons_flutter/<Family>`.

Fix the harness map so EACH weight file is FontLoader-loaded under BOTH names (same bytes twice):

| file | family A (bare) | family B (package-resolved) |
|---|---|---|
| Phosphor.ttf | PhosphorRegular | packages/phosphoricons_flutter/PhosphorRegular |
| Phosphor-Bold.ttf | PhosphorBold | packages/phosphoricons_flutter/PhosphorBold |
| Phosphor-Fill.ttf | PhosphorFill | packages/phosphoricons_flutter/PhosphorFill |
| Phosphor-Light.ttf | PhosphorLight | packages/phosphoricons_flutter/PhosphorLight |
| Phosphor-Thin.ttf | PhosphorThin | packages/phosphoricons_flutter/PhosphorThin |
| Phosphor-Duotone.ttf | PhosphorDuotone | packages/phosphoricons_flutter/PhosphorDuotone |

Keep the loud `StateError` when the dir or a file is missing. Test-only; no lib/ changes.

## R3 — Lock overlay composites blurred/dim under the sheet scrim; scrim covers header+tabs (verifier R3 / mockup F3)

Root cause chain (verified in code):
1. `TrainerLockOverlay` (lock_overlay.dart) = `Positioned.fill > IgnorePointer > AnimatedOpacity >
   GestureDetector > BackdropFilter(blur 7) > Container(bg@0.78) > Column(circle,message)`,
   mounted in the ExercisesScreen root Stack → its blur+dim cover header AND tab strip too.
2. `showTrainerUpsellSheet` → `showAppSheet` (lib/widgets/glass.dart) → `_GlassSheetRoute`, whose
   `buildModalBarrier()` wraps the barrier (`black@0.32`) in `_BlurBarrier` = BackdropFilter(blur
   14) → the sheet route blurs+dims the ENTIRE screen below it, lock content included; only the
   sheet stays crisp.

Target composite (mockup upsell-locks.png): header + tab strip crisp; list area blurred + dimmed;
lock circle + padlock + message crisp ABOVE the scrim, centered in the space above the sheet;
sheet crisp on top.

Implement exactly:

a) `lib/widgets/glass.dart` (ADDITIVE only): `showAppSheet` gains two optional params —
   `bool blurBarrier = true` and `Color? modalBarrierColor` — threaded through `_GlassSheetRoute`
   (it already forwards `super.modalBarrierColor`). `_BlurBarrier` gets a `bool enabled` (or
   equivalent) and returns `child` unchanged when disabled. Default behavior of every existing
   call site must not change (defaults keep today's blur + `black@0.32`).

b) `lib/screens/trainer/lock_overlay.dart`:
   - NEW public widget `TrainerLockScrim({required bool visible})` — mounted inside the
     list-region Stack (see c), so NO Positioned.fill of its own; it expands to its parent:
     `IgnorePointer(ignoring: !visible) > AnimatedOpacity(220ms, visible ? 1 : 0) > ClipRect >
     BackdropFilter(blur 7) > Container(color: gc.bg.withValues(alpha: 0.78))` filling the parent.
     No content child. (RenderAnimatedOpacity skips painting entirely at opacity 0, so an
     always-mounted scrim costs nothing while hidden.)
   - `TrainerLockOverlay` keeps its public API (`visible`, `onDismiss`) and its
     `Positioned.fill > IgnorePointer > AnimatedOpacity > GestureDetector(behavior: opaque,
     onTap: onDismiss)` shell, but the `BackdropFilter` and the dim `Container` are REMOVED. It
     renders only the content: `Align(alignment: Alignment(0, -0.55)) > Padding(h32) >
     Column(circle 64 mutedFill + 14 + message 13.5 w700)` — exactly the current visual content,
     now always crisp (the scrim lives behind it in the list Stack).

c) `lib/screens/exercises_screen.dart`: scope the scrim to the list region — the `Expanded`
   around the `ListView.builder` becomes:
   ```dart
   Expanded(
     child: Stack(
       children: [
         ListView.builder(... unchanged ...),
         TrainerLockScrim(visible: _lockShown),
       ],
     ),
   ),
   ```
   The root Stack keeps `Column(...)` first and `TrainerLockOverlay(...)` second (lock content
   paints above the list scrim). Header (title / search / tabs / chips) stays outside any scrim.

d) `showTrainerUpsellSheet` (lock_overlay.dart): pass `blurBarrier: false` and
   `modalBarrierColor: Colors.transparent` to `showAppSheet` so the route neither blurs nor dims
   the composite below; the visible dim comes solely from `TrainerLockScrim` over the list. The
   sheet itself stays crisp above everything. Keep `isScrollControlled`, shape, backgroundColor
   as-is. Dismiss semantics unchanged (barrier still dismissible; `whenComplete` still clears the
   lock).

## Tests — extend, do not weaken

`test/trainer_source_test.dart`, existing test
"tapping Trainer does NOT navigate: lock overlay + upsell sheet rise instead": keep every
existing assertion (AnimatedOpacity target 1.0, message above the half-height line, sheet
contents, CTA, no prices) and ADD four composite-legibility assertions after them:

1. No dimming route layer: for every `ModalBarrier` in
   `tester.widgetList<ModalBarrier>(find.byType(ModalBarrier))`, assert `color == null ||
   color!.alpha == 0`.
2. No partial-opacity ancestors over the message: from
   `tester.renderObject<RenderParagraph>(find.text(t.lockAdvancedMessage))`, walk `.parent` up to
   the root; every `RenderOpacity` must have `opacity == 1.0` and every `RenderAnimatedOpacity`
   must have `opacity.value == 1.0`.
3. Scrim scoped to the list area:
   `tester.getTopLeft(find.byType(TrainerLockScrim)).dy >= tester.getBottomRight(find.byType(PremiumSourceTabs)).dy`
   (the scrim starts at/below the tab strip's bottom edge — header and tabs are never under it).
4. No route-level blur barrier: every `BackdropFilter` in the tree is a descendant of
   `TrainerLockScrim` (i.e. `tester.widgetList(find.byType(BackdropFilter))` non-empty is fine,
   but none may sit outside the scrim — this proves the `_BlurBarrier` is gone for this route).

Note: import `TrainerLockScrim` from the existing lock_overlay.dart import already present in the
test file. `find.byType(TrainerLockScrim)` works because the scrim is always mounted (AnimatedOpacity-gated).

---

## Gates before you commit (run them yourself)

1. `dart format lib/widgets/glass.dart lib/screens/trainer/lock_overlay.dart lib/screens/trainer/source_tabs.dart lib/screens/exercises_screen.dart test/trainer_source_test.dart test/trainer_captures_test.dart`
2. `flutter analyze` — 0 new findings (2 pre-existing deprecated_member_use infos in
   routine_edit_screen.dart:264 / session_screen.dart:1582 are baseline).
3. `flutter test test/trainer_source_test.dart test/paywall_gating_test.dart test/i18n_test.dart`
   — ALL pass, including the F1 fit test at both sizes (iterate R1 until green).
4. `git checkout -- pubspec.lock` if a run churned it. Do NOT run the capture suite
   (BB_CAPTURES) — the controller regenerates and vision-checks all 20 PNGs after your commit.
5. Commit EXACTLY ONE commit on `wt/t_c52ff168` containing only the six files above, message:
   `TCS FIX2: repair cycle 1 - tab fit at 360, phosphor package families, list-scoped lock scrim (R1-R3)`
   Never push.

## RETURN

Files changed (path + what), gate outputs (analyze findings count, test pass/fail counts, the
FIT360 debug line at both sizes), any deviation from this contract and why.
