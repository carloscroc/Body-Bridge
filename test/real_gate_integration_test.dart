import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/auth_wall_screen.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_gate_impl.dart';
import 'package:gymmane/state/account_state.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Real-app proof of the mandatory-auth entry gate (t_f232e72e): the
/// composition root boots into the production [RealAccountGate], the
/// signed-out cold start lands on the blocking [AuthWallScreen], a failed
/// email submit shows the inline validation error without ever revealing
/// app content, and a seeded signed-in phase restores the shell (session
/// restore).
///
/// Failure-first keeps the whole file deterministic: the gate and account
/// singletons are shared across the tests here, so the gate is exercised
/// before any test mutates the signed-in phase.
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

  testWidgets('failed email submit from the wall shows the inline error and stays on the wall', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));

    await tester.enterText(find.byType(TextField).at(0), 'not-an-email');
    await tester.pump(const Duration(milliseconds: 100));

    await tester.tap(find.text(t.authCtaContinueEmail));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.textContaining('auth unavailable'), findsNothing,
        reason: 'the signed-out stub must never run in the real app');
    expect(find.text(t.authErrorInvalidEmail), findsOneWidget,
        reason: 'a malformed email maps to the localized authErrorInvalidEmail');
    expect(find.byType(AuthWallScreen), findsOneWidget,
        reason: 'a failed submit keeps the user on the wall');
    expect(tester.takeException(), isNull,
        reason: 'a failed submit must not crash the app');
    expect(AccountGate.instance.snapshot.tier, AccountTier.signedOut,
        reason: 'a failed submit must not produce a signed-in tier');
    expect(find.byType(CircularProgressIndicator), findsNothing,
        reason: 'no stuck spinner: submitting resets after the failure');
    expect(find.text(t.authCtaContinueEmail), findsOneWidget,
        reason: 'the submit button is back, form still usable');
  });

  testWidgets('real gate installed at boot; signed-out cold start shows the auth wall', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));

    expect(AccountGate.instance is RealAccountGate, isTrue,
        reason: 'boot must wire the production gate; no fake install in this file');

    expect(find.byType(AuthWallScreen), findsOneWidget,
        reason: 'signed-out boot must show the blocking wall, not the app');
    expect(find.text('BODY BRIDGE'), findsOneWidget,
        reason: 'the wall carries the wordmark');

    // The email step is the default: the submit button offers the code
    // handoff.
    expect(find.text(t.authCtaContinueEmail), findsOneWidget,
        reason: 'the email step is the default on the wall');
    expect(tester.takeException(), isNull);
  });

  testWidgets('seeded signed-in phase restores the app shell (session restore)', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(AuthWallScreen), findsOneWidget);

    // Simulate a restored session, exactly what the boot probe produces on
    // a cold start with an existing session.
    account.debugSetPhase(AccountPhase.signedInFree);
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(AuthWallScreen), findsNothing,
        reason: 'a signed-in phase leaves the wall');
    expect(find.text(t.authCtaContinueEmail), findsNothing,
        reason: 'the wall form is gone from the tree');
    expect(tester.takeException(), isNull,
        reason: 'the shell renders for the restored session');
  });
}
