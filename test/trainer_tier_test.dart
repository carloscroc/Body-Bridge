// Tier-gating widget tests for the trainer surfaces (card t_d788f36e).
//
// Matrix (locked brief facts — custom workouts + trainer chat = Advanced):
//   free / basic / signed-out → Advanced gate sheet on both entry points,
//                               chat + assignments NOT reachable;
//   advanced → My Trainer home, workout detail and chat all reachable;
//   FREE-cap + existing flows regression at the end.
//
// Same harness as paywall_gating_test: the gate seam is an injectable
// AccountGate resolving through the shared tierCan mirror — no Firebase,
// no Convex, no network. Trainer seeds load through mock SharedPreferences.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/trainer_chat_screen.dart';
import 'package:gymmane/screens/trainer_home_screen.dart';
import 'package:gymmane/screens/trainer_workout_detail_screen.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FakeGate extends AccountGate {
  FakeGate(this.tier);
  final AccountTier tier;

  @override
  AccountSnapshot get snapshot => AccountSnapshot(
      tier: tier, email: tier == AccountTier.signedOut ? null : 'a@b.c');

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
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    AccountGate.install(FakeGate(AccountTier.signedOut));
    fit.resetRoute('home');
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
    fit.resetRoute('home');
  });

  Future<void> pumpTrainer(WidgetTester tester) async {
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
                'trainer-workout' => TrainerWorkoutDetailScreen(),
                'trainer-chat' => const TrainerChatScreen(),
                _ => TrainerHomeScreen(),
              },
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pump(const Duration(milliseconds: 400));
  }

  group('gated tiers (free / basic / signed-out)', () {
    for (final tier in [
      AccountTier.free,
      AccountTier.basic,
      AccountTier.signedOut,
    ]) {
      testWidgets('${tier.name} sees the gate sheet over the tab', (tester) async {
        AccountGate.install(FakeGate(tier));
        await pumpTrainer(tester);

        // Gate sheet presented (tab-tap entry point, auto-opened).
        expect(find.text(t.trainerGateTitle), findsOneWidget,
            reason: '${tier.name} members meet the Advanced gate on the tab');
        expect(find.text(t.trainerGateCta), findsOneWidget);
        expect(find.text(t.gateFootnote), findsOneWidget);

        // ZERO in-app prices anywhere on the gate.
        expect(find.textContaining(RegExp(r'\$\d')), findsNothing,
            reason: 'the gate must not show prices (iOS-safe mockup rule)');

        // Assignments + chat are NOT reachable for gated tiers.
        expect(find.text('Lower Body — Knee-Safe Progression'), findsNothing);
        expect(find.byType(TrainerChatScreen), findsNothing);
        expect(find.byType(TrainerWorkoutDetailScreen), findsNothing);
      });
    }

    testWidgets('free tapping Message re-opens the same gate sheet', (tester) async {
      AccountGate.install(FakeGate(AccountTier.free));
      await pumpTrainer(tester);
      expect(find.text(t.trainerGateTitle), findsOneWidget);

      // Dismiss ("Not now"), then tap Message — the mockup's second entry.
      await tester.tap(find.text(t.gateDismiss));
      await tester.pumpAndSettle();
      expect(find.text(t.trainerGateTitle), findsNothing);

      await tester.tap(find.text(t.messageTrainer));
      await tester.pumpAndSettle();
      expect(find.text(t.trainerGateTitle), findsOneWidget,
          reason: 'both entry points reach the same sheet');
      expect(fit.route, 'home', reason: 'Message never navigates for gated tiers');
    });
  });

  group('advanced tier', () {
    setUp(() => AccountGate.install(FakeGate(AccountTier.advanced)));

    testWidgets('My Trainer home renders intro card + assigned workouts, no gate',
        (tester) async {
      await pumpTrainer(tester);

      expect(find.text(t.trainerGateTitle), findsNothing,
          reason: 'advanced members must not meet the gate');
      expect(find.text('Marcus Reyes'), findsOneWidget);
      expect(find.text(t.assignedWorkouts), findsOneWidget);
      expect(find.text('Lower Body — Knee-Safe Progression'), findsOneWidget);
      expect(find.text('Mobility Reset — Hips & T-Spine'), findsOneWidget);
      expect(find.text('Posture Foundations — Week 2'), findsOneWidget);
      // Three-signal unread system: chat unread count pill on the header.
      expect(find.text('2'), findsWidgets);
    });

    testWidgets('workout detail opens with coach note + guided rows', (tester) async {
      await pumpTrainer(tester);
      await tester.tap(find.text('Lower Body — Knee-Safe Progression'));
      await tester.pumpAndSettle();

      expect(fit.route, 'trainer-workout');
      expect(find.byType(TrainerWorkoutDetailScreen), findsOneWidget);
      // Header "sent by" line renders with the formatted date.
      expect(find.textContaining('Sent by your trainer on'), findsOneWidget);
      expect(find.textContaining('box height next week'), findsOneWidget,
          reason: 'top-level coach note visible');
      expect(find.text('Goblet Box Squat'), findsOneWidget);
      expect(find.textContaining('Heels flat, box tap light'), findsOneWidget,
          reason: 'per-exercise trainer note visible');
      expect(find.text(t.startWorkout), findsOneWidget);
    });

    testWidgets('chat opens from Message, marks read, sends a reply', (tester) async {
      await pumpTrainer(tester);
      await tester.tap(find.text(t.messageTrainer));
      await tester.pumpAndSettle();

      expect(fit.route, 'trainer-chat');
      expect(find.byType(TrainerChatScreen), findsOneWidget);
      expect(find.textContaining("That's the progression working"),
          findsOneWidget);
      // Thread-level read marker: unread pill cleared after opening.
      expect(trainer.unreadTotal, 0);

      await tester.enterText(find.byType(TextField), 'On it — thanks coach.');
      await tester.tap(find.byIcon(PhosphorIconsFill.paperPlaneRight));
      await tester.pumpAndSettle();
      expect(find.text('On it — thanks coach.'), findsOneWidget);
    });
  });
}
