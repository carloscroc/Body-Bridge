// Throwaway capture harness (scratch_ prefix = not part of the committed
// suite): renders the real AuthWallScreen at the Samsung viewport in both
// themes, both OTP steps, and exports PNGs to CAPTURE_DIR for visual review.
import 'dart:io';
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/auth_wall_screen.dart';
import 'package:gymmane/services/otp_auth_service.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/otp_auth_form.dart';

class ScriptedGate extends AccountGate {
  /// Thrown by requestEmailCode: arms the failed-send code-step path
  /// (banner, no code ever delivered). Mutable so a capture can arm it.
  OtpAuthException? requestFailure;

  /// Thrown by verifyEmailCode. When no failure is armed the gate returns
  /// FALSE for a wrong code (mirroring the real gate's contract) so the
  /// invalid branch is exercised.
  OtpAuthException? verifyFailure;

  @override
  AccountSnapshot get snapshot => const AccountSnapshot(tier: AccountTier.signedOut);
  @override
  bool canAccess(String feature) => false;
  @override
  Future<void> requestEmailCode(String email) async {
    final failure = requestFailure;
    if (failure != null) throw failure;
  }
  @override
  Future<bool> verifyEmailCode(String email, String code) async {
    final failure = verifyFailure;
    if (failure != null) throw failure;
    return false;
  }
  @override
  Future<void> signOut() async {}
  @override
  Future<void> deleteAccount() async {}
}

/// Injectable form clock: expiry / resend / lock countdowns read it.
DateTime _captureClock = DateTime(2026, 1, 1, 12);

Future<void> _capture(WidgetTester tester, GlobalKey key, String name) async {
  await tester.binding.runAsync(() async {
    final boundary =
        key.currentContext!.findRenderObject() as RenderRepaintBoundary;
    final image = await boundary.toImage(pixelRatio: 3.0);
    final bytes = await image.toByteData(format: ImageByteFormat.png);
    final dir = Platform.environment['CAPTURE_DIR'] ?? '.';
    await File('$dir/$name.png').writeAsBytes(bytes!.buffer.asUint8List());
    stdout.writeln('captured $name');
  });
}

Widget _host(ThemeData theme) => MaterialApp(
      theme: theme,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const AuthWallScreen(),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    // Load the real Nunito assets — without this the harness renders every
    // glyph as a solid block ("squares"), which poisoned the first review set.
    // Phosphor families are loaded too so brand glyphs (lock, clock, arrows)
    // render as icons instead of tofu in the capture PNGs.
    final families = <String, List<String>>{
      'Nunito': [
        'assets/fonts/Nunito-Regular.ttf',
        'assets/fonts/Nunito-Italic.ttf',
        'assets/fonts/Nunito-Medium.ttf',
        'assets/fonts/Nunito-SemiBold.ttf',
        'assets/fonts/Nunito-SemiBoldItalic.ttf',
        'assets/fonts/Nunito-Bold.ttf',
        'assets/fonts/Nunito-ExtraBold.ttf',
        'assets/fonts/Nunito-Black.ttf',
      ],
      'packages/phosphoricons_flutter/PhosphorRegular': [
        'file://C:/Users/thebe/AppData/Local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts/Phosphor.ttf',
      ],
      'packages/phosphoricons_flutter/PhosphorFill': [
        'file://C:/Users/thebe/AppData/Local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts/Phosphor-Fill.ttf',
      ],
    };
    for (final entry in families.entries) {
      final loader = FontLoader(entry.key);
      for (final path in entry.value) {
        if (path.startsWith('file://')) {
          // Host-absolute path (pub-cache font): read straight from disk.
          final bytes = File(path.substring(7)).readAsBytesSync();
          loader.addFont(Future.value(bytes.buffer.asByteData()));
        } else {
          loader.addFont(rootBundle.load(path));
        }
      }
      await loader.load();
    }
  });

  testWidgets('capture auth wall variants', (tester) async {
    final gate = ScriptedGate();
    AccountGate.install(gate);
    // The form's countdowns read this mutable clock; reset per state below.
    OtpAuthForm.now = () => _captureClock;
    addTearDown(() => OtpAuthForm.now = DateTime.now);

    const phys = Size(1440, 3200);
    tester.view.physicalSize = phys;
    tester.view.devicePixelRatio = 3.0;
    addTearDown(tester.view.reset);

    final emailKey = GlobalKey();
    final codeKey = GlobalKey();

    // Freshly pumped host, email typed, continue tapped, code step settled.
    // A fresh GlobalKey per pumpWidget is REQUIRED: reusing a key makes the
    // root adapter update the retained subtree in place, so the form would
    // stay on the previous step instead of starting fresh on the email step.
    Future<GlobalKey> toCodeStep(ThemeData theme,
        {OtpAuthException? requestFailure}) async {
      final stateKey = GlobalKey();
      _captureClock = DateTime(2026, 1, 1, 12);
      gate.requestFailure = requestFailure;
      gate.verifyFailure = null;
      await tester.pumpWidget(
        RepaintBoundary(key: stateKey, child: _host(theme)),
      );
      await tester.enterText(find.byType(TextField), 'carlos@bodybridge.app');
      await tester.pump();
      await tester.tap(find.text(t.authCtaContinueEmail));
      for (var i = 0; i < 6; i++) {
        await tester.pump(const Duration(milliseconds: 150));
      }
      return stateKey;
    }

    // DARK theme — email step
    await tester.pumpWidget(
      RepaintBoundary(key: emailKey, child: _host(AppTheme.dark)),
    );
    await tester.pump(const Duration(milliseconds: 600));
    await _capture(tester, emailKey, 'dark_email_step');

    // DARK theme — code step
    await tester.enterText(find.byType(TextField), 'carlos@bodybridge.app');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    for (var i = 0; i < 6; i++) {
      await tester.pump(const Duration(milliseconds: 150));
    }
    await tester.pumpWidget(
      RepaintBoundary(key: codeKey, child: _host(AppTheme.dark)),
    );
    await tester.enterText(find.byType(TextField), 'carlos@bodybridge.app');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    for (var i = 0; i < 6; i++) {
      await tester.pump(const Duration(milliseconds: 150));
    }
    await _capture(tester, codeKey, 'dark_code_step');

    // LIGHT theme — email step
    await tester.pumpWidget(
      RepaintBoundary(key: emailKey, child: _host(AppTheme.light)),
    );
    await tester.pump(const Duration(milliseconds: 600));
    await _capture(tester, emailKey, 'light_email_step');

    // LIGHT theme — code step
    await tester.enterText(find.byType(TextField), 'carlos@bodybridge.app');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    for (var i = 0; i < 6; i++) {
      await tester.pump(const Duration(milliseconds: 150));
    }
    await tester.pumpWidget(
      RepaintBoundary(key: codeKey, child: _host(AppTheme.light)),
    );
    await tester.enterText(find.byType(TextField), 'carlos@bodybridge.app');
    await tester.pump();
    await tester.tap(find.text(t.authCtaContinueEmail));
    for (var i = 0; i < 6; i++) {
      await tester.pump(const Duration(milliseconds: 150));
    }
    await _capture(tester, codeKey, 'light_code_step');

    // Code-step states for visual review (t_2ffc0956): the well outline
    // states and the failed-send expiry honesty, both themes.
    for (final (name, theme) in [
      ('dark', AppTheme.dark),
      ('light', AppTheme.light),
    ]) {
      // Success send, well focused (autofocus).
      await _capture(
          tester, await toCodeStep(theme), '${name}_code_normal');

      // TTL lapsed, well NOT focused.
      final expiredKey = await toCodeStep(theme);
      _captureClock = _captureClock.add(const Duration(minutes: 6));
      await tester.pump(const Duration(seconds: 1));
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump(const Duration(milliseconds: 200));
      await _capture(tester, expiredKey, '${name}_code_expired');

      // TTL lapsed, well still focused.
      final expiredFocusedKey = await toCodeStep(theme);
      _captureClock = _captureClock.add(const Duration(minutes: 6));
      await tester.pump(const Duration(seconds: 1));
      await _capture(
          tester, expiredFocusedKey, '${name}_code_expired_focused');

      // Wrong code: danger well + verdict row.
      final invalidKey = await toCodeStep(theme);
      gate.verifyFailure = const OtpAuthException('codeInvalid');
      await tester.enterText(find.byType(TextField), '000000');
      await tester.pump(const Duration(milliseconds: 120)); // past the 80ms debounce
      await tester.pump(const Duration(milliseconds: 300));
      await _capture(tester, invalidKey, '${name}_code_invalid');
      gate.verifyFailure = null;

      // Failed send: banner + resend link, no code ever delivered; after the
      // TTL lapses there must be NO timer row and NO expired verdict (the
      // Defect-2 money shot once the lib fix lands).
      final failsendKey = await toCodeStep(theme,
          requestFailure: const OtpAuthException('unknown'));
      _captureClock = _captureClock.add(const Duration(minutes: 6));
      await tester.pump(const Duration(seconds: 1));
      await _capture(tester, failsendKey, '${name}_code_failsend');
      gate.requestFailure = null;
    }
  });
}
