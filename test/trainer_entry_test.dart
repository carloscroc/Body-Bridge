// Trainer entry rework widget tests (card t_fcd4945b): 4-slot nav, Exercises
// strip + bell tier gating, NEW-workout banner overlay, hub back affordance.
//
// Harness mirrors trainer_tier_test (FakeGate + mock SharedPreferences +
// fit.resetRoute); the nav test mirrors shell_transition_test (the real
// AppShell pumped through GymManeApp).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/exercises_screen.dart';
import 'package:gymmane/screens/home_screen.dart';
import 'package:gymmane/screens/trainer_home_screen.dart';
import 'package:gymmane/screens/trainer_workout_detail_screen.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/services/progress_reminder.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_state.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
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

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    fit.resetRoute('home');
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
    fit.resetRoute('home');
  });

  // One screen with a route switch — same shape as trainer_tier_test's
  // pumpTrainer, extended with exercises + home.
  Future<void> pumpSurface(WidgetTester tester, AccountTier tier) async {
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
                'exercises' => ExercisesScreen(),
                'trainer' => TrainerHomeScreen(),
                'trainer-workout' => TrainerWorkoutDetailScreen(key: ValueKey(trainer.openAssignmentId)),
                _ => HomeScreen(),
              },
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pump(const Duration(milliseconds: 400));
  }

  testWidgets('nav renders exactly 4 tabs; tapping exercises lands there', (tester) async {
    await Store.instance.init();
    ProgressReminder.instance.enabled = false;
    setAppLanguage('es');
    fit.onboarded = true;
    fit.session = null;
    fit.sessions.clear();
    fit.awards.clear();
    fit.awardsSeen.clear();
    fit.pendingAwards.clear();
    fit.resetRoute('home');
    account.debugSetWarmedUp();
    account.debugSetPhase(AccountPhase.signedInFree);

    await tester.pumpWidget(const GymManeApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // Home is selected → fill variant; the other three render regular.
    expect(find.byIcon(PhosphorIconsFill.house), findsOneWidget);
    expect(find.byIcon(PhosphorIconsRegular.barbell), findsOneWidget);
    expect(find.byIcon(PhosphorIconsRegular.chartLineUp), findsOneWidget);
    expect(find.byIcon(PhosphorIconsRegular.userCircle), findsOneWidget);
    // The old MY TRAINER tab icon is gone in both weights.
    expect(find.byIcon(PhosphorIconsRegular.users), findsNothing);
    expect(find.byIcon(PhosphorIconsFill.users), findsNothing);

    await tester.tap(find.text(t.exercises));
    await tester.pump();
    expect(fit.route, 'exercises');

    setAppLanguage('en');
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('advanced: strip shows trainer + pill; pushes hub; back returns', (tester) async {
    fit.resetRoute('exercises');
    await pumpSurface(tester, AccountTier.advanced);

    expect(find.text('Marcus Reyes'), findsOneWidget);
    expect(find.byIcon(PhosphorIconsFill.chatCircleDots), findsOneWidget);
    expect(find.text('2'), findsWidgets);
    expect(find.byIcon(PhosphorIconsRegular.bell), findsOneWidget);

    await tester.tap(find.text('Marcus Reyes'));
    await tester.pump();
    expect(fit.route, 'trainer');
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.byType(TrainerHomeScreen), findsOneWidget);

    await tester.tap(find.byType(RoundBtn).first);
    await tester.pump();
    expect(fit.route, 'exercises');
  });

  testWidgets('free: upsell strip opens the gate; no trainer surfaces', (tester) async {
    fit.resetRoute('exercises');
    await pumpSurface(tester, AccountTier.free);

    expect(find.text(t.talkToTrainer), findsOneWidget);
    expect(find.text('Marcus Reyes'), findsNothing);
    expect(find.byType(TrainerHomeScreen), findsNothing);
    expect(find.byIcon(PhosphorIconsRegular.bell), findsNothing);

    await tester.tap(find.text(t.talkToTrainer));
    await tester.pumpAndSettle();
    expect(find.text(t.gateTitle), findsOneWidget);
    expect(find.textContaining(RegExp(r'\$\d')), findsNothing, reason: 'the gate must not show prices');
  });

  testWidgets('bell badge follows unreadTotal', (tester) async {
    fit.resetRoute('exercises');
    await pumpSurface(tester, AccountTier.advanced);

    expect(find.text('2'), findsWidgets);
    await trainer.markThreadRead('thr_chat_marcus');
    await tester.pumpAndSettle();
    expect(trainer.unreadTotal, 0);
    expect(find.text('2'), findsNothing);
    expect(find.byIcon(PhosphorIconsRegular.bell), findsOneWidget);
  });

  testWidgets('free: bell absent', (tester) async {
    fit.resetRoute('exercises');
    await pumpSurface(tester, AccountTier.free);
    expect(find.byIcon(PhosphorIconsRegular.bell), findsNothing);
  });

  testWidgets('home banner: tap opens the workout; dismissed stays gone', (tester) async {
    fit.resetRoute('home');
    await pumpSurface(tester, AccountTier.advanced);

    expect(find.textContaining('New workout'), findsOneWidget);
    await tester.tap(find.textContaining('New workout'));
    await tester.pumpAndSettle();
    expect(fit.route, 'trainer-workout');
    expect(find.byType(TrainerWorkoutDetailScreen), findsOneWidget);

    fit.goHome();
    await tester.pumpAndSettle();
    expect(find.textContaining('New workout'), findsNothing);
  });

  testWidgets('free home: no banner', (tester) async {
    fit.resetRoute('home');
    await pumpSurface(tester, AccountTier.free);
    expect(find.textContaining('New workout'), findsNothing);
  });

  testWidgets("handleBack on 'trainer' pops to exercises, not home", (tester) async {
    fit.resetRoute('exercises');
    fit.pushRoute('trainer');
    expect(fit.route, 'trainer');
    fit.handleBack();
    expect(fit.route, 'exercises');
    expect(fit.route, isNot('home'));
  });
}
