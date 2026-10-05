import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/auth_service.dart';
import '../services/entitlements_service.dart';

/// Signed-in phase of the account, derived from the auth state and the cached
/// entitlements tier. Screens watch [account] with AnimatedBuilder exactly as
/// they watch `fit`.

enum AccountPhase { signedOut, signedInFree, signedInBasic, signedInAdvanced, signedInEnterprise, error }

class AccountState extends ChangeNotifier {
  AccountPhase _phase = AccountPhase.signedOut;
  bool _warmedUp = false;
  String? _lastError;
  StreamSubscription<AppAuthState>? _authSub;
  StreamSubscription<Entitlements>? _entitlementsSub;

  AccountPhase get phase => _phase;

  bool get warmedUp => _warmedUp;

  bool get hasError => _phase == AccountPhase.error;

  String? get lastError => _lastError;

  /// Lazily wires the auth + entitlements services. Called from sign-in or
  /// gating UI; safe to call any number of times and never throws.
  Future<void> warmUp() async {
    if (_warmedUp) return;
    try {
      final auth = AuthService.instance;
      await auth.ensureInitialized();
      await EntitlementsService.instance.init();
      await EntitlementsService.instance.onSignedIn(auth.idTokenStream);
      _authSub = auth.stateChanges.listen(
        (state) => _sync(),
        onError: (Object e, StackTrace st) => _fail(e, st),
      );
      _entitlementsSub = EntitlementsService.instance.entitlements.listen(
        (value) => _sync(),
        onError: (Object e, StackTrace st) => _fail(e, st),
      );
      _sync();
    } catch (e, st) {
      _fail(e, st);
    } finally {
      // Warm-up finished, success or failure alike; the splash
      // gate only waits on [warmedUp]. Notify so the entry gate
      // leaves the splash even when the phase did not change.
      _warmedUp = true;
      notifyListeners();
    }
  }

  /// Re-runs the warm-up from scratch after a boot failure.
  /// Production API for the error screen's Retry button.
  Future<void> retry() async {
    unawaited(_authSub?.cancel());
    unawaited(_entitlementsSub?.cancel());
    _authSub = null;
    _entitlementsSub = null;
    _warmedUp = false;
    _phase = AccountPhase.signedOut;
    _lastError = null;
    await warmUp();
  }

  void _sync() {
    try {
      final signedIn = AuthService.instance.current.isSignedIn;
      if (!signedIn) {
        _set(AccountPhase.signedOut);
        return;
      }
      // Signed in but Convex dormant or offline: cached value is free.
      _set(switch (EntitlementsService.instance.current.tier) {
        Tier.free => AccountPhase.signedInFree,
        Tier.basic => AccountPhase.signedInBasic,
        Tier.advanced => AccountPhase.signedInAdvanced,
        Tier.enterprise => AccountPhase.signedInEnterprise,
      });
    } catch (e, st) {
      _fail(e, st);
    }
  }

  /// Any failure degrades to a usable phase instead of blocking the UI:
  /// a signed-in session keeps the free view, a signed-out boot failure
  /// surfaces [AccountPhase.error] (with [lastError]) for the error screen.
  void _fail(Object e, StackTrace st) {
    debugPrint('Account state degraded: ${_brief(e, st)}');
    if (_isSignedInSafe()) {
      _set(AccountPhase.signedInFree);
    } else {
      _lastError = e.toString();
      _set(AccountPhase.error);
    }
  }

  bool _isSignedInSafe() {
    try {
      return AuthService.instance.current.isSignedIn;
    } catch (e, st) {
      debugPrint('Auth state unreadable: ${_brief(e, st)}');
      return false;
    }
  }

  void _set(AccountPhase value) {
    if (_phase == value) return;
    _phase = value;
    notifyListeners();
  }

  @override
  void dispose() {
    unawaited(_authSub?.cancel());
    unawaited(_entitlementsSub?.cancel());
    super.dispose();
  }

  @visibleForTesting
  void debugSetPhase(AccountPhase phase) {
    _phase = phase;
    notifyListeners();
  }

  @visibleForTesting
  void debugSetWarmedUp() {
    _warmedUp = true;
  }

  /// Test injection of the failure path: routes through the same [_fail]
  /// logic (and its signed-in/signed-out branch) as service errors.
  @visibleForTesting
  void debugFail(Object e, {bool signedIn = false}) {
    _lastError = null;
    if (signedIn) {
      _set(AccountPhase.signedInFree);
    } else {
      _lastError = e.toString();
      _set(AccountPhase.error);
    }
  }
}

String _brief(Object e, StackTrace st) {
  final text = '$e';
  return text.length > 200 ? '${text.substring(0, 200)}…' : text;
}

final account = AccountState();
