import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/auth_handoff.dart';
import 'package:gymmane/services/otp_auth_service.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/onboarding_gate.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/otp_auth_form.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// OtpAuthForm behavior: the two-step email-OTP sign-in. Covers email
/// validation, the failure-key -> localized message mapping (raw exception
/// text must never reach the UI), the code-well retry loop, attempt limits,
/// rate-limit locks with server-hinted countdowns, resend cooldowns, the
/// 320dp overflow budget, reduce motion, and the AuthHandoff variants the
/// post-verification gate routes into.
class ScriptedGate extends AccountGate {
  ScriptedGate(
      {this.requestFailure, this.verifyFailure, this.verifySuccess = true});

  /// Thrown by requestEmailCode, mirroring what the real gate does when the
  /// backend refuses to send a code. Mutable so a test can arm it after the
  /// first send (e.g. only the resend leg fails).
  OtpAuthException? requestFailure;

  /// Thrown by verifyEmailCode. A wrong code surfaces on the REAL gate as
  /// verifyEmailCode RETURNING FALSE (see [verifySuccess]); explicit
  /// OtpAuthException('codeInvalid') throws remain possible too — the form
  /// must handle both.
  final OtpAuthException? verifyFailure;

  /// Returned by verifyEmailCode when no [verifyFailure] is armed; false
  /// mirrors the real gate's wrong-code contract (a value, not an exception).
  final bool verifySuccess;

  int sentCount = 0;
  final List<String> codes = <String>[];

  @override
  AccountSnapshot get snapshot =>
      const AccountSnapshot(tier: AccountTier.signedOut);

  @override
  bool canAccess(String feature) => false;

  @override
  Future<void> requestEmailCode(String email) async {
    sentCount++;
    final failure = requestFailure;
    if (failure != null) throw failure;
  }

  @override
  Future<bool> verifyEmailCode(String email, String code) async {
    codes.add(code);
    final failure = verifyFailure;
    if (failure != null) throw failure;
    return verifySuccess;
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}
}

/// Injectable clock: the form reads OtpAuthForm.now for expiry, resend and
/// lock countdowns.
DateTime _clock = DateTime(2026, 1, 1, 12);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    OtpAuthForm.now = () => _clock;
  });

  tearDown(() {
    OtpAuthForm.now = DateTime.now;
    OnboardingGate.meQueryOverride = null;
    onboardingGate.reset();
  });

  Widget host(Widget child, {EdgeInsets viewInsets = EdgeInsets.zero}) =>
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: MediaQuery(
          data: MediaQueryData(viewInsets: viewInsets),
          child: Scaffold(body: child),
        ),
      );

  Future<void> pumpEmailStep(
    WidgetTester tester,
    ScriptedGate gate, {
    EdgeInsets viewInsets = EdgeInsets.zero,
  }) async {
    AccountGate.install(gate);
    if (viewInsets.bottom > 0) {
      tester.view.viewInsets = FakeViewPadding(
          bottom: viewInsets.bottom * tester.view.devicePixelRatio);
      addTearDown(tester.view.resetViewInsets);
    }
    await tester.pumpWidget(
      host(
        OtpAuthForm(showBrandHeader: true, strings: () => t),
        viewInsets: viewInsets,
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  }

  Future<void> toCodeStep(WidgetTester tester, ScriptedGate gate) async {
    await pumpEmailStep(tester, gate);
    await tester.enterText(find.byType(TextField), 'racer@gymmane.dev');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 300));
  }

  /// Unmounts the tree so the code step's 1s ticker is cancelled by dispose
  /// (a periodic Timer still pending fails the test).
  Future<void> unmount(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
  }

  /// Types a full code and lets the well's 80ms debounce fire the verify.
  Future<void> enterCode(WidgetTester tester, String code) async {
    await tester.enterText(find.byType(TextField), code);
    await tester.pump(const Duration(milliseconds: 120));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
  }

  testWidgets('an invalid email arms the inline error and stays on the email step',
      (tester) async {
    final gate = ScriptedGate();
    await pumpEmailStep(tester, gate);

    await tester.enterText(find.byType(TextField), 'not-an-email');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text(t.authErrorInvalidEmail), findsOneWidget,
        reason: 'the failed validation maps to the localized inline error');
    expect(find.text(t.authCodeTitle), findsNothing,
        reason: 'the form stays on the email step');
    expect(gate.sentCount, 0, reason: 'an invalid email never reaches the gate');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a network failure sending the code stays put with a localized error',
      (tester) async {
    final gate = ScriptedGate(requestFailure: const OtpAuthException('network'));
    await pumpEmailStep(tester, gate);

    await tester.enterText(find.byType(TextField), 'racer@gymmane.dev');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text(t.authErrorNetwork), findsOneWidget,
        reason: 'the network key maps to the localized message');
    expect(find.text(t.authCodeTitle), findsNothing,
        reason: 'a network failure keeps the email step');
    expect(find.textContaining('OtpAuthException('), findsNothing,
        reason: 'raw exception text must never reach the UI');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a rate-limited send stays put with a localized error',
      (tester) async {
    final gate =
        ScriptedGate(requestFailure: const OtpAuthException('rateLimit'));
    await pumpEmailStep(tester, gate);

    await tester.enterText(find.byType(TextField), 'racer@gymmane.dev');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text(t.authErrorTooManyRequests), findsOneWidget,
        reason: 'the rateLimit key maps to the localized message');
    expect(find.text(t.authCodeTitle), findsNothing,
        reason: 'a rate-limited send keeps the email step');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a valid email advances to the code step and echoes the address',
      (tester) async {
    final gate = ScriptedGate();
    await toCodeStep(tester, gate);

    expect(find.text(t.authCodeTitle), findsOneWidget,
        reason: 'the code step is now on screen');
    expect(find.textContaining('racer@gymmane.dev', findRichText: true),
        findsOneWidget,
        reason: 'the sent pane echoes the address (rich-text span)');
    expect(find.text(t.authCtaContinueEmail), findsNothing,
        reason: 'the email step is gone');
    expect(gate.sentCount, 1);
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a wrong code counts the attempt, shows the verdict and re-arms the well',
      (tester) async {
    final gate =
        ScriptedGate(verifyFailure: const OtpAuthException('codeInvalid'));
    await toCodeStep(tester, gate);

    await enterCode(tester, '000000');
    expect(find.text(t.authCodeInvalid(2)), findsOneWidget,
        reason: 'three attempts minus one failure leaves two');

    // The well cleared: a fresh code is accepted as a brand-new attempt.
    await enterCode(tester, '111111');
    expect(gate.codes, ['000000', '111111'],
        reason: 'the well cleared between attempts — codes never concatenate');
    expect(find.text(t.authCodeInvalid(1)), findsOneWidget,
        reason: 'the last attempt is announced');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('an expired code names the expiry and re-arms resend immediately',
      (tester) async {
    final gate =
        ScriptedGate(verifyFailure: const OtpAuthException('codeExpired'));
    await toCodeStep(tester, gate);

    await enterCode(tester, '000000');
    expect(find.text(t.authCodeExpiredVerdict), findsWidgets,
        reason: 'the verdict and the timer row both name the expiry');
    expect(find.text(t.authCodeExpired), findsOneWidget,
        reason: 'the expiry explains the code lifetime');
    expect(find.text(t.authResendAction), findsOneWidget,
        reason: 'expiry re-arms resend with no cooldown');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a rate-limited verify locks with the server countdown, never an invented time',
      (tester) async {
    final gate = ScriptedGate(
        verifyFailure:
            const OtpAuthException('rateLimit', retryAfterSeconds: 461));
    await toCodeStep(tester, gate);

    await enterCode(tester, '000000');
    expect(find.text(t.authRateLimitTitle), findsOneWidget);
    expect(find.text(t.authRateLimitRule), findsOneWidget);
    expect(find.textContaining('07:41'), findsOneWidget,
        reason: '461s formats as 07:41');
    expect(find.text(t.authResendAction), findsNothing,
        reason: 'the lock hides the resend affordance');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a rate limit without a retry hint locks with no countdown pill',
      (tester) async {
    final gate =
        ScriptedGate(verifyFailure: const OtpAuthException('rateLimit'));
    await toCodeStep(tester, gate);

    await enterCode(tester, '000000');
    expect(find.text(t.authRateLimitTitle), findsOneWidget);
    expect(find.textContaining(RegExp(r'\d\d:\d\d')), findsNothing,
        reason: 'without a server hint there is no invented countdown');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('resend honors the 30s cooldown and re-arms after a resend',
      (tester) async {
    final gate = ScriptedGate();
    await toCodeStep(tester, gate);

    expect(find.textContaining('0:30'), findsOneWidget,
        reason: 'the cooldown pill shows right after the code step opens');
    _clock = _clock.add(const Duration(seconds: 31));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text(t.authResendAction), findsOneWidget,
        reason: 'after 31s the resend affordance is back');

    await tester.tap(find.text(t.authResendAction));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(gate.sentCount, 2, reason: 'resend reaches the gate');
    expect(find.textContaining('0:30'), findsOneWidget,
        reason: 'the cooldown re-arms');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('the compact email step fits 320x640 with the keyboard open',
      (tester) async {
    tester.view.physicalSize = const Size(320 * 3, 640 * 3);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await pumpEmailStep(
      tester,
      ScriptedGate(),
      viewInsets: const EdgeInsets.only(bottom: 260),
    );
    await tester.pump(const Duration(milliseconds: 300));

    expect(tester.takeException(), isNull,
        reason: 'zero RenderFlex overflow at 320x640 with the keyboard up');
    await unmount(tester);
  });

  testWidgets('disableAnimations renders the first frame without motion',
      (tester) async {
    tester.platformDispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(disableAnimations: true);
    addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);

    await pumpEmailStep(tester, ScriptedGate());
    await tester.pump();

    expect(tester.takeException(), isNull,
        reason: 'the first frame renders fully under reduce-motion');
    expect(find.byType(OtpAuthForm), findsOneWidget);
    await unmount(tester);
  });

  testWidgets('the handoff shows the setup variant with the chips while onboarding pends',
      (tester) async {
    onboardingGate.reset();
    OnboardingGate.meQueryOverride = () async => null;
    await tester.pumpWidget(host(const AuthHandoff()));
    await tester.pump(const Duration(milliseconds: 1300));

    expect(find.byType(CircularProgressIndicator), findsNothing,
        reason: 'checking is over once the resolve floor elapses');
    expect(find.text(t.authSetupKicker), findsWidgets,
        reason: 'the kicker names the setup variant (the title falls back to it)');
    expect(find.text(t.authChipName), findsOneWidget);
    expect(find.text(t.authChipUnits), findsOneWidget);
    expect(find.text(t.authChipBody), findsOneWidget);
    expect(find.text(t.authChipGoal), findsOneWidget);
    expect(find.text(t.authChipPlaces), findsOneWidget);
    expect(find.text('B'), findsOneWidget,
        reason: 'the set-you-up hero is the B mark alone (no ring)');
    expect(find.byIcon(PhosphorIconsRegular.arrowRight), findsNWidgets(3),
        reason: 'accent arrows separate the chips in both rows');
    expect(find.text(t.authWelcomeBackKicker), findsNothing,
        reason: 'the returning-member variant is not shown');

    await tester.pump(const Duration(seconds: 2));
  });

  testWidgets('the handoff greets a returning member by name', (tester) async {
    onboardingGate.reset();
    OnboardingGate.meQueryOverride = () async => <String, dynamic>{
          'displayName': 'Carlos',
          'onboardedAt': '2026-01-01T00:00:00Z',
        };
    await tester.pumpWidget(host(const AuthHandoff()));
    await tester.pump(const Duration(milliseconds: 1300));

    expect(find.text(t.authWelcomeBackTitle('Carlos')), findsOneWidget,
        reason: 'the server displayName names the greeting');
    expect(find.text(t.authSetupKicker), findsNothing,
        reason: 'the setup variant is not shown for an onboarded account');
    expect(find.text(t.authChipName), findsNothing,
        reason: 'welcome-back shows no chips — they are set-you-up only');
    expect(find.text(t.authChipUnits), findsNothing);
    expect(find.text(t.authChipBody), findsNothing);
    expect(find.text(t.authChipGoal), findsNothing);
    expect(find.text(t.authChipPlaces), findsNothing);
    expect(find.text('B'), findsNothing,
        reason: 'welcome-back hero is the plain sage check ring, no B mark');

    await tester.pump(const Duration(seconds: 2));
  });

  testWidgets('a wrong code returned as false still shows the inline verdict',
      (tester) async {
    final gate = ScriptedGate(verifySuccess: false);
    await toCodeStep(tester, gate);

    await enterCode(tester, '000000');
    expect(find.text(t.authCodeInvalid(2)), findsOneWidget,
        reason:
            'a false verify (a value, not a throw) counts the attempt and'
            ' names two attempts left');

    // The well cleared: a fresh code is accepted as a brand-new attempt.
    await enterCode(tester, '111111');
    expect(gate.codes, ['000000', '111111'],
        reason: 'the well cleared between attempts — codes never concatenate');
    expect(find.text(t.authCodeInvalid(1)), findsOneWidget,
        reason: 'the last attempt is announced');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a non-network send failure still lands on the code step with a banner',
      (tester) async {
    final gate = ScriptedGate(requestFailure: const OtpAuthException('unknown'));
    await toCodeStep(tester, gate);

    expect(find.text(t.authCodeTitle), findsOneWidget,
        reason: 'the request row was committed — the code step is the right place');
    expect(find.text(t.authFailedGeneric), findsOneWidget,
        reason: 'the generic send-failure banner surfaces on the code step');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets('a rate-limited resend banners inline without resetting state',
      (tester) async {
    final gate = ScriptedGate();
    await toCodeStep(tester, gate);
    gate.requestFailure =
        const OtpAuthException('rateLimit', retryAfterSeconds: 455);

    _clock = _clock.add(const Duration(seconds: 31));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text(t.authResendAction), findsOneWidget,
        reason: 'after 31s the resend affordance is available');

    await tester.tap(find.text(t.authResendAction));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text(t.authRateLimitBanner('07:35')), findsOneWidget,
        reason: '455s formats as 07:35 in the inline banner');
    expect(find.text(t.authRateLimitTitle), findsNothing,
        reason: 'a rate-limited resend never locks the screen');
    expect(find.text(t.authCodeExpires('4:29')), findsOneWidget,
        reason: 'the expiry countdown keeps ticking — no state reset');
    expect(find.text(t.authResendAction), findsOneWidget,
        reason: 'the failed resend did not re-arm the cooldown');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets(
      'the email field keeps its text-input connection across the inset rebuild',
      (tester) async {
    // Regression for the device defect: the IME inset lands ~80-130ms after
    // showSoftInput; the inset-responsive rebuild of the email step used to
    // re-create the focused EditableText (the compact flip removed the hero
    // children from the FRONT of the Column's child list, shifting every
    // later slot), whose dispose closed the TextInputConnection — the app
    // called hideSoftInput on itself and no input path remained.
    final gate = ScriptedGate();
    await pumpEmailStep(tester, gate);

    await tester.tap(find.byType(TextField));
    await tester.pump();
    expect(tester.testTextInput.hasAnyClients, isTrue,
        reason: 'tapping the field opens the text-input connection');

    // The IME inset lands while the field is focused: the rebuild must not
    // drop the connection (dropping it calls hideSoftInput — the keyboard
    // self-dismisses and adb input text lands nowhere).
    tester.view.viewInsets =
        FakeViewPadding(bottom: 260 * tester.view.devicePixelRatio);
    addTearDown(tester.view.resetViewInsets);
    await tester.pumpWidget(
      host(
        OtpAuthForm(showBrandHeader: true, strings: () => t),
        viewInsets: const EdgeInsets.only(bottom: 260),
      ),
    );
    await tester.pump(const Duration(milliseconds: 200));

    expect(tester.testTextInput.hasAnyClients, isTrue,
        reason: 'the inset-driven rebuild keeps the connection alive');
    tester.testTextInput.enterText('c');
    await tester.pump();
    expect(find.text('c'), findsOneWidget,
        reason: 'typing reaches the still-attached client after the rebuild');

    // Reverse leg: the keyboard goes away and the inset drains to 0 — the
    // field must survive that rebuild too (this leg is what re-armed the
    // flash on every subsequent tap).
    await tester.pumpWidget(
      host(OtpAuthForm(showBrandHeader: true, strings: () => t)),
    );
    await tester.pump(const Duration(milliseconds: 200));
    expect(tester.testTextInput.hasAnyClients, isTrue,
        reason: 'the inset-drain rebuild keeps the connection alive too');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });

  testWidgets(
      'landscape with the keyboard open keeps the email field above the fold',
      (tester) async {
    tester.view.physicalSize = const Size(2400, 1080); // 800x360 logical @3x
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await pumpEmailStep(
      tester,
      ScriptedGate(),
      viewInsets: const EdgeInsets.only(bottom: 260),
    );
    await tester.pump(const Duration(milliseconds: 200));

    final rect = tester.getRect(find.byType(TextField));
    final imeTop = 360 - 260;
    expect(rect.top, greaterThanOrEqualTo(0));
    expect(rect.bottom, lessThanOrEqualTo(imeTop),
        reason:
            'the focused field sits fully in the region above the IME — '
            'reachable with the keyboard open in landscape');
    expect(tester.takeException(), isNull);
    await unmount(tester);
  });
}
