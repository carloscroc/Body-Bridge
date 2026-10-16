import 'dart:io';
import 'dart:typed_data' show ByteData;
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart' show FontLoader;
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/catalog/trainer_catalog.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/exercises_screen.dart';
import 'package:gymmane/screens/trainer/custom_assigned_screen.dart';
import 'package:gymmane/screens/trainer/trainer_library_screen.dart';
import 'package:gymmane/screens/trainer/trainer_video_screen.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart';

/// Capture harness for the premium exercise sources feature.
///
/// Env-gated: runs ONLY with BB_CAPTURES=1. Plain `flutter test` registers
/// nothing and passes trivially. With the flag on it produces 20 PNGs —
/// 5 captures x 2 themes (dark, light) x 2 sizes (411x914, 360x800) —
/// under build/captures/trainer/. Output is gitignored; never commit it.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  if (Platform.environment['BB_CAPTURES'] != '1') return;

  const outDir = 'build/captures/trainer';
  final boundaryKey = GlobalKey();

  setUpAll(() async {
    // Real Nunito so captures match the shipped typography.
    final fontDir = Directory('assets/fonts');
    final fontFiles = fontDir.listSync().whereType<File>().where((f) => f.path.endsWith('.ttf')).toList()
      ..sort((a, b) => a.path.compareTo(b.path));
    if (fontFiles.isEmpty) {
      throw StateError('No .ttf files under assets/fonts — captures would render fallback type.');
    }
    final nunito = FontLoader('Nunito');
    for (final f in fontFiles) {
      final bytes = f.readAsBytesSync();
      nunito.addFont(Future.value(ByteData.sublistView(bytes)));
    }
    await nunito.load();

    // MaterialIcons glyphs come from the Flutter SDK cache, not the app bundle.
    final flutterRoot = Platform.environment['FLUTTER_ROOT'] ?? 'C:/Users/thebe/flutter';
    final iconsFile = File('$flutterRoot/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf');
    if (!iconsFile.existsSync()) {
      throw StateError('MaterialIcons-Regular.otf missing at ${iconsFile.path}.');
    }
    final icons = FontLoader('MaterialIcons')
      ..addFont(Future.value(ByteData.sublistView(iconsFile.readAsBytesSync())));
    await icons.load();

    // Phosphor glyphs live in the pub cache, one family per weight file.
    final phosphorWin = Directory(
      'C:/Users/thebe/AppData/Local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts',
    );
    final phosphorPosix = Directory(
      '${Platform.environment['HOME'] ?? ''}/.pub-cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts',
    );
    final phosphorDir = phosphorWin.existsSync() ? phosphorWin : phosphorPosix;
    if (!phosphorDir.existsSync()) {
      throw StateError('Phosphor fonts not found at ${phosphorWin.path} or ${phosphorPosix.path}.');
    }
    // Package font families resolve under BOTH the bare family name and the
    // packages/phosphoricons_flutter/<Family> name; load each weight file twice.
    const phosphorFamilies = <String, List<String>>{
      'Phosphor.ttf': ['PhosphorRegular', 'packages/phosphoricons_flutter/PhosphorRegular'],
      'Phosphor-Bold.ttf': ['PhosphorBold', 'packages/phosphoricons_flutter/PhosphorBold'],
      'Phosphor-Fill.ttf': ['PhosphorFill', 'packages/phosphoricons_flutter/PhosphorFill'],
      'Phosphor-Light.ttf': ['PhosphorLight', 'packages/phosphoricons_flutter/PhosphorLight'],
      'Phosphor-Thin.ttf': ['PhosphorThin', 'packages/phosphoricons_flutter/PhosphorThin'],
      'Phosphor-Duotone.ttf': ['PhosphorDuotone', 'packages/phosphoricons_flutter/PhosphorDuotone'],
    };
    final present = phosphorDir.listSync().whereType<File>().map((f) => f.uri.pathSegments.last).toSet();
    for (final entry in phosphorFamilies.entries) {
      if (!present.contains(entry.key)) {
        throw StateError('${entry.key} missing in ${phosphorDir.path}.');
      }
      final bytes = File('${phosphorDir.path}/${entry.key}').readAsBytesSync();
      for (final family in entry.value) {
        final loader = FontLoader(family)..addFont(Future.value(ByteData.sublistView(bytes)));
        await loader.load();
      }
    }
  });

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    fit.saveAndExit();
    fit.sessions.clear();
    fit.routines.clear();
    fit.onboarded = true;
    fit.resetRoute('home');
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
    fit.resetRoute('home');
  });

  Future<void> shoot(
    WidgetTester tester, {
    required ThemeData theme,
    required Size size,
    required String suffix,
    required String name,
    required AccountGate gate,
    required Widget screen,
    Future<void> Function(WidgetTester)? beforeShot,
  }) async {
    AccountGate.install(gate);
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    // The boundary wraps the whole MaterialApp so modal routes (the upsell
    // sheet lives in the navigator overlay) are inside the captured layer.
    await tester.pumpWidget(
      RepaintBoundary(
        key: boundaryKey,
        child: MaterialApp(
          theme: theme,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(
            gate: gate,
            child: Scaffold(body: screen),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await beforeShot?.call(tester);
    await tester.pumpAndSettle();

    final path = File('$outDir/$name-$suffix.png');
    await tester.runAsync(() async {
      final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(boundaryKey));
      final image = await boundary.toImage(pixelRatio: 2.0);
      final data = await image.toByteData(format: ImageByteFormat.png);
      if (data == null) throw StateError('toByteData returned null for ${path.path}');
      path.createSync(recursive: true);
      path.writeAsBytesSync(data.buffer.asUint8List());
    });
    expect(path.existsSync(), isTrue, reason: 'capture written: ${path.path}');
  }

  final themes = {'dark': AppTheme.dark, 'light': AppTheme.light};
  final sizes = {'411': const Size(411, 914), '360': const Size(360, 800)};

  for (final themeEntry in themes.entries) {
    for (final sizeEntry in sizes.entries) {
      final suffix = '${themeEntry.key}-${sizeEntry.key}';
      final theme = themeEntry.value;
      final size = sizeEntry.value;

      testWidgets('exercises-free-$suffix', (tester) async {
        await shoot(
          tester,
          theme: theme,
          size: size,
          suffix: suffix,
          name: 'exercises-free',
          gate: FakeGate(AccountTier.free),
          screen: const ExercisesScreen(),
        );
      });

      testWidgets('exercises-locked-$suffix', (tester) async {
        await shoot(
          tester,
          theme: theme,
          size: size,
          suffix: suffix,
          name: 'exercises-locked',
          gate: FakeGate(AccountTier.free),
          screen: const ExercisesScreen(),
          beforeShot: (wt) async {
            await wt.tap(find.text(t.sourceTrainer));
            await wt.pumpAndSettle();
          },
        );
      });

      testWidgets('trainer-library-$suffix', (tester) async {
        await shoot(
          tester,
          theme: theme,
          size: size,
          suffix: suffix,
          name: 'trainer-library',
          gate: FakeGate(AccountTier.advanced),
          screen: const TrainerLibraryScreen(),
        );
      });

      testWidgets('trainer-video-$suffix', (tester) async {
        await shoot(
          tester,
          theme: theme,
          size: size,
          suffix: suffix,
          name: 'trainer-video',
          gate: FakeGate(AccountTier.advanced),
          screen: TrainerVideoScreen(sessionId: kTrainerSessions.first.id),
        );
      });

      testWidgets('custom-assigned-$suffix', (tester) async {
        await shoot(
          tester,
          theme: theme,
          size: size,
          suffix: suffix,
          name: 'custom-assigned',
          gate: FakeGate(AccountTier.advanced),
          screen: const CustomAssignedScreen(),
        );
      });
    }
  }
}
