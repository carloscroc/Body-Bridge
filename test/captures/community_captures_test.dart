// Capture harness for the community screens (P2 visual review). Not part of
// the default suite: every PNG export is gated behind BB_CAPTURES so plain
// `flutter test` runs this file as a no-op.
//
//   flutter test test/captures/community_captures_test.dart --dart-define=BB_CAPTURES=1
//
// Exports 10 PNGs (device viewport + 360x800 variant) to build/community_captures/
// at pixelRatio 3: feed_dark, feed_light, feed_dark_360, gate_dark, gate_light,
// gate_dark_360, composer_dark, composer_light, post_detail_dark, post_detail_light.
import 'dart:io';
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/community/community_composer.dart';
import 'package:gymmane/screens/community/community_feed.dart';
import 'package:gymmane/screens/community/community_post_detail.dart';
import 'package:gymmane/services/community_repo.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';

import '../community_gate_test.dart';

const bool kCaptures = bool.fromEnvironment('BB_CAPTURES');

/// Physical size of the attached device via adb, else a Samsung-class
/// fallback. Without a device the harness still renders at phone proportions.
Size _devicePhysical() {
  try {
    final sizeOut = Process.runSync('adb', ['shell', 'wm', 'size']).stdout.toString();
    final densityOut = Process.runSync('adb', ['shell', 'wm', 'density']).stdout.toString();
    final sizeMatch = RegExp(r'(\d+)x(\d+)').firstMatch(sizeOut);
    final densityMatch = RegExp(r'(\d+)').firstMatch(densityOut);
    if (sizeMatch != null && densityMatch != null) {
      final w = int.parse(sizeMatch.group(1)!);
      final h = int.parse(sizeMatch.group(2)!);
      if (w >= 720 && h >= 1280) return Size(w.toDouble(), h.toDouble());
    }
  } catch (_) {}
  return const Size(1440, 3200);
}

Future<void> _capture(WidgetTester tester, GlobalKey key, String name) async {
  await tester.binding.runAsync(() async {
    final boundary = key.currentContext!.findRenderObject() as RenderRepaintBoundary;
    final image = await boundary.toImage(pixelRatio: 3.0);
    final bytes = await image.toByteData(format: ImageByteFormat.png);
    final dir = Directory('build/community_captures');
    dir.createSync(recursive: true);
    await File('${dir.path}/$name.png').writeAsBytes(bytes!.buffer.asUint8List());
    stdout.writeln('captured $name');
  });
}

Widget _host(ThemeData theme, Widget home) => MaterialApp(
      theme: theme,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: home,
    );

Future<void> _render(
  WidgetTester tester,
  Widget home,
  ThemeData theme,
  Size physical,
  String name,
) async {
  final key = GlobalKey();
  await tester.pumpWidget(RepaintBoundary(key: key, child: _host(theme, home)));
  await tester.pump(const Duration(milliseconds: 600));
  await _capture(tester, key, name);
}

void main() {
  if (!kCaptures) return;
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    // Real Nunito + phosphor assets, else every glyph renders as a solid
    // block and the review set is useless (first capture round's lesson).
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
          final bytes = File(path.substring(7)).readAsBytesSync();
          loader.addFont(Future.value(bytes.buffer.asByteData()));
        } else {
          loader.addFont(rootBundle.load(path));
        }
      }
      await loader.load();
    }
  });

  testWidgets('capture community screens', (tester) async {
    CommunityRepo().reset();
    setAppLanguage('en');
    addTearDown(tester.view.reset);

    final phys = _devicePhysical();
    const compact = Size(1080, 2400); // logical 360x800 at dpr 3

    // Feed — device viewport, both themes, plus the 360x800 dark variant.
    AccountGate.install(FakeTierGate(AccountTier.basic, email: 'mara@bodybridge.app'));
    tester.view.physicalSize = phys;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, const CommunityFeedScreen(), AppTheme.dark, phys, 'feed_dark');
    await _render(tester, const CommunityFeedScreen(), AppTheme.light, phys, 'feed_light');
    tester.view.physicalSize = compact;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, const CommunityFeedScreen(), AppTheme.dark, compact, 'feed_dark_360');

    // Gate — free tier sees the upsell veil over the blurred feed.
    AccountGate.install(FakeTierGate(AccountTier.free, email: 'mara@bodybridge.app'));
    tester.view.physicalSize = phys;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, const CommunityFeedScreen(), AppTheme.dark, phys, 'gate_dark');
    await _render(tester, const CommunityFeedScreen(), AppTheme.light, phys, 'gate_light');
    tester.view.physicalSize = compact;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, const CommunityFeedScreen(), AppTheme.dark, compact, 'gate_dark_360');

    // Composer — basic tier, progress mode with no empty photo slots.
    AccountGate.install(FakeTierGate(AccountTier.basic, email: 'mara@bodybridge.app'));
    tester.view.physicalSize = phys;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, const CommunityComposerScreen(), AppTheme.dark, phys, 'composer_dark');
    await _render(tester, const CommunityComposerScreen(), AppTheme.light, phys, 'composer_light');

    // Post detail — the seeded pull-up post with its comment thread.
    await _render(
      tester,
      const CommunityPostDetailScreen(postId: 'wk8-pullup'),
      AppTheme.dark,
      phys,
      'post_detail_dark',
    );
    await _render(
      tester,
      const CommunityPostDetailScreen(postId: 'wk8-pullup'),
      AppTheme.light,
      phys,
      'post_detail_light',
    );
  });
}
