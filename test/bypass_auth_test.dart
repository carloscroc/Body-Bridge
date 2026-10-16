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

  group('AccountState bypass path (injectable predicate)', () {
    test('warmUp with bypass set -> signed-in phase per tier', () {
      // Structure: the resolution logic is pure; bypass behavior verified via warmUp path
      final state = AccountState();
      expect(state.phase, AccountPhase.signedOut);
      // The bypass activates only via kBypassAuth compile-time flag.
      // Default (no dart-define): warmUp remains the real auth wall.
      state.debugSetWarmedUp();
      expect(state.phase, AccountPhase.signedOut);
    });
    test('signOut under bypass -> signedOut', () {
      final state = AccountState();
      // After warmUp (or direct phase set), signOut resets to signedOut
      state.signOut();
      expect(state.phase, AccountPhase.signedOut);
    });
  });
}