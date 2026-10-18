// DIAGNOSTIC repro captures for card t_3ea946f2 (device-found defects F1/F2/F3).
// Env-gated: runs ONLY with --dart-define=BB_REPAIR=true (+ optional
// BB_REPAIR_DIR); plain `flutter test` registers nothing.
//
// Unlike trainer_captures_test.dart (bare screens), this pumps the REAL
// AppShell so shell interactions (EdgeBlur, AnimatedSwitcher, nav bar, body
// bottom padding) are in the tree exactly like on device.
import 'dart:io';
import 'dart:typed_data' show ByteData;
import 'dart:ui' as dart_ui show Image;
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart' show FontLoader;
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/app_shell.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/glass.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart' show FakeGate;

const bool bbRepair = bool.fromEnvironment('BB_REPAIR');
const String bbRepairDir =
    String.fromEnvironment('BB_REPAIR_DIR', defaultValue: 'build/captures/repair');

final StringBuffer _log = StringBuffer();

void _emit(String line) {
  // ignore: avoid_print
  print(line);
  _log.writeln(line);
}

void _diag(WidgetTester tester, String tag) {
  int count(Type t) => find.byType(t).evaluate().length;
  _emit('DIAG $tag'
      ' barriers=${count(ModalBarrier)}'
      ' backdrops=${count(BackdropFilter)}'
      ' snacks=${count(SnackBar)}'
      ' edgeBottom=${find.byWidgetPredicate((w) => w is EdgeBlur && !w.top).evaluate().length}'
      ' edgeTop=${find.byWidgetPredicate((w) => w is EdgeBlur && w.top).evaluate().length}'
      ' insetsB=${tester.view.viewInsets.bottom}'
      ' padB=${tester.view.padding.bottom}');
}

Future<void> _shoot(WidgetTester tester, GlobalKey key, String name) async {
  final boundary = key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
  if (boundary == null) throw StateError('capture boundary missing: $name');
  final image = await tester.runAsync<dart_ui.Image>(() => boundary.toImage(pixelRatio: 2));
  final data = await tester.runAsync<ByteData?>(() => image!.toByteData(format: ImageByteFormat.png));
  final path = '$bbRepairDir/$name.png';
  File(path)
    ..createSync(recursive: true)
    ..writeAsBytesSync(data!.buffer.asUint8List());
  _emit('CAPTURED $path');
}

Future<void> _loadFontFamily(String path, List<String> names) async {
  final bytes = File(path).readAsBytesSync();
  for (final name in names) {
    final loader = FontLoader(name)..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  }
}

Future<void>? _fontsFuture;

Future<void> _loadRealFonts() {
  return _fontsFuture ??= () async {
    final local = Platform.environment['LOCALAPPDATA'] ?? '';
    final phosphorFonts = '$local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts';
    for (final f in [
      ['Phosphor.ttf', 'PhosphorRegular'],
      ['Phosphor-Fill.ttf', 'PhosphorFill'],
      ['Phosphor-Bold.ttf', 'PhosphorBold'],
    ]) {
      await _loadFontFamily('$phosphorFonts/${f.first}', [
        f.last,
        'packages/phosphoricons_flutter/${f.last}',
      ]);
    }
    final root = Directory.current.path;
    for (final f in [
      'Nunito-Regular.ttf',
      'Nunito-Medium.ttf',
      'Nunito-SemiBold.ttf',
      'Nunito-Bold.ttf',
      'Nunito-ExtraBold.ttf',
      'Nunito-Black.ttf',
    ]) {
      await _loadFontFamily('$root/assets/fonts/$f', ['Nunito']);
    }
    final flutterRoot = Platform.environment['FLUTTER_ROOT'] ?? 'C:/Users/thebe/flutter';
    await _loadFontFamily('$flutterRoot/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
        ['MaterialIcons']);
  }();
}

void main() {
  if (!bbRepair) return; // env-gated early return

  TestWidgetsFlutterBinding.ensureInitialized();

  final key = GlobalKey();

  Future<void> pumpShell(
    WidgetTester tester, {
    required bool dark,
    required AccountTier tier,
    required Size size,
  }) async {
    await tester.runAsync(_loadRealFonts);
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    AccountGate.install(FakeGate(tier));
    fit.resetRoute('home');
    fit.onboarded = true;
    tester.view.devicePixelRatio = 1.0;
    tester.view.platformDispatcher.textScaleFactorTestValue = 1.0;
    tester.view.physicalSize = size;
    tester.view.viewInsets = FakeViewPadding.zero;
    tester.view.padding = FakeViewPadding.zero;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: MaterialApp(
          theme: dark ? AppTheme.dark : AppTheme.light,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(
            gate: AccountGate.instance,
            child: AppShell(),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 120));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
  }

  const size = Size(411, 914);

  // Emulates the QA device's reported bottom safe-area inset (derived from
  // Carlos's pixel measurements: composer gap 108dp = 2X + 10 -> X ~= 49).
  const deviceInset = 49.0;

  Future<void> pumpShellInset(
    WidgetTester tester, {
    required bool dark,
    required AccountTier tier,
    required Size size,
  }) async {
    await tester.runAsync(_loadRealFonts);
    SharedPreferences.setMockInitialValues({});
    trainer.resetForTest();
    AccountGate.install(FakeGate(tier));
    fit.resetRoute('home');
    fit.onboarded = true;
    tester.view.devicePixelRatio = 1.0;
    tester.view.platformDispatcher.textScaleFactorTestValue = 1.0;
    tester.view.physicalSize = size;
    tester.view.viewInsets = FakeViewPadding.zero;
    tester.view.padding = const FakeViewPadding(bottom: deviceInset);
    tester.view.viewPadding = const FakeViewPadding(bottom: deviceInset);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: MaterialApp(
          theme: dark ? AppTheme.dark : AppTheme.light,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(
            gate: AccountGate.instance,
            child: AppShell(),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 120));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
  }

  testWidgets('F1 community inbox icon tap (dark 411)', (tester) async {
    await pumpShell(tester, dark: true, tier: AccountTier.advanced, size: size);
    fit.goCommunity();
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    _diag(tester, 'f1-before');
    await _shoot(tester, key, 'f1-before');

    // The header inbox/message icon: chatCircle RoundAction with badge '2'.
    final inbox = find.ancestor(of: find.text('2'), matching: find.byType(RoundAction)).first;
    await tester.tap(inbox);
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    _diag(tester, 'f1-inbox-open');
    await _shoot(tester, key, 'f1-inbox-open');

    // Let the snackbar timer elapse and settle.
    await tester.pump(const Duration(seconds: 5));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    _diag(tester, 'f1-after-snack');
    await _shoot(tester, key, 'f1-after-snack');
  });

  testWidgets('F1b post options glass sheet open+dismiss (dark 411)', (tester) async {
    await pumpShell(tester, dark: true, tier: AccountTier.advanced, size: size);
    fit.goCommunity();
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    await tester.tap(find.byIcon(PhosphorIconsRegular.dotsThree).first);
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    _diag(tester, 'f1b-sheet-open');
    await _shoot(tester, key, 'f1b-sheet-open');

    // Dismiss via the barrier (tap far above the sheet panel).
    await tester.tapAt(const Offset(205, 80));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    _diag(tester, 'f1b-sheet-closed');
    await _shoot(tester, key, 'f1b-sheet-closed');
  });

  testWidgets('F2 workout detail CTA placement (dark 411)', (tester) async {
    await pumpShell(tester, dark: true, tier: AccountTier.advanced, size: size);
    trainer.openAssignmentId = 'asg_lower';
    fit.pushRoute('trainer-workout');
    await tester.pumpAndSettle(const Duration(milliseconds: 200));
    _diag(tester, 'f2-detail');
    final cta = tester.getRect(find.text(t.startWorkout));
    final ask = tester.getRect(find.textContaining('Marcus'));
    _emit('DIAG f2-rect cta=$cta ask=$ask screen=$size ctaBottomGap=${size.height - cta.bottom}');
    await _shoot(tester, key, 'f2-detail');
  });

  testWidgets('F3 chat composer insets open+drain (dark 411)', (tester) async {
    await pumpShell(tester, dark: true, tier: AccountTier.advanced, size: size);
    fit.pushRoute('trainer-chat');
    await tester.pumpAndSettle(const Duration(milliseconds: 200));
    _diag(tester, 'f3-rest');
    var r = tester.getRect(find.byType(TextField).first);
    _emit('DIAG f3-rest composer=$r bottomGap=${size.height - r.bottom}');
    await _shoot(tester, key, 'f3-rest');

    // Keyboard opens: insets 300.
    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    r = tester.getRect(find.byType(TextField).first);
    _emit('DIAG f3-kb-open composer=$r aboveKeyboardGap=${size.height - 300 - r.bottom}');
    await _shoot(tester, key, 'f3-kb-open');

    // Keyboard drains: insets back to 0.
    tester.view.viewInsets = FakeViewPadding.zero;
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    r = tester.getRect(find.byType(TextField).first);
    _emit('DIAG f3-kb-closed composer=$r bottomGap=${size.height - r.bottom}');
    await _shoot(tester, key, 'f3-kb-closed');

    File('$bbRepairDir/diag.txt').writeAsStringSync(_log.toString());
  });

  testWidgets('F2i workout detail CTA with device inset 49dp (dark 411)', (tester) async {
    await pumpShellInset(tester, dark: true, tier: AccountTier.advanced, size: size);
    trainer.openAssignmentId = 'asg_lower';
    fit.pushRoute('trainer-workout');
    await tester.pumpAndSettle(const Duration(milliseconds: 200));
    final cta = tester.getRect(find.text(t.startWorkout));
    final ask = tester.getRect(find.textContaining('Marcus'));
    _emit('DIAG f2i cta=$cta ask=$ask ctaBottomGap=${size.height - cta.bottom}'
        ' (device measured: 164dp)');
    await _shoot(tester, key, 'f2i-detail-inset');
  });

  testWidgets('F3i chat composer with device inset 49dp open+drain (dark 411)', (tester) async {
    await pumpShellInset(tester, dark: true, tier: AccountTier.advanced, size: size);
    fit.pushRoute('trainer-chat');
    await tester.pumpAndSettle(const Duration(milliseconds: 200));
    var r = tester.getRect(find.byType(TextField).first);
    _emit('DIAG f3i-rest composer=$r bottomGap=${size.height - r.bottom}'
        ' (device measured: 108dp)');
    await _shoot(tester, key, 'f3i-rest-inset');

    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    tester.view.padding = FakeViewPadding.zero;
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    r = tester.getRect(find.byType(TextField).first);
    _emit('DIAG f3i-kb-open composer=$r aboveKeyboardGap=${size.height - 300 - r.bottom}');
    await _shoot(tester, key, 'f3i-kb-open-inset');

    tester.view.viewInsets = FakeViewPadding.zero;
    tester.view.padding = const FakeViewPadding(bottom: deviceInset);
    tester.view.viewPadding = const FakeViewPadding(bottom: deviceInset);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    r = tester.getRect(find.byType(TextField).first);
    _emit('DIAG f3i-kb-closed composer=$r bottomGap=${size.height - r.bottom}');
    await _shoot(tester, key, 'f3i-kb-closed-inset');

    File('$bbRepairDir/diag.txt').writeAsStringSync(_log.toString());
  });

  testWidgets('F1i inbox tap with device inset 49dp (dark 411)', (tester) async {
    await pumpShellInset(tester, dark: true, tier: AccountTier.advanced, size: size);
    fit.goCommunity();
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    final inbox = find.ancestor(of: find.text('2'), matching: find.byType(RoundAction)).first;
    await tester.tap(inbox);
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    _diag(tester, 'f1i-inbox-open');
    await _shoot(tester, key, 'f1i-inbox-open-inset');
  });

  // FINAL capture matrix (card gate 5): community feed after sheet dismiss
  // (no scrim), workout detail (anchored CTA), chat composer at rest +
  // keyboard-open — dark+light x 411x914 + 360x800.
  const sizes = {'411x914': Size(411, 914), '360x800': Size(360, 800)};
  for (final themeEntry in {'dark': true, 'light': false}.entries) {
    for (final sizeEntry in sizes.entries) {
      final tag = '${themeEntry.key}-${sizeEntry.key}';
      final sz = sizeEntry.value;

      testWidgets('matrix community-after-dismiss $tag', (tester) async {
        await pumpShellInset(tester, dark: themeEntry.value, tier: AccountTier.advanced, size: sz);
        fit.goCommunity();
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
        await tester.tap(find.byIcon(PhosphorIconsRegular.dotsThree).first);
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
        await tester.tapAt(Offset(sz.width / 2, 80));
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
        _diag(tester, 'matrix-community-$tag');
        await _shoot(tester, key, 'matrix-community-after-dismiss-$tag');
      });

      testWidgets('matrix workout-detail $tag', (tester) async {
        await pumpShellInset(tester, dark: themeEntry.value, tier: AccountTier.advanced, size: sz);
        trainer.openAssignmentId = 'asg_lower';
        fit.pushRoute('trainer-workout');
        await tester.pumpAndSettle(const Duration(milliseconds: 200));
        final cta = tester.getRect(find.text(t.startWorkout));
        _emit('DIAG matrix-f2-$tag ctaBottomGap=${sz.height - cta.bottom}');
        await _shoot(tester, key, 'matrix-workout-detail-$tag');
      });

      testWidgets('matrix chat-rest+kb $tag', (tester) async {
        await pumpShellInset(tester, dark: themeEntry.value, tier: AccountTier.advanced, size: sz);
        fit.pushRoute('trainer-chat');
        await tester.pumpAndSettle(const Duration(milliseconds: 200));
        var r = tester.getRect(find.byType(TextField).first);
        _emit('DIAG matrix-f3-rest-$tag bottomGap=${sz.height - r.bottom}');
        await _shoot(tester, key, 'matrix-chat-rest-$tag');

        tester.view.viewInsets = const FakeViewPadding(bottom: 300);
        tester.view.padding = FakeViewPadding.zero;
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 300));
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
        r = tester.getRect(find.byType(TextField).first);
        _emit('DIAG matrix-f3-kb-$tag aboveKeyboardGap=${sz.height - 300 - r.bottom}');
        await _shoot(tester, key, 'matrix-chat-kb-open-$tag');

        tester.view.viewInsets = FakeViewPadding.zero;
        tester.view.padding = const FakeViewPadding(bottom: deviceInset);
        tester.view.viewPadding = const FakeViewPadding(bottom: deviceInset);
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
      });
    }
  }
}
