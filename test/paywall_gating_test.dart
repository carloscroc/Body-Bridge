import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/constants/billing.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/paywall_screen.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';

/// Paywall + gating widget tests (card C4 item 4) against C3's real widgets.
///
/// The gate seam is the injectable AccountGate C3 shipped precisely for this:
/// every tier is a scripted fake — no Firebase, no Convex, no network.
/// Scriptable gate: tier + the feature matrix under test.
class FakeGate extends AccountGate {
  FakeGate(this.tier);
  final AccountTier tier;
  bool signOutCalled = false;

  @override
  AccountSnapshot get snapshot => AccountSnapshot(
      tier: tier, email: tier == AccountTier.signedOut ? null : 'a@b.c');

  @override
  bool canAccess(String feature) => switch (tier) {
        AccountTier.premium => true,
        AccountTier.normal => feature == kFeatureAiPlan,
        _ => false,
      };

  @override
  Future<void> signIn(String email, String password) async {}

  @override
  Future<void> signUp(String email, String password) async {}

  @override
  Future<void> signOut() async => signOutCalled = true;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    AccountGate.install(FakeGate(AccountTier.signedOut));
    fit.resetRoute('home');
  });

  tearDown(() {
    AccountGate.install(GuestAccountGate());
    fit.resetRoute('home');
  });

  Future<void> pumpHost(WidgetTester tester, Widget child) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: PremiumGate(
          gate: AccountGate.instance, child: Scaffold(body: child)),
    ));
    await tester.pump(const Duration(milliseconds: 300));
  }

  FeatureGate gatedFeature({VoidCallback? onTap}) => FeatureGate(
        feature: kFeatureAiPlan,
        onTap: onTap ?? () {},
        child: const Text('AI plan'),
      );

  group('FeatureGate: locked tap -> PaywallScreen', () {
    testWidgets('guest tapping the gated feature lands on the paywall',
        (tester) async {
      await pumpHost(tester, gatedFeature());

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();

      expect(fit.route, 'paywall',
          reason: 'guests must see the paywall, never the locked feature');
    });

    testWidgets('free user sees the gate too', (tester) async {
      AccountGate.install(FakeGate(AccountTier.free));
      await pumpHost(tester, gatedFeature());

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();

      expect(fit.route, 'paywall');
    });

    testWidgets('premium user passes straight through', (tester) async {
      var activated = false;
      AccountGate.install(FakeGate(AccountTier.premium));
      await pumpHost(tester, gatedFeature(onTap: () => activated = true));

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();

      expect(activated, isTrue, reason: 'premium must bypass the paywall');
      expect(fit.route, isNot('paywall'));
    });

    testWidgets('normal tier unlocks its matrix but nothing beyond',
        (tester) async {
      var activated = 0;
      AccountGate.install(FakeGate(AccountTier.normal));
      await pumpHost(
          tester,
          Column(children: [
            FeatureGate(
              feature: kFeatureAiPlan,
              onTap: () => activated++,
              child: const Text('AI plan'),
            ),
            FeatureGate(
              feature: 'another_locked_feature',
              onTap: () => activated++,
              child: const Text('Locked extra'),
            ),
          ]));

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();
      expect(activated, 1, reason: 'ai_plan is inside the normal-tier matrix');
      expect(fit.route, isNot('paywall'));

      await tester.tap(find.text('Locked extra'));
      await tester.pumpAndSettle();
      expect(fit.route, 'paywall',
          reason: 'features outside the tier matrix stay locked');
    });
  });

  group('PaywallScreen', () {
    Future<void> pumpPaywall(WidgetTester tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(body: PaywallScreen()),
      ));
      await tester.pumpAndSettle();
    }

    testWidgets('draws the price stub and the Upgrade CTA', (tester) async {
      await pumpPaywall(tester);

      expect(find.text('Unlock Premium'), findsWidgets);
      expect(find.text('$kPremiumPriceLabel / month'), findsOneWidget,
          reason: 'kPremiumPriceLabel is the single price stub');
      expect(find.text('Upgrade'), findsOneWidget);
    });

    testWidgets('Upgrade is a billed-later stub: coming-soon snackbar only',
        (tester) async {
      await pumpPaywall(tester);

      await tester.tap(find.text('Upgrade'));
      await tester.pump(const Duration(milliseconds: 400));

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Billing is coming soon.'), findsOneWidget);
    });
  });
}
