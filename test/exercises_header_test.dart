// Exercises header rework widget tests (contract t_a9afb1b7): the 38dp coach
// disc with unread pill, quiet count chips, the 'all' default source with
// section banners, LOCKED row chips, and the dockable pinned header.
//
// Harness mirrors trainer_source_test (FakeGate + mock SharedPreferences +
// Store.instance.init); the disc/back test mirrors trainer_entry_test's
// route-switch surface.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/catalog/trainer_exercises.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/exercises_screen.dart';
import 'package:gymmane/screens/home_screen.dart';
import 'package:gymmane/screens/trainer/lock_overlay.dart';
import 'package:gymmane/screens/trainer_home_screen.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/consultation_sheet.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/trainer_kit.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FakeGate extends AccountGate {
  FakeGate(this.tier);
  final AccountTier tier;

  @override
  AccountSnapshot get snapshot =>
      AccountSnapshot(tier: tier, email: tier == AccountTier.signedOut ? null : 'a@b.c');

  @override
  bool canAccess(String feature) => tierCan(tier, feature);

  @override
  Future<void> signIn(String email, String password) async {}

  @override
  Future<void> signUp(String email, String password) async {}

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}

  @override
  Future<void> sendPasswordReset(String email) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    fit.saveAndExit();
    fit.sessions.clear();
    fit.routines.clear();
    fit.onboarded = true;
    // t_a9afb1b7: 'all' is the new default — reset it so tests that mutate
    // the source never leak into the default-source assertions.
    fit.setExSource('all');
    fit.resetRoute('home');
    trainer.resetForTest();
    // t_a9afb1b7: dismiss the floating workout banner card — it slides in
    // over the top edge and covers the disc's tap target on advanced surfaces.
    trainer.dismissedBanners.add('workout:thr_lower');
    setAppLanguage('en');
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
    fit.resetRoute('home');
  });

  // Route-switch surface (same shape as trainer_entry_test's pumpSurface) so
  // disc taps can be followed through fit.route transitions.
  Future<void> pumpSurface(WidgetTester tester, AccountTier tier) async {
    final gate = FakeGate(tier);
    AccountGate.install(gate);
    // The suite exercises the header — start on it (the route-switch builder
    // above still follows tap-driven transitions for the disc-nav test).
    fit.resetRoute('exercises');
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: gate,
          child: AnimatedBuilder(
            animation: fit,
            builder: (context, _) => Scaffold(
              body: switch (fit.route) {
                'exercises' => ExercisesScreen(),
                'trainer' => TrainerHomeScreen(),
                _ => HomeScreen(),
              },
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pumpAndSettle();
  }

  // Tall surface so every All-view row / section banner is built and findable
  // without scrolling (the gated pool is fixed: 6 sessions, 4 assignments).
  Future<void> pumpTall(WidgetTester tester, AccountTier tier) async {
    final gate = FakeGate(tier);
    AccountGate.install(gate);
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
          child: const Scaffold(body: ExercisesScreen()),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  // Scaled surface (repair D1): explicit logical width + ambient text scale
  // so the header-extent matrix can exercise the owner's font-scale setup.
  Future<void> pumpScaled(WidgetTester tester, double width, double scale) async {
    final gate = FakeGate(AccountTier.advanced);
    AccountGate.install(gate);
    tester.view.physicalSize = Size(width, 850);
    tester.view.devicePixelRatio = 1.0;
    tester.platformDispatcher.textScaleFactorTestValue = scale;
    addTearDown(tester.view.reset);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
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
    await tester.pumpAndSettle();
  }

  Finder ctaFinder() => find.byWidgetPredicate(
      (w) => w is Text && (w.data ?? '').toLowerCase().contains('bodybridge.net'));

  // The title row fades out as the header docks (Opacity 1-progress).
  double titleOpacity(WidgetTester tester) => tester
      .widget<Opacity>(find
          .ancestor(of: find.byType(ScreenTitle), matching: find.byType(Opacity))
          .first)
      .opacity;

  group('coach disc: render, unread pill, no bell', () {
    testWidgets('advanced: disc renders with the pill mirroring trainer.unreadTotal',
        (tester) async {
      await pumpSurface(tester, AccountTier.advanced);

      expect(find.byKey(const ValueKey('exercises-coach-disc')), findsOneWidget);
      expect(find.byKey(const ValueKey('disc-unread')), findsOneWidget,
          reason: 'the seeded trainer repo carries unread messages');
      final pill = tester.widget<TrainerCountPill>(find.byKey(const ValueKey('disc-unread')));
      expect(pill.count, trainer.unreadTotal,
          reason: 'the unread count lives on the disc pill now (t_a9afb1b7)');
    });

    testWidgets('advanced: markThreadRead clears the pill', (tester) async {
      await pumpSurface(tester, AccountTier.advanced);
      expect(find.byKey(const ValueKey('disc-unread')), findsOneWidget);

      await trainer.markThreadRead('thr_chat_marcus');
      await tester.pumpAndSettle();
      expect(trainer.unreadTotal, 0);
      expect(find.byKey(const ValueKey('disc-unread')), findsNothing,
          reason: 'the pill disappears once everything is read');
    });

    for (final tier in [AccountTier.free, AccountTier.basic]) {
      testWidgets('${tier.name}: no bell icon anywhere in the header', (tester) async {
        await pumpSurface(tester, tier);
        expect(find.byIcon(PhosphorIconsRegular.bell), findsNothing,
            reason: 'the Exercises header no longer renders a bell (t_a9afb1b7)');
      });
    }

    testWidgets('advanced: disc renders the chat glyph, no initials avatar',
        (tester) async {
      await pumpSurface(tester, AccountTier.advanced);
      final disc = find.byKey(const ValueKey('exercises-coach-disc'));

      expect(
          find.descendant(
              of: disc, matching: find.byIcon(PhosphorIconsRegular.chatCircle)),
          findsOneWidget,
          reason: 'both tiers render the outlined chat glyph (t_ec882f80)');
      expect(
          find.descendant(of: disc, matching: find.byType(TrainerAvatarDisc)),
          findsNothing,
          reason: 'the initials avatar is replaced by the chat glyph (t_ec882f80)');
    });

    for (final tier in [AccountTier.free, AccountTier.basic]) {
      testWidgets('${tier.name}: disc renders the chat glyph', (tester) async {
        await pumpSurface(tester, tier);
        final disc = find.byKey(const ValueKey('exercises-coach-disc'));

        expect(
            find.descendant(
                of: disc, matching: find.byIcon(PhosphorIconsRegular.chatCircle)),
            findsOneWidget,
            reason: 'both tiers render the outlined chat glyph (t_ec882f80)');
      });
    }
  });

  group('disc navigation: advanced opens the hub, back returns', () {
    testWidgets('tap disc → trainer; back → exercises', (tester) async {
      await pumpSurface(tester, AccountTier.advanced);

      await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
      await tester.pump();
      expect(fit.route, 'trainer');
      await tester.pump(const Duration(milliseconds: 50));
      expect(find.byType(TrainerHomeScreen), findsOneWidget);

      fit.handleBack();
      await tester.pump();
      expect(fit.route, 'exercises');
      expect(find.byType(ExercisesScreen), findsOneWidget);
    });
  });

  group('free/basic disc: two-door consultation sheet', () {
    for (final tier in [AccountTier.free, AccountTier.basic]) {
      testWidgets('${tier.name}: tap disc → sheet; dismiss keeps the route', (tester) async {
        await pumpSurface(tester, tier);
        final routeBefore = fit.route;

        expect(find.byType(TrainerHomeScreen), findsNothing);
        await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
        await tester.pumpAndSettle();

        expect(find.text(t.consultSheetTitle), findsOneWidget);
        expect(find.textContaining(RegExp(r'\$\d')), findsNothing,
            reason: 'zero prices in-app');
        expect(find.byType(TrainerHomeScreen), findsNothing);

        await tester.tapAt(const Offset(20, 20)); // barrier tap dismisses the modal sheet
        await tester.pumpAndSettle();
        expect(find.byType(ConsultationSheet), findsNothing);
        expect(fit.route, routeBefore, reason: 'the sheet never pushes a route');
      });
    }
  });

  group('quiet count chips: labels, taps, gating', () {
    testWidgets('chip labels render the true per-source counts', (tester) async {
      await pumpSurface(tester, AccountTier.advanced);

      expect(
        find.text(
            '${t.sourceAll} ${fit.allExercises.length + trainerExercises.length + assignedExercises.length}'),
        findsOneWidget,
      );
      expect(find.text('${t.sourceFree} ${fit.allExercises.length}'), findsOneWidget);
      expect(find.text('${t.sourceTrainer} ${trainerExercises.length}'), findsOneWidget);
      expect(find.text('${t.sourceCustom} ${assignedExercises.length}'), findsOneWidget);
    });

    testWidgets('tapping Free switches the source in place, no route', (tester) async {
      await pumpSurface(tester, AccountTier.advanced);

      await tester.tap(find.byKey(const ValueKey('chip-free')));
      await tester.pumpAndSettle();

      expect(fit.exSource, 'free');
      expect(fit.route, 'exercises', reason: 'chips never push a route');
    });

    testWidgets('advanced: tapping Trainer switches to the trainer source', (tester) async {
      await pumpSurface(tester, AccountTier.advanced);

      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      expect(fit.exSource, 'trainer');
    });

    testWidgets('free: tapping Trainer keeps the source and raises the lock UX',
        (tester) async {
      await pumpSurface(tester, AccountTier.free);
      final before = fit.exSource;

      await tester.tap(find.byKey(const ValueKey('chip-trainer')));
      await tester.pumpAndSettle();

      expect(fit.exSource, before, reason: 'gated taps never change the active source');
      expect(find.byType(TrainerLockOverlay), findsOneWidget);
      expect(find.text(t.lockAdvancedMessage), findsOneWidget,
          reason: 'the dim overlay explains the lock');
      expect(ctaFinder(), findsOneWidget, reason: 'the CTA names bodybridge.net');
      expect(find.textContaining(r'$'), findsNothing, reason: 'no prices anywhere');
    });
  });

  group("default source 'all': section banners, gated rows first", () {
    testWidgets('the screen opens on all with the trainer section above the free one',
        (tester) async {
      await pumpTall(tester, AccountTier.advanced);

      expect(fit.exSource, 'all', reason: "'all' is the new default source (t_a9afb1b7)");
      final trainerBanner = find.text(t.sectionTrainerLibrary.toUpperCase());
      final freeBanner = find.text(t.sectionFreeLibrary.toUpperCase());
      expect(trainerBanner, findsOneWidget);
      expect(freeBanner, findsOneWidget);
      expect(
        tester.getTopLeft(trainerBanner).dy,
        lessThan(tester.getTopLeft(freeBanner).dy),
        reason: 'the gated library leads the merged All view',
      );
    });
  });

  group('row gating: LOCKED chip vs ADVANCED badge', () {
    testWidgets('free: trainer rows carry the LOCKED chip and tapping one never navigates',
        (tester) async {
      await pumpTall(tester, AccountTier.free);

      expect(find.text(t.srcLocked), findsNWidgets(10),
          reason: '6 sessions + 4 assignments are visible and locked in the All view');
      final idBefore = fit.activeExerciseId;
      final routeBefore = fit.route;

      await tester.tap(find.text('Pallof Press — setup'));
      await tester.pumpAndSettle();

      expect(fit.route, routeBefore, reason: 'locked rows never push a route');
      expect(fit.activeExerciseId, idBefore, reason: 'locked rows never open the detail');
      expect(find.byType(TrainerLockOverlay), findsOneWidget);
      expect(find.text(t.lockAdvancedMessage), findsOneWidget);
    });

    testWidgets('advanced: trainer rows show the ADVANCED badge and open the detail',
        (tester) async {
      await pumpTall(tester, AccountTier.advanced);

      expect(find.text(t.advancedBadge), findsNWidgets(10),
          reason: 'every trainer row carries the ADVANCED badge');

      await tester.tap(find.text('Pallof Press — setup'));
      await tester.pumpAndSettle();

      expect(fit.activeExerciseId, 'tr-pallof-setup');
      expect(fit.route, 'exercise-detail');
    });
  });

  group('scroll-dock: title collapses, search pill stays pinned', () {
    testWidgets('dragging up docks the header; dragging back undocks it', (tester) async {
      await pumpSurface(tester, AccountTier.advanced);
      expect(find.byType(ScreenTitle), findsOneWidget);
      expect(
        find.ancestor(of: find.byType(ScreenTitle), matching: find.byType(Opacity)),
        findsOneWidget,
      );
      expect(titleOpacity(tester), 1.0);

      await tester.drag(find.byType(CustomScrollView), const Offset(0, -120)); // > 210−160 delta
      await tester.pumpAndSettle();

      expect(titleOpacity(tester), 0.0, reason: 'the title row fades out as the header docks');
      final search = find.byType(SearchField);
      expect(search, findsOneWidget, reason: 'the search pill stays pinned at the top');
      expect(tester.getTopLeft(search).dy, lessThan(100),
          reason: 'the pinned search pill sits at the top of the screen');

      await tester.drag(find.byType(CustomScrollView), const Offset(0, 120));
      await tester.pumpAndSettle();

      expect(titleOpacity(tester), 1.0, reason: 'the title row returns when the header undocks');
    });
  });

  group('scroll-dock: scale-aware extents (repair D1)', () {
    // The owner device runs a system font scale (~1.1): the header extents
    // must grow with the ambient TextScaler instead of clipping the docked
    // column (the old hand-tuned 210/160 overflowed by ~6px at scale 1.15).
    for (final (width, scale) in const [(411.4, 1.15), (411.0, 1.15), (360.0, 1.15), (411.4, 1.0)]) {
      testWidgets('${width}dp x ${scale}x: docks and undocks without exceptions', (tester) async {
        await pumpScaled(tester, width, scale);

        expect(tester.takeException(), isNull, reason: 'zero exceptions at rest');

        await tester.drag(find.byType(CustomScrollView), const Offset(0, -40)); // partial dock
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'partial dock must not throw');
        final firstRow = find.text(t.sectionTrainerLibrary.toUpperCase());
        expect(firstRow, findsOneWidget);
        final rect = tester.getRect(firstRow);
        expect(rect.top, greaterThanOrEqualTo(0), reason: 'the first row starts inside the viewport');
        expect(rect.bottom, lessThan(850), reason: 'the first row stays fully inside the viewport');

        await tester.drag(find.byType(CustomScrollView), const Offset(0, -80)); // full dock
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'full dock must not throw');
        final search = find.byType(SearchField);
        expect(search, findsOneWidget, reason: 'the search pill stays pinned');
        expect(tester.getTopLeft(search).dy, lessThan(100), reason: 'pinned near the top');

        await tester.drag(find.byType(CustomScrollView), const Offset(0, 120)); // undock
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'undock must not throw');
        expect(titleOpacity(tester), 1.0, reason: 'the title row returns when the header undocks');
      });
    }
  });
}
