// Trainer entry rework widget tests (card t_fcd4945b): 4-slot nav, Exercises
// coach disc + unread pill tier gating (t_a9afb1b7 replaced the strip + bell),
// NEW-workout banner overlay, hub back affordance.
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

  testWidgets('nav renders the 5-slot shape (4 tabs + center FAB); tapping exercises lands there', (tester) async {
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
    expect(find.byIcon(PhosphorIconsRegular.chatCircle), findsOneWidget);
    // Profile/Settings live in Home's top bar (main's 5-slot design), so the
    // userCircle glyph is still present — but as top-bar chrome, not a tab.
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

  testWidgets('nav selection pill sits on the selected tab', (tester) async {
    await Store.instance.init();
    ProgressReminder.instance.enabled = false;
    fit.onboarded = true;
    fit.session = null;
    fit.sessions.clear();
    fit.awards.clear();
    fit.awardsSeen.clear();
    fit.pendingAwards.clear();
    account.debugSetWarmedUp();
    account.debugSetPhase(AccountPhase.signedInFree);

    // Phone-width surface: below ~462px the _gap clamp(0, 40) never kicks
    // in, so _slotX and the Row's spaceBetween share the same gap math.
    tester.view.physicalSize = const Size(411, 823);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    // The nav bar is the SizedBox(height: 74); the liquid pill is its only
    // DecoratedBox with BorderRadius.circular(24) (54 tall at rest), and the
    // selected tab is the only place the filled icon renders.
    final navFinder = find.byWidgetPredicate((w) => w is SizedBox && w.height == 74);
    double centerX(Finder finder) {
      expect(finder, findsOneWidget);
      return tester.getCenter(finder).dx;
    }

    await tester.pumpWidget(const GymManeApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    for (final (go, icon) in [
      (fit.goHome, PhosphorIconsFill.house),
      (fit.goProgress, PhosphorIconsFill.chartLineUp),
      (fit.goExercises, PhosphorIconsFill.barbell),
      (fit.goCommunity, PhosphorIconsFill.chatCircle),
    ]) {
      go();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500)); // pill move = 460ms
      final pillX = centerX(find.descendant(
          of: navFinder,
          matching: find.byWidgetPredicate((w) =>
              w is DecoratedBox &&
              (w.decoration as BoxDecoration).borderRadius == BorderRadius.circular(24))));
      final iconX = centerX(find.descendant(of: navFinder, matching: find.byIcon(icon)));
      expect(
        (pillX - iconX).abs(),
        lessThanOrEqualTo(4),
        reason: 'pill must sit under the selected tab ($icon)',
      );
    }

    fit.goHome();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('advanced: disc shows trainer + pill; pushes hub; back returns (strip→disc t_a9afb1b7)', (tester) async {
    fit.resetRoute('exercises');
    // t_a9afb1b7: dismiss the floating workout banner card — it slides in
    // over the top edge and covers the disc's tap target on this surface.
    trainer.dismissedBanners.add('workout:thr_lower');
    await pumpSurface(tester, AccountTier.advanced);

    // t_a9afb1b7: the entry strip is replaced by the 38dp coach disc; the
    // header bell is gone — the disc pill carries the unread count now.
    expect(find.byKey(const ValueKey('exercises-coach-disc')), findsOneWidget);
    expect(find.byIcon(PhosphorIconsFill.chatCircleDots), findsNothing,
        reason: 'the strip Message pill is gone with the strip');
    expect(find.byKey(const ValueKey('disc-unread')), findsOneWidget,
        reason: 'unread count moved from the bell badge to the disc pill');
    expect(find.byIcon(PhosphorIconsRegular.bell), findsNothing,
        reason: 'the Exercises header no longer renders a bell');

    await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
    await tester.pump();
    expect(fit.route, 'trainer');
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.byType(TrainerHomeScreen), findsOneWidget);

    await tester.tap(find.byType(RoundBtn).first);
    await tester.pump();
    expect(fit.route, 'exercises');
  });

  testWidgets('free: disc opens the consultation sheet; no trainer surfaces (strip→disc t_a9afb1b7)', (tester) async {
    fit.resetRoute('exercises');
    await pumpSurface(tester, AccountTier.free);

    expect(find.byKey(const ValueKey('exercises-coach-disc')), findsOneWidget,
        reason: 'the free door is the Semantics-labelled disc, not a strip card');
    expect(find.text('Marcus Reyes'), findsNothing);
    expect(find.byType(TrainerHomeScreen), findsNothing);
    expect(find.byIcon(PhosphorIconsRegular.bell), findsNothing);

    await tester.tap(find.byKey(const ValueKey('exercises-coach-disc')));
    await tester.pumpAndSettle();
    // t_db30a5d3 R2/B4: the free-tier strip opens the two-door consultation
    // sheet — NOT the Advanced gate.
    expect(find.text(t.consultSheetTitle), findsOneWidget);
    expect(find.text(t.trainerGateTitle), findsNothing);
    expect(find.textContaining(RegExp(r'\$\d')), findsNothing, reason: 'the sheet must not show prices');
  });

  testWidgets('disc pill follows unreadTotal (bell→pill t_a9afb1b7)', (tester) async {
    fit.resetRoute('exercises');
    await pumpSurface(tester, AccountTier.advanced);

    expect(find.byKey(const ValueKey('disc-unread')), findsOneWidget,
        reason: 'the unread count lives on the disc pill now');
    await trainer.markThreadRead('thr_chat_marcus');
    await tester.pumpAndSettle();
    expect(trainer.unreadTotal, 0);
    expect(find.byKey(const ValueKey('disc-unread')), findsNothing);
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
