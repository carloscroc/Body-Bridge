import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/constants/billing.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/paywall_screen.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';

/// Paywall + gating widget tests, ported to the 4-tier capability model.
///
/// The gate seam is the injectable AccountGate: every tier is a scripted
/// fake — no Firebase, no Convex, no network. The fake resolves capabilities
/// through the shared tierCan mirror, exactly like RealAccountGate does.
class FakeGate extends AccountGate {
  FakeGate(this.tier);
  final AccountTier tier;
  bool signOutCalled = false;

  @override
  AccountSnapshot get snapshot =>
      AccountSnapshot(tier: tier, email: tier == AccountTier.signedOut ? null : 'a@b.c');

  @override
  bool canAccess(String feature) => tierCan(tier, feature);

  @override
  Future<void> signIn(String email, String password) async {}

  @override
  Future<void> signUp(String email, String password) async {}

  @override
  Future<void> signOut() async => signOutCalled = true;

  @override
  Future<void> deleteAccount() async {}
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
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: AccountGate.instance,
          child: Scaffold(body: child),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  }

  FeatureGate gatedFeature({VoidCallback? onTap}) =>
      FeatureGate(feature: kCapAiPlan, onTap: onTap ?? () {}, child: const Text('AI plan'));

  group('FeatureGate: locked tap -> PaywallScreen', () {
    testWidgets('guest tapping the gated feature lands on the paywall', (tester) async {
      await pumpHost(tester, gatedFeature());

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();

      expect(fit.route, 'paywall', reason: 'guests must see the paywall, never the locked feature');
    });

    testWidgets('free user sees the gate too', (tester) async {
      AccountGate.install(FakeGate(AccountTier.free));
      await pumpHost(tester, gatedFeature());

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();

      expect(fit.route, 'paywall');
    });

    testWidgets('basic unlocks its ladder but not the advanced features', (tester) async {
      var activated = 0;
      AccountGate.install(FakeGate(AccountTier.basic));
      await pumpHost(
        tester,
        Column(
          children: [
            FeatureGate(
              feature: kCapUnlimitedRoutines,
              onTap: () => activated++,
              child: const Text('Routines'),
            ),
            FeatureGate(feature: kCapAiPlan, onTap: () => activated++, child: const Text('AI plan')),
          ],
        ),
      );

      await tester.tap(find.text('Routines'));
      await tester.pumpAndSettle();
      expect(activated, 1, reason: 'unlimited_routines is inside the basic plan matrix');
      expect(fit.route, isNot('paywall'));

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();
      expect(fit.route, 'paywall', reason: 'personalized_programs stays locked below advanced');
    });

    testWidgets('advanced user passes the AI plan through', (tester) async {
      var activated = false;
      AccountGate.install(FakeGate(AccountTier.advanced));
      await pumpHost(tester, gatedFeature(onTap: () => activated = true));

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();

      expect(activated, isTrue, reason: 'advanced must bypass the paywall');
      expect(fit.route, isNot('paywall'));
    });

    testWidgets('enterprise passes everything, organization_management included', (tester) async {
      var activated = 0;
      AccountGate.install(FakeGate(AccountTier.enterprise));
      await pumpHost(
        tester,
        Column(
          children: [
            FeatureGate(feature: kCapAiPlan, onTap: () => activated++, child: const Text('AI plan')),
            FeatureGate(
              feature: 'organization_management',
              onTap: () => activated++,
              child: const Text('Org console'),
            ),
          ],
        ),
      );

      await tester.tap(find.text('AI plan'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Org console'));
      await tester.pumpAndSettle();

      expect(activated, 2, reason: 'enterprise is the full superset');
      expect(fit.route, isNot('paywall'));
    });

    testWidgets('signed-in free hits the FREE limits: trio gates route to paywall', (tester) async {
      var activated = 0;
      AccountGate.install(FakeGate(AccountTier.free));
      await pumpHost(
        tester,
        Column(
          children: [
            FeatureGate(
              feature: kCapUnlimitedRoutines,
              onTap: () => activated++,
              child: const Text('Routines'),
            ),
            FeatureGate(feature: kCapFullHistory, onTap: () => activated++, child: const Text('History')),
            FeatureGate(feature: kCapCustomExercises, onTap: () => activated++, child: const Text('Custom')),
          ],
        ),
      );

      // On free the capabilities are absent from the plan, so the gates
      // route to the paywall: zero activations.
      await tester.tap(find.text('Routines'));
      await tester.pumpAndSettle();
      expect(fit.route, 'paywall', reason: 'free lacks unlimited_routines -> paywall');
      expect(activated, 0);
    });
  });

  group('PaywallScreen', () {
    Future<void> pumpPaywall(WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(body: PaywallScreen()),
        ),
      );
      await tester.pumpAndSettle();
    }

    testWidgets('renders one card per plan tier with both period options', (tester) async {
      await pumpPaywall(tester);

      expect(find.text(t.paywallTitle), findsWidgets);
      expect(find.text(t.paywallPlanBasic), findsOneWidget);
      expect(find.text(t.paywallPlanAdvanced), findsOneWidget);
      expect(find.text('\$2.99'), findsOneWidget);
      expect(find.text('\$24.99'), findsOneWidget);
      expect(find.text('\$5.99'), findsOneWidget);
      expect(find.text('\$49.99'), findsOneWidget);
      expect(find.byType(PrimaryButton), findsNothing, reason: 'the old single-price stub is gone');
    });

    testWidgets('every CTA is a billed-later stub: coming-soon snackbar only', (tester) async {
      await pumpPaywall(tester);

      expect(
        find.text(t.paywallCtaUpgrade),
        findsNWidgets(4),
        reason: 'monthly + yearly for BASIC and ADVANCED',
      );

      await tester.tap(find.text(t.paywallCtaUpgrade).first);
      await tester.pump(const Duration(milliseconds: 400));

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(t.billingComingSoon), findsOneWidget);
    });

    test('plan config stays provider-agnostic placeholders', () {
      expect(kPaywallPlans.length, 4);
      expect({for (final p in kPaywallPlans) p.tier}, {'basic', 'advanced'});
      expect({for (final p in kPaywallPlans) p.period}, {'monthly', 'yearly'});
      for (final p in kPaywallPlans) {
        expect(
          p.priceLabel.startsWith('\$'),
          isTrue,
          reason: 'placeholder prices only, no store/product ids',
        );
      }
    });
  });
}
