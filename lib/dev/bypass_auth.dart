// lib/dev/bypass_auth.dart
// Auth bypass (compile-time, dart-define gated) — test the app with auth on hold

import 'dart:async';

import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/account_state.dart';

/// Compile-time flag: set via `flutter run --dart-define=BB_AUTH_BYPASS=true`
/// (only the exact string `true` enables it — `=1` leaves the bypass OFF).
const bool kBypassAuth = bool.fromEnvironment('BB_AUTH_BYPASS');

/// Raw tier string from dart-defines: `BB_AUTH_BYPASS_TIER=free|basic|advanced|enterprise`
const String _rawBypassTier = String.fromEnvironment(
  'BB_AUTH_BYPASS_TIER',
  defaultValue: 'advanced',
);

/// Placeholder email for bypass sessions
const String kBypassEmail = 'dev-bypass@bodybridge.local';

/// Pure function: maps tier string to AccountTier (advanced for invalid input)
AccountTier resolveBypassTier(String tier) {
  switch (tier.toLowerCase()) {
    case 'free':
      return AccountTier.free;
    case 'basic':
      return AccountTier.basic;
    case 'advanced':
      return AccountTier.advanced;
    case 'enterprise':
      return AccountTier.enterprise;
    default:
      return AccountTier.advanced; // fallback as per contract
  }
}

/// Bypass tier resolved at compile-time.
AccountTier get kBypassTier => resolveBypassTier(_rawBypassTier);

/// Bypass account gate that mirrors the account state without OTP/Convex calls.
class BypassAccountGate extends AccountGate {
  BypassAccountGate() {
    AccountGate.install(this);
    account.addListener(_forward);
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
      AccountPhase.signedInBasic => AccountTier.basic,
      AccountPhase.signedInAdvanced => AccountTier.advanced,
      AccountPhase.signedInEnterprise => AccountTier.enterprise,
      AccountPhase.error => AccountTier.signedOut,
    },
    email: account.phase == AccountPhase.signedOut ? null : kBypassEmail,
  );

  @override
  bool canAccess(String feature) => tierCan(snapshot.tier, feature);

  // The wall never shows under bypass (warmUp signs the account straight in),
  // so the email-code surface is unreachable here; mirror [SignedOutGate]'s
  // failure mode for safety.

  @override
  Future<void> requestEmailCode(String email) =>
      Future<void>.error(StateError('auth unavailable: bypass active'));

  @override
  Future<bool> verifyEmailCode(String email, String code) =>
      Future<bool>.error(StateError('auth unavailable: bypass active'));

  @override
  Future<void> signOut() async {
    account.signOut();
  }

  @override
  Future<void> deleteAccount() async {
    await account.warmUp();
  }

  @override
  void dispose() {
    _disposed = true;
    account.removeListener(_forward);
    super.dispose();
  }
}