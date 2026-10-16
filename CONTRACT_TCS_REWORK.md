# CONTRACT TCS-REWORK — fold trainer exercises into the EXISTING exercise/workout flow

## TASK
Product-owner (Carlos) revision: trainer and trainer-assigned exercises must be consumed through the EXISTING exercises list, the EXISTING exercise detail screen, and the EXISTING routine editor picker. The parallel trainer screens are removed entirely. Verbatim intent: "the flow is the same, the way workouts should be done are similar to free version — we should not change anything other than adding new exercises through the personal trainer."

## WORKSPACE
`C:\Users\thebe\.aa.StudioProjects\Body-Bridge\.worktrees\t_c52ff168` — branch `wt/t_c52ff168`. Work ONLY here.
Flutter SDK: `C:\Users\thebe\flutter\bin\flutter.bat`. Flutter is likely OFF your PATH — if `flutter --version` fails, do NOT attempt flutter commands; mark each check DEFERRED (the operator runs them). Do not install anything.

## CONTEXT (verified current architecture)
- `lib/models/exercise.dart` — universal `Exercise` model (id, name, primary, secondary, equipment, difficulty, art, steps, mode). Free catalog `kExercises` in `lib/catalog/exercise_catalog.dart` (~8865 lines, don't touch). User custom exercises live in `customExercises`; `allExercises = [...kExercises, ...customExercises]`.
- `lib/state/library_state.dart` (a `part of fit_state.dart`) — `exSource` ('free'|'trainer'|'custom', in-memory only, NOT persisted), `exercisesMatching(q)`/`exercisesFiltered` drive BOTH the Exercises screen list AND the routine editor picker. `openExercise(id)` pushes 'exercise-detail'. `goTrainerLibrary/goTrainerAssigned/goTrainerVideo` + `activeTrainerSessionId` push the parallel routes (to be removed). `exerciseById` resolves free+custom only today.
- `lib/state/places_state.dart:161` OVERRIDES `exercisesMatching(String query)` — see step 3, the override signature must keep conforming.
- `lib/screens/exercises_screen.dart` — Free/Trainer/Custom `PremiumSourceTabs`; `_onSourceTap` gates then PUSHES 'trainer-library'/'trainer-assigned' (to become in-place switching). Row anatomy: `ExerciseMedia(ex, height:52, radius:15, bordered:false)` thumb · name (14.5 w600) · `t.equipment · t.difficulty` (12) · star favourite; sections grouped by `primary` with header `muscleLabel(primary).toUpperCase()`; `TrainerLockScrim` + `TrainerLockOverlay` + `showTrainerUpsellSheet` handle the gated UX (KEEP unchanged).
- `lib/screens/exercise_detail_screen.dart` — media slot at ~line 119: `ExerciseMedia(ex, height:220, radius:22, live:true, bordered:false)`; media add/change/reset overlay buttons (~121–143); pencil edit → `showCreateExerciseSheet(editing:)`; favourite; `_meta(gc, t.primaryLabel, muscleLabel(ex.primary))` row; steps section renders `exerciseSteps(ex)`.
- `lib/screens/routine_edit_screen.dart` — the picker IS this screen: SearchField (~272) + `_filterChips` + `_pickRow` (`ExerciseMedia(ex, height:44, radius:10)`, name, `muscleLabel(primary) · equipment`, plus/check circle) fed by `fit.exercisesMatching(_q)` (line 48). Add/toggle = `fit.toggleRoutineExercise(_id, ex.id)`; reorder/set-planning/start-workout are separate existing paths.
- `lib/screens/trainer/` — `source_tabs.dart` (`enum SourceTab { free, trainer, custom }` + `PremiumSourceTabs`, KEEP as-is), `lock_overlay.dart` (`TrainerLockOverlay`, `TrainerLockScrim`, `showTrainerUpsellSheet`, KEEP as-is), `trainer_library_screen.dart` / `trainer_video_screen.dart` / `custom_assigned_screen.dart` (DELETE). The deleted files define `const Color _kVideoSurface = Color(0xFF1C1C1C)`, `_VideoArcs`/`_MiniArcs` painters, a tap-to-play host-driven player (progress bar + position/duration labels) — salvage that code into the new widget (step 4).
- `lib/catalog/trainer_catalog.dart` — seeds: `kTrainerSessions` (6 sessions: id, title, category ∈ strength/mobility/core/corrective/warmup, equipmentLabel ∈ Band/Mat/Bench/Wall/Kettlebell, durationSec, cues, setsHint, repsHint, isNew), `kTrainerAssignments` (4: sessionId, title, prescription, durationSec, date, dueToday), `kTrainerCategories` (['all','strength','mobility','core','corrective','warmup']), `TrainerVideoHost` + `StaticTrainerVideoHost` + `trainerVideoHostFactory` + `trainerSessionById`. The host abstraction is the deterministic playback seam for tests/captures — KEEP. `videoUrl` seeds are '' and the static host simulates playback. `TrainerSession` has NO difficulty field today.
- `lib/widgets/exercise_media.dart` — resolves LOCAL media via `fit.mediaFor(id)` (MediaStore files); falls back to `ExerciseArt` line drawing; `_VideoTile` = muted looping local-file video. Trainer exercises have no local media — they need the host-driven surface instead.
- `lib/app/app_shell.dart` — `_screen()` switch has 'trainer-library' / 'trainer-assigned' / 'trainer-video' cases (~357–362) + 3 trainer screen imports (~36–38). Bottom nav `_routes = ['home','progress','exercises','settings']` — no trainer slot, nothing to remove there.
- Gating: `context.can(kCapCustomExercises)` (`'trainer_features'`, `lib/constants/billing.dart`) — advanced-only; free/basic get lock overlay + upsell sheet (zero prices, link-out). This stays exactly as is.
- l10n: 16 ARBs under `lib/l10n/` (ar, de, en, es, fr, it, ja, ko, nl, pl, pt, ru, tr, uk, zh, zh_Hant); generated `app_localizations*.dart` files are COMMITTED in-tree. `t.muscle(id)` falls back to the raw id for unknown keys; `t.equipment(id)` falls back to equipOther for Mat/Bench/Wall; `t.difficulty(id)` maps Beginner/Advanced, everything else → Intermediate. Hand-written switch helpers live in `lib/l10n/l10n.dart` (`String muscle(String id)`, `String equipment(String id)`, etc.).
- Tests: `test/trainer_source_test.dart` (behavior tests; imports the screens being deleted → rewrite), `test/trainer_captures_test.dart` (env-gated `BB_CAPTURES=1` harness: FontLoader Nunito from assets/fonts + MaterialIcons from SDK cache + Phosphor loaded under BOTH bare and `packages/phosphoricons_flutter/` family names; sizes 411x914 + 360x800; dark+light; output `build/captures/trainer/`, gitignored), shared helpers `test/paywall_gating_test.dart` (`FakeGate`, `pumpHost`) — reuse.

## SCOPE (implement in this order; commit at each checkpoint)

### 1. i18n FIRST (before any code that references the keys)
Add EXACTLY these 5 new ARB keys to ALL 16 ARBs — nothing else unless truly unavoidable:
`trainerCatStrength`, `trainerCatMobility`, `trainerCatCore`, `trainerCatCorrective`, `trainerCatWarmup`
(en values: Strength / Mobility / Core / Corrective / Warm-up; translate the other 15 languages sensibly.)
Run gen-l10n (or hand-extend the generated files consistently if flutter is unavailable — prefer gen-l10n; if hand-editing, follow the existing generated switch patterns exactly so a later `flutter gen-l10n` is a no-op).
Commit checkpoint 1 (`TCS REWORK: i18n — trainer category labels`).

### 2. Data adapter — trainer exercises become Exercises
Extend `lib/catalog/trainer_catalog.dart`: add `final String difficulty;` to `TrainerSession` (default `'Beginner'` in the const constructor). Seed values: pallof-setup Beginner, hip-switch Intermediate, copenhagen-plank Advanced, tibialis-raise Beginner, goblet-bracing Intermediate, worlds-greatest-stretch Beginner.
New file `lib/catalog/trainer_exercises.dart`:
- `const Set<String> kTrainerCategoryIds = {'strength','mobility','core','corrective','warmup'};`
- `Exercise trainerSessionExercise(TrainerSession s)` → id `'tr-<s.id>'`, name `s.title`, primary `s.category`, secondary `const []`, equipment MAPPED: `Band→Band`, `Kettlebell→Kettlebell`, `Mat/Bench/Wall→Bodyweight` (all 6 seeds covered; keeps `t.equipment` and equipment filters truthful), difficulty `s.difficulty`, art `''`, steps `s.cues`, mode `''`.
- `Exercise trainerAssignmentExercise(TrainerAssignment a, int k)` → id `'as-<a.sessionId>-<k>'` where k = 0-based index of this assignment among assignments sharing `a.sessionId` in `kTrainerAssignments` order (deterministic across restarts — these ids get STORED in routines); name `a.title`; primary/equipment/difficulty inherited from the base session (`trainerSessionById`); art `''`; steps = `[a.prescription, ...base.cues]`; mode `''`.
- `List<Exercise> get trainerExercises` / `List<Exercise> get assignedExercises` (built from the seeds), and `bool isTrainerSourcedId(String id)` (membership or prefix — your choice, but consistent).
IDs must be stable; never regenerate them at runtime from timestamps.

### 3. State layer (`lib/state/library_state.dart`)
- REMOVE `goTrainerLibrary`, `goTrainerAssigned`, `goTrainerVideo`, `activeTrainerSessionId`.
- `exerciseById` must ALSO resolve `trainerExercises` + `assignedExercises` (so detail, routine rows, and sessions resolve trainer ids). Keep `allExercises` itself free+custom — free-user code paths (similar-exercises on free items, note/workout-import pickers) keep their exact old behavior.
- Extend `similarExercises` to search `[...allExercises, ...trainerExercises, ...assignedExercises]` — for free exercises nothing changes (category ids never equal muscle ids), trainer details get same-category suggestions.
- Make the list source-aware: `List<Exercise> exercisesMatching(String query, {String? source})` with `source ?? exSource`. `'trainer'` → run the SAME predicate pipeline (search via `exerciseSearch`, favourites, difficulty, equipment; muscle filter simply won't match since kFilterMuscles never contains category ids — correct) over `trainerExercises`; `'custom'` → same over `assignedExercises`; else the current free logic byte-identical.
- Grouping: trainer/custom sources group by `primary` ordered by `kTrainerCategories` skipping 'all', seed order within each category; the FREE source keeps `_groupedByMuscle` exactly. `exercisesFiltered` passes no source (uses `exSource`).
- Add `bool isTrainerSourced(String id)`.
- `lib/state/places_state.dart`: update the `exercisesMatching` override to accept and forward `{String? source}` (Dart overrides must accept the base's full signature).
- Add label helpers: `String trainerCategory(String id)` in `lib/l10n/l10n.dart` (switch over the 5 category ids → the new keys, fallback raw id) and `String exerciseSectionLabel(Exercise e)` in `lib/catalog/trainer_exercises.dart` (= `t.trainerCategory(e.primary)` when `kTrainerCategoryIds.contains(e.primary)`, else `muscleLabel(e.primary)`).
Commit checkpoint 2 (`TCS REWORK: trainer exercise adapter + source-aware library state`).

### 4. UI integration
New `lib/widgets/trainer_exercise_media.dart`:
- `TrainerExerciseMedia({super.key, required Exercise ex, required double height, double radius = 20, bool interactive = false})`. Resolves the underlying session/assignment from `ex.id` (via the adapter; `trainerSessionById` for base data).
- Static poster mode (list/picker rows): `_kVideoSurface` Color(0xFF1C1C1C) surface + arc CustomPaint (move `_VideoArcs`/`_MiniArcs` code here), centered play glyph, duration chip bottom-left (session `durationLabel`; assignment `durationSec`). Deterministic — no controllers, safe in widget tests.
- Interactive mode (detail slot): same visual language, tap-to-play/pause via `trainerVideoHostFactory`, bottom progress bar + position/duration labels (salvage from the deleted `trainer_video_screen.dart`), muted by default, `dispose()` the host in State.dispose, no badges.
`lib/screens/exercises_screen.dart`:
- `_onSourceTap`: free → `fit.setExSource('free')`; gated → existing lock overlay + upsell sheet (unchanged behavior); entitled trainer/custom → `fit.setExSource(tab.name)` — IN PLACE, NO navigation.
- Row thumbnail: trainer-sourced rows render `TrainerExerciseMedia(ex, height:52, radius:15)` instead of `ExerciseMedia`.
- ADVANCED badge on trainer-sourced rows: small pill with `t.advancedBadge` (style like the tab badge: AppTheme.f(7.5, w800), subtle bg pill) placed after the name (wrap name+badge in a Row, name stays ellipsized).
- Section headers for trainer/custom sources use `exerciseSectionLabel(ex).toUpperCase()`; FREE source byte-identical (`muscleLabel`).
- Everything else (search, quick chips, filters sheet incl. its count button, favourites, empty state, lock scrim/overlay) unchanged.
`lib/screens/exercise_detail_screen.dart`:
- Trainer-sourced: media slot renders `TrainerExerciseMedia(ex, height:220, radius:22, interactive:true)`; HIDE the media add/change/reset overlay buttons AND the pencil edit for trainer ids; KEEP favourite. Any display of `muscleLabel(ex.primary)` (the `_meta` primary row) uses `exerciseSectionLabel(ex)` for trainer-sourced exercises. Steps render automatically (cues / prescription+cues) via the existing steps UI.
- Free/custom exercises: byte-identical behavior.
`lib/screens/routine_edit_screen.dart`:
- Insert `PremiumSourceTabs` under the picker SearchField (before `_filterChips`), driven by LOCAL state `String _source = 'free'`; `_filtered => fit.exercisesMatching(_q, source: _source)`. Tab taps gated identically (lock overlay + upsell on gated tabs) and do NOT mutate the global `exSource`.
- `_pickRow`: trainer-sourced → `TrainerExerciseMedia(ex, height:44, radius:10)` + ADVANCED badge after the name; subtitle `exerciseSectionLabel(ex) · t.equipment(equipment)` for trainer-sourced.
- NOTHING else in the routine editor changes: add/toggle, sets/reps planning, reorder, save, start-workout — all existing code paths work off ids.
Commit checkpoint 3 (`TCS REWORK: in-place source tabs on exercises/detail/routine picker`).

### 5. DELETIONS
- Delete `lib/screens/trainer/trainer_library_screen.dart`, `trainer_video_screen.dart`, `custom_assigned_screen.dart`.
- `lib/app/app_shell.dart`: remove the 3 route cases + 3 imports.
- KEEP `source_tabs.dart` + `lock_overlay.dart` untouched.
- `trainer_catalog.dart`: keep the host abstraction and seed data. If `TrainerProfile`/`kTrainerProfile`/`kTrainerCoachNote` become fully unreferenced, leave them (public consts don't warn) — do not gut the file.
- l10n cleanup: for each ARB key whose identifier has ZERO remaining references in lib/ and test/ (grep before removing), remove it from all 16 ARBs + regen (or hand-extend consistently). Keys used only by the deleted screens (candidates: trainerSessionBadge, fromYourTrainerBadge, startAssignedWork, customAssignedTitle, addSessionToWorkout, addedToWorkout, assignedOn, dueToday, and any trainer-library keys) — VERIFY each by grep; KEEP anything still referenced anywhere; when uncertain, keep.
- Rewrite `test/trainer_source_test.dart` (reuse FakeGate/pumpHost from paywall_gating_test.dart):
  - free tier: padlocked tabs; tapping Trainer/Custom → lock overlay + upsell, NO navigation, free list unchanged; routine-editor picker tabs likewise gated; no free-user path reaches trainer exercises (spot-check openExercise/allExercises surfaces).
  - advanced tier: Exercises screen Trainer tab switches IN PLACE (no route push — assert fit.route stays 'exercises'), trainer rows visible (video thumbs + ADVANCED badges + category headers), Custom tab shows the 4 assigned exercises; row tap opens exercise-detail (interactive player present, no edit/media buttons); routine editor picker Trainer tab lists trainer exercises, tapping adds to the routine, save persists the id, `fit.routineExercises` resolves the name; `fit.modeOf('tr-pallof-setup') == ''` (rep-based like free).
  - determinism: id scheme (`tr-pallof-setup`, `as-<sessionId>-<k>`), equipment mapping (Mat→Bodyweight, Bench→Bodyweight, Wall→Bodyweight, Band→Band, Kettlebell→Kettlebell), category grouping order.
- Rewrite `test/trainer_captures_test.dart`: 3 scenarios — (a) Exercises screen with Trainer tab selected, (b) trainer exercise DETAIL with the player, (c) routine editor picker with Trainer tab selected — × dark/light × 411x914/360x800 = 12 PNGs, same env-gate + font-loading harness, same output dir.
Commit checkpoint 4 (`TCS REWORK: remove parallel trainer screens; rework tests`).

## DO NOT
- Do not change how FREE exercises behave in ANY surface (lists, detail, picker, routines, sessions, notes, import) — the free source path must be byte-identical.
- Do not touch the workout/routine/session creation/logging flow beyond the picker gaining source tabs.
- Do not modify services/, models/ (unless trivially required — explain), pubspec.yaml, android/, ios/ — and never pubspec.lock.
- Do not add l10n keys beyond the 5 trainerCat* keys without overwhelming justification.
- Do not add prices anywhere; the upsell stays zero-price link-out.
- Do not run `git push`. Do not commit capture PNGs (build/ is gitignored).
- Do not delete or weaken existing passing tests outside the two files being rewritten.
- Do not restyle `source_tabs.dart` / `lock_overlay.dart`.

## ACCEPTANCE CRITERIA
1. All 16 ARBs carry the 5 new keys; generated l10n stays consistent with the ARBs (a later `flutter gen-l10n` must be a no-op).
2. Zero references to the deleted screens/routes in lib/ and test/ (grep proves it).
3. Tier matrix: free/basic → no reachable trainer content anywhere (lists, detail, picker); advanced → end-to-end Exercises→detail(video)→picker→routine works with trainer exercises exactly like free ones.
4. `flutter analyze` (operator-run): 0 new issues. `flutter test` (operator-run): no new failures vs baseline (1 known pre-existing smoke failure).
5. Captures produce 12 PNGs (operator-run).
6. Every commit compiles standalone; no dangling staged-only state at any point.

## REQUIRED CHECKS
Run only if flutter is on your PATH, else mark DEFERRED and say so explicitly in the return:
- `flutter --version` (probe)
- `flutter analyze`
- `flutter test` (full)
If any flutter command rewrote `pubspec.lock`, leave it — the operator restores it; mention it.

## IMPLEMENTATION RULES
- Match existing style exactly: existing widgets (Pill, RoundAction, PrimaryButton, AppTheme.f, `context.gc` colors), l10n via `t.*`, no new dependencies, no reformatting of untouched code.
- Smallest coherent diffs; no drive-by refactors.
- Salvage (copy) code from deleted screens rather than reinventing visuals — the player/poster visuals were already approved.
- After finishing, self-verify: `git status` clean (all work committed), `git log --oneline` shows the 4 checkpoints, and grep proves no dangling references.

## RETURN
Report: full changed-files list, deleted files, decisions/deviations, commands run + results (or DEFERRED per check), your OpenCode session id, remaining risks. Verify claims with git status/diff before reporting — do not claim success on unverified states.
