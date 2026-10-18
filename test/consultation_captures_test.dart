// Capture harness for the coaching funnel surfaces (card t_aaa15e0d).
//
// Env-gated: runs ONLY with --dart-define=BB_CAPTURE=true and a capture dir
// (early return keeps the normal `flutter test` run unaffected — the
// markTestSkipped-in-testWidgets pattern does not abort, so gate in main).
//
//   flutter test test/consultation_captures_test.dart \
//     --dart-define=BB_CAPTURE=true \
//     --dart-define=BB_CAPTURE_DIR=C:/path/to/captures
//
// Font rule (lesson from t_dbd7d0d1 F6): real TTFs must be registered — the
// app Nunito faces AND Phosphor, each under BOTH the bare family name and
// the `packages/phosphoricons_flutter/<Family>` name — otherwise glyphs
// render as tofu and text overflows ~2x under the default Ahem font.
//
// One capture per testWidgets: re-pumping a second MaterialApp inside a
// single test hung on this host (Windows), so every surface×theme is its
// own test that pumps exactly once. All surfaces at 360×800 per the card
// acceptance matrix.

import 'dart:io';
import 'dart:ui' as dart_ui show Image;
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/coaching_intro_screen.dart';
import 'package:gymmane/screens/coaching_welcome_screen.dart';
import 'package:gymmane/screens/consultation_confirmation_screen.dart';
import 'package:gymmane/screens/consultation_request_screen.dart';
import 'package:gymmane/services/trainer_data.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:shared_preferences/shared_preferences.dart';

const bool bbCapture = bool.fromEnvironment('BB_CAPTURE');
const String bbCaptureDir = String.fromEnvironment('BB_CAPTURE_DIR');

class _FakeGate extends AccountGate {
  _FakeGate(this.tier);
  final AccountTier tier;

  @override
  AccountSnapshot get snapshot =>
      AccountSnapshot(tier: tier, email: tier == AccountTier.signedOut ? null : 'dev@bodybridge.local');

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

Future<void>? _fontsFuture;

Future<void> _loadFontFamily(String path, List<String> names) async {
  final bytes = File(path).readAsBytesSync();
  for (final name in names) {
    final loader = FontLoader(name)..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  }
}

Future<void> _loadRealFonts() {
  return _fontsFuture ??= () async {
    final root = Directory.current.path;
    final local = Platform.environment['LOCALAPPDATA'] ?? '';
    final phosphorFonts = '$local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts';

    for (final f in [
      'Nunito-Regular.ttf',
      'Nunito-Italic.ttf',
      'Nunito-Medium.ttf',
      'Nunito-SemiBold.ttf',
      'Nunito-SemiBoldItalic.ttf',
      'Nunito-Bold.ttf',
      'Nunito-ExtraBold.ttf',
      'Nunito-Black.ttf',
    ]) {
      await _loadFontFamily('$root/assets/fonts/$f', ['Nunito']);
    }

    // Phosphor under BOTH names (bare + package-qualified) — missing either
    // is exactly what produced tofu in t_dbd7d0d1 F6.
    for (final family in [
      ['Phosphor.ttf', 'PhosphorRegular'],
      ['Phosphor-Fill.ttf', 'PhosphorFill'],
      ['Phosphor-Bold.ttf', 'PhosphorBold'],
    ]) {
      await _loadFontFamily('$phosphorFonts/${family.first}', [
        family.last,
        'packages/phosphoricons_flutter/${family.last}',
      ]);
    }
  }();
}

void main() {
  if (!bbCapture || bbCaptureDir.isEmpty) return; // env-gated early return

  TestWidgetsFlutterBinding.ensureInitialized();

  final captureKey = GlobalKey();

  Future<void> capture(
    WidgetTester tester, {
    required String name,
    required bool dark,
    void Function()? setup,
    required Widget body,
  }) async {
    // Real engine work (font registration, rasterization) must escape the
    // test FakeAsync zone — bare awaits here hang the test on this host.
    await tester.runAsync(_loadRealFonts);
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    AccountGate.install(_FakeGate(AccountTier.advanced));
    fit.resetRoute('home');
    setup?.call();
    tester.view.devicePixelRatio = 1.0;
    tester.view.platformDispatcher.textScaleFactorTestValue = 1.0;
    tester.view.physicalSize = const Size(360, 800);

    await tester.pumpWidget(
      MaterialApp(
        theme: dark ? AppTheme.dark : AppTheme.light,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        builder: (context, child) => RepaintBoundary(key: captureKey, child: child),
        home: PremiumGate(
          gate: AccountGate.instance,
          child: AnimatedBuilder(
            animation: fit,
            builder: (context, _) => Scaffold(body: body),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 120));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    final boundary = captureKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) throw StateError('capture boundary missing: $name');
    final image = await tester.runAsync<dart_ui.Image>(() => boundary.toImage(pixelRatio: 2));
    final data = await tester.runAsync<ByteData?>(() => image!.toByteData(format: ImageByteFormat.png));
    final out = '$bbCaptureDir/$name.png';
    File(out)
      ..createSync(recursive: true)
      ..writeAsBytesSync(data!.buffer.asUint8List());
    // ignore: avoid_print
    print('CAPTURED $out');
  }

  // The on-file request used for the confirmation capture — stable ids so
  // the summary rows exercise all label mappings, notes non-empty.
  const onFile = TrainerConsultationRequest(
    goal: 'strength',
    experience: 'returning',
    timeWindow: 'morning',
    notes: 'Knees complain on deep squats.',
    createdAt: 1760000000000,
  );

  for (final dark in [true, false]) {
    final theme = dark ? 'dark' : 'light';

    testWidgets('consult intro $theme', (tester) async {
      await capture(
        tester,
        name: 'consult-intro-$theme-360x800',
        dark: dark,
        body: const CoachingIntroScreen(),
      );
    });

    testWidgets('consult request $theme', (tester) async {
      await capture(
        tester,
        name: 'consult-request-$theme-360x800',
        dark: dark,
        body: const ConsultationRequestScreen(),
      );
    });

    testWidgets('consult confirmation $theme', (tester) async {
      await capture(
        tester,
        name: 'consult-confirmation-$theme-360x800',
        dark: dark,
        setup: () => trainer.consultation = onFile,
        body: const ConsultationConfirmationScreen(),
      );
    });

    testWidgets('consult welcome $theme', (tester) async {
      await capture(
        tester,
        name: 'consult-welcome-$theme-360x800',
        dark: dark,
        setup: () => trainer.consultation = onFile,
        body: const CoachingWelcomeScreen(),
      );
    });
  }
}
