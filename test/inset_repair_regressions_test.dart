// Regression tests for card t_3ea946f2 (device-found layout defects F1/F2/F3).
//
// Pumps the REAL AppShell with the QA device's bottom safe-area inset (49dp)
// so the shell's own bottom body padding is in play — the defects were all
// double applications of that inset behind it. Plain tests: `flutter test`
// always runs them.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/app_shell.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart' show FakeGate;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const size = Size(411, 914);

  // Emulates the QA device's bottom safe-area inset (derived from the
  // reproduction measurements: composer gap 108dp = 2X + 10 -> X ~= 49).
  const deviceInset = 49.0;

  Future<void> pumpShellInset(WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    AccountGate.install(FakeGate(AccountTier.advanced));
    fit.resetRoute('home');
    fit.onboarded = true;
    tester.view.devicePixelRatio = 1.0;
    tester.view.platformDispatcher.textScaleFactorTestValue = 1.0;
    tester.view.physicalSize = size;
    tester.view.viewInsets = FakeViewPadding.zero;
    tester.view.padding = const FakeViewPadding(bottom: deviceInset);
    tester.view.viewPadding = const FakeViewPadding(bottom: deviceInset);
    addTearDown(tester.view.reset);

    // One MaterialApp pump per test — a second pump on this host hangs.
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: AccountGate.instance,
          child: AppShell(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 120));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
  }

  testWidgets('F1 inbox tap shows the notch toast, never a Scaffold snackbar',
      (tester) async {
    await pumpShellInset(tester);
    fit.goCommunity();
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    // The header inbox/message icon: chatCircle RoundAction with badge '2'.
    final inbox =
        find.ancestor(of: find.text('2'), matching: find.byType(RoundAction)).first;
    await tester.tap(inbox);
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    // No Scaffold snackbar -> no scrim-behind-nav-bar artifact is possible.
    expect(find.byType(SnackBar), findsNothing);
    // The top-anchored notch toast is visible instead.
    expect(find.text(t.inboxComingSoon), findsOneWidget);

    // Drain the toast dismissal timer so the test ends clean.
    await tester.pump(const Duration(seconds: 5));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
  });

  testWidgets('F1 community options sheet barrier opens and disposes on dismiss',
      (tester) async {
    await pumpShellInset(tester);
    fit.goCommunity();
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    final baselineBarriers = find.byType(ModalBarrier).evaluate().length;

    await tester.tap(find.byIcon(PhosphorIconsRegular.dotsThree).first);
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    expect(find.byType(ModalBarrier).evaluate().length, baselineBarriers + 1,
        reason: 'the glass sheet pushes exactly one modal barrier');

    // Dismiss via the barrier (tap far above the sheet panel).
    await tester.tapAt(const Offset(205, 80));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    expect(find.byType(ModalBarrier).evaluate().length, baselineBarriers,
        reason: 'the sheet barrier must dispose on dismiss');
  });

  testWidgets('F2 workout CTA anchors above the nav with a single bottom inset',
      (tester) async {
    await pumpShellInset(tester);
    trainer.openAssignmentId = 'asg_lower';
    fit.pushRoute('trainer-workout');
    await tester.pumpAndSettle(const Duration(milliseconds: 200));

    final cta = tester.getRect(find.text(t.startWorkout));
    // Fixed (single inset): 131.0 measured = broken 180.0 - the 49dp shell
    // inset the screen no longer adds itself. 132 keeps 1dp headroom while
    // any reintroduced double application (180) still fails hard.
    expect(size.height - cta.bottom, lessThanOrEqualTo(132),
        reason: 'double inset floated the CTA text 180dp up; single inset is 131');

    final ask = tester.getRect(find.textContaining('Marcus'));
    expect(size.height - ask.bottom, lessThanOrEqualTo(85),
        reason: 'double inset floated the ask link 125dp up');

    // The anchored CTA must stay fixed, not scroll with the content.
    expect(
      find.ancestor(
          of: find.text(t.startWorkout), matching: find.byType(Scrollable)),
      findsNothing,
    );

    // The seeded assignment rendered its exercise rows.
    expect(find.text('Goblet Box Squat'), findsOneWidget);
  });

  testWidgets('F3 chat composer tracks insets with no reserved dead space',
      (tester) async {
    await pumpShellInset(tester);
    fit.pushRoute('trainer-chat');
    await tester.pumpAndSettle(const Duration(milliseconds: 200));

    var composer = tester.getRect(find.byType(TextField).first);
    expect(size.height - composer.bottom, lessThanOrEqualTo(62),
        reason: 'double inset floated the composer 109dp up');

    // Keyboard opens: insets 300 (engine clamps padding to 0).
    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    tester.view.padding = FakeViewPadding.zero;
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    composer = tester.getRect(find.byType(TextField).first);
    // With padding clamped to 0 the screen has no inset to add, so the
    // composer rests on the shell's own viewPadding floor (app_shell.dart
    // pads every body by viewPaddingOf: 49 shell + 10 container + 1 border =
    // 60 measured). Bound at the same 62 floor as the closed state: any
    // extra reserved dead space above that floor still fails.
    expect(size.height - 300 - composer.bottom, lessThanOrEqualTo(62),
        reason: 'composer must sit at the shell floor above the keyboard (60), not lower');

    // Keyboard drains: insets back to 0, safe area restored.
    tester.view.viewInsets = FakeViewPadding.zero;
    tester.view.padding = const FakeViewPadding(bottom: deviceInset);
    tester.view.viewPadding = const FakeViewPadding(bottom: deviceInset);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    composer = tester.getRect(find.byType(TextField).first);
    expect(size.height - composer.bottom, lessThanOrEqualTo(62),
        reason: 'the composer must settle back after the keyboard drains');
  });
}
