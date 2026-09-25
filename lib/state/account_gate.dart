import 'package:flutter/foundation.dart';

enum AccountTier { signedOut, free, normal, premium }

extension AccountTierX on AccountTier {
  bool get isSignedIn => this != AccountTier.signedOut;
}

@immutable
class AccountSnapshot {
  const AccountSnapshot({required this.tier, this.email});

  final AccountTier tier;
  final String? email;

  @override
  bool operator ==(Object other) =>
      other is AccountSnapshot && other.tier == tier && other.email == email;

  @override
  int get hashCode => Object.hash(tier, email);
}

abstract class AccountGate extends ChangeNotifier {
  AccountSnapshot get snapshot;
  bool canAccess(String feature);
  Future<void> signIn(String email, String password);
  Future<void> signUp(String email, String password);
  Future<void> signOut();

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
}
