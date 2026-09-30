import 'package:flutter_test/flutter_test.dart';

import 'fakes/account_state_fake.dart';

/// Account-state lifecycle regression (card C4, item 3), ported to the
/// 4-tier capability model.
///
/// Runs against the contract mirror in test/fakes/. The transition matrix
/// asserted here IS the fixed contract: {signedOut, signedInFree,
/// signedInBasic, signedInAdvanced, signedInEnterprise} — mirroring the
/// lib/state AccountPhase declaration (AccountState maps Tier onto it 1:1).
void main() {
  group('account state transitions', () {
    test('cold start is signedOut (guest mode is the default)', () {
      final account = FakeAccountState();

      expect(account.status, FakeAccountStatus.signedOut);
      expect(account.signedIn, isFalse, reason: 'guest mode: no account, no blocking prompt');
    });

    test('signedOut -> signedInFree -> signedInBasic -> signedInAdvanced -> signedInEnterprise', () async {
      final account = FakeAccountState();
      final seen = <FakeAccountStatus>[];
      final sub = account.authStateChanges.listen(seen.add);

      account.status = FakeAccountStatus.signedInFree;
      expect(account.signedIn, isTrue);

      account.status = FakeAccountStatus.signedInBasic;
      expect(account.signedIn, isTrue);

      account.status = FakeAccountStatus.signedInAdvanced;
      expect(account.signedIn, isTrue);

      account.status = FakeAccountStatus.signedInEnterprise;
      expect(account.status, FakeAccountStatus.signedInEnterprise);

      await pumpEventQueue();
      await sub.cancel();

      expect(seen, [
        FakeAccountStatus.signedInFree,
        FakeAccountStatus.signedInBasic,
        FakeAccountStatus.signedInAdvanced,
        FakeAccountStatus.signedInEnterprise,
      ]);
    });

    test('sign-out returns to signedOut and broadcasts it', () async {
      final account = FakeAccountState()..status = FakeAccountStatus.signedInEnterprise;
      final seen = <FakeAccountStatus>[];
      final sub = account.authStateChanges.listen(seen.add);

      account.status = FakeAccountStatus.signedOut;
      await pumpEventQueue();
      await sub.cancel();

      expect(account.status, FakeAccountStatus.signedOut);
      expect(account.signedIn, isFalse);
      expect(seen, [
        FakeAccountStatus.signedOut,
      ], reason: 'sign-out must be observable by screens watching the stream');
    });

    test('every tier of the signed-in family reports signedIn', () {
      for (final tier in [
        FakeAccountStatus.signedInFree,
        FakeAccountStatus.signedInBasic,
        FakeAccountStatus.signedInAdvanced,
        FakeAccountStatus.signedInEnterprise,
      ]) {
        final account = FakeAccountState()..status = tier;
        expect(account.signedIn, isTrue, reason: '$tier is a signed-in state');
      }
    });
  });
}
