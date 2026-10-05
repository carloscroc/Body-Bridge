import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/catalog/program_templates.dart';
import 'package:gymmane/constants/billing.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/models/workout.dart';
import 'package:gymmane/screens/routines_screen.dart';
import 'package:gymmane/services/entitlements_service.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/services/plan_share.dart';
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
    AccountGate.install(SignedOutGate());
  });

  tearDown(() {
    fit.resetRoute('home');
    AccountGate.install(SignedOutGate());
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
        routineCreationAllowed(AccountTier.signedOut, 0),
        isTrue,
        reason: 'signedOut falls under the same FREE routine cap (0 < 3)',
      );
      expect(
        routineCreationAllowed(AccountTier.signedOut, kFreeRoutineCap),
        isFalse,
        reason: 'mandatory auth: signedOut has NO unlimited_routines, so the FREE cap applies',
      );
      expect(
        routineCreationAllowed(AccountTier.signedOut, 999),
        isFalse,
        reason: 'mandatory auth: no guest freebies — the cap holds at any count',
      );
      expect(tierCan(AccountTier.signedOut, kCapUnlimitedRoutines), isFalse);
      expect(tierCan(AccountTier.signedOut, kCapFullHistory), isFalse);
      expect(tierCan(AccountTier.signedOut, kCapCustomExercises), isFalse);
      expect(tierCan(AccountTier.signedOut, kCapAiPlan), isFalse);
    });
  });

  group('visibleSessions (7-day window without full_history)', () {
    LoggedSession log(int daysAgo) {
      final s = LoggedSession(DateTime.now().subtract(Duration(days: daysAgo)), 600, []);
      fit.sessions.add(s);
      return s;
    }

    test('signed-out (no account) sees nothing windowed because the wall blocks them first', () {
      // Mandatory auth: a signed-out user can never reach the app shell, so
      // the history window is a signed-in FREE concern. The predicate itself
      // must report windowing for signedOut (no full_history capability).
      log(30);
      log(10);
      log(2);

      expect(fit.historyIsFiltered, isTrue, reason: 'signedOut has no full_history capability');
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

    testWidgets('signed-out gate caps routine creation: the paywall replaces it', (tester) async {
      for (var i = 0; i < kFreeRoutineCap + 2; i++) {
        fit.createRoutine('Plan $i');
      }

      await pumpRoutines(tester, SignedOutGate());

      await tester.ensureVisible(find.text(titleCase(t.newRoutine)));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(find.text(titleCase(t.newRoutine)));
      await tester.pumpAndSettle();
      // Flush the 400ms save debounce so no Timer is pending at teardown.
      await tester.pump(const Duration(seconds: 1));

      expect(fit.route, 'paywall', reason: 'mandatory auth: signed-out has no unlimited_routines');
      expect(fit.routines.length, kFreeRoutineCap + 2, reason: 'no routine was created');
    });
  });

  group('state-layer FREE cap: applyPlan / applyTemplate (import bypass regression)', () {
    setUp(() {
      // The file-level setUp clears routines but not the weekly plan; the
      // template tests below schedule weekdays, so keep them isolated.
      fit.weeklyPlan.clear();
    });

    List<PlanRoutine> plansWithNames(List<String> names) => [
          for (final name in names)
            ...parsePlan('{"routines": [{"name": "$name", "exercises": ["Barbell Bench Press"]}]}'),
        ];

    test('free tier below cap: applyPlan creates only up to kFreeRoutineCap, rest blocked', () {
      AccountGate.install(FakeGate(AccountTier.free));

      final result = fit.applyPlan(plansWithNames(['A', 'B', 'C', 'D', 'E']));

      expect(result.routines, kFreeRoutineCap, reason: 'creation stops exactly at the cap');
      expect(result.blocked, 2, reason: 'the plans past the cap are reported as skipped');
      expect(result.added, kFreeRoutineCap);
      expect(fit.routines.length, kFreeRoutineCap);
    });

    test('free tier at cap: applyPlan creates nothing, schedules nothing, blocked count correct', () {
      AccountGate.install(FakeGate(AccountTier.free));
      for (var i = 0; i < kFreeRoutineCap; i++) {
        fit.createRoutine('Plan $i');
      }

      final result = fit.applyPlan(plansWithNames(['X', 'Y']), schedule: true);

      expect(result.routines, 0);
      expect(result.blocked, 2);
      expect(fit.routines.length, kFreeRoutineCap, reason: 'the import must not overshoot the cap');
      expect(fit.weeklyPlan, isEmpty, reason: 'blocked plans must not claim weekdays either');
    });

    test('identical routine reuse at cap stays allowed: no creation, no blocked count', () {
      AccountGate.install(FakeGate(AccountTier.free));
      fit.applyPlan(plansWithNames(['Same']));

      final result = fit.applyPlan(plansWithNames(['Same']), schedule: true);

      expect(result.routines, 0, reason: 'the identical routine is reused, not recreated');
      expect(result.blocked, 0, reason: 'reuse is not a creation, so the cap never bites');
      expect(fit.routines.length, 1, reason: 'the reused routine is the only one');
    });

    test('free tier below cap: applyTemplate creates up to the cap and reports the rest', () {
      AccountGate.install(FakeGate(AccountTier.free));
      fit.createRoutine('Plan 0');
      fit.createRoutine('Plan 1');
      final template = kProgramTemplates.firstWhere((t) => t.id == 'upperlower');

      final result = fit.applyTemplate(template);

      expect(result.made, 1, reason: 'only one routine slot was left');
      expect(result.blocked, 3, reason: 'upperlower has 4 distinct days; 3 are skipped');
      expect(fit.routines.length, kFreeRoutineCap);
    });

    test('free tier at cap: applyTemplate creates nothing', () {
      AccountGate.install(FakeGate(AccountTier.free));
      for (var i = 0; i < kFreeRoutineCap; i++) {
        fit.createRoutine('Plan $i');
      }
      final template = kProgramTemplates.firstWhere((t) => t.id == 'fullbody');

      final result = fit.applyTemplate(template);

      expect(result.made, 0);
      expect(result.blocked, 1, reason: 'fullbody repeats one day shape: one skipped routine');
      expect(fit.routines.length, kFreeRoutineCap, reason: 'no ghost routines');
      expect(fit.weeklyPlan, isEmpty, reason: 'a fully blocked template schedules nothing');
    });

    test('unlimited tier: applyPlan and applyTemplate are unaffected', () {
      AccountGate.install(FakeGate(AccountTier.basic));

      final plan = fit.applyPlan(plansWithNames(['A', 'B', 'C', 'D', 'E']));
      expect(plan.routines, 5);
      expect(plan.blocked, 0);

      final template = fit.applyTemplate(kProgramTemplates.firstWhere((t) => t.id == 'upperlower'));
      expect(template.made, 4);
      expect(template.blocked, 0);
      expect(fit.routines.length, 9);
    });
  });
}
