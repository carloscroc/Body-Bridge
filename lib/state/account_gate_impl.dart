import 'dart:async';

import '../constants/billing.dart';
import '../services/auth_service.dart';
import 'account_gate.dart';
import 'account_state.dart';

/// Production [AccountGate] backed by the C2 services: the global [account]
/// (AuthService + EntitlementsService sync) is the source of truth and
/// [AuthService] performs the real sign-in/sign-up/sign-out.
///
/// Offline-first invariant: construction, [snapshot] and [canAccess] never
/// throw and never touch platform channels; every service failure degrades to
/// the guest/free view exactly like [GuestAccountGate] did at boot.
class RealAccountGate extends AccountGate {
  RealAccountGate() {
    // Composition-time wiring: once the app builds the real gate, the seam
    // default must follow so callers that bypass the inherited widget never
    // land on the guest stub.
    AccountGate.install(this);
    account.addListener(_forward);
    // Pick up a persisted/restored Firebase session at composition time;
    // warmUp is memoized, never throws and never blocks startup.
    unawaited(account.warmUp());
  }

  bool _disposed = false;

  void _forward() {
    if (_disposed) return;
    notifyListeners();
  }

  @override
  AccountSnapshot get snapshot => AccountSnapshot(
        tier: switch (account.phase) {
          AccountPhase.signedOut => AccountTier.signedOut,
          AccountPhase.signedInFree => AccountTier.free,
          AccountPhase.signedInNormal => AccountTier.normal,
          AccountPhase.signedInPremium => AccountTier.premium,
        },
        email: _email(),
      );

  String? _email() {
    try {
      return AuthService.instance.current.email;
    } catch (_) {
      return null;
    }
  }

  @override
  bool canAccess(String feature) => switch (snapshot.tier) {
        AccountTier.premium => true,
        AccountTier.normal => feature == kFeatureAiPlan,
        _ => false,
      };

  @override
  Future<void> signIn(String email, String password) async {
    await account.warmUp();
    await AuthService.instance.signIn(email: email, password: password);
  }

  @override
  Future<void> signUp(String email, String password) async {
    await account.warmUp();
    await AuthService.instance.signUp(email: email, password: password);
  }

  @override
  Future<void> signOut() async {
    await account.warmUp();
    // AuthService.signOut already clears the entitlements; the phase change
    // propagates back through the [account] listener.
    await AuthService.instance.signOut();
  }

  @override
  void dispose() {
    _disposed = true;
    account.removeListener(_forward);
    super.dispose();
  }
}
