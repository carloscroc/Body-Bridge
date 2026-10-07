import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/services/auth_service.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/auth_form.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

/// AuthForm behavior: the password reveal toggle, the forgot-password flow
/// end to end, and the AuthException -> localized message mapping (raw
/// `AuthException.toString()` must never reach the UI).
class _ScriptedGate extends AccountGate {
  _ScriptedGate({this.failWith});

  final AuthException? failWith;
  String? resetEmail;

  @override
  AccountSnapshot get snapshot => const AccountSnapshot(tier: AccountTier.signedOut);

  @override
  bool canAccess(String feature) => tierCan(AccountTier.signedOut, feature);

  @override
  Future<void> signIn(String email, String password) async {
    final failure = failWith;
    if (failure != null) throw failure;
  }

  @override
  Future<void> signUp(String email, String password) async {
    final failure = failWith;
    if (failure != null) throw failure;
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}

  @override
  Future<void> sendPasswordReset(String email) async => resetEmail = email;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpForm(WidgetTester tester, _ScriptedGate gate) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: gate,
          child: Scaffold(body: AuthForm(strings: () => t)),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  }

  testWidgets('password field toggles obscure and swaps eye icons', (tester) async {
    await pumpForm(tester, _ScriptedGate());

    await tester.enterText(find.byType(TextField).at(1), 'stable-password');
    await tester.pump();

    // find.text() matches EditableText even when obscured in current
    // Flutter; assert the field's own obscureText state instead.
    bool obscureOf(WidgetTester t) => (t.widget<EditableText>(
          find.byType(EditableText).at(1),
        )).obscureText;
    expect(obscureOf(tester), isTrue, reason: 'the field starts obscured');
    expect(find.byIcon(PhosphorIconsRegular.eye), findsOneWidget);

    await tester.tap(find.byIcon(PhosphorIconsRegular.eye));
    await tester.pump();

    expect(obscureOf(tester), isFalse, reason: 'the reveal shows the password');
    expect(find.byIcon(PhosphorIconsRegular.eyeSlash), findsOneWidget);
    expect(find.byIcon(PhosphorIconsRegular.eye), findsNothing);
  });

  testWidgets('forgot password carries the email and lands on the sent pane', (tester) async {
    final gate = _ScriptedGate();
    await pumpForm(tester, gate);

    await tester.enterText(find.byType(TextField).at(0), 'rider@gymmane.app');
    await tester.pump();

    // Switch to sign-in to reveal the forgot-password link, then follow it.
    await tester.tap(find.text(t.signIn));
    await tester.pump();
    await tester.tap(find.text(t.forgotPassword));
    await tester.pump();

    await tester.tap(find.byType(PrimaryButton)); // resetSend
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(gate.resetEmail, 'rider@gymmane.app',
        reason: 'the reset email carries over from the sign-in field');
    expect(find.text(t.resetSentTitle), findsOneWidget);
    expect(find.textContaining('rider@gymmane.app'), findsOneWidget,
        reason: 'the sent pane echoes the address');
    expect(find.byType(TextField), findsNothing, reason: 'the sent pane has no form fields');
  });

  testWidgets('AuthException maps to a localized message, never raw text', (tester) async {
    await pumpForm(tester, _ScriptedGate(failWith: const AuthException('wrongPassword')));

    await tester.enterText(find.byType(TextField).at(0), 'rider@gymmane.app');
    await tester.enterText(find.byType(TextField).at(1), 'stable-password');
    await tester.pump();

    // Segment first, then the submit button: after the switch both read
    // 'Sign in' because PrimaryButton titleCases its label.
    await tester.tap(find.text(t.signIn));
    await tester.pump();
    await tester.tap(find.byType(PrimaryButton));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text(t.authErrorWrongPassword), findsOneWidget,
        reason: 'the wrongPassword key maps to its localized message');
    expect(find.textContaining('AuthException('), findsNothing,
        reason: 'AuthException.toString() must never reach the UI');
  });

  testWidgets('reset pane back affordance returns to the sign-in pane without stale errors',
      (tester) async {
    final gate = _ScriptedGate();
    await pumpForm(tester, gate);

    await tester.enterText(find.byType(TextField).at(0), 'rider@gymmane.app');
    await tester.pump();

    // Switch to sign-in to reveal the forgot-password link, then follow it.
    await tester.tap(find.text(t.signIn));
    await tester.pump();
    await tester.tap(find.text(t.forgotPassword));
    await tester.pump();

    // Reset pane: one email field and the back affordance.
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text(t.backToSignIn), findsOneWidget);

    // The sign-in email carries into the reset field, so clear it: submit
    // must arm the validation error instead of reaching the gate.
    await tester.enterText(find.byType(TextField), '');
    await tester.pump();

    // Raise a stale reset error: validation returns before the gate call.
    await tester.tap(find.byType(PrimaryButton)); // resetSend
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text(t.emailInvalid), findsOneWidget,
        reason: 'the error path armed without touching the gate');

    await tester.tap(find.text(t.backToSignIn));
    await tester.pump();

    // Back on the sign-in pane: segment, two fields, one submit button.
    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.text(t.signIn), findsNWidgets(2),
        reason: 'the segment option and the submit button both read "Sign in"');
    expect(find.byType(PrimaryButton), findsOneWidget);

    // No stale reset error and no back affordance on the sign-in pane.
    expect(find.text(t.emailInvalid), findsNothing);
    expect(find.text(t.backToSignIn), findsNothing);
    expect(gate.resetEmail, isNull, reason: 'back must not submit the reset request');
  });

  test('authKeyOf maps Firebase error codes to stable keys', () {
    expect(AuthService.authKeyOf('invalid-credential'), 'wrongPassword',
        reason: '6.x: wrong password and unknown email both return invalid-credential');
    expect(AuthService.authKeyOf('wrong-password'), 'wrongPassword',
        reason: 'deprecated arm still maps for older SDKs');
    expect(AuthService.authKeyOf('user-not-found'), 'userNotFound',
        reason: 'deprecated arm still maps for older SDKs');
    expect(AuthService.authKeyOf('operation-not-allowed'), 'unknown',
        reason: 'unmapped codes fall back to unknown');
  });
}
