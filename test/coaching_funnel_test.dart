import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/consultation_confirmation_screen.dart';
import 'package:gymmane/screens/consultation_request_screen.dart';
import 'package:gymmane/services/trainer_data.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/consultation_sheet.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/trainer_kit.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FakeGate extends AccountGate {
  FakeGate(this.tier);
  final AccountTier tier;

  @override
  AccountSnapshot get snapshot => AccountSnapshot(
      tier: tier,
      email: tier == AccountTier.signedOut ? null : 'funnel@bodybridge.local');

  @override
  bool canAccess(String feature) => tierCan(tier, feature);

  @override
  Future<void> requestEmailCode(String email) async {}

  @override
  Future<bool> verifyEmailCode(String email, String code) async => false;

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}

}

void main() {
  group('Consultation funnel seam (trainer_data.dart)', () {
    TestWidgetsFlutterBinding.ensureInitialized();

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('gymmane_consultation_v1');
      // Ensure the trainer state singleton resets for each test
      TrainerState.instance.resetForTest();
    });

    // Contract: consultations:getMine — null before first request.
    test('consultations:getMine returns null initially', () async {
      final repo = LocalTrainerRepository();
      final result = await repo.consultationGetMine();
      expect(result, isNull);
    });

    // Contract: consultations:request — first request wins; duplicate tap returns unchanged.
    test('consultations:request creates first record and duplicate returns same', () async {
      final repo = LocalTrainerRepository();
      final first = await repo.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Test request',
      );
      expect(first, isNotNull);
      expect(first.goal, 'strength');
      expect(first.experience, 'new');
      expect(first.timeWindow, 'morning');
      expect(first.notes, 'Test request');
      expect(first.createdAt, greaterThan(0));

      // Second call with different data should still return the first request unchanged.
      final second = await repo.consultationRequest(
        goal: 'fat_loss', // different goal
        experience: 'returning',
        timeWindow: 'evening',
        notes: 'Different notes',
      );
      // First-wins: the duplicate call returns the identical first record.
      expect(second, same(first));
      expect(second.goal, 'strength'); // unchanged, still first request
      expect(second.experience, 'new');
      expect(second.timeWindow, 'morning');
      expect(second.notes, 'Test request');
      expect(second.createdAt, first.createdAt);
    });

    // Contract: persistence across repo re-instantiation (service restart).
    test('consultation persists after repo re-instantiation', () async {
      final repo1 = LocalTrainerRepository();
      await repo1.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Persist test',
      );

      // Recreate the repository (simulating a process restart).
      final repo2 = LocalTrainerRepository();
      final retrieved = await repo2.consultationGetMine();
      expect(retrieved, isNotNull);
      expect(retrieved!.goal, 'strength');
      expect(retrieved.notes, 'Persist test');
    });

    // Contract: resetForTest clears the consultation.
    test('resetForTest clears consultation', () async {
      final repo = LocalTrainerRepository();
      await repo.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Will be reset',
      );

      final beforeReset = await repo.consultationGetMine();
      expect(beforeReset, isNotNull);

      // Reset the test seam (as provided by trainer_state).
      TrainerState.instance.resetForTest();
      // Flush the best-effort prefs purge fired by resetForTest.
      await Future<void>.delayed(Duration.zero);

      // A fresh repository instance (what a restart would see) has none.
      final fresh = LocalTrainerRepository();
      final afterReset = await fresh.consultationGetMine();
      expect(afterReset, isNull);
    });
  });

  // t_db30a5d3 R9 — the funnel UI cases the R3 run claimed but never
  // delivered: two doors, first-wins re-entry, upgrade-door routing, and the
  // goal-only request form.
  group('Consultation funnel UI (t_db30a5d3 R9)', () {
    TestWidgetsFlutterBinding.ensureInitialized();

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      trainer.resetForTest();
      fit.resetRoute('exercises');
    });

    tearDown(() {
      AccountGate.install(SignedOutGate());
      fit.resetRoute('home');
    });

    Future<void> pumpFunnel(WidgetTester tester, AccountTier tier) async {
      AccountGate.install(FakeGate(tier));
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(
            gate: AccountGate.instance,
            child: AnimatedBuilder(
              animation: fit,
              builder: (context, _) => Scaffold(
                body: switch (fit.route) {
                  'consultation-request' => ConsultationRequestScreen(),
                  'consultation-confirmation' => const ConsultationConfirmationScreen(),
                  _ => const ExercisesCoachDisc(),
                },
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
    }

    testWidgets('free: strip tap opens the two-door consultation sheet, not the gate', (tester) async {
      await pumpFunnel(tester, AccountTier.free);

      // t_a9afb1b7: the free door is the disc (talkToTrainer Semantics),
      // mounted by pumpFunnel — tap it by key, not by strip text.
      await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
      await tester.pumpAndSettle();

      expect(find.text(t.consultSheetTitle), findsOneWidget);
      expect(find.text(t.consultPrimary), findsOneWidget);
      expect(find.text(t.exploreCoachingPlans), findsOneWidget);
      expect(find.text(t.consultFootnote), findsOneWidget);
      expect(find.text(t.trainerGateTitle), findsNothing,
          reason: 'the old Advanced gate must not appear for free/basic');
      expect(find.textContaining(RegExp(r'\$\d')), findsNothing,
          reason: 'zero prices in-app');
    });

    testWidgets('upgrade door routes to the plans flow, never the request form', (tester) async {
      await pumpFunnel(tester, AccountTier.free);

      await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
      await tester.pumpAndSettle();

      await tester.tap(find.text(t.exploreCoachingPlans));
      await tester.pumpAndSettle();

      expect(fit.route, isNot('consultation-request'),
          reason: 'Explore Coaching Plans never opens the form');
      expect(fit.route, 'exercises');
      expect(find.byType(ConsultationSheet), findsNothing,
          reason: 'the sheet closes after handing off');
    });

    testWidgets('first-wins: with a request on file the sheet shows the SUBMITTED door, never a fresh form', (tester) async {
      await trainer.requestConsultation(
        goal: 'recover',
        experience: '',
        timeWindow: 'wk_morning',
        notes: 'Knee history',
      );
      await pumpFunnel(tester, AccountTier.free);

      await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
      await tester.pumpAndSettle();

      expect(find.text(t.consultDoorView), findsOneWidget);
      expect(find.text(t.consultPrimary), findsNothing,
          reason: 'no second Request Consultation once a request is on file');

      await tester.tap(find.text(t.consultDoorView));
      await tester.pumpAndSettle();

      expect(fit.route, 'consultation-confirmation');
      expect(find.text(t.sentChip), findsOneWidget,
          reason: 'the SUBMITTED status card, not the form');
      expect(find.byType(ConsultationRequestScreen), findsNothing);
    });

    testWidgets('request form: account-prefilled contact and goal-only submit', (tester) async {
      // Tall viewport so the whole form (submit included) is laid out —
      // the ListView builds lazily and off-screen children are findable-never.
      tester.view.physicalSize = const Size(411, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      fit.resetRoute('consultation-request');
      await pumpFunnel(tester, AccountTier.free);

      // Prefilled from the FakeGate snapshot.
      expect(find.text('funnel@bodybridge.local'), findsOneWidget);
      expect(find.text(t.requestVerified), findsOneWidget);

      // Submitting without a goal is blocked.
      await tester.tap(find.byType(PrimaryButton));
      await tester.pump();
      expect(find.text(t.requestPickBoth), findsOneWidget);
      expect(fit.route, 'consultation-request');

      // Picking only the goal is enough (time chips stay optional).
      await tester.tap(find.text(t.goalRecover));
      await tester.pump();
      await tester.tap(find.byType(PrimaryButton));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(fit.route, 'consultation-confirmation');
      final r = trainer.consultation;
      expect(r, isNotNull);
      expect(r!.goal, 'recover');
      expect(r.timeWindow, '');
    });
  });
}
