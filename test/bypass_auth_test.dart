import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/dev/bypass_auth.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_state.dart';

void main() {
  group('bypass_auth pure resolution', () {
    test('tier strings map to correct AccountTier', () {
      expect(resolveBypassTier('free'), AccountTier.free);
      expect(resolveBypassTier('basic'), AccountTier.basic);
      expect(resolveBypassTier('advanced'), AccountTier.advanced);
      expect(resolveBypassTier('enterprise'), AccountTier.enterprise);
    });
    test('invalid / empty tier falls back to advanced', () {
      expect(resolveBypassTier(''), AccountTier.advanced);
      expect(resolveBypassTier('junk'), AccountTier.advanced);
      expect(resolveBypassTier('FREE'), AccountTier.free); // case-insensitive
    });
    test('compile-time constants present (kBypassAuth is bool, kBypassTier is AccountTier)', () {
      expect(kBypassAuth, isA<bool>());
      expect(kBypassTier, isA<AccountTier>());
    });
  });

  // The bypass branch of AccountState.warmUp() is compile-time gated
  // (bool.fromEnvironment), so it only executes when this suite itself runs
  // with --dart-define=BB_AUTH_BYPASS=true. Define-less runs skip the group
  // below; run it with the define to exercise the ON path.
  group('bypass ON (requires BB_AUTH_BYPASS=true)', () {
    test('warmUp -> signed-in phase per tier + gate snapshot email', () async {
      await account.warmUp();
      final gate = BypassAccountGate();
      addTearDown(gate.dispose);
      expect(gate.snapshot.tier, kBypassTier);
      expect(gate.snapshot.email, kBypassEmail);
    });
    test('signOut -> signedOut + null email; re-warmUp re-enters bypass', () async {
      await account.warmUp();
      final gate = BypassAccountGate();
      addTearDown(gate.dispose);
      var notifications = 0;
      gate.addListener(() => notifications++);
      await gate.signOut();
      expect(gate.snapshot.tier, AccountTier.signedOut);
      expect(gate.snapshot.email, isNull);
      expect(notifications, greaterThan(0), reason: 'gate must notifyListeners on signOut');
      await account.warmUp();
      expect(gate.snapshot.tier, kBypassTier);
      expect(gate.snapshot.email, kBypassEmail);
    });
  }, skip: kBypassAuth ? false : 'requires --dart-define=BB_AUTH_BYPASS=true');
}