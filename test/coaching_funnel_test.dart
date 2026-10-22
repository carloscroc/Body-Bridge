// RED coaching-funnel contract tests (card t_060c85a4) — committed BEFORE any
// funnel implementation in the R2 decomposition. Runs 738/739/741 on
// t_aaa15e0d falsified by skipping reproduce-first; this file is the fix.
//
// Contract under test:
//   Seam — lib/services/trainer_data.dart consultations:getMine /
//          consultations:request (ONE per client, FIRST-WINS, persisted
//          under gymmane_consultation_v1, resetForTest) plus the
//          lib/state/trainer_state.dart mirror (+ requestConsultation).
//   UI   — the two-door funnel on the Exercises trainer strip (free/basic),
//          the account-prefilled request form, the confirmation status card,
//          and the coaching welcome (24–48h window, dashed pending
//          placeholder, NO fabricated trainer/avatar/chat history).
//
// RED state: lib/l10n currently carries only the base ARBs — the funnel
// surfaces reference removed keys, so the UI group below FAILS TO COMPILE.
// That compile failure is the designed RED evidence; t_ffd43e99 implements
// until this file is green. The seam group is l10n-free; its standalone
// pass/fail record was captured separately for the handoff.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/coaching_welcome_screen.dart';
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
  AccountSnapshot get snapshot =>
      AccountSnapshot(tier: tier, email: tier == AccountTier.signedOut ? null : 'funnel@bodybridge.local');

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
  group('seam: consultations contract (trainer_data.dart)', () {
    TestWidgetsFlutterBinding.ensureInitialized();

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      trainer.resetForTest();
    });

    test('consultations:getMine — null before the first request, populated after', () async {
      final repo = LocalTrainerRepository();
      expect(await repo.consultationGetMine(), isNull);

      final filed = await repo.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: '',
      );
      final mine = await repo.consultationGetMine();
      expect(mine, isNotNull);
      expect(mine!.goal, 'strength');
      expect(mine.experience, 'new');
      expect(mine.timeWindow, 'morning');
      expect(mine.createdAt, filed.createdAt);
    });

    test(
      'consultations:request — FIRST-WINS: the 2nd call returns the existing request, not a new one',
      () async {
        final repo = LocalTrainerRepository();
        final first = await repo.consultationRequest(
          goal: 'strength',
          experience: 'new',
          timeWindow: 'morning',
          notes: 'First notes',
        );

        final second = await repo.consultationRequest(
          goal: 'fat_loss',
          experience: 'returning',
          timeWindow: 'evening',
          notes: 'Different notes',
        );

        expect(second, same(first), reason: 'the duplicate call must not create a second record');
        expect(second.goal, 'strength', reason: 'first request wins — the 2nd call args are discarded');
        expect(second.experience, 'new');
        expect(second.timeWindow, 'morning');
        expect(second.notes, 'First notes');
        expect(second.createdAt, first.createdAt);

        final mine = await repo.consultationGetMine();
        expect(mine!.goal, 'strength', reason: 'exactly one record on file, and it is the first');
      },
    );

    test('persistence: the record survives repo re-instantiation (gymmane_consultation_v1)', () async {
      final repo1 = LocalTrainerRepository();
      final filed = await repo1.consultationRequest(
        goal: 'mobility',
        experience: 'seasoned',
        timeWindow: 'weekend',
        notes: 'Survives restart',
      );
      final prefs = await SharedPreferences.getInstance();
      expect(
        prefs.getString('gymmane_consultation_v1'),
        isNotNull,
        reason: 'persisted under the contract key, not memory only',
      );

      final repo2 = LocalTrainerRepository(); // simulates an app restart
      final revived = await repo2.consultationGetMine();
      expect(revived, isNotNull);
      expect(revived!.goal, 'mobility');
      expect(revived.experience, 'seasoned');
      expect(revived.timeWindow, 'weekend');
      expect(revived.notes, 'Survives restart');
      expect(revived.createdAt, filed.createdAt);
    });

    test('resetForTest clears memory AND the persisted record (repo + TrainerState)', () async {
      final repo = LocalTrainerRepository();
      await repo.consultationRequest(
        goal: 'consistency',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Wipe me',
      );

      repo.resetForTest();
      expect(await repo.consultationGetMine(), isNull, reason: 'in-memory record cleared');
      await Future<void>.delayed(Duration.zero); // flush the unawaited prefs purge
      final prefs = await SharedPreferences.getInstance();
      expect(
        prefs.containsKey('gymmane_consultation_v1'),
        isFalse,
        reason: 'a fresh instance must start clean',
      );

      // The TrainerState mirror resets the same way.
      await trainer.requestConsultation(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: '',
      );
      expect(trainer.consultation, isNotNull);
      trainer.resetForTest();
      expect(trainer.consultation, isNull);
      expect(trainer.loaded, isFalse);
    });
  });

  group('UI: two-door coaching funnel (strip + sheet + form + confirmation + welcome)', () {
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
                  'coaching-welcome' => const CoachingWelcomeScreen(),
                  _ => const TrainerEntryStrip(),
                },
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
    }

    testWidgets('free: strip tap opens the two-door sheet — BOTH doors, no gate, no prices', (tester) async {
      await pumpFunnel(tester, AccountTier.free);

      await tester.tap(find.text(t.talkToTrainer));
      await tester.pumpAndSettle();

      expect(find.text(t.consultSheetTitle), findsOneWidget);
      expect(find.text(t.consultPrimary), findsOneWidget, reason: 'door 1 — Request Consultation');
      expect(find.text(t.exploreCoachingPlans), findsOneWidget, reason: 'door 2 — Explore Coaching Plans');
      expect(find.text(t.consultFootnote), findsOneWidget);
      expect(
        find.text(t.gateTitle),
        findsNothing,
        reason: 'free/basic taps must NOT hit the old Advanced gate',
      );
      expect(find.textContaining(RegExp(r'\$\d')), findsNothing, reason: 'zero in-app prices');
    });

    testWidgets('basic: strip tap opens the same two-door sheet, not the gate', (tester) async {
      await pumpFunnel(tester, AccountTier.basic);

      await tester.tap(find.text(t.talkToTrainer));
      await tester.pumpAndSettle();

      expect(find.text(t.consultSheetTitle), findsOneWidget);
      expect(find.text(t.consultPrimary), findsOneWidget);
      expect(find.text(t.exploreCoachingPlans), findsOneWidget);
      expect(find.text(t.gateTitle), findsNothing);
    });

    testWidgets('explore door: hands off to the existing upgrade flow — sheet closes, no invented route', (
      tester,
    ) async {
      await pumpFunnel(tester, AccountTier.free);

      await tester.tap(find.text(t.talkToTrainer));
      await tester.pumpAndSettle();
      await tester.tap(find.text(t.exploreCoachingPlans));
      await tester.pumpAndSettle();

      expect(find.byType(ConsultationSheet), findsNothing, reason: 'the sheet closes after handing off');
      expect(
        fit.route,
        'exercises',
        reason:
            'the plans journey is the EXISTING external upgrade flow '
            '— never a new in-app route',
      );
      expect(
        fit.route,
        isNot('consultation-request'),
        reason: 'the explore door never opens the request form',
      );
      expect(find.text(t.gateTitle), findsNothing);
    });

    testWidgets('advanced: strip keeps the unchanged hub path — no consultation sheet', (tester) async {
      await trainer.ensureLoaded();
      await pumpFunnel(tester, AccountTier.advanced);

      expect(
        find.text('Marcus Reyes'),
        findsOneWidget,
        reason: 'advanced still sees the trainer identity card',
      );
      await tester.tap(find.text('Marcus Reyes'));
      await tester.pump();

      expect(fit.route, 'trainer', reason: 'hub path unchanged');
      expect(
        find.byType(ConsultationSheet),
        findsNothing,
        reason: 'advanced never sees the consultation funnel',
      );
    });

    testWidgets(
      'request door: account-prefilled form → submit → "Consultation request received" + SUBMITTED status card',
      (tester) async {
        // Tall viewport so the whole form (submit included) is laid out —
        // the ListView builds lazily and off-screen children are untappable.
        tester.view.physicalSize = const Size(411, 1600);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        fit.resetRoute('consultation-request');
        await pumpFunnel(tester, AccountTier.free);

        expect(
          find.text('funnel@bodybridge.local'),
          findsOneWidget,
          reason: 'contact prefilled from the account snapshot',
        );
        expect(find.text(t.requestVerified), findsOneWidget);

        await tester.tap(find.byType(PrimaryButton));
        await tester.pump();
        expect(
          find.text(t.requestPickBoth),
          findsOneWidget,
          reason: 'goal-only required — empty submit is blocked inline',
        );
        expect(fit.route, 'consultation-request');

        await tester.tap(find.text(t.goalRecover));
        await tester.pump();
        await tester.tap(find.byType(PrimaryButton));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 200));

        expect(fit.route, 'consultation-confirmation');
        expect(t.sentTitle, 'Consultation request received', reason: 'mockup copy: received, never booked');
        expect(find.text(t.sentTitle), findsOneWidget);
        expect(find.text(t.sentChip), findsOneWidget, reason: 'the SUBMITTED status card');
        expect(find.text(t.goalRecover), findsOneWidget, reason: 'the status card carries the filed goal');

        final stored = await trainer.repo.consultationGetMine();
        expect(stored, isNotNull);
        expect(stored!.goal, 'recover');
        expect(stored.timeWindow, '', reason: 'time chips stay optional');
      },
    );

    testWidgets('first-wins re-entry: repeat strip taps show the status card, never a fresh form', (
      tester,
    ) async {
      await trainer.requestConsultation(
        goal: 'recover',
        experience: '',
        timeWindow: '',
        notes: 'Knee history',
      );
      await pumpFunnel(tester, AccountTier.free);

      await tester.tap(find.text(t.talkToTrainer));
      await tester.pumpAndSettle();

      expect(
        find.text(t.consultDoorView),
        findsOneWidget,
        reason: 'door 1 flips to the status entry once a request is on file',
      );
      expect(find.text(t.consultPrimary), findsNothing, reason: 'no second Request Consultation door');

      await tester.tap(find.text(t.consultDoorView));
      await tester.pumpAndSettle();
      expect(fit.route, 'consultation-confirmation');
      expect(find.text(t.sentChip), findsOneWidget, reason: 'the SUBMITTED status card, not the form');
      expect(find.byType(ConsultationRequestScreen), findsNothing);

      // A repeat strip tap behaves identically — still no fresh form.
      // Exit through the product's own CTA (t.sentContinue → goExercises):
      // resetRoute() is a setup-time initializer that never notifies
      // listeners, so it cannot drive a mid-test transition.
      await tester.tap(find.text(t.sentContinue));
      await tester.pumpAndSettle();
      await tester.tap(find.text(t.talkToTrainer));
      await tester.pumpAndSettle();
      expect(find.text(t.consultDoorView), findsOneWidget);
      expect(find.text(t.consultPrimary), findsNothing, reason: 'duplicate protection holds across re-entry');
    });

    testWidgets(
      'welcome: 24–48h outreach window + dashed pending placeholder, zero fabricated trainer content',
      (tester) async {
        // Tall viewport so the bottom CTA is built — the ListView builds
        // lazily and off-screen children never enter the tree (same
        // harness as the request-form case above).
        tester.view.physicalSize = const Size(411, 1600);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        fit.resetRoute('coaching-welcome');
        await pumpFunnel(tester, AccountTier.advanced);

        expect(find.text(t.welcomeTitle), findsWidgets);
        expect(find.text(t.welcomeBody), findsOneWidget);
        expect(
          t.welcomeBody.contains('24') && t.welcomeBody.contains('48'),
          isTrue,
          reason:
              'welcome copy carries the 24–48h outreach window '
              '(FLAG for owner: keep only if the coaching team can meet it)',
        );
        expect(find.text(t.welcomeStep3T), findsOneWidget);
        expect(
          t.welcomeStep3T.contains('24') && t.welcomeStep3T.contains('48'),
          isTrue,
          reason: 'the what-happens-next card restates the 24–48h window',
        );

        // Dashed pending-assignment placeholder — no real trainer yet.
        expect(find.text(t.welcomePendingT), findsOneWidget);
        expect(find.text(t.welcomePendingS), findsOneWidget);
        expect(
          find.byWidgetPredicate((w) => w is CustomPaint && w.foregroundPainter != null),
          findsWidgets,
          reason: 'the pending card is drawn with the dashed hairline border',
        );

        // Nothing fabricated: no seeded trainer identity, avatar or chat history.
        expect(find.textContaining('Marcus'), findsNothing);
        expect(find.byType(TrainerAvatarDisc), findsNothing);
        expect(find.byType(CircleAvatar), findsNothing);
        expect(
          find.textContaining("Program's ready"),
          findsNothing,
          reason: 'no seeded chat history on the welcome surface',
        );
        expect(find.text(t.welcomeDone), findsOneWidget);
      },
    );
  });
}
