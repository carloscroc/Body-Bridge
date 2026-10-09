import 'package:flutter/foundation.dart';

import '../constants/billing.dart';
import '../services/entitlements_service.dart';

enum AccountTier { signedOut, free, basic, advanced, enterprise }

extension AccountTierX on AccountTier {
  bool get isSignedIn => this != AccountTier.signedOut;
}

/// Shared capability resolution for every gate: signed-in tiers mirror the
/// server's kPlanCapabilities; signed-out users have NO capabilities
/// (mandatory auth).
bool tierCan(AccountTier tier, String capability) => switch (tier) {
  AccountTier.signedOut => false,
  _ => kPlanCapabilities[tier.name]?.contains(capability) ?? false,
};

/// Pure FREE-limit guard: creating one more routine is allowed when the tier
/// carries unlimited_routines, or the free cap is not reached yet.
bool routineCreationAllowed(AccountTier tier, int routineCount) =>
    tierCan(tier, kCapUnlimitedRoutines) || routineCount < kFreeRoutineCap;

@immutable
class AccountSnapshot {
  const AccountSnapshot({required this.tier, this.email});

  final AccountTier tier;
  final String? email;

  @override
  bool operator ==(Object other) => other is AccountSnapshot && other.tier == tier && other.email == email;

  @override
  int get hashCode => Object.hash(tier, email);
}

abstract class AccountGate extends ChangeNotifier {
  AccountSnapshot get snapshot;
  bool canAccess(String feature);
  /// Sends the 6-digit email code; throws an OtpAuthException whose key
  /// selects the localized message.
  Future<void> requestEmailCode(String email);

  /// Verifies the code; false means wrong code (a value, not an exception).
  Future<bool> verifyEmailCode(String email, String code);
  Future<void> signOut();
  Future<void> deleteAccount();
  static AccountGate _instance = SignedOutGate();

  /// Installs the account implementation supplied by the C2 integration.
  static void install(AccountGate gate) => _instance = gate;

  static AccountGate get instance => _instance;
}

class SignedOutGate extends AccountGate {
  static const _snapshot = AccountSnapshot(tier: AccountTier.signedOut);

  @override
  AccountSnapshot get snapshot => _snapshot;

  @override
  bool canAccess(String feature) => false;

  @override
  Future<void> requestEmailCode(String email) =>
      Future<void>.error(StateError('auth unavailable: sign in required'));

  @override
  Future<bool> verifyEmailCode(String email, String code) =>
      Future<bool>.error(StateError('auth unavailable: sign in required'));

  @override
  Future<void> signOut() => Future<void>.value();

  @override
  Future<void> deleteAccount() => Future<void>.error(StateError('auth unavailable: sign in required'));
}
