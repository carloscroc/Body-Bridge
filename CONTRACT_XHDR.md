# CONTRACT — t_a9afb1b7: Exercises header rework (coach disc, quiet chips with counts, dockable search, sections)

## TASK
Rework `lib/screens/exercises_screen.dart` + the library source state to match Carlos's
approved mockup (decoded spec below is BINDING): one header row (title left, 38dp coach
disc right), TrainerAccessCard strip DELETED, bell REMOVED (unread folds into the disc
pill), borderless search pill dockable in the header plane, quiet count chips replacing
the source tabs, and All-view sections (TRAINER LIBRARY / FREE LIBRARY) with LOCKED
badges. Both themes, all 16 locales, existing design tokens only.

## WORKSPACE
`C:\Users\thebe\.aa.StudioProjects\Body-Bridge\.worktrees\integration-all` (branch
wt/integration-all, base 6b1208b6). Work ONLY here. COMMIT every checkpoint with messages
prefixed `t_a9afb1b7:`. NEVER push. Never touch anything outside this worktree.

## CONTEXT (verified against the tree at 6b1208b6)
- `lib/screens/exercises_screen.dart` — today: `_header` = Row[ScreenTitle + `t.libraryCount`
  subtitle, bell RoundAction (advanced, unread pill), plus RoundAction (advanced)],
  `TrainerEntryStrip()`, `SearchField`, `PremiumSourceTabs`, `_quickChips`. List =
  ListView.builder with section headers on `primary` change (`_sectionLabel`).
- `lib/state/library_state.dart` (part of fit_state) — `String exSource = 'free'`;
  `exercisesMatching(query, {source})`: `'trainer'`→`trainerExercises` (6),
  `'custom'`→`assignedExercises` (4), default→`allExercises` (= `kExercises` + user
  customs). Grouping: `_groupedByCategory` (kTrainerCategories order) / `_groupedByMuscle`.
  NOT persisted.
- `lib/screens/trainer/source_tabs.dart` — `PremiumSourceTabs` ALSO used by
  `lib/screens/routine_edit_screen.dart` with its OWN local `_source` state
  (`fit.exercisesMatching(_q, source: _source)`); the picker is OUT OF SCOPE and must
  keep working byte-identical.
- `lib/widgets/trainer_kit.dart` — `TrainerEntryStrip` (to delete), `TrainerAvatarDisc`
  (gradient + initials), `TrainerCountPill`, `trainerPrimaryBg/Fg` helpers,
  `TrainerBannerOverlay` (keep wrapping the screen).
- `lib/widgets/consultation_sheet.dart` — `showConsultationSheet(context)` = the two-door
  free-tier sheet. `lib/screens/trainer/lock_overlay.dart` — `TrainerLockScrim`,
  `TrainerLockOverlay`, `showTrainerUpsellSheet` (existing gate UX, keep).
- `t.myTrainer` ("MY TRAINER") and `t.talkToTrainer` exist — use as Semantics labels for
  the disc (advanced / free). `t.searchExercises` stays the search hint (never hardcode
  the mockup's English "Search movements"). `t.srcLocked`, `t.sourceFree/Trainer/Custom`
  exist. `context.can(kCapCustomExercises)` gates tier (advanced-only capability,
  constants/billing.dart).
- Tests that WILL break and must be reconciled: `test/trainer_source_test.dart`
  (tabs, libraryCount header, ADVANCED badge counts, scrim-vs-tabs geometry),
  `test/trainer_entry_test.dart` (strip + bell), `test/coaching_funnel_test.dart`
  (harness mounts `TrainerEntryStrip`, taps `find.text(t.talkToTrainer)`),
  `test/tcs_captures_test.dart` (taps `find.text(t.sourceTrainer)`; env-gated but must
  compile), `test/polish_test.dart` + `test/reps_only_test.dart` (assume default pool =
  allExercises). `test/trainer_captures_test.dart` only pumps ExercisesScreen — keep it
  compiling/passing without edits if possible.

## SCOPE (implementation contract — follow exactly)

### 1. State: new 'all' source, new default (`lib/state/library_state.dart`)
- `String exSource = 'all';`
- `exercisesMatching`: add `'all'` branch — pool = `[...allExercises, ...trainerExercises,
  ...assignedExercises]`, run the SAME predicate pipeline (search/favourites/muscle/
  equipment/difficulty), then split trainer-sourced (`isTrainerSourcedId`) vs rest, order
  gated part via `_groupedByCategory` and free part via `_groupedByMuscle`, concat gated
  FIRST (sections below depend on it). `'free'` stays byte-identical (`allExercises`),
  as do `'trainer'` / `'custom'` / the default case.
- Nothing else in the state layer changes. `clearExFilters` still does not reset source.

### 2. Header: one row, disc right (`exercises_screen.dart` + `trainer_kit.dart`)
- New public widget in `lib/widgets/trainer_kit.dart`: `ExercisesCoachDisc`
  (`const ExercisesCoachDisc({super.key, this.size = 38})`), default key
  `ValueKey('exercises-coach-disc')`, `AnimatedBuilder(animation: trainer)`:
  - Advanced (`context.can(kCapCustomExercises)`): `Pressable` → `fit.pushRoute('trainer')`,
    `Semantics(button: true, label: t.myTrainer)`, child = Stack[
    `TrainerAvatarDisc(initials: trainer.profile?.initials ?? '—', size: 38)`,
    if `trainer.unreadTotal > 0` Positioned(right: -2, top: -2,
    `TrainerCountPill(count: trainer.unreadTotal, size: 17, key: ValueKey('disc-unread'))`)].
  - Free/basic: `Pressable` → `showConsultationSheet(context)`,
    `Semantics(button: true, label: t.talkToTrainer)`, child = 38dp circle, color
    `gc.bgRaised`, NO border, `Icon(PhosphorIconsRegular.userFocus, size: 19, color: gc.accent)`.
- DELETE the `TrainerEntryStrip` class from trainer_kit.dart (dead after this rework).
- Header row: `Row[Expanded(ScreenTitle(t.exercises))]` + for advanced only:
  `RoundAction(size: 38, label: t.newExercise, plus icon → showCreateExerciseSheet)`
  then `SizedBox(width: 10)` then `ExercisesCoachDisc()`. NO trainer name, NO chat icon,
  NO `TrainerEntryStrip`, NO bell anywhere. REMOVE the `t.libraryCount` subtitle line
  (counts now live in the chips; `t.libraryCount` itself stays — filters sheet uses it).

### 3. Scroll-driven dockable header (exercises_screen.dart)
- Replace Column+ListView with `CustomScrollView(controller: _scroll, slivers: [
  SliverPersistentHeader(pinned: true, delegate: _ExercisesHeaderDelegate(...)),
  <sliver list of rows> ])` inside the existing Stack (TrainerLockScrim/Overlay stay).
- Delegate: `maxExtent` = title row (~38-44) + gaps + SearchField(48) + source chips row +
  `_quickChips` row + paddings; `minExtent` = same header WITHOUT the title row
  (search + both chip rows = the docked state). Background opaque `gc.bg` so content
  scrolls under it cleanly.
- Title fade per annotation: progress = `shrinkOffset / (maxExtent - minExtent)` clamped
  0..1; the title ROW collapses (SizedBox height lerp → 0 + ClipRect) and its Opacity
  fades to 0 (disc/plus fade with it — the disc returns on scroll-to-top; record this as
  the implemented interpretation). Search+chips dock directly under the SafeArea top
  (status bar).
- Keep physics default; do NOT add RefreshIndicator; pull/scroll feel must stay stock.
- TrainerLockScrim positioning: keep it covering ONLY the list region — wrap in
  `Positioned(left: 0, right: 0, top: <current header bottom>, bottom: 0)` where current
  header bottom = `minExtent + (maxExtent - minExtent) * (1 - progress)` from `_scroll`
  offset (AnimatedBuilder), so the invariant "header/chips never under the scrim" holds
  at any scroll position. TrainerLockOverlay unchanged (full-bleed).

### 4. Quiet source chips with counts (replace PremiumSourceTabs usage)
- One horizontally-scrollable Row under the search: All / Free / Trainer / Custom chips,
  each `GestureDetector > AnimatedContainer(200ms, padding h14/v7, radius 100, color:
  selected ? gc.accent : Colors.transparent) > Text('$label $count',
  AppTheme.f(12.5, w700 selected / w500 not, color: selected ? (dark ? gc.pageBg :
  gc.onEmber) : gc.textSecondary))`. NO borders anywhere. 8px gaps.
- Labels: `t.sourceAll` (NEW key), `t.sourceFree`, `t.sourceTrainer`, `t.sourceCustom`.
- Counts computed from data each build (never hardcode): all = allExercises.length +
  trainerExercises.length + assignedExercises.length; free = allExercises.length;
  trainer = trainerExercises.length; custom = assignedExercises.length. Gated sources
  show their TRUE count for every tier.
- Widget keys for tests: `ValueKey('chip-all')`, `'chip-free'`, `'chip-trainer'`,
  `'chip-custom'` on the GestureDetectors.
- Tap: All/Free → `setState(() => fit.setExSource(...))` always allowed;
  Trainer/Custom keep TODAY's gating when `!context.can(kCapCustomExercises)`:
  `_lockShown = true` + `showTrainerUpsellSheet` (source unchanged, no navigation).
- Keep the existing `_quickChips` row (Filters / Favourites / No gear) BELOW the source
  chips, unchanged, inside the pinned header (both chip rows dock).

### 5. Sections + LOCKED badges (list body)
- `exSource == 'all'`: TWO flat sections — trainer-sourced rows first under small-caps
  `t.sectionTrainerLibrary`, then free rows under `t.sectionTrainerLibrary`'s sibling
  `t.sectionFreeLibrary` (NEW keys). NO muscle/category sub-headers inside 'all' (data
  order comes from the state layer). Section header style: uppercase, 10.5 w700,
  letterSpacing 1.3, `gc.textSecondary` (one step brighter than the sub-headers below).
- `'free'` keeps today's muscle sub-headers; `'trainer'`/`'custom'` keep today's category
  sub-headers (`_sectionLabel` logic, adjusted for the new default).
- Row gating: `locked = !context.can(kCapCustomExercises) && fit.isTrainerSourced(ex.id)`.
  Locked rows: show the existing brass `_lockChip` (LOCKED) INSTEAD of the ADVANCED
  badge, and `onTap` must NOT open — run the same lock UX as gated chip taps
  (`_lockShown = true` + `showTrainerUpsellSheet`), never `fit.openExercise`.
  Unlocked trainer rows keep the ADVANCED badge exactly as today. User custom rows
  ('c…' ids) are never locked.
- Empty state, favourites stars, dividers, TrainerExerciseMedia thumbs: unchanged.

### 6. l10n — 3 new keys in ALL 16 `lib/l10n/app_*.arb` + `flutter gen-l10n`
`sourceAll`, `sectionTrainerLibrary`, `sectionFreeLibrary`. Use these exact values
(uppercase display happens in code via toUpperCase):
| locale | sourceAll | sectionTrainerLibrary | sectionFreeLibrary |
|---|---|---|---|
| en | All | Trainer library | Free library |
| ar | الكل | مكتبة المدرب | المكتبة المجانية |
| de | Alle | Trainer-Bibliothek | Kostenlose Bibliothek |
| es | Todos | Biblioteca del entrenador | Biblioteca gratuita |
| fr | Tous | Bibliothèque du coach | Bibliothèque gratuite |
| it | Tutti | Libreria del trainer | Libreria gratuita |
| ja | すべて | トレーナーライブラリ | 無料ライブラリ |
| ko | 전체 | 트레이너 라이브러리 | 무료 라이브러리 |
| nl | Alles | Trainerbibliotheek | Gratis bibliotheek |
| pl | Wszystkie | Biblioteka trenera | Darmowa biblioteka |
| pt | Todos | Biblioteca do treinador | Biblioteca gratuita |
| ru | Все | Библиотека тренера | Бесплатная библиотека |
| tr | Tümü | Antrenör kütüphanesi | Ücretsiz kütüphane |
| uk | Усі | Бібліотека тренера | Безкоштовна бібліотека |
| zh | 全部 | 教练库 | 免费库 |
| zh_Hant | 全部 | 教練庫 | 免費庫 |
Then `flutter gen-l10n` (generated `app_localizations*.dart` are committed — commit them
too). `flutter test test/i18n_test.dart` must pass BEFORE anything else.

### 7. Test reconciliation (update finders/semantics to the NEW reality; never weaken
assertions; put a one-line reason comment on each changed expectation)
- NEW `test/exercises_header_test.dart` (FakeGate pattern from trainer_source_test):
  1) advanced: disc renders (by key), unread pill shows trainer.unreadTotal and clears
     after `trainer.markThreadRead(...)`; `find.byIcon(PhosphorIconsRegular.bell)`
     findsNothing on BOTH tiers.
  2) advanced: tap disc → `fit.route == 'trainer'`; back → 'exercises'.
  3) free/basic: tap disc → consultation sheet (t.consultSheetTitle), no prices, no
     TrainerHomeScreen, `fit.route` unchanged after dismiss.
  4) chips: expected counts computed from the same data getters (assert rendered labels
     `'${t.sourceAll} ${fit.allExercises.length + trainerExercises.length + assignedExercises.length}'`
     etc.); tapping Free → `fit.exSource == 'free'`; tapping Trainer as advanced →
     `'trainer'`; as free → source UNCHANGED + lock overlay + upsell sheet.
  5) default source is 'all'; All view shows t.sectionTrainerLibrary + t.sectionFreeLibrary
     headers, trainer rows above free rows.
  6) free tier: trainer-sourced rows carry the LOCKED chip, tapping one does NOT navigate
     (route + activeExerciseId unchanged) and raises the lock overlay + upsell; advanced
     tier rows show ADVANCED badge and open normally ('tr-pallof-setup' → exercise-detail).
  7) scroll-dock: pump, drag the list up ≥ header delta → ScreenTitle gone/faded and the
     search pill still visible pinned at top; drag back → title visible again.
- `trainer_source_test.dart`: exercises-screen groups move to chips (tap by the
  ValueKeys; labels now include counts so `find.text(t.sourceTrainer)` no longer
  matches); libraryCount-on-screen assertions removed (subtitle deleted); scrim geometry
  now asserted against the pinned header (scrim top ≥ docked header bottom / chips key
  bottom); the free-exclusion test becomes: source 'free' pool excludes tr-/as- ids AND
  default All view shows them locked (visible, not openable). Routine-editor groups stay
  untouched and passing (PremiumSourceTabs unchanged there).
- `trainer_entry_test.dart`: strip tests → disc (tap by key 'exercises-coach-disc';
  'Marcus Reyes' / chat icon no longer on the exercises screen — assert that);
  bell-badge test becomes disc-pill test; keep the nav/banner/back tests green.
- `coaching_funnel_test.dart`: harness mounts `ExercisesCoachDisc()` and taps by key
  (the two-door/first-wins/routing expectations stay identical).
- `tcs_captures_test.dart`: `find.text(t.sourceTrainer)` → `find.byKey(ValueKey('chip-trainer'))`.
- `polish_test.dart` + `reps_only_test.dart`: pin `fit.setExSource('free')` in setUp with
  a comment (default is now 'all'; these suites exercise the free pool).

### 8. NEW capture harness `test/exercises_header_captures_test.dart`
Copy the harness mechanics EXACTLY from `test/consultation_captures_test.dart`
(BB_CAPTURE/BB_CAPTURE_DIR early-return gate, real Nunito + Phosphor fonts under both
family names, `tester.runAsync`, RepaintBoundary captureKey, one pump per testWidgets,
pixelRatio 2). Matrix (name prefix `exercises-header-`):
- {advanced, free} × {dark, light} × {411x800, 360x800} = 16 base captures (setup:
  `trainer.dismissedBanners.add('workout:thr_lower')`, `Store.instance.init()` same as
  that file's pattern).
- advanced × {dark, light} × 411 with unread > 0 (seed like trainer_entry_test does so
  the pill shows) = 2 (names `-unread-`).
- docked state: advanced-dark-411 and free-light-411, drag the list up past the header
  delta, pumpAndSettle, capture = 2 (names `-docked-`).
- The test asserts each PNG file exists after writing (print CAPTURED lines like the
  reference harness).

## DO NOT
- Do NOT touch: app_shell.dart / nav bar, trainer hub screens, consultation sheet
  internals, routine_edit_screen.dart / source_tabs.dart (picker keeps its tabs), home
  banner, TCS content, workout flow, theme tokens (use GymColors only), pubspec.yaml,
  no new dependencies.
- Do NOT hardcode any user-facing string that has an existing l10n key; no prices
  anywhere.
- Do NOT delete or weaken behavioral assertions — reconcile them to the new spec.
- Do NOT push, do NOT rebase, do NOT touch files outside the worktree.
- Do NOT leave the `t.libraryCount` subtitle, `TrainerEntryStrip`, or the bell in the
  Exercises header.

## ACCEPTANCE CRITERIA
1. `flutter analyze` — 0 findings.
2. All 16 ARBs carry the 3 new keys; `flutter gen-l10n` committed;
   `flutter test test/i18n_test.dart` GREEN (run it FIRST).
3. New + reconciled tests GREEN: exercises_header, trainer_source, trainer_entry,
   coaching_funnel, polish, reps_only, tcs_captures (compile), trainer_captures (compile).
4. FULL `flutter test` — every failure either fixed or named in the RETURN with the
   pre-existing baseline (1 smoke share-sheet failure) as the only acceptable one.
5. Capture matrix written to `build/captures/exercises-header/` (20 PNGs).

## REQUIRED CHECKS (run in order, from the worktree)
1. `flutter gen-l10n`
2. `flutter analyze`
3. `flutter test test/i18n_test.dart`
4. `flutter test test/exercises_header_test.dart test/trainer_source_test.dart test/trainer_entry_test.dart test/coaching_funnel_test.dart test/polish_test.dart test/reps_only_test.dart`
5. `flutter test`
6. `flutter test test/exercises_header_captures_test.dart --dart-define=BB_CAPTURE=true --dart-define=BB_CAPTURE_DIR=build/captures/exercises-header`

## RETURN (report back)
- Commits made (hash + message), files changed, OpenCode decisions taken where the
  contract left room, full test counts (passed/failed/skipped per command), capture
  filenames, and any remaining risks — verbatim numbers, no claims without the command
  output.
