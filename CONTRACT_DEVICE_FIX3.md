# CONTRACT_DEVICE_FIX3 — REPAIR: 3 owner-device defects (card t_9d175854)

Base: branch `wt/t_9d175854` @ `e810275d` (verified tip). Work ONLY in this
worktree. Commit everything to this branch. No pushes.

Flutter: `C:\Users\thebe\flutter\bin\flutter.bat` (pin 3.41.9). If `flutter`
is not on PATH use the absolute path. After test runs, `git checkout --
pubspec.lock` if it was rewritten (it must not change in the commits).

Three independent defects found by the owner on his phone (1440x3200,
~411dp logical, system font scale >1.0). His screenshots are the spec.

---

## D1 — Exercises header: RenderFlex bottom overflow when scrolled/docked

**Diagnosis (proven by probe test on this tree):** the pinned header extents
are hand-tuned constants (210/160 in `lib/screens/exercises_screen.dart`,
`_headerMaxExtent`/`_headerMinExtent`) but the content height scales with the
system text scaler (`AppTheme.f` pins `height: 1.15`; both chip rows grow as
`12.5 * scaler * 1.15 + 14` per chip). At scaler 1.0 everything fits at every
width; at scaler 1.15 the docked column is ~166px vs the 160px box →
"A RenderFlex overflowed by 6.0 pixels on the bottom", at ALL widths
(411.4 / 411 / 360 all reproduced). The owner runs a system font scale
(~1.1), hence the 4.0/4.8px hazard stripes mid-scroll. NOT width-sensitive —
do not tune for widths; fix the scale-sensitivity.

**Fix (underlying, not cosmetic):**
1. `_ExercisesHeaderDelegate` takes the ambient `TextScaler`
   (`MediaQuery.textScalerOf(context)` from the screen's build) and computes
   its extents from the actual content pieces using `TextPainter` with that
   scaler applied — the same styles the rows render
   (`AppTheme.f(12.5, weight: FontWeight.w700)` source chips,
   `AppTheme.f(12.5, weight: FontWeight.w600)` quick pills):
   - `chipRowHeight = textPainterHeight + 14` (vertical padding 7 x 2)
   - `maxExtent = 12 + 38 + 12 + 48 + 10 + srcRow + 10 + quickRow + 12` (the
     current piece list: top pad, title row, gap, SearchField 48, gap, source
     chips, gap, quick chips, bottom pad) plus a small +2px safety margin
   - `minExtent = maxExtent - 38`
   The +2 margin guarantees measured-content <= extent even with rounding;
   `ColoredBox(gc.bg)` already fills any slack. Cache the measurement per
   scaler value so layout stays cheap.
2. Make the collapsing title row exactly 38px at any scale: wrap the title
   `Row` (inside the existing ClipRect/Align/Opacity collapse) in
   `SizedBox(height: 38)` + `Center` + `MediaQuery.withClampedTextScaling`
   (max ~1.3) so `ScreenTitle` can never push the row past the budget. At
   default text scale the visuals are pixel-identical.
3. The lock-scrim `Positioned(top: maxExtent - shrinkOffset)` keeps working —
   it reads the delegate's own getters.

**Regression tests (extend `test/exercises_header_test.dart`, scroll-dock
group):** for `(width, scale)` in `(411.4, 1.15)`, `(411.0, 1.15)`,
`(360.0, 1.15)`, `(411.4, 1.0)`: pump ExercisesScreen (advanced), set
`tester.view.physicalSize = Size(width, 850)`, dpr 1.0,
`tester.platformDispatcher.textScaleFactorTestValue = scale`; drag -40
(partial dock), assert `tester.takeException()` null and the first exercise
row fully inside the viewport; drag -80 more (full dock), assert no exception
and SearchField pinned near the top; drag back +120 (undock), assert no
exception and title opacity back to 1.0. Also assert zero exceptions at rest
before the first drag.

**Capture:** extend `test/exercises_header_captures_test.dart` (BB_CAPTURE
harness) with a docked frame at logical 411.4 + text scale 1.15 (advanced,
dark) — drag the list to full dock before capturing; update the matrix
comment. The old 20 frames stay.

---

## D2 — My Trainer hub: REMOVE the simulated "New message from Marcus" toast

The white pill banner with the orange "B" avatar reading
"New message from Marcus · Tap to view" must NOT exist. Notification duty
stays with the unread badges (header count pill + Message button pill).

1. `lib/state/trainer_state.dart`: delete `TrainerBannerKind.newMessage` and
   the `unreadTotal > 0` branch in `activeBanner` — the banner is
   new-workout-only now. Update the doc comments.
2. `lib/widgets/trainer_kit.dart` `TrainerBannerCard`: drop the kind
   branching, always render `t.bannerNewWorkout(...)` + `t.bannerTapToView`.
   (`TrainerBannerOverlay` is already new-workout-only — leave it.)
3. `lib/screens/trainer_home_screen.dart` `_banner`: drop the
   `isNewWorkout` branch — tap always dismisses + opens the new workout.
4. l10n: retire `bannerNewMessage` from ALL 16 `lib/l10n/app_*.arb` files
   (keep `bannerNewWorkout` AND `bannerTapToView` — the workout banner still
   uses both). Run `flutter gen-l10n`.
5. Tests: `test/trainer_data_test.dart` badge-logic test — after
   `markAssignmentOpened` the expectation becomes `state.activeBanner,
   isNull` even though chat unread is still 2 (chat unread alone must never
   produce a banner). Remove the `dismissBanner('chat')` tail.
6. Do NOT touch the community inbox notch-toast (`app_shell.dart`
   `showNotchToast`) — different surface, owner-sanctioned.

**Capture:** `test/trainer_captures_test.dart` — add a clean hub-entry frame
(dark + light): hub with NO banner (pre-dismiss the workout banner key /
mark the assignment opened in the harness seed). Keep existing frames.

---

## D3 — Trainer chat header: phone icon → "Book a call" request sheet

NO user may ever reach a trainer's personal number. No `tel:`, no dialer, no
phone-number literals — anywhere in `lib/`, ever.

1. `lib/screens/trainer_chat_screen.dart` (~line 147): the bare
   `Icon(PhosphorIconsRegular.phone)` in the header row becomes a
   `RoundAction` button: size 36, child
   `Icon(PhosphorIconsRegular.calendarBlank, size: 17, color: gc.text)`,
   `label: t.bookCallA11y` (RoundAction's Semantics label), onTap
   `showBookCallSheet(context)`.
2. New `lib/widgets/book_call_sheet.dart`, modeled on the existing
   consultation pieces (sheet skeleton like `ConsultationSheet`, chips/field
   styling exactly like `consultation_request_screen.dart`):
   - kicker `t.callKicker` — "PERSONAL TRAINING" (9.5 w800, brass,
     letterSpacing 1.6, centered — same style as consultCardKicker)
   - title `t.callSheetTitle` — "Book a 1-1 call" (19 w800 centered)
   - preferred-day chips: `t.weekdayShort(1..7)` (existing l10n helper —
     locale-aware Monday..Sunday; store the int, not the label, so the
     record stays locale-independent)
   - preferred time-window chips: `t.timeMorning` / `t.timeAfternoon` /
     `t.timeEvening` (existing keys; ids `morning`/`afternoon`/`evening`)
   - optional note `TextField` (minLines 2, maxLines 4, hint
     `t.callNotesHint`)
   - primary submit `PrimaryButton` `t.callSubmit` — "Send request" with
     `trainerPrimaryBg/trainerPrimaryFg`; validation: day AND window required
     else inline error `t.callPickDayTime` (same error style as the
     consultation form)
   - submit → `await trainer.requestCall(day: ..., timeWindow: ..., notes:
     ...)` → in-sheet confirmation state: sage check-circle glyph,
     `t.callSentTitle` ("Request sent"), `t.callSentBody` ("Marcus will
     confirm your time"), and a `t.callDone` ("Done") button that pops the
     sheet
   - two-door grammar: when a call request is already on file the sheet
     opens directly on the confirmation state (mirror the consultation
     first-wins flip)
3. Local/state seam — mirror the consultation seam EXACTLY, local-only
   (comment it as a v0 local stub, no backend counterpart yet):
   - `lib/services/trainer_data.dart`: `TrainerCallRequest` record
     `{required int day (1..7), required String timeWindow, String notes,
     required int createdAt}`; `TrainerRepository` gains `callGetMine()` +
     `callRequest({required int day, required String timeWindow, String
     notes})`; `LocalTrainerRepository` implements both mirroring the
     consultation pattern (in-memory + SharedPreferences under its OWN key
     `gymmane_call_v1`, latest-wins overwrite is fine, `resetForTest`
     purges record + prefs key).
   - `lib/state/trainer_state.dart`: field `call`; `requestCall(...)`
     stores + `notifyListeners()`; load it in `ensureLoaded`'s Future.wait;
     `resetForTest` clears it.
4. l10n — NINE new keys in ALL 16 ARBs with REAL translations (match the
   existing tone; kicker/`PERSONAL TRAINING` stays uppercase):
   `callKicker`, `callSheetTitle`, `callNotesHint`, `callPickDayTime`,
   `callSubmit`, `callSentTitle`, `callSentBody`, `callDone`,
   `bookCallA11y`. Then `flutter gen-l10n`.
5. Tests (new `test/book_call_test.dart`, harness mirrors
   `exercises_header_test.dart`'s FakeGate + pumpSurface):
   - chat header: phone icon findsNothing; tapping the calendar button
     opens the sheet with kicker + title
   - a11y: the button carries the `t.bookCallA11y` semantics label
   - validation: submit with nothing picked → `t.callPickDayTime`, no record
   - happy path: pick day + window, type a note, Send → confirmation texts,
     `trainer.call` carries day/window/notes
   - two-door: with `trainer.call` set, opening the sheet lands on the
     confirmation state directly
   - repo seam (extend `test/trainer_data_test.dart`): requestCall
     latest-wins, persists via prefs, resetForTest clears
6. Grep gates (report the counts): `grep -rn "tel:" lib/` = 0;
   `grep -rniE "dialer|action.DIAL|action.CALL" lib/` = 0;
   `grep -rn "PhosphorIcons.*phone" lib/` = 0;
   no phone-number literals introduced anywhere in `lib/`.

**Capture:** `test/trainer_captures_test.dart` — chat dark/light frames
regenerate with the calendar button (existing frames); ADD book-a-call sheet
frames: form state dark + light, confirmation state dark + light.

---

## NOT in scope (do not touch)

Nav bar; chips/search/dock design beyond the D1 extent fix (no restyle);
community surfaces; the consultation sheet/screens; hub layout beyond the D2
removal; any backend/network/API invention; database/schema; pubspec deps.

## Acceptance criteria

1. `flutter analyze` — no new issues.
2. Targeted tests updated + passing: exercises_header_test,
   trainer_data_test, book_call_test, trainer_entry_test, trainer_tier_test.
3. FULL `flutter test` green.
4. `flutter gen-l10n` clean; `flutter test test/i18n_test.dart` fully green
   (29/29).
5. Capture harness runs clean with BB_CAPTURE=true (report the output dir +
   PNG count): includes the new D1 docked-at-411.4-scale-1.15 frame, D2
   clean hub frames, D3 sheet frames (form + confirmation, dark + light).
6. Grep gates above all zero.
7. Everything committed to `wt/t_9d175854` (messages prefixed
   `t_9d175854:`; logical commits per defect are fine). pubspec.lock must
   not change.

## Return

Report: changed files with one-line summaries per defect, commands run +
results, decisions taken, any deviations from this contract with reasons.
