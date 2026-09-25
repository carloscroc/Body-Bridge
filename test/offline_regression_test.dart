import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Offline regression guard (card C4, item 5): with every remote dependency
/// unconfigured (no Firebase options, no CONVEX_URL) the app must still
/// cold-start to a usable home screen, signed-out (guest mode), with zero
/// blocking dialogs — the offline-first invariant of master card t_839752fb.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('offline-first invariant (real app, no network configured)', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
      fit.onboarded = true;
      fit.session = null;
      fit.sessions.clear();
    });

    tearDown(() {
      fit.route = 'home';
    });

    testWidgets('cold start with no remote config lands signed-out and usable',
        (tester) async {
      await tester.pumpWidget(const GymManeApp());
      await tester.pump(const Duration(milliseconds: 400));

      expect(tester.takeException(), isNull,
          reason: 'missing Firebase/Convex config must never crash boot');

      final dialog = tester.widgetList(find.byType(Dialog)).toList();
      expect(dialog, isEmpty,
          reason: 'guest mode: no blocking auth dialog on cold start');
      final snackbar = tester.widgetList(find.byType(SnackBar)).toList();
      expect(snackbar, isEmpty,
          reason: 'no error banners either — offline is a normal state');

      for (final route in const ['home', 'train', 'progress', 'routines', 'tools']) {
        fit.route = route;
        await tester.pump(const Duration(milliseconds: 200));
        expect(tester.takeException(), isNull,
            reason: 'core route "$route" must stay usable signed-out offline');
      }
    });

    testWidgets('core flows stay interactive without any network', (tester) async {
      await tester.pumpWidget(const GymManeApp());
      await tester.pump(const Duration(milliseconds: 400));

      // Guest can reach the exercise catalog offline.
      fit.route = 'exercises';
      await tester.pump(const Duration(milliseconds: 200));
      expect(tester.takeException(), isNull);

      // The settings screen draws (where the account row will live in C3).
      fit.route = 'settings';
      await tester.pump(const Duration(milliseconds: 200));
      expect(tester.takeException(), isNull);
      expect(find.byType(MaterialApp), findsOneWidget,
          reason: 'app shell renders, not an error screen');
    });
  });
}
