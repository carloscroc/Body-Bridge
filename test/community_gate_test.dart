// Community gate (P2): locked tiers get the upsell veil, paid tiers pass
// through. Locked UI must never surface pricing ('$') per contract.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/community/community_gate.dart';
import 'package:gymmane/services/community_repo.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/theme/app_theme.dart';

class FakeTierGate extends AccountGate {
  FakeTierGate(this.tier, {this.email});

  final AccountTier tier;
  final String? email;

  @override
  AccountSnapshot get snapshot => AccountSnapshot(tier: tier, email: email);

  @override
  bool canAccess(String feature) => tierCan(tier, feature);

  @override
  Future<void> signIn(String email, String password) async {}

  @override
  Future<void> signUp(String email, String password) async {}

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}

  @override
  Future<void> sendPasswordReset(String email) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    CommunityRepo().reset();
    setAppLanguage('en');
  });

  test('communityUnlocked mirrors paid tiers', () {
    expect(communityUnlocked(const AccountSnapshot(tier: AccountTier.signedOut)), isFalse);
    expect(communityUnlocked(const AccountSnapshot(tier: AccountTier.free)), isFalse);
    expect(communityUnlocked(const AccountSnapshot(tier: AccountTier.basic)), isTrue);
    expect(communityUnlocked(const AccountSnapshot(tier: AccountTier.advanced)), isTrue);
    expect(communityUnlocked(const AccountSnapshot(tier: AccountTier.enterprise)), isTrue);
  });

  testWidgets('locked tier shows the upsell veil, never pricing', (tester) async {
    AccountGate.install(FakeTierGate(AccountTier.free, email: 'mara@bodybridge.app'));
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityGate(child: SizedBox.expand()),
    ));
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text(t.gateTitle), findsOneWidget);
    expect(find.text(t.gateNotNow), findsOneWidget);
    expect(find.text(t.gateCta), findsOneWidget);
    expect(find.textContaining('\$'), findsNothing);
  });

  testWidgets('basic tier passes straight through to the child', (tester) async {
    AccountGate.install(FakeTierGate(AccountTier.basic, email: 'mara@bodybridge.app'));
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityGate(child: Scaffold(body: Text('UNLOCKED_FEED'))),
    ));
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text('UNLOCKED_FEED'), findsOneWidget);
    expect(find.text(t.gateTitle), findsNothing);
  });

  testWidgets('signed-out tier stays locked', (tester) async {
    AccountGate.install(SignedOutGate());
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityGate(child: SizedBox.expand()),
    ));
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text(t.gateTitle), findsOneWidget);
  });

  testWidgets('locked "Not now" goes home through the fit route, never a route pop', (tester) async {
    AccountGate.install(FakeTierGate(AccountTier.free, email: 'mara@bodybridge.app'));
    fit.goCommunity();
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityGate(child: SizedBox.expand()),
    ));
    await tester.pump(const Duration(milliseconds: 400));

    expect(fit.route, 'community');
    await tester.tap(find.text(t.gateNotNow));
    await tester.pump();

    expect(fit.route, 'home');
    expect(find.text(t.gateTitle), findsOneWidget); // the veil is in-place UI: there is no pushed route to pop
  });
}
