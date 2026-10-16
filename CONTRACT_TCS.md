# CONTRACT_TCS — Premium Exercise Sources (Trainer library + Custom assigned + source tabs)

## TASK

Implement the approved "Premium Exercise Sources" feature in the Flutter app (GymMane 1.4.4+7):
a Free / Trainer / Custom source-tab strip on the Exercises screen, a Trainer library browse
screen, a trainer video player screen, a Custom assigned screen, and the gated (free/basic)
lock overlay + upsell sheet. Match the approved mockups EXACTLY. Binding references (read-only,
do NOT copy into the repo):

- Mockup PNGs: `C:/Users/thebe/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/e9f1358a-995c-4c13-a0e6-c3cbae8aacad/exports/`
  (library-picker, trainer-library, trainer-video-player, custom-assigned, upsell-locks, verify-screen1 .png)
- HTML sources + DESIGN.md one directory up (same project folder) — styling reference only.

`OPENCODING_PLAN.md` in the worktree is a prior draft plan. Where it conflicts with this
contract, THIS CONTRACT WINS. Known plan corrections:
- Do NOT create a new `_SegToggle` — `SegToggle`/`SegOption` already exist (lib/widgets/ui_kit.dart:623-664). Build a separate `PremiumSourceTabs` widget (own file) styled like SegToggle (bgRaised2 track, radius 100, 3px padding, ember active fill) but supporting a lock icon + "ADVANCED" badge per segment. Do NOT modify SegToggle.
- Do NOT use `entitlements_service.getEntitlement('trainer_features')` — gate via the existing
  capability system: `context.can(kCapCustomExercises)` (lib/constants/billing.dart;
  kCapCustomExercises = 'trainer_features'; granted for basic? NO — only advanced + enterprise
  per kPlanCapabilities in lib/services/entitlements_service.dart).
- No `segmentActive` token: use existing `gc.ember` for the active segment fill (dark = white,
  light = #3B4835 olive) exactly like every other active Pill/SegToggle in the app.
  verify-screen1.png COL NOTE binds this ("umber flips to olive #3B4835").

## WORKSPACE

Work ONLY in `C:/Users/thebe/.aa.StudioProjects/Body-Bridge/.worktrees/t_c52ff168`
(branch `wt/t_c52ff168`, currently at main tip 24629cfd). Never touch other worktrees.
Never push. Never merge. Commit every working checkpoint to the branch with clear messages.

## CONTEXT (verified facts — trust these, they were read from this worktree today)

- Host screen: `lib/screens/exercises_screen.dart`. `_header()` builds ScreenTitle(t.exercises)
  + count, then `SearchField` (line ~132), then `_quickChips`. The tab strip goes BETWEEN
  SearchField and _quickChips (verify-screen1: tabs under search, filter chips under tabs).
  The "+ New exercise" button is already gated by `context.can(kCapCustomExercises)` (line ~120) — leave as is.
- Capability gate: `context.can(kCapCustomExercises)` from `PremiumContext` (lib/widgets/premium_gate.dart:22-30);
  `AccountGate.instance` / `PremiumGate` inherited widget; test fake pattern `FakeGate(AccountTier.x)`
  exported by `test/paywall_gating_test.dart` (see usage in test/free_limits_test.dart:114-153:
  `AccountGate.install(FakeGate(...))` + `home: PremiumGate(gate: ..., child: ...)`) — reuse, do not invent.
- State: `lib/state/library_state.dart` is `part of fit_state.dart`, `mixin LibraryState on FitCore`.
  Additive fields go there. Global controller: `fit` (lib/state/fit_state.dart). Routes: `pushRoute(name)`
  / `_setRoute(name, reset: true)`; route switch in `lib/app/app_shell.dart` (~line 350
  `case 'exercises': return ExercisesScreen();`); `showNav` whitelist in lib/state/fit_core.dart:154
  decides bottom-nav visibility — do NOT add the new routes to it (mockups 2-4 have no bottom nav).
- Colors: `lib/theme/app_colors.dart` GymColors tokens. Active fill = `gc.ember`/`gc.onEmber`;
  soft green accents (selected checks, DUE TODAY, benefit checks, NEW badge) = `gc.sage`/`gc.sageSoft`;
  cards `gc.bgRaised`, track/chips `gc.bgRaised2`, borders `gc.border`, text tiers `gc.text/textSecondary/textTertiary`,
  peach accent `gc.accent`. DO NOT add color tokens.
- Reusable widgets in `lib/widgets/ui_kit.dart`: ScreenTitle, SearchField, Pill, PrimaryButton,
  SegToggle, SheetHandle, showAppSheet, Pressable, RoundAction; `context.gc` extension.
- Link-out precedent: `lib/screens/about_screen.dart:248` `launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication)`.
  `url_launcher: ^6.3.2` and `video_player: ^2.9.2` are ALREADY in pubspec.yaml — NO new dependencies.
- l10n: `t` from `lib/l10n/l10n.dart`; 16 ARBs at `lib/l10n/app_*.arb`
  (ar, de, en, es, fr, it, ja, ko, nl, pl, pt, ru, tr, uk, zh, zh_Hant). `flutter gen-l10n` regenerates.
  HARD RULE enforced by `test/i18n_test.dart`: (a) exact key parity across all 16 ARBs;
  (b) a literal scanner over lib/screens, lib/widgets, lib/app flags `Text('...')`, `label: '...'`,
  `hintText: '...'`, `ScreenTitle('...')`, `title: '...'` UI-looking English literals — ALL UI chrome
  strings must go through `t.*`. Seed/content strings live OUTSIDE those dirs (lib/catalog/) and are exempt,
  exactly like the exercise catalog.
- Auth bypass for manual/QA runs (already on this branch): `--dart-define=BB_AUTH_BYPASS=true
  --dart-define=BB_AUTH_BYPASS_TIER=advanced` (lib/dev/bypass_auth.dart). Tests do NOT need it — use FakeGate.
- Fonts for captures: Nunito TTFs at `assets/fonts/`; MaterialIcons at
  `$FLUTTER_ROOT/bin/cache/artifacts/material_fonts` (C:/Users/thebe/flutter/bin/cache/artifacts/material_fonts).
- ASCII body-line art per exercise exists at `assets/art/<slug>.txt` used via existing art widgets —
  you may reuse the existing art rendering path for thumbnails where a matching exercise art exists
  (e.g. banded-pallof-press); otherwise draw subtle arcs with CustomPaint. NO new binary assets.

## SCOPE

### New files
1. `lib/catalog/trainer_catalog.dart` — local, offline seed + model + player seam:
   - `class TrainerProfile { id, name, credentials }`; seed: Coach Maya Reyes, 'CSCS · Corrective exercise specialist' (initials MR).
   - `class TrainerSession { id, title, category, equipmentLabel, duration (const), cues (List<String>), isNew, videoUrl (String, default '') , setsHint, repsHint }`.
     Categories (const ids): all, strength, mobility, core, corrective, warmup.
     Seed EXACTLY per trainer-library.png (titles/subtitles/durations verbatim):
     - 'Pallof Press — setup' core/band 2:10 ; cues = ['Brace your trunk before each rep','Exhale as you rotate away','Stop at the pinch, not into pain'] ; setsHint '3', repsHint '10' ; duration 1:30 for player scrubber display per trainer-video-player.png (0:12 of 1:30) — model carries both list duration (2:10) and player duration (90s) OR a dedicated `playerDuration`; choose the cleanest.
     - '90/90 Hip Switch' mobility/mat 1:35 isNew=true
     - 'Copenhagen Plank' strength/bench 1:50
     - 'Tibialis Raise' corrective/wall 0:45
     - 'Goblet Squat — bracing' strength/kettlebell 3:20
     - "World's Greatest Stretch" warmup/mat 2:40
     All `videoUrl` empty (offline-first; static player).
   - `class TrainerAssignment { sessionId, title, note (italic prescription), setsText ('3×10, pause 2s at top' style is prescription — keep note + prescription separate: prescription like '3×10, pause 2s at top'), assignedDate (DateTime), dueToday (bool) }`. Seed EXACTLY per custom-assigned.png:
     - 'Pallof Press — tall kneeling' (title truncates to 'Pallof Press — tall …' naturally) prescription '3×10, pause 2s at top' assigned Mon Oct 12 dueToday=true
     - 'Wall Slide — tempo' prescription '2×12, 3s up, 3s down' assigned Mon Oct 12
     - 'Dead Bug — breath pacing' prescription '3×8 per side, exhale fully' assigned Fri Oct 9
     - 'Copenhagen — short lever' prescription '3×20s per side' assigned Fri Oct 9
     Coach note card text: 'Your shoulder is clearing — slow tempo this week.'
   - Player seam: `abstract class TrainerVideoHost { ... }` minimal interface (load(url)/dispose) +
     `class StaticTrainerVideoHost implements TrainerVideoHost` — deterministic, no network, holds
     position/duration (featured: 12s of 90s, paused). Screens use a host obtained from a
     `TrainerVideoHost Function()` factory typedef with static default; when `session.videoUrl` is
     non-empty a video_player-backed host MAY be attempted with try/catch fallback to static.
     Widget tests always exercise the static host (no network, no plugins).
2. `lib/screens/trainer/source_tabs.dart` — `PremiumSourceTabs`: full-width SegToggle-styled strip,
   3 segments (Free / Trainer / Custom). Segment data: label (t.*), locked (bool), badge ('ADVANCED' pill
   shown INSIDE the Trainer segment per mockups, visible in ALL tiers — it marks the tier that unlocks it).
   Locked segments show a small padlock icon (Phosphor `lockSimple`/`lock` regular) before the label.
   Active segment: ember fill + onEmber text. Track: bgRaised2, radius 100, 3px padding, height ~40.
   Callback: `onSelected(SourceTab)` — the PARENT decides navigation/lock (widget is stateless-ish).
3. `lib/screens/trainer/trainer_library_screen.dart` — Screen 2: back chevron + 'Trainer Library'
   title, PremiumSourceTabs (Trainer active), coach identity strip (MR initials avatar circle w/ accent
   border, name, credentials), SearchField(hint t.searchTrainerSessions) filtering sessions by title,
   category chips (All/Strength/Mobility/Core/Corrective/Warm-up — Pill, active = ember fill; 'ALL'
   label uppercase small per mockup), 2-column GridView of video cards: 16:10 dark thumbnail
   (bg #1C1C1C-equivalent via gc.bgRaised in dark AND light per mockup — video surfaces stay dark in
   both themes: use a fixed dark surface Color(0xFF1C1C1C) + subtle CustomPaint arcs + centered play
   circle w/ translucent bg), duration pill bottom-right, NEW sage pill top-right when isNew,
   title (14.5 w600) + 'category · equipment' subtitle (12 w500 textSecondary) below.
   Tap card → push trainer-video route for that session. Capability guard: if !can(kCapCustomExercises)
   render the lock state (see lock_overlay) instead of content.
4. `lib/screens/trainer/trainer_video_screen.dart` — Screen 3: top bar back chevron + bookmark icon
   (Phosphor bookmarkSimple, decorative toggle), portrait 9:16 video surface (dark in both themes),
   'TRAINER SESSION' uppercase micro-pill top-left inside surface, center play/pause circle button,
   bottom scrubber: thin track + round thumb at position, current/total time labels ('0:12' / '1:30').
   Static host advances nothing; play button toggles icon only (deterministic). Below: session title
   (19 w800), coach row (avatar + name + credentials), cue bullets (small sage dots + 13.5 w500 lines),
   SETS / REPS steppers side-by-side (label micro-caps, − value + with round ghost buttons, values from
   setsHint/repsHint, local setState only), PrimaryButton(t.addSessionToWorkout) → confirmation snackbar
   (t.addedToWorkout) — NO workout-domain writes (decision recorded). Capability guard as above.
5. `lib/screens/trainer/custom_assigned_screen.dart` — Screen 4: back chevron + title t.customAssignedTitle
   ('From your trainer'), PremiumSourceTabs (Custom active), coach card (bgRaised, radius ~20):
   '+ FROM YOUR TRAINER' sage pill (sageSoft bg, sage fg, tiny), coach strip, italic note text
   (Nunito italic 13.5 textSecondary). Assignment rows (bgRaised radius ~16): 9:16 mini dark thumb
   w/ play circle + duration pill bottom-left, title (14.5 w600, ellipsis), sage 'DUE TODAY' pill
   top-right when dueToday (tiny, sageSoft/sage), italic prescription (13 italic textSecondary),
   'Assigned <date>' (12 textTertiary) via intl date formatting honoring appLanguage (use existing
   t.shortDate-style helper if present; else DateFormat.medium with intlLocale). Tap row → trainer-video.
   Bottom PrimaryButton(t.startAssignedWork) → opens trainer-video for the first dueToday assignment
   (else first assignment). Capability guard as above.
6. `lib/screens/trainer/lock_overlay.dart` — Screen 5 gating UX, shown ON the Exercises screen when a
   gated tab is tapped: (a) content behind dims (scrim gc.bg ~78% alpha; mockup shows blurred content —
   prefer ImageFilter.blur via BackdropFilter if cheap, else plain scrim; wrap in an animated Stack
   overlay INSIDE the exercises screen body, NOT a dialog route), soft circle (mutedFill) with lock
   icon + centered message t.lockAdvancedMessage ('Trainer-recorded exercises are part of Advanced');
   (b) bottom sheet (showAppSheet + SheetHandle) titled t.unlockAdvancedTitle ('Unlock Advanced'),
   3 benefit rows with sage check icons — t.benefitTrainerLibrary / t.benefitCoachAssignments /
   t.benefitMonthlySessions — PrimaryButton(t.continueOnSite + ↗ arrow icon) → launchUrl
   (https://bodybridge.net, externalApplication) wrapped in try/catch, ghost text button t.notNow → pop.
   NO prices, NO '$', NO 'per month' anywhere in new UI (locked product fact).
   Sheet dismiss (Not now / back / scrim tap) returns to the untouched Free list; exSource stays 'free'.
7. `test/trainer_source_test.dart` — widget tests using FakeGate + PremiumGate + mock SharedPreferences
   (pattern of test/free_limits_test.dart):
   - free tier: Exercises screen shows 3 tabs; Trainer + Custom segments carry padlock icons;
     Free list renders exactly as before (same row count for a fixed catalog); tapping Trainer does NOT
     navigate and shows lock overlay + sheet; sheet contains benefit texts + 'bodybridge.net' CTA text
     and contains NO '$' character; Not now pops and Free content is intact.
   - advanced tier: tapping Trainer pushes TrainerLibraryScreen (coach name visible, 6 session cards,
     90/90 card carries NEW badge); category chip filters cards (tap 'Core' → only core sessions);
     tapping a card pushes video screen (title, cues, SETS 3 / REPS 10 steppers visible); Custom tab
     pushes CustomAssignedScreen (coach note, 4 rows, DUE TODAY on first row only).
   - basic tier: same locked behavior as free (trainer_features NOT in basic kPlanCapabilities).
   - existing flows unaffected: exercisesFiltered length unchanged on Free with active filters; no
     analyzer-visible changes to other tests (full suite still passes).
8. `test/trainer_captures_test.dart` — capture harness, ENV-GATED with EARLY RETURN
   (`if (Platform.environment['BB_CAPTURES'] != '1') { return; }` at top of main — do NOT rely on
   testWidgets skip APIs). setUpAll: FontLoader for every assets/fonts/Nunito-*.ttf + MaterialIcons
   from the SDK path above (fail loudly if missing). Captures (dark AND light) at logical size
   411x914 AND 360x800: (1) Exercises Free with tabs (free tier), (2) Exercises with lock overlay +
   sheet risen (free tier), (3) Trainer Library (advanced), (4) Trainer Video (advanced), (5) Custom
   Assigned (advanced). Write PNGs to `build/captures/trainer/<name>-<dark|light>-<411|360>.png`
   via RepaintBoundary + captureImage pattern used by flutter_test (render then toByteData png).

### Modified files (keep MINIMAL + additive)
- `lib/screens/exercises_screen.dart` — insert PremiumSourceTabs between SearchField and _quickChips
  in `_header()`; gated tap → lock overlay + sheet; allowed tap → `fit.goTrainerLibrary()` /
  `fit.goTrainerAssigned()`. Free tab = existing list (zero visual change otherwise). The screen
  becomes source-aware ONLY via the tab strip. Do not restructure anything else.
- `lib/state/library_state.dart` — additive: `String exSource = 'free';` + `void setExSource(String s)`
  (notifyListeners; only called for allowed transitions).
- `lib/state/fit_core.dart` — ADDITIVE ONLY navigation hooks near the existing go* methods:
  `void goTrainerLibrary() => pushRoute('trainer-library');`,
  `void goTrainerAssigned() => pushRoute('trainer-assigned');`,
  `void goTrainerVideo(String sessionId) { activeTrainerSessionId = sessionId; pushRoute('trainer-video'); }`
  + `String activeTrainerSessionId = kTrainerSessions.first.id;` (or store in library_state — your call,
  keep it in the library mixin). DO NOT touch existing lines (deleting goSettings/goPreferences broke
  main once — never again).
- `lib/app/app_shell.dart` — exactly 3 additive route cases returning the 3 new screens. Nothing else.
- `lib/l10n/app_*.arb` — ALL 16 files, exact key parity. en values (translate ALL to natural,
  real translations in the other 15 — no placeholder copies of English except where a locale genuinely
  borrows the word):
  sourceFree 'Free', sourceTrainer 'Trainer', sourceCustom 'Custom', advancedBadge 'ADVANCED',
  trainerLibraryTitle 'Trainer Library', searchTrainerSessions 'Search trainer sessions',
  categoryAll 'All', categoryStrength 'Strength', categoryMobility 'Mobility', categoryCore 'Core',
  categoryCorrective 'Corrective', categoryWarmup 'Warm-up', trainerSessionBadge 'TRAINER SESSION',
  newBadge 'NEW', customAssignedTitle 'From your trainer', fromYourTrainerBadge 'From your trainer',
  dueToday 'Due today', assignedOn 'Assigned {date}' (+ @assignedOn placeholders metadata, date:String),
  startAssignedWork 'Start assigned work', unlockAdvancedTitle 'Unlock Advanced',
  benefitTrainerLibrary 'Full trainer video library',
  benefitCoachAssignments 'Exercises assigned personally by your coach',
  benefitMonthlySessions 'New trainer sessions monthly', continueOnSite 'Continue on bodybridge.net',
  notNow 'Not now', lockAdvancedMessage 'Trainer-recorded exercises are part of Advanced',
  setsLabel 'Sets', repsLabel 'Reps', addSessionToWorkout 'Add to workout',
  addedToWorkout 'Added to workout'.
  Then run `flutter gen-l10n`.
- `build/captures/trainer/` — capture output (build/ is gitignored; do NOT commit captures).

## DO NOT

- Do NOT modify: SegToggle, paywall_screen.dart, kPaywallPlans/billing constants (existing paywall keeps
  its prices; the NEW sheet must never show prices), analysis_options.yaml, existing tests' assertions,
  pubspec.yaml (deps already present), any file outside this worktree.
- Do NOT weaken or skip existing tests. Do NOT edit generated app_localizations*.dart by hand — gen-l10n owns them.
- Do NOT add dependencies, assets, or network calls. Seed data is compile-time const.
- Do NOT navigate gated tabs (no route push when !can); do NOT leak trainer content into free/basic builds' widget trees.
- Do NOT use openrouter/google/gemini-3.8-flash (out of credits). This contract runs on zai-coding-plan/glm-4.7.
- Do NOT push, merge, or rebase. Commit locally to wt/t_c52ff168 at each checkpoint.

## ACCEPTANCE CRITERIA

1. `flutter analyze` — 0 new findings vs the pre-existing baseline (baseline: 2 info-level onReorder
   deprecations in routine_edit_screen.dart / session_screen.dart; generated l10n files excluded).
2. `flutter test test/i18n_test.dart` — ALL pass (16-ARB parity + literal scanner clean).
3. `flutter test test/trainer_source_test.dart` — ALL pass.
4. `flutter test` FULL suite — pass count recorded; any failure must be named and classified
   pre-existing vs introduced (introduced = contract violated).
5. `dart format` on every file you created/edited (page width 110 per analysis_options).
6. `BB_CAPTURES=1 flutter test test/trainer_captures_test.dart` produces 20 PNGs
   (5 screens × 2 themes × 2 sizes) under build/captures/trainer/.
7. Every checkpoint committed; `git log --oneline` shows the phase commits; working tree clean at the end
   except build/ artifacts. OPENCODE_CONTRACT.md and this file (CONTRACT_TCS.md) stay committed as-is.

## REQUIRED CHECKS (run inside the worktree; C:/Users/thebe/flutter/bin/flutter)

- `flutter gen-l10n` (after ARB edits)
- `flutter analyze`
- `flutter test test/i18n_test.dart test/trainer_source_test.dart`
- `flutter test` (full)
- `BB_CAPTURES=1 flutter test test/trainer_captures_test.dart`
- `git status --short` + `git log --oneline -8` at the end

## IMPLEMENTATION RULES

- Read before writing: exercises_screen.dart, ui_kit.dart (SegToggle/Pill/PrimaryButton/SheetHandle/showAppSheet),
  premium_gate.dart, account_gate.dart, entitlements_service.dart (kPlanCapabilities),
  exercises_screen insertion area, fit_core.dart routes, app_shell.dart route switch,
  free_limits_test.dart + paywall_gating_test.dart (FakeGate pattern), i18n_test.dart (scanner),
  app_colors.dart, exercise_media.dart (video_player precedent), about_screen.dart:240-250 (launchUrl).
- Match existing code style: AppTheme.f(...) for all text, gc.* tokens only, 110-col formatting,
  const constructors where possible, no setState in parents that have FitState equivalents.
- Mockup-fidelity details that MATTER (verified against PNGs): '+ ADVANCED' badge sits INSIDE the
  Trainer segment next to its label in every state; padlock glyphs sit INSIDE locked segments before
  the label (upsell-locks.png); trainer video surface is dark in BOTH themes and portrait 9:16;
  category chips wrap to 2 rows (ALL STRENGTH MOBILITY CORE / CORRECTIVE WARM-UP); the assigned-row
  prescription line is italic; 'DUE TODAY' only on the first assignment; the coach note card carries
  the '+ FROM YOUR TRAINER' sage pill; lock overlay keeps the picker visible but dimmed behind it;
  the benefits sheet has a drag handle, no prices, ↗ arrow on the CTA.
- Turkish/Arabic/etc: use proper localized strings — do not machine-copy English. RTL-safe (no
  hardcoded left/right where Directionality matters; use start/end).
- If a check fails, fix and re-run before committing that phase.

## PHASE ORDER (commit after each)

P1 l10n: all 16 ARBs + gen-l10n + i18n test green. Commit 'TCS P1: l10n keys for premium exercise sources (16 locales)'.
P2 seed + state + routes: trainer_catalog.dart, library_state exSource, fit_core hooks, app_shell cases, analyze clean. Commit 'TCS P2: trainer catalog seed, source state, routes'.
P3 tabs + lock overlay on Exercises screen. Commit 'TCS P3: source tabs + lock overlay + upsell sheet'.
P4 trainer library + video + custom screens. Commit 'TCS P4: trainer library, video player, custom assigned screens'.
P5 tests + captures: trainer_source_test.dart green, capture harness + PNGs, full suite. Commit 'TCS P5: tests + capture harness'.
P6 write `DIVERGENCES_TCS.md` in the worktree root: every intentional divergence vs the mockups
   (e.g. dark active-pill color follows gc.ember token per verify-screen1, list durations vs player
   duration for Pallof,snackbar-only Add-to-workout) + anything you could not match. Commit 'TCS P6: divergence notes'.

## RETURN

Report back: files created/changed (paths), commands run + results (analyze counts, test counts),
OpenCode session id, capture PNG paths, divergence-list summary, any blockers. Do not claim success
without the checks above having actually run and passed.
