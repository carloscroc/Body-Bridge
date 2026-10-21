import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/catalog/trainer_catalog.dart';
import 'package:gymmane/catalog/trainer_exercises.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/exercise_detail_screen.dart';
import 'package:gymmane/screens/exercises_screen.dart';
import 'package:gymmane/screens/routine_edit_screen.dart';
import 'package:gymmane/screens/trainer/lock_overlay.dart';
import 'package:gymmane/screens/trainer/source_tabs.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/trainer_exercise_media.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart';

/// Premium exercise sources: the tab strip and the lock UX on the existing
/// exercises / detail / routine-picker surfaces — the trainer library has no
/// screens of its own. Tiers are scripted fakes — no Firebase, no network.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    const files = [
      'Nunito-Regular',
      'Nunito-Italic',
      'Nunito-Medium',
      'Nunito-SemiBold',
      'Nunito-SemiBoldItalic',
      'Nunito-Bold',
      'Nunito-ExtraBold',
      'Nunito-Black',
    ];
    final loader = FontLoader('Nunito');
    for (final file in files) {
      loader.addFont(rootBundle.load('assets/fonts/$file.ttf'));
    }
    await loader.load();
  });

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    fit.saveAndExit();
    fit.sessions.clear();
    fit.routines.clear();
    fit.onboarded = true;
    fit.resetRoute('home');
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
    fit.resetRoute('home');
  });

  Future<void> pumpExercises(WidgetTester tester, AccountGate gate) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: gate,
          child: const Scaffold(body: ExercisesScreen()),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  }

  // Row badges only — the Trainer tab chip inside the tab strip also reads
  // "ADVANCED", so count badges outside PremiumSourceTabs.
  int rowBadgeCount() => find
      .text(t.advancedBadge)
      .evaluate()
      .where((e) => e.findAncestorWidgetOfExactType<PremiumSourceTabs>() == null)
      .length;

  // Tall surface so every row / section header is built and findable
  // without scrolling (the trainer pool is fixed: 6 sessions, 4 assignments).
  Future<void> pumpTall(WidgetTester tester, Widget screen, AccountGate gate) async {
    tester.view.physicalSize = const Size(411, 1700);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: gate,
          child: Scaffold(body: screen),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  Finder ctaFinder() =>
      find.byWidgetPredicate((w) => w is Text && (w.data ?? '').toLowerCase().contains('bodybridge.fit'));

  // Padlocks shown on the locked segments only — the screen has other, unrelated
  // lock icons, so the finder is scoped to the source tab strip.
  Finder tabPadlocks() => find.descendant(
    of: find.byType(PremiumSourceTabs),
    matching: find.byIcon(PhosphorIconsRegular.lockSimple),
  );

  void resetSource() {
    fit.setExSource('all'); // t_a9afb1b7: 'all' is the new default source
    fit.activeRoutineId = null;
  }

  group('free tier: Exercises screen stays free + locks the gated tabs', () {
    testWidgets('4 quiet chips render, All stays the free pool (strip→chips t_a9afb1b7)', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      // t_a9afb1b7: the tab strip became quiet count chips, keyed per source.
      for (final key in ['chip-all', 'chip-free', 'chip-trainer', 'chip-custom']) {
        expect(find.byKey(ValueKey(key)), findsOneWidget, reason: '$key chip renders');
      }
      expect(find.byType(PremiumSourceTabs), findsNothing,
          reason: 'the tab strip survives only in the routine picker');
      // t_a9afb1b7: the per-list libraryCount subtitle is gone — counts live
      // inside the chips, so the old subtitle assertion is dropped. And 'all'
      // now merges the libraries: free users see trainer rows LOCKED in the
      // All view — the lock UX replaces absence.
      expect(find.text('Pallof Press — setup'), findsOneWidget,
          reason: 'the All view lists trainer rows locked for free users');
    });

    testWidgets('tab labels fit without ellipsis at 360x800 and 411x914', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      for (final size in [const Size(360, 800), const Size(411, 914)]) {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.dark,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: PremiumGate(
              gate: gate,
              child: const Scaffold(body: ExercisesScreen()),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 300));

        // t_a9afb1b7: chips label the sources now ("Trainer N") — measure the
        // chip's Text, not a bare source label.
        final label = find.descendant(
          of: find.byKey(const ValueKey('chip-trainer')),
          matching: find.byType(Text),
        );
        expect(label, findsOneWidget, reason: 'full Trainer label renders at ${size.width}dp');
        final paragraph = tester.renderObject<RenderParagraph>(label);
        debugPrint(
          'FIT360 avail=${paragraph.constraints.maxWidth} need=${paragraph.getMaxIntrinsicWidth(double.infinity)}',
        );
        expect(paragraph.didExceedMaxLines, isFalse, reason: 'Trainer label truncates at ${size.width}dp');
      }
    });

    testWidgets('tapping the Trainer chip does NOT navigate: lock overlay + upsell sheet rise instead (t_a9afb1b7)', (
      tester,
    ) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);
      final sourceBefore = fit.exSource;

      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      expect(fit.route, 'home', reason: 'gated tabs never push a route');
      expect(fit.exSource, sourceBefore, reason: 'gated taps never change the active source');
      expect(find.text(t.lockAdvancedMessage), findsOneWidget, reason: 'the dim overlay explains the lock');
      final overlayOpacity = tester.widget<AnimatedOpacity>(
        find.descendant(of: find.byType(TrainerLockOverlay), matching: find.byType(AnimatedOpacity)),
      );
      expect(overlayOpacity.opacity, 1.0, reason: 'the lock message shows above the scrim at full opacity');
      expect(
        tester.getCenter(find.text(t.lockAdvancedMessage)).dy,
        lessThan(tester.view.physicalSize.height / tester.view.devicePixelRatio * 0.5),
        reason: 'the lock message sits in the space above the sheet',
      );
      expect(find.text(titleCase(t.unlockAdvancedTitle)), findsOneWidget);
      expect(find.text(t.benefitTrainerLibrary), findsOneWidget);
      expect(find.text(t.benefitCoachAssignments), findsOneWidget);
      expect(find.text(t.benefitMonthlySessions), findsOneWidget);
      expect(ctaFinder(), findsOneWidget, reason: 'the CTA names bodybridge.fit');
      expect(find.textContaining(r'$'), findsNothing, reason: 'no prices anywhere in the sheet');

      // Composite legibility: no route-level dim or blur; the scrim lives only
      // over the list region; the lock message paints at full opacity above it.
      for (final barrier in tester.widgetList<ModalBarrier>(find.byType(ModalBarrier))) {
        expect(
          (barrier.color?.a ?? 0) == 0,
          isTrue,
          reason: 'no dimming route layer — the visible dim comes only from the list scrim',
        );
      }
      RenderObject node = tester.renderObject<RenderParagraph>(find.text(t.lockAdvancedMessage));
      while (node.parent != null) {
        node = node.parent!;
        if (node is RenderOpacity) {
          expect(node.opacity, 1.0, reason: 'no partial-opacity RenderOpacity above the lock message');
        }
        if (node is RenderAnimatedOpacity) {
          expect(node.opacity.value, 1.0, reason: 'no mid-fade RenderAnimatedOpacity above the lock message');
        }
      }
      // t_a9afb1b7: two scrims exist while locked (pinned-header scrim +
      // overlay scrim); the header one comes first in traversal order.
      expect(
        tester.getTopLeft(find.byType(TrainerLockScrim).first).dy,
        greaterThanOrEqualTo(tester.getBottomRight(find.byKey(const ValueKey('chip-trainer'))).dy),
        reason: 'the scrim starts at/below the pinned header chips — they are never under it',
      );
      final allBlurs = tester.widgetList(find.byType(BackdropFilter)).length;
      expect(allBlurs, greaterThan(0), reason: 'the list scrim itself blurs the list area');
      expect(
        find.descendant(of: find.byType(TrainerLockScrim), matching: find.byType(BackdropFilter)),
        findsNWidgets(allBlurs),
        reason: 'every BackdropFilter lives inside the list scrim — no route-level blur barrier',
      );
    });

    testWidgets('Not now pops the sheet and the Free list is intact', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();
      await tester.tap(find.text(t.notNow));
      await tester.pumpAndSettle();

      expect(find.text(titleCase(t.unlockAdvancedTitle)), findsNothing);
      expect(fit.route, 'home');
      // t_a9afb1b7: the per-list libraryCount subtitle is gone — counts live
      // in the chips; free-list intactness is covered by the pool tests below.
    });

    test('no free path reaches trainer exercises: allExercises and the free list exclude tr-/as- ids', () {
      AccountGate.install(FakeGate(AccountTier.free));
      expect(
        fit.allExercises.where((e) => isTrainerSourcedId(e.id)),
        isEmpty,
        reason: 'allExercises stays catalog + customs',
      );
      // t_a9afb1b7: 'all' merges the libraries by design — exercisesFiltered
      // follows the active source, so the invariant lives on the free pool.
      expect(
        fit.exercisesMatching('', source: 'free').where((e) => isTrainerSourcedId(e.id)),
        isEmpty,
        reason: 'the free pool never surfaces trainer items',
      );
      expect(fit.exercisesFiltered, isNotEmpty, reason: 'the free pool itself is intact');
    });

    testWidgets('routine editor picker: gated tabs stay locked for free users', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      fit.activeRoutineId = fit.createRoutine('Free Pick');
      addTearDown(resetSource);
      await pumpTall(tester, const RoutineEditScreen(), gate);

      expect(tabPadlocks(), findsNWidgets(2));
      await tester.tap(find.text(t.sourceTrainer));
      await tester.pumpAndSettle();

      expect(fit.route, 'home', reason: 'gated picker tabs never push a route');
      expect(
        find.text(titleCase(t.unlockAdvancedTitle)),
        findsOneWidget,
        reason: 'the upsell sheet rises from the picker too',
      );
      expect(find.text('Pallof Press — setup'), findsNothing, reason: 'the picker stays on the free pool');
      expect(find.byType(TrainerExerciseMedia), findsNothing);
    });
  });

  group('basic tier: same locked behavior (trainer_features is advanced-only)', () {
    testWidgets('All view locks trainer rows + lock UX, no navigation (t_a9afb1b7)', (tester) async {
      final gate = FakeGate(AccountTier.basic);
      AccountGate.install(gate);
      // t_a9afb1b7: 'all' is the new default and gated users see the trainer
      // pool locked in place — use the tall surface so the sections build.
      await pumpTall(tester, const ExercisesScreen(), gate);
      final sourceBefore = fit.exSource;

      expect(find.byType(PremiumSourceTabs), findsNothing,
          reason: 'quiet chips on Exercises — the tab strip lives only in the picker');
      expect(find.text(t.sectionTrainerLibrary.toUpperCase()), findsOneWidget,
          reason: 'the All view opens on the trainer section');
      expect(find.text(t.sectionFreeLibrary.toUpperCase()), findsOneWidget);
      expect(find.text(t.srcLocked), findsNWidgets(10),
          reason: '6 sessions + 4 assignments render LOCKED in the All pool');

      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      expect(fit.route, 'home', reason: 'basic cannot enter the trainer library either');
      expect(fit.exSource, sourceBefore, reason: 'gated taps never change the active source');
      // t_a9afb1b7: locked rows render their thumbnail behind the LOCKED chip
      // by design — the leak guard is behavioral: the blocked tap leaves every
      // trainer row locked instead of removing the art.
      expect(find.text(t.srcLocked), findsNWidgets(10),
          reason: 'the blocked tap leaves every trainer row locked');
      expect(find.text(t.lockAdvancedMessage), findsOneWidget);
      expect(ctaFinder(), findsOneWidget);
    });
  });

  group('advanced tier: trainer sources fold into the existing screens', () {
    testWidgets('tapping Trainer switches the source in place — no route push', (tester) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      addTearDown(resetSource);
      await pumpExercises(tester, gate);

      expect(tabPadlocks(), findsNothing, reason: 'advanced is unlocked');
      final before = fit.route;
      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      expect(fit.exSource, 'trainer', reason: 'sources switch in place');
      expect(fit.route, before, reason: 'no route push — the list swaps in place');
    });

    testWidgets('Trainer tab lists the 6 sessions grouped by category with thumbs and ADVANCED badges', (
      tester,
    ) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      addTearDown(resetSource);
      await pumpTall(tester, const ExercisesScreen(), gate);
      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      for (final s in kTrainerSessions) {
        expect(find.text(s.title), findsOneWidget, reason: '${s.title} row is present');
      }
      expect(find.byType(TrainerExerciseMedia), findsNWidgets(6), reason: 'every row carries its thumb');
      expect(rowBadgeCount(), 6, reason: 'every row carries the badge');
      for (final c in ['core', 'mobility', 'strength', 'corrective', 'warmup']) {
        expect(
          find.text(t.trainerCategory(c).toUpperCase()),
          findsOneWidget,
          reason: 'the $c section header is present',
        );
      }
      final seen = <String>[];
      for (final e in fit.exercisesFiltered) {
        if (seen.isEmpty || seen.last != e.primary) seen.add(e.primary);
      }
      expect(seen, ['strength', 'mobility', 'core', 'corrective', 'warmup'],
          reason: 'sections follow kTrainerCategories order');
    });

    testWidgets('Custom tab lists the 4 assigned exercises with thumbs and badges', (tester) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      addTearDown(resetSource);
      await pumpTall(tester, const ExercisesScreen(), gate);
      await tester.tap(find.byKey(const ValueKey('chip-custom')));
      await tester.pumpAndSettle();

      expect(fit.exSource, 'custom', reason: 'sources switch in place');
      for (final a in kTrainerAssignments) {
        expect(find.text(a.title), findsOneWidget, reason: '${a.title} row is present');
      }
      expect(find.byType(TrainerExerciseMedia), findsNWidgets(4));
      expect(rowBadgeCount(), 4, reason: 'every row carries the badge');
    });

    testWidgets('tapping a trainer row opens exercise-detail: interactive player, no edit/media buttons', (
      tester,
    ) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      addTearDown(resetSource);
      await pumpTall(tester, const ExercisesScreen(), gate);
      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Pallof Press — setup'));
      await tester.pumpAndSettle();

      expect(fit.activeExerciseId, 'tr-pallof-setup');
      expect(fit.route, 'exercise-detail');
      await pumpTall(tester, const ExerciseDetailScreen(), gate);

      expect(find.byType(TrainerExerciseMedia), findsOneWidget,
          reason: 'the interactive player replaces the free art');
      expect(find.byIcon(PhosphorIconsRegular.pencilSimple), findsNothing,
          reason: 'trainer exercises are not editable');
      expect(find.byIcon(PhosphorIconsRegular.trash), findsNothing,
          reason: 'trainer exercises cannot be deleted');
    });

    testWidgets('routine editor picker: Trainer tab lists trainer exercises; adding persists on save', (
      tester,
    ) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      addTearDown(resetSource);
      fit.activeRoutineId = fit.createRoutine('Trainer Pick');
      final rid = fit.activeRoutineId!;
      await pumpTall(tester, const RoutineEditScreen(), gate);

      await tester.tap(find.text(t.sourceTrainer));
      await tester.pumpAndSettle();
      expect(find.text('Pallof Press — setup'), findsOneWidget);

      await tester.tap(find.text('Pallof Press — setup'));
      await tester.pumpAndSettle();
      expect(fit.activeRoutine!.exerciseIds, contains('tr-pallof-setup'),
          reason: 'tapping a trainer row adds it to the routine');

      fit.saveAndExit();
      final saved = fit.routines.firstWhere((r) => r.id == rid);
      expect(saved.exerciseIds, contains('tr-pallof-setup'), reason: 'save persists the trainer id');
      expect(fit.routineExercises(saved).first.name, 'Pallof Press — setup',
          reason: 'routineExercises resolves the trainer name');
    });

    test('trainer ids stay rep-based: modeOf is empty like free exercises', () {
      expect(fit.modeOf('tr-pallof-setup'), '');
    });
  });

  group('determinism', () {
    test('id scheme: tr-<session> and as-<session>-<seat>', () {
      expect(trainerExercises.map((e) => e.id), [
        'tr-pallof-setup',
        'tr-hip-switch',
        'tr-copenhagen-plank',
        'tr-tibialis-raise',
        'tr-goblet-bracing',
        'tr-worlds-greatest-stretch',
      ]);
      expect(assignedExercises.map((e) => e.id), [
        'as-pallof-setup-0',
        'as-tibialis-raise-0',
        'as-pallof-setup-1',
        'as-copenhagen-plank-0',
      ]);
    });

    test('equipment mapping: Mat/Bench/Wall→Bodyweight, Band→Band, Kettlebell→Kettlebell', () {
      final byId = {for (final e in [...trainerExercises, ...assignedExercises]) e.id: e};
      expect(byId['tr-pallof-setup']!.equipment, 'Band');
      expect(byId['tr-hip-switch']!.equipment, 'Bodyweight');
      expect(byId['tr-copenhagen-plank']!.equipment, 'Bodyweight');
      expect(byId['tr-tibialis-raise']!.equipment, 'Bodyweight');
      expect(byId['tr-goblet-bracing']!.equipment, 'Kettlebell');
      expect(byId['tr-worlds-greatest-stretch']!.equipment, 'Bodyweight');
      expect(byId['as-pallof-setup-0']!.equipment, 'Band');
      expect(byId['as-copenhagen-plank-0']!.equipment, 'Bodyweight');
    });

    test('category grouping follows kTrainerCategories order', () {
      AccountGate.install(FakeGate(AccountTier.advanced));
      addTearDown(resetSource);
      fit.setExSource('trainer');
      final seen = <String>[];
      for (final e in fit.exercisesFiltered) {
        if (seen.isEmpty || seen.last != e.primary) seen.add(e.primary);
      }
      expect(seen, ['strength', 'mobility', 'core', 'corrective', 'warmup']);
    });
  });

  group('existing flows unaffected', () {
    test('exercisesFiltered length is restored when the source returns to free', () {
      AccountGate.install(FakeGate(AccountTier.free));
      fit.setExSearch('bench');
      final n = fit.exercisesFiltered.length;
      expect(n, greaterThan(0), reason: 'the bench search matches factory exercises');

      fit.setExSource('trainer');
      fit.setExSource('custom');
      fit.setExSource('free');

      expect(fit.exercisesFiltered.length, n, reason: 'returning to free restores the catalog pool');
      expect(fit.exSource, 'free');
    });
  });
}
