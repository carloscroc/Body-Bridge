import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/pro_badge.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:gymmane/widgets/upgrade_sheet.dart';
import 'package:gymmane/screens/progress_screen.dart';
import 'package:gymmane/screens/routines_screen.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'paywall_gating_test.dart' show FakeGate;

/// Premium billing UI: Pro badge, upgrade sheet, lock surfaces, per-tier
/// visibility.
///
/// All inert — no billing SDKs, no network. The CTA only swaps in the
/// coming-soon stub inside the open sheet.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    fit.saveAndExit();
    fit.sessions.clear();
    fit.routines.clear();
    fit.onboarded = true;
    AccountGate.install(FakeGate(AccountTier.signedOut));
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
  });

  Future<void> pumpHost(WidgetTester tester, Widget child) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(body: child),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> openSheet(WidgetTester tester) async {
    await pumpHost(
      tester,
      Builder(
        builder: (context) => Center(
          child: TextButton(
            onPressed: () => showUpgradeSheet(context),
            child: const Text('open'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
  }

  group('ProBadge', () {
    testWidgets('renders only on the free tier', (tester) async {
      AccountGate.install(FakeGate(AccountTier.free));
      await pumpHost(tester, const Center(child: ProBadge()));
      expect(find.text(t.proBadgeLabel), findsOneWidget);

      AccountGate.install(FakeGate(AccountTier.basic));
      await pumpHost(tester, const Center(child: ProBadge()));
      expect(find.text(t.proBadgeLabel), findsNothing);

      AccountGate.install(FakeGate(AccountTier.signedOut));
      await pumpHost(tester, const Center(child: ProBadge()));
      expect(find.text(t.proBadgeLabel), findsNothing);
    });

    testWidgets('tapping the badge opens the upgrade sheet', (tester) async {
      AccountGate.install(FakeGate(AccountTier.free));
      await pumpHost(tester, const Center(child: ProBadge()));

      await tester.tap(find.text(t.proBadgeLabel));
      await tester.pumpAndSettle();

      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
    });

    testWidgets('badge hides live when the installed gate flips tiers, no host rebuild', (tester) async {
      final free = FakeGate(AccountTier.free);
      AccountGate.install(free);

      var hostBuilds = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(
            body: Center(
              child: Builder(
                builder: (context) {
                  hostBuilds++;
                  return const ProBadge();
                },
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text(t.proBadgeLabel), findsOneWidget);
      final buildsBefore = hostBuilds;

      AccountGate.install(FakeGate(AccountTier.advanced));
      free.notifyListeners(); // the badge's own subscription re-resolves the seam
      await tester.pump();

      expect(find.text(t.proBadgeLabel), findsNothing,
          reason: 'the badge must react to the live gate notification');
      expect(hostBuilds, buildsBefore,
          reason: 'the badge updates via its own AnimatedBuilder — the host widget must not rebuild');
    });
  });

  group('UpgradeSheet', () {
    testWidgets('shows both plans with a monthly default and no stub', (tester) async {
      await openSheet(tester);

      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
      expect(find.text(t.upgradeSheetSubtitle), findsOneWidget);
      expect(find.text(t.billingMonthly), findsOneWidget);
      expect(find.text(t.billingAnnual), findsOneWidget);
      expect(find.text(titleCase(t.paywallPlanBasic)), findsOneWidget);
      expect(find.text(titleCase(t.paywallPlanAdvanced)), findsOneWidget);
      expect(find.text('\$10'), findsOneWidget);
      expect(find.text('\$20'), findsOneWidget);
      expect(find.text('/mo'), findsNWidgets(2));
      expect(find.text(t.planMostPopular.toUpperCase()), findsOneWidget);
      expect(find.text(t.upgradeCtaContinueOnWeb), findsOneWidget);
      expect(find.text(t.enterpriseContactSales), findsOneWidget);
      expect(find.text(t.checkoutComingSoon), findsNothing, reason: 'the stub stays hidden until a tap');
      expect(find.textContaining('bodybridge.fit'), findsNWidgets(2),
          reason: 'the CTA and the fine print both point at the site');
    });

    testWidgets('CTA taps swap in the coming-soon stub without closing', (tester) async {
      await openSheet(tester);

      await tester.tap(find.text(t.upgradeCtaContinueOnWeb));
      await tester.pump();

      expect(find.text(t.checkoutComingSoon), findsOneWidget);
      expect(find.text(t.upgradeSheetTitle), findsOneWidget, reason: 'the sheet must stay open');
      expect(find.text(t.upgradeCtaContinueOnWeb), findsNothing);
    });

    testWidgets('enterprise contact also lands on the stub', (tester) async {
      await openSheet(tester);

      await tester.tap(find.text(t.enterpriseContactSales));
      await tester.pump();

      expect(find.text(t.checkoutComingSoon), findsOneWidget);
      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
    });

    testWidgets('period toggle flips without leaving the sheet', (tester) async {
      await openSheet(tester);

      await tester.tap(find.text(t.billingAnnual));
      await tester.pump();

      expect(find.text(t.billingAnnual), findsOneWidget);
      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
    });

    testWidgets('fits a 320dp viewport without overflow', (tester) async {
      tester.view.physicalSize = const Size(320 * 3, 700 * 3);
      tester.view.devicePixelRatio = 3.0;
      addTearDown(tester.view.reset);

      await openSheet(tester);

      expect(tester.takeException(), isNull);
      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
    });
  });

  group('Lock surfaces', () {
    Future<void> pumpScreen(WidgetTester tester, Widget screen, AccountGate gate) async {
      await tester.pumpWidget(
        MaterialApp(
        key: UniqueKey(), // force a full remount so stale routes (open sheets) never leak across tiers
          theme: AppTheme.dark,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: PremiumGate(gate: gate, child: Scaffold(body: screen)),
        ),
      );
      await tester.pumpAndSettle();
    }

    Future<void> openTemplates(WidgetTester tester) async {
      final button = find.widgetWithText(GhostButton, t.templates);
      await tester.ensureVisible(button);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(button);
      await tester.pumpAndSettle();
    }

    testWidgets('analytics lock row shows for free and basic tiers', (tester) async {
      for (final tier in [AccountTier.free, AccountTier.basic]) {
        await pumpScreen(tester, const ProgressScreen(), FakeGate(tier));

        expect(find.text(t.lockAnalyticsTitle), findsOneWidget, reason: '$tier lacks advanced_analytics');
        expect(find.text(t.lockAnalyticsMeta), findsOneWidget);
        expect(find.text(t.lockAnalyticsUpsell), findsOneWidget);
      }
    });

    testWidgets('tapping the analytics lock row opens the upgrade sheet', (tester) async {
      await pumpScreen(tester, const ProgressScreen(), FakeGate(AccountTier.free));

      await tester.tap(find.text(t.lockAnalyticsTitle));
      await tester.pumpAndSettle();

      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
    });

    testWidgets('analytics lock row stays hidden for entitled and signed-out tiers', (tester) async {
      for (final tier in [AccountTier.signedOut, AccountTier.advanced, AccountTier.enterprise]) {
        await pumpScreen(tester, const ProgressScreen(), FakeGate(tier));

        expect(find.text(t.lockAnalyticsTitle), findsNothing,
            reason: '$tier must not see the analytics upsell');
      }
    });

    testWidgets('premium program teaser sits in the templates sheet for free tiers', (tester) async {
      await pumpScreen(tester, const RoutinesScreen(), FakeGate(AccountTier.free));
      await openTemplates(tester);

      expect(find.text(t.premiumProgramLabel.toUpperCase()), findsOneWidget);
      expect(find.text(t.premiumProgramTitle), findsOneWidget);
      expect(find.text(t.premiumProgramMeta), findsOneWidget);
      expect(find.text(t.premiumProgramUpsell), findsOneWidget);
      expect(find.text(t.unlockWithPro), findsOneWidget);
    });

    testWidgets('the unlock pill pops the templates sheet into the upgrade sheet', (tester) async {
      await pumpScreen(tester, const RoutinesScreen(), FakeGate(AccountTier.free));
      await openTemplates(tester);

      await tester.ensureVisible(find.text(t.unlockWithPro));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(find.text(t.unlockWithPro));
      await tester.pumpAndSettle();

      expect(find.text(t.upgradeSheetTitle), findsOneWidget);
      expect(find.text(t.premiumProgramTitle), findsNothing,
          reason: 'the templates sheet must be gone');
    });

    testWidgets('premium program teaser stays hidden for entitled and signed-out tiers', (tester) async {
      for (final tier in [AccountTier.signedOut, AccountTier.advanced, AccountTier.enterprise]) {
        await pumpScreen(tester, const RoutinesScreen(), FakeGate(tier));
        await openTemplates(tester);

        expect(find.text(t.premiumProgramTitle), findsNothing,
            reason: '$tier must not see the program upsell');
      }
    });
  });

}