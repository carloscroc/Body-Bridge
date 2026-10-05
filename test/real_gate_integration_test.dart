import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/auth_wall_screen.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_gate_impl.dart';
import 'package:gymmane/state/account_state.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Real-app proof of the mandatory-auth entry gate (t_f232e72e): the
/// composition root boots into the production [RealAccountGate], the
/// signed-out cold start lands on the blocking [AuthWallScreen], a failed
/// sign-in shows the inline auth error without ever revealing app content,
/// and a seeded signed-in phase restores the shell (session restore).
///
/// Order matters: the failed sign-in test runs FIRST. The RealAccountGate /
/// AccountState singletons are shared across tests in this file, and once
/// warmUp() has completed in an earlier test the submit microtask resolves
/// differently in the fake async environment. Sign-in-first keeps the whole
/// file deterministic.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    fit.onboarded = true;
    fit.session = null;
    fit.sessions.clear();
    fit.resetRoute('home');
  });

  tearDown(() {
    fit.resetRoute('home');
  });

  testWidgets('failed sign-in from the wall shows the auth error and stays on the wall', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));

    await tester.enterText(find.byType(TextField).at(0), 'rider@gymmane.app');
    await tester.enterText(find.byType(TextField).at(1), 'stable-password');
    await tester.pump(const Duration(milliseconds: 100));

    // Switch to sign-in mode, then submit. PrimaryButton titleCases its
    // label, so after the switch both the segment and the button read
    // 'Sign in' — tap the segment first, then the button.
    await tester.tap(find.text(t.signIn));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(find.byType(PrimaryButton));
    await tester.pump();
    // The submit spinner animates forever: advance in bounded steps instead
    // of an unbounded pumpAndSettle.
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));

    expect(find.textContaining('auth unavailable'), findsNothing,
        reason: 'the signed-out stub must never run in the real app');
    expect(find.textContaining(t.authFailedGeneric), findsOneWidget,
        reason: 'submit went RealAccountGate -> AuthService -> AuthException(unknown)');
    expect(find.byType(AuthWallScreen), findsOneWidget,
        reason: 'a failed auth keeps the user on the wall');
    expect(tester.takeException(), isNull,
        reason: 'auth failure must not crash the app');
    expect(AccountGate.instance.snapshot.tier, AccountTier.signedOut,
        reason: 'a failed sign-in must not produce a signed-in tier');
    expect(find.byType(CircularProgressIndicator), findsNothing,
        reason: 'no stuck spinner: submitting resets after the failure');
    expect(find.byType(PrimaryButton), findsOneWidget,
        reason: 'the submit button is back, form still usable');
  });

  testWidgets('real gate installed at boot; signed-out cold start shows the auth wall', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));

    expect(AccountGate.instance is RealAccountGate, isTrue,
        reason: 'boot must wire the production gate; no fake install in this file');

    expect(find.byType(AuthWallScreen), findsOneWidget,
        reason: 'signed-out boot must show the blocking wall, not the app');
    expect(find.text('Body Bridge'), findsOneWidget,
        reason: 'the wall carries the wordmark');

    // Sign-up is the default mode: the submit button offers the free start.
    expect(find.text(t.startFree), findsOneWidget,
        reason: 'sign-up (create account) is the default on the wall');
    expect(tester.takeException(), isNull);
  });

  testWidgets('seeded signed-in phase restores the app shell (session restore)', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(AuthWallScreen), findsOneWidget);

    // Simulate a restored Firebase session, exactly what warmUp produces on
    // a cold start with an existing session.
    account.debugSetPhase(AccountPhase.signedInFree);
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(AuthWallScreen), findsNothing,
        reason: 'a signed-in phase leaves the wall');
    expect(find.text(t.startFree), findsNothing,
        reason: 'the wall form is gone from the tree');
    expect(tester.takeException(), isNull,
        reason: 'the shell renders for the restored session');
  });
}
