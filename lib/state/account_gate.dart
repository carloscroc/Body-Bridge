import 'package:flutter/foundation.dart';

import '../constants/billing.dart';
import '../services/entitlements_service.dart';

enum AccountTier { signedOut, free, basic, advanced, enterprise }

extension AccountTierX on AccountTier {
  bool get isSignedIn => this != AccountTier.signedOut;
}

/// Shared capability resolution for every gate: signed-in tiers mirror the
/// server's kPlanCapabilities; guests (signedOut) keep the local free-limit
/// trio so local-only usage is never gated, while cloud features (AI plan)
/// stay locked.
bool tierCan(AccountTier tier, String capability) => switch (tier) {
  AccountTier.signedOut => kGuestCapabilities.contains(capability),
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
  Future<void> signIn(String email, String password);
  Future<void> signUp(String email, String password);
  Future<void> signOut();
  Future<void> deleteAccount();

  static AccountGate _instance = GuestAccountGate();

  /// Installs the account implementation supplied by the C2 integration.
  static void install(AccountGate gate) => _instance = gate;

  static AccountGate get instance => _instance;
}

class GuestAccountGate extends AccountGate {
  static const _snapshot = AccountSnapshot(tier: AccountTier.signedOut);

  @override
  AccountSnapshot get snapshot => _snapshot;

  @override
  bool canAccess(String feature) => false;

  @override
  Future<void> signIn(String email, String password) =>
      Future<void>.error(StateError('auth unavailable in guest mode'));

  @override
  Future<void> signUp(String email, String password) =>
      Future<void>.error(StateError('auth unavailable in guest mode'));

  @override
  Future<void> signOut() => Future<void>.value();

  @override
  Future<void> deleteAccount() => Future<void>.error(StateError('auth unavailable in guest mode'));
}
