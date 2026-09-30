import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/constants/billing.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/models/workout.dart';
import 'package:gymmane/screens/routines_screen.dart';
import 'package:gymmane/services/entitlements_service.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart';

/// FREE client-side limits: the 3-routine cap, the 7-day history window and
/// the pure guard that routes creation to the paywall.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    fit.saveAndExit();
    fit.sessions.clear();
    fit.routines.clear();
    fit.onboarded = true;
    fit.resetRoute('home');
    AccountGate.install(GuestAccountGate());
  });

  tearDown(() {
    fit.resetRoute('home');
    AccountGate.install(GuestAccountGate());
  });

  group('capability predicates (pure)', () {
    test('free tier does NOT carry unlimited_routines', () {
      expect(Entitlements.free.can(kCapUnlimitedRoutines), isFalse);
      expect(Entitlements.free.can(kCapFullHistory), isFalse);
      expect(
        Entitlements.free.can(kCapCustomExercises),
        isFalse,
        reason: 'trainer_features is an advanced capability',
      );
      expect(Entitlements.free.can('workout_tracking'), isTrue, reason: 'core tracking is the free baseline');
    });

    test('routineCreationAllowed honors kFreeRoutineCap only without the capability', () {
      const free = AccountTier.free;
      expect(routineCreationAllowed(free, 0), isTrue);
      expect(routineCreationAllowed(free, kFreeRoutineCap - 1), isTrue);
      expect(
        routineCreationAllowed(free, kFreeRoutineCap),
        isFalse,
        reason: 'the 4th routine is over the free cap',
      );
      expect(routineCreationAllowed(free, kFreeRoutineCap + 5), isFalse);

      expect(
        routineCreationAllowed(AccountTier.basic, 99),
        isTrue,
        reason: 'basic carries unlimited_routines',
      );
      expect(routineCreationAllowed(AccountTier.enterprise, 999), isTrue);

      expect(
        routineCreationAllowed(AccountTier.signedOut, 999),
        isTrue,
        reason: 'guests keep local-only usage unlimited',
      );
    });
  });

  group('visibleSessions (7-day window without full_history)', () {
    LoggedSession log(int daysAgo) {
      final s = LoggedSession(DateTime.now().subtract(Duration(days: daysAgo)), 600, []);
      fit.sessions.add(s);
      return s;
    }

    test('guests (signed-out) see everything', () {
      log(30);
      log(10);
      log(2);

      expect(fit.visibleSessions.length, 3, reason: 'guest mode is local-only usage: no windowing');
      expect(fit.historyIsFiltered, isFalse);
    });

    test('signed-in free loses sessions older than kFreeHistoryDays', () {
      AccountGate.install(FakeGate(AccountTier.free));
      log(30);
      log(10);
      final recent = log(2);

      expect(fit.visibleSessions, [recent], reason: 'only the last 7 days stay visible');
      expect(fit.historyIsFiltered, isTrue);
      expect(fit.sessions.length, 3, reason: 'display filtering ONLY: the data itself is untouched');
    });

    test('full_history tiers see everything', () {
      AccountGate.install(FakeGate(AccountTier.basic));
      log(30);
      log(10);
      log(2);

      expect(fit.visibleSessions.length, 3);
      expect(fit.historyIsFiltered, isFalse);
    });
  });

  group('RoutinesScreen FREE cap (widget)', () {
    Future<void> pumpRoutines(WidgetTester tester, AccountGate gate) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(
            gate: gate,
            child: const Scaffold(body: RoutinesScreen()),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));
    }

    testWidgets('the 4th routine routes to the paywall instead of creating', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      for (var i = 0; i < kFreeRoutineCap; i++) {
        fit.createRoutine('Plan $i');
      }
      expect(fit.routines.length, kFreeRoutineCap);

      await pumpRoutines(tester, gate);

      expect(
        find.text(t.routinesFreeCount(kFreeRoutineCap, kFreeRoutineCap)),
        findsOneWidget,
        reason: 'free users see their routine budget',
      );

      await tester.ensureVisible(find.text(titleCase(t.newRoutine)));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(find.text(titleCase(t.newRoutine)));
      await tester.pumpAndSettle();
      // Flush the 400ms save debounce so no Timer is pending at teardown.
      await tester.pump(const Duration(seconds: 1));

      expect(fit.route, 'paywall', reason: 'cap reached: the paywall replaces creation');
      expect(fit.routines.length, kFreeRoutineCap, reason: 'no routine was created');
    });

    testWidgets('under the cap creation works as before', (tester) async {
      final gate = FakeGate(AccountTier.free);
      AccountGate.install(gate);
      fit.createRoutine('Plan 0');

      await pumpRoutines(tester, gate);

      await tester.ensureVisible(find.text(titleCase(t.newRoutine)));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(find.text(titleCase(t.newRoutine)));
      await tester.pumpAndSettle();
      // Flush the 400ms save debounce so no Timer is pending at teardown.
      await tester.pump(const Duration(seconds: 1));

      expect(fit.route, 'routine-edit', reason: '2nd routine is still inside the free cap');
      expect(fit.routines.length, 2);
    });

    testWidgets('guests keep unlimited local routines', (tester) async {
      for (var i = 0; i < kFreeRoutineCap + 2; i++) {
        fit.createRoutine('Plan $i');
      }

      await pumpRoutines(tester, GuestAccountGate());

      await tester.ensureVisible(find.text(titleCase(t.newRoutine)));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(find.text(titleCase(t.newRoutine)));
      await tester.pumpAndSettle();
      // Flush the 400ms save debounce so no Timer is pending at teardown.
      await tester.pump(const Duration(seconds: 1));

      expect(fit.route, 'routine-edit');
      expect(fit.routines.length, kFreeRoutineCap + 3, reason: 'guest local usage is never capped');
    });
  });
}
