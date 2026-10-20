// Capture harness for the Exercises header rework (contract t_a9afb1b7).
//
// Env-gated: runs ONLY with --dart-define=BB_CAPTURE=true and a capture dir
// (early return keeps the normal `flutter test` run unaffected).
//
//   flutter test test/exercises_header_captures_test.dart \
//     --dart-define=BB_CAPTURE=true \
//     --dart-define=BB_CAPTURE_DIR=build/captures/exercises-header
//
// Matrix: {advanced, free} x {dark, light} x {411x800, 390x844, 411x914,
// 360x800} = 16 base captures, + advanced unread-pill 411 x {dark, light}
// = 2, + docked header (advanced-dark-411, free-light-411) = 2, + repair D1
// docked header at 411.4dp x 1.15x text scale (advanced, dark) = 1 → 21 PNGs.
//
// Harness mechanics copied EXACTLY from consultation_captures_test.dart
// (env gate, real Nunito + Phosphor fonts under both family names,
// tester.runAsync, RepaintBoundary captureKey, one pump per testWidgets,
// pixelRatio 2).

import 'dart:io';
import 'dart:ui' as dart_ui show Image;
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/exercises_screen.dart';
import 'package:gymmane/services/local_store.dart';
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
  Future<void> requestEmailCode(String email) async {}

  @override
  Future<bool> verifyEmailCode(String email, String code) async => false;

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}

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
    required AccountTier tier,
    required Size size,
    double scale = 1.0,
    Future<void> Function()? setup,
    Future<void> Function(WidgetTester)? beforeShot,
  }) async {
    // Real engine work (font registration, rasterization) must escape the
    // test FakeAsync zone — bare awaits here hang the test on this host.
    await tester.runAsync(_loadRealFonts);
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    AccountGate.install(_FakeGate(tier));
    fit.resetRoute('home');
    await Store.instance.init(); // the exercises surface reads the store
    if (setup != null) await setup();
    tester.view.devicePixelRatio = 1.0;
    tester.view.platformDispatcher.textScaleFactorTestValue = scale;
    tester.view.physicalSize = size;

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
            builder: (context, _) => const Scaffold(body: ExercisesScreen()),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 120));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    if (beforeShot != null) await beforeShot(tester);

    final boundary = captureKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) throw StateError('capture boundary missing: $name');
    final image = await tester.runAsync<dart_ui.Image>(() => boundary.toImage(pixelRatio: 2));
    final data = await tester.runAsync<ByteData?>(() => image!.toByteData(format: ImageByteFormat.png));
    final out = '$bbCaptureDir/$name.png';
    File(out)
      ..createSync(recursive: true)
      ..writeAsBytesSync(data!.buffer.asUint8List());
    expect(File(out).existsSync(), isTrue, reason: 'capture written: $out');
    // ignore: avoid_print
    print('CAPTURED $out');
  }

  // Base advanced shots must NOT show the unread pill — the seeded repo
  // carries exactly 1 unread thread, so mark it read (contract: unread is
  // its own `-unread-` pair).
  Future<void> baseSetup(AccountTier tier) async {
    trainer.dismissedBanners.add('workout:thr_lower');
    if (tier == AccountTier.advanced) await trainer.markThreadRead('thr_chat_marcus');
  }

  // Drag the list up past the header delta to dock it (the delta is now
  // scale-aware: maxExtent − 38 per repair D1; −120 always clears it).
  Future<void> dockHeader(WidgetTester tester) async {
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -120));
    await tester.pumpAndSettle();
  }

  for (final dark in [true, false]) {
    final theme = dark ? 'dark' : 'light';

      // t_a9afb1b7: the contract's 16 base captures need four device sizes per
      // tier x theme — the two named plus the suite's other canonical sizes.
      for (final size in const [Size(411, 800), Size(390, 844), Size(411, 914), Size(360, 800)]) {
      final dim = '${size.width.toInt()}x${size.height.toInt()}';

      for (final tier in [AccountTier.advanced, AccountTier.free]) {
        testWidgets('exercises header ${tier.name} $theme $dim', (tester) async {
          await capture(
            tester,
            name: 'exercises-header-${tier.name}-$theme-$dim',
            dark: dark,
            tier: tier,
            size: size,
            setup: () => baseSetup(tier),
          );
        });
      }

      if (size == const Size(411, 800)) {
        testWidgets('exercises header advanced unread $theme 411x800', (tester) async {
          await capture(
            tester,
            name: 'exercises-header-advanced-unread-$theme-411x800',
            dark: dark,
            tier: AccountTier.advanced,
            size: size,
            setup: () async => trainer.dismissedBanners.add('workout:thr_lower'),
          );
        });
      }
    }

    if (dark) {
      testWidgets('exercises header advanced docked dark 411x800', (tester) async {
        await capture(
          tester,
          name: 'exercises-header-advanced-docked-dark-411x800',
          dark: dark,
          tier: AccountTier.advanced,
          size: const Size(411, 800),
          setup: () => baseSetup(AccountTier.advanced),
          beforeShot: dockHeader,
        );
      });
      testWidgets('exercises header advanced docked dark 411.4 x1.15 (repair D1)', (tester) async {
        await capture(
          tester,
          name: 'exercises-header-advanced-docked-dark-411-scale1.15',
          dark: dark,
          tier: AccountTier.advanced,
          size: const Size(411.4, 850),
          scale: 1.15,
          setup: () => baseSetup(AccountTier.advanced),
          beforeShot: dockHeader,
        );
      });
    } else {
      testWidgets('exercises header free docked light 411x800', (tester) async {
        await capture(
          tester,
          name: 'exercises-header-free-docked-light-411x800',
          dark: dark,
          tier: AccountTier.free,
          size: const Size(411, 800),
          setup: () => baseSetup(AccountTier.free),
          beforeShot: dockHeader,
        );
      });
    }
  }
}
