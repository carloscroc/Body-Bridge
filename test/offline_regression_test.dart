import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/screens/auth_wall_screen.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Mandatory-auth regression guard: with every remote dependency unconfigured
/// (no Firebase options, no CONVEX_URL) the app must cold-start onto the
/// blocking auth wall — never into app content. Guest mode is abolished: the
/// old offline-first invariant was explicitly overridden by the owner.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('mandatory auth (real app, no network configured)', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
      fit.onboarded = true;
      fit.session = null;
      fit.sessions.clear();
    });

    tearDown(() {
      fit.route = 'home';
    });

    testWidgets('cold start with no remote config lands on the auth wall', (tester) async {
      await tester.pumpWidget(const GymManeApp());
      await tester.pump(const Duration(milliseconds: 400));

      expect(tester.takeException(), isNull,
          reason: 'missing Firebase/Convex config must never crash boot');

      expect(find.byType(AuthWallScreen), findsOneWidget,
          reason: 'signed-out cold start must hit the blocking auth wall');
      expect(find.text('Body Bridge'), findsOneWidget,
          reason: 'the wall carries the Body Bridge wordmark');
    });

    testWidgets('app content is unreachable while signed out', (tester) async {
      await tester.pumpWidget(const GymManeApp());
      await tester.pump(const Duration(milliseconds: 400));

      // Even if some code path flips the route, the entry gate keeps the
      // wall on screen: there is no way into the shell signed out.
      for (final route in const ['home', 'train', 'progress', 'routines', 'tools']) {
        fit.route = route;
        await tester.pump(const Duration(milliseconds: 200));
        expect(tester.takeException(), isNull,
            reason: 'route flip must not crash on the wall');
        expect(find.byType(AuthWallScreen), findsOneWidget,
            reason: 'no navigation into "$route" while signed out');
      }
    });
  });
}
