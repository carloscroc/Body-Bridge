import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/auth_service.dart';
import '../services/entitlements_service.dart';

/// Signed-in phase of the account, derived from the auth state and the cached
/// entitlements tier. Screens watch [account] with AnimatedBuilder exactly as
/// they watch `fit`.

enum AccountPhase { signedOut, signedInFree, signedInBasic, signedInAdvanced, signedInEnterprise }

class AccountState extends ChangeNotifier {
  AccountPhase _phase = AccountPhase.signedOut;
  bool _warmedUp = false;
  StreamSubscription<AppAuthState>? _authSub;
  StreamSubscription<Entitlements>? _entitlementsSub;

  AccountPhase get phase => _phase;

  bool get warmedUp => _warmedUp;

  /// Lazily wires the auth + entitlements services. Called from sign-in or
  /// gating UI; safe to call any number of times and never throws.
  Future<void> warmUp() async {
    if (_warmedUp) return;
    _warmedUp = true;
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
    }
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

  /// Any failure degrades to a usable phase instead of blocking the UI.
  void _fail(Object e, StackTrace st) {
    debugPrint('Account state degraded: ${_brief(e, st)}');
    _set(_isSignedInSafe() ? AccountPhase.signedInFree : AccountPhase.signedOut);
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
}

String _brief(Object e, StackTrace st) {
  final text = '$e';
  return text.length > 200 ? '${text.substring(0, 200)}…' : text;
}

final account = AccountState();
