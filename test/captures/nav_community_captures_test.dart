// Capture harness for the bottom nav on the community tab (cycle-2 repair
// visual evidence): nav persistence + free-tier padlock badge. Not part of
// the default suite: every PNG export is gated behind BB_CAPTURES so plain
// `flutter test` runs this file as a no-op.
//
//   flutter test test/captures/nav_community_captures_test.dart --dart-define=BB_CAPTURES=true
//
// Exports 4 PNGs (device viewport + 360x800 variant) to build/community_captures/
// at pixelRatio 3: nav_community_dark, nav_community_light, nav_community_dark_360,
// nav_community_light_360.
import 'dart:io';
import 'dart:ui' show ImageByteFormat;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/services/community_repo.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/services/progress_reminder.dart';
import 'package:gymmane/state/account_state.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

/// Renders the FULL app so the real bottom nav bar is in frame, seeded like
/// shell_transition_test's setUp, then lands on the community tab. Free tier
/// (default): the padlock badge must be visible in every frame.
Future<void> _render(
  WidgetTester tester,
  GlobalKey key, {
  required bool dark,
  required String name,
}) async {
  fit.dark = dark;
  fit.resetRoute('home');
  await tester.pumpWidget(RepaintBoundary(key: key, child: const GymManeApp()));
  await tester.pump(const Duration(milliseconds: 600));
  fit.goCommunity();
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

  testWidgets('capture bottom nav on community', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    ProgressReminder.instance.enabled = false;
    setAppLanguage('en');
    CommunityRepo().reset();
    fit.onboarded = true;
    fit.session = null;
    fit.sessions.clear();
    fit.resetRoute('home');
    account.debugSetWarmedUp();
    account.debugSetPhase(AccountPhase.signedInFree); // free tier: badge on
    addTearDown(tester.view.reset);

    final phys = _devicePhysical();
    const compact = Size(1080, 2400); // logical 360x800 at dpr 3

    tester.view.physicalSize = phys;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, GlobalKey(), dark: true, name: 'nav_community_dark');
    await _render(tester, GlobalKey(), dark: false, name: 'nav_community_light');
    tester.view.physicalSize = compact;
    tester.view.devicePixelRatio = 3.0;
    await _render(tester, GlobalKey(), dark: true, name: 'nav_community_dark_360');
    await _render(tester, GlobalKey(), dark: false, name: 'nav_community_light_360');
  });
}
