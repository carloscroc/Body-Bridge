import 'package:flutter_test/flutter_test.dart';

import 'fakes/account_state_fake.dart';

/// Account-state lifecycle regression (card C4, item 3).
///
/// Runs against the contract mirror in test/fakes/ while C2 lands the real
/// controller. The transition matrix asserted here IS the FIXED contract from
/// the master card t_839752fb: {signedOut, signedInFree, signedInNormal,
/// signedInPremium}. When lib/state exposes the real controller, the mirror
/// is swapped for it in the merge validation (same assertions, real type).
void main() {
  group('account state transitions', () {
    test('cold start is signedOut (guest mode is the default)', () {
      final account = FakeAccountState();

      expect(account.status, FakeAccountStatus.signedOut);
      expect(account.signedIn, isFalse,
          reason: 'guest mode: no account, no blocking prompt');
    });

    test('signedOut -> signedInFree -> signedInNormal -> signedInPremium',
        () async {
      final account = FakeAccountState();
      final seen = <FakeAccountStatus>[];
      final sub = account.authStateChanges.listen(seen.add);

      account.status = FakeAccountStatus.signedInFree;
      expect(account.signedIn, isTrue);

      account.status = FakeAccountStatus.signedInNormal;
      expect(account.signedIn, isTrue);

      account.status = FakeAccountStatus.signedInPremium;
      expect(account.status, FakeAccountStatus.signedInPremium);

      await pumpEventQueue();
      await sub.cancel();

      expect(seen, [
        FakeAccountStatus.signedInFree,
        FakeAccountStatus.signedInNormal,
        FakeAccountStatus.signedInPremium,
      ]);
    });

    test('sign-out returns to signedOut and broadcasts it', () async {
      final account = FakeAccountState()
        ..status = FakeAccountStatus.signedInPremium;
      final seen = <FakeAccountStatus>[];
      final sub = account.authStateChanges.listen(seen.add);

      account.status = FakeAccountStatus.signedOut;
      await pumpEventQueue();
      await sub.cancel();

      expect(account.status, FakeAccountStatus.signedOut);
      expect(account.signedIn, isFalse);
      expect(seen, [FakeAccountStatus.signedOut],
          reason: 'sign-out must be observable by screens watching the stream');
    });

    test('every tier of the signed-in family reports signedIn', () {
      for (final tier in [
        FakeAccountStatus.signedInFree,
        FakeAccountStatus.signedInNormal,
        FakeAccountStatus.signedInPremium,
      ]) {
        final account = FakeAccountState()..status = tier;
        expect(account.signedIn, isTrue, reason: '$tier is a signed-in state');
      }
    });
  });
}
