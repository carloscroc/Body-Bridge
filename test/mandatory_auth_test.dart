import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/constants/billing.dart';
import 'package:gymmane/services/auth_service.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_state.dart';

/// Mandatory-auth contract (t_f232e72e): guest mode is abolished. A
/// signed-out user holds zero capabilities, a signed-out boot failure lands
/// on the blocking error phase (never a usable phase), and retry() re-runs
/// the warm-up from a clean slate.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('capability contract', () {
    test('tierCan(signedOut, anything) is false — no guest freebies', () {
      for (final capability in [
        kCapUnlimitedRoutines,
        kCapFullHistory,
        kCapCustomExercises,
        kCapAiPlan,
        'workout_tracking',
        'anything-else',
      ]) {
        expect(tierCan(AccountTier.signedOut, capability), isFalse,
            reason: 'mandatory auth: signed-out resolves to NO capabilities');
      }
    });

    test('kGuestCapabilities is gone from the codebase', () {
      final gateSrc = File('lib/state/account_gate.dart').readAsStringSync();
      final billingSrc = File('lib/constants/billing.dart').readAsStringSync();
      final screens = Directory('lib')
          .listSync(recursive: true)
          .whereType<File>()
          .where((f) => f.path.endsWith('.dart'))
          .map((f) => f.readAsStringSync())
          .join('\n');

      expect(gateSrc.contains('GuestAccountGate'), isFalse,
          reason: 'the guest gate class is renamed/removed');
      expect(screens.contains('kGuestCapabilities'), isFalse,
          reason: 'the guest capability grant constant is deleted');
      expect(billingSrc.contains('kGuestCapabilities'), isFalse);
      expect(screens.contains('continue as guest'), isFalse,
          reason: 'no guest entry point copy anywhere');
    });

    test('SignedOutGate denies everything and auth ops throw', () async {
      final gate = SignedOutGate();
      expect(gate.canAccess(kCapUnlimitedRoutines), isFalse);
      expect(gate.snapshot.tier, AccountTier.signedOut);
      await expectLater(gate.signUp('a@b.c', 'secret1'), throwsStateError);
      await expectLater(gate.signIn('a@b.c', 'secret1'), throwsStateError);
      await gate.signOut(); // no-op by contract
    });
  });

  group('AccountState failure contract', () {
    test('cold start is signedOut and NOT warmed up', () {
      final state = AccountState();
      addTearDown(state.dispose);
      expect(state.phase, AccountPhase.signedOut);
      expect(state.warmedUp, isFalse, reason: 'the splash gate waits for warm-up');
      expect(state.hasError, isFalse);
    });

    test('_fail while signed out lands on the blocking error phase', () {
      final state = AccountState();
      addTearDown(state.dispose);

      // AuthService.instance.current defaults to signed-out in the tester,
      // so a boot failure must surface the error phase — not a usable one.
      state.debugFail(const AuthException('networkRequested'));

      expect(state.phase, AccountPhase.error);
      expect(state.hasError, isTrue);
      expect(state.lastError, contains('networkRequested'));
    });

    test('_fail while signed in keeps the cached free tier', () {
      final state = AccountState();
      addTearDown(state.dispose);

      // Seed a signed-in auth snapshot, then fail: signed-in offline keeps
      // its tier instead of blocking.
      state.debugFail(const AuthException('networkRequested'), signedIn: true);

      expect(state.phase, AccountPhase.signedInFree,
          reason: 'signed-in + failure keeps cached tier (contract item 3)');
      expect(state.hasError, isFalse);
    });

    test('retry() clears the error and re-runs warm-up', () async {
      final state = AccountState();
      addTearDown(state.dispose);
      state.debugFail(const AuthException('networkRequested'));
      expect(state.hasError, isTrue);

      await state.retry();

      // warm-up re-ran (unconfigured Firebase in the tester: init returns
      // false, no config -> the state resolves from the signed-out current
      // snapshot, NOT the stale error).
      expect(state.hasError, isFalse, reason: 'retry resets the error surface');
      expect(state.warmedUp, isTrue, reason: 'the retry ran to completion');
      expect(state.phase, AccountPhase.signedOut,
          reason: 'with no config the user stays signed out — on the wall');
    });

    test('debugSetPhase seeds a signed-in cold start for widget tests', () {
      final state = AccountState();
      addTearDown(state.dispose);
      state.debugSetWarmedUp();
      state.debugSetPhase(AccountPhase.signedInFree);
      expect(state.phase, AccountPhase.signedInFree);
      expect(state.warmedUp, isTrue);
    });
  });
}
