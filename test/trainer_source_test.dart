import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/exercises_screen.dart';
import 'package:gymmane/screens/trainer/custom_assigned_screen.dart';
import 'package:gymmane/screens/trainer/lock_overlay.dart';
import 'package:gymmane/screens/trainer/source_tabs.dart';
import 'package:gymmane/screens/trainer/trainer_library_screen.dart';
import 'package:gymmane/screens/trainer/trainer_video_screen.dart';
import 'package:gymmane/catalog/trainer_catalog.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart';

/// Premium exercise sources: the tab strip, the lock UX and the three
/// trainer screens. Tiers are scripted fakes — no Firebase, no network.
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

  // Tall surface so every grid card / video section is built and findable
  // without scrolling (the catalog is fixed: 6 sessions, 4 assignments).
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
      find.byWidgetPredicate((w) => w is Text && (w.data ?? '').toLowerCase().contains('bodybridge.net'));

  // Padlocks shown on the locked segments only — the screen has other, unrelated
  // lock icons, so the finder is scoped to the source tab strip.
  Finder tabPadlocks() => find.descendant(
    of: find.byType(PremiumSourceTabs),
    matching: find.byIcon(PhosphorIconsRegular.lockSimple),
  );

  group('free tier: Exercises screen stays free + locks the gated tabs', () {
    testWidgets('3 tabs render, Trainer and Custom carry padlocks, list unchanged', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      expect(find.text(t.sourceFree), findsOneWidget);
      expect(find.text(t.sourceTrainer), findsOneWidget);
      expect(find.text(t.sourceCustom), findsOneWidget);
      expect(tabPadlocks(), findsNWidgets(2));

      // The Free list renders exactly as before: the count header still
      // reports the untouched catalog size for the active filters.
      expect(
        find.text(t.libraryCount(fit.exercisesFiltered.length)),
        findsOneWidget,
        reason: 'the free list is untouched behind the Free tab',
      );
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

        final label = find.text(t.sourceTrainer);
        expect(label, findsOneWidget, reason: 'full Trainer label renders at ${size.width}dp');
        final paragraph = tester.renderObject<RenderParagraph>(label);
        debugPrint(
          'FIT360 avail=${paragraph.constraints.maxWidth} need=${paragraph.getMaxIntrinsicWidth(double.infinity)}',
        );
        expect(paragraph.didExceedMaxLines, isFalse, reason: 'Trainer label truncates at ${size.width}dp');
      }
    });

    testWidgets('tapping Trainer does NOT navigate: lock overlay + upsell sheet rise instead', (
      tester,
    ) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      await tester.tap(find.text(t.sourceTrainer));
      await tester.pumpAndSettle();

      expect(fit.route, 'home', reason: 'gated tabs never push a route');
      expect(find.byType(TrainerLibraryScreen), findsNothing);
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
      expect(ctaFinder(), findsOneWidget, reason: 'the CTA names bodybridge.net');
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
      expect(
        tester.getTopLeft(find.byType(TrainerLockScrim)).dy,
        greaterThanOrEqualTo(tester.getBottomRight(find.byType(PremiumSourceTabs)).dy),
        reason: 'the scrim starts at/below the tab strip — header and tabs are never under it',
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

      await tester.tap(find.text(t.sourceTrainer));
      await tester.pumpAndSettle();
      await tester.tap(find.text(t.notNow));
      await tester.pumpAndSettle();

      expect(find.text(titleCase(t.unlockAdvancedTitle)), findsNothing);
      expect(fit.route, 'home');
      expect(
        find.text(t.libraryCount(fit.exercisesFiltered.length)),
        findsOneWidget,
        reason: 'the free list is untouched behind the Free tab',
      );
    });
  });

  group('basic tier: same locked behavior (trainer_features is advanced-only)', () {
    testWidgets('locked tabs + lock UX, no navigation', (tester) async {
      final gate = FakeGate(AccountTier.basic);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      expect(tabPadlocks(), findsNWidgets(2));
      await tester.tap(find.text(t.sourceTrainer));
      await tester.pumpAndSettle();

      expect(fit.route, 'home', reason: 'basic cannot enter the trainer library either');
      expect(find.byType(TrainerLibraryScreen), findsNothing);
      expect(find.text(t.lockAdvancedMessage), findsOneWidget);
      expect(ctaFinder(), findsOneWidget);
    });
  });

  group('advanced tier: the three trainer screens', () {
    testWidgets('tapping Trainer pushes the trainer library route', (tester) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      expect(tabPadlocks(), findsNothing, reason: 'advanced is unlocked');
      await tester.tap(find.text(t.sourceTrainer));
      await tester.pumpAndSettle();

      expect(fit.route, 'trainer-library', reason: 'allowed taps navigate via the fit hooks');
    });

    testWidgets('TrainerLibraryScreen: coach, 6 sessions, NEW badge, category filter', (tester) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      await pumpTall(tester, const TrainerLibraryScreen(), gate);

      expect(find.text(kTrainerProfile.name), findsOneWidget);
      for (final s in kTrainerSessions) {
        expect(find.text(s.title), findsOneWidget, reason: '${s.title} card is present');
      }
      expect(find.text(t.newBadge), findsOneWidget, reason: 'only the 90/90 card carries NEW');
      expect(find.text(t.searchTrainerSessions), findsOneWidget);

      // Category chip filters the grid: CORE leaves only the Pallof card.
      await tester.tap(find.text(t.categoryCore.toUpperCase()));
      await tester.pumpAndSettle();

      expect(find.text('Pallof Press — setup'), findsOneWidget);
      expect(find.text('90/90 Hip Switch'), findsNothing);
      expect(find.text('Copenhagen Plank'), findsNothing);
    });

    testWidgets('tapping a card pushes the video screen with title, cues and steppers', (tester) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      await pumpTall(tester, const TrainerLibraryScreen(), gate);

      await tester.tap(find.text('Pallof Press — setup'));
      await tester.pumpAndSettle();

      expect(fit.route, 'trainer-video');
      await pumpTall(tester, TrainerVideoScreen(sessionId: kTrainerSessions.first.id), gate);

      expect(find.text('Pallof Press — setup'), findsOneWidget);
      for (final cue in kTrainerSessions.first.cues) {
        expect(find.text(cue), findsOneWidget);
      }
      expect(find.text(t.setsLabel.toUpperCase()), findsOneWidget);
      expect(find.text(t.repsLabel.toUpperCase()), findsOneWidget);
      expect(find.text('3'), findsOneWidget, reason: 'sets hint seeds the stepper');
      expect(find.text('10'), findsOneWidget, reason: 'reps hint seeds the stepper');
      expect(find.text(kTrainerProfile.name), findsOneWidget);
    });

    testWidgets('video screen fits title, cues, steppers and CTA above the fold at 411x914', (tester) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      tester.view.physicalSize = const Size(411, 914);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(
            gate: gate,
            child: Scaffold(body: TrainerVideoScreen(sessionId: kTrainerSessions.first.id)),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final session = kTrainerSessions.first;
      expect(find.text(session.title), findsOneWidget);
      expect(tester.getRect(find.text(session.title)).top, greaterThanOrEqualTo(0));
      expect(
        tester.getRect(find.text(session.cues.first)).bottom,
        lessThanOrEqualTo(914),
        reason: 'the first cue is visible',
      );
      expect(find.text(t.setsLabel.toUpperCase()), findsOneWidget);
      expect(find.text(t.repsLabel.toUpperCase()), findsOneWidget);
      expect(tester.getRect(find.text('3')).bottom, lessThanOrEqualTo(914), reason: 'sets stepper visible');
      expect(tester.getRect(find.text('10')).bottom, lessThanOrEqualTo(914), reason: 'reps stepper visible');
      final cta = find.text(t.addSessionToWorkout);
      expect(cta, findsOneWidget);
      expect(tester.getRect(cta).bottom, lessThanOrEqualTo(914), reason: 'the CTA must sit above the fold');
    });

    testWidgets('Custom tab pushes the assigned screen: coach note, 4 rows, DUE TODAY on the first only', (
      tester,
    ) async {
      final gate = FakeGate(AccountTier.advanced);
      AccountGate.install(gate);
      await pumpExercises(tester, gate);

      await tester.tap(find.text(t.sourceCustom));
      await tester.pumpAndSettle();

      expect(fit.route, 'trainer-assigned');
      await pumpTall(tester, const CustomAssignedScreen(), gate);

      expect(find.text(kTrainerCoachNote), findsOneWidget);
      for (final a in kTrainerAssignments) {
        expect(find.text(a.title), findsOneWidget, reason: '${a.title} row is present');
      }
      expect(find.text(t.dueToday.toUpperCase()), findsOneWidget, reason: 'only the first row is due today');
      expect(find.textContaining(t.assignedOn('')), findsWidgets);
      for (final a in kTrainerAssignments) {
        expect(find.text(a.durationLabel), findsOneWidget, reason: '${a.title} shows its own duration');
      }
      expect(
        find.text(t.assignedOn(t.longDate(DateTime(2026, 10, 12)))),
        findsNWidgets(2),
        reason: 'rows show the weekday: both Oct 12 rows carry Mon',
      );
    });
  });

  group('existing flows unaffected', () {
    test('exercisesFiltered length is unchanged while the source state moves', () {
      AccountGate.install(FakeGate(AccountTier.free));
      fit.setExSearch('bench');
      final n = fit.exercisesFiltered.length;
      expect(n, greaterThan(0), reason: 'the bench search matches factory exercises');

      fit.setExSource('trainer');
      fit.setExSource('custom');
      fit.setExSource('free');

      expect(fit.exercisesFiltered.length, n, reason: 'source state never touches filtering');
      expect(fit.exSource, 'free');
    });
  });
}
