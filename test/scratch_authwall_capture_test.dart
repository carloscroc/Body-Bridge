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
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';

class ScriptedGate extends AccountGate {
  @override
  AccountSnapshot get snapshot => const AccountSnapshot(tier: AccountTier.signedOut);
  @override
  bool canAccess(String feature) => false;
  @override
  Future<void> requestEmailCode(String email) async {}
  @override
  Future<bool> verifyEmailCode(String email, String code) async => false;
  @override
  Future<void> signOut() async {}
  @override
  Future<void> deleteAccount() async {}
}

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
    };
    for (final entry in families.entries) {
      final loader = FontLoader(entry.key);
      for (final path in entry.value) {
        loader.addFont(rootBundle.load(path));
      }
      await loader.load();
    }
  });

  testWidgets('capture auth wall variants', (tester) async {
    AccountGate.install(ScriptedGate());
    const phys = Size(1440, 3200);
    tester.view.physicalSize = phys;
    tester.view.devicePixelRatio = 3.0;
    addTearDown(tester.view.reset);

    final emailKey = GlobalKey();
    final codeKey = GlobalKey();

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
  });
}
