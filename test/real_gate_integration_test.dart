import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_gate_impl.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Real-app proof that the composition root installed the production
/// [RealAccountGate] (C2 <-> C3 integration): in-app sign-in runs the real
/// service chain instead of the guest StateError, and FeatureGate consults
/// the installed real gate. No AccountGate.install here on purpose — the app
/// must boot wired all by itself.
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

  testWidgets('real gate installed at boot; sign-in degrades gracefully offline', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));

    expect(AccountGate.instance is RealAccountGate, isTrue,
        reason: 'boot must wire the production gate; no fake install in this file');

    fit.goAccount();
    // Start the shell's route transition, then advance past its 380ms exit so
    // the previous screen is fully unmounted before interacting.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pump(const Duration(milliseconds: 400));

    await tester.enterText(find.byType(TextField).at(0), 'rider@gymmane.app');
    await tester.enterText(find.byType(TextField).at(1), 'stable-password');
    await tester.pump(const Duration(milliseconds: 100));

    // Switch to sign-in mode, then submit. PrimaryButton titleCases its label,
    // so after the switch both the segment and the button read 'Sign in'.
    await tester.tap(find.text(t.signIn));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(find.byType(PrimaryButton));
    await tester.pump();
    // The submit spinner animates forever: advance in bounded steps instead
    // of an unbounded pumpAndSettle.
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));

    expect(find.textContaining('auth unavailable in guest mode'), findsNothing,
        reason: 'the guest stub must never run in the real app');
    expect(find.textContaining(t.authFailedGeneric), findsOneWidget,
        reason: 'submit went RealAccountGate -> AuthService -> AuthException(unknown)');
    expect(tester.takeException(), isNull,
        reason: 'auth failure must not crash the app');
    expect(AccountGate.instance.snapshot.tier, AccountTier.signedOut,
        reason: 'offline-first: failed auth degrades to signed-out');
    expect(find.byType(CircularProgressIndicator), findsNothing,
        reason: 'no stuck spinner: submitting resets after the failure');
    expect(find.byType(PrimaryButton), findsOneWidget,
        reason: 'the submit button is back, form still usable');
  });

  testWidgets('FeatureGate consults the installed real gate: guest AI Routine lands on paywall', (tester) async {
    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(milliseconds: 400));

    fit.goRoutines();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pump(const Duration(milliseconds: 400));

    final aiRoutineButton = find.text(t.aiRoutine);
    await tester.ensureVisible(aiRoutineButton);
    await tester.pump(const Duration(milliseconds: 100));

    await tester.tap(aiRoutineButton);
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));

    expect(fit.route, 'paywall',
        reason: 'real gate in guest mode: canAccess(ai_plan) is false -> paywall');
    expect(tester.takeException(), isNull);
  });
}
