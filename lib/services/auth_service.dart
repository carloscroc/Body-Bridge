import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import 'entitlements_service.dart';

/// Firebase Auth wrapper: lazy, guarded initialization and typed error keys.
/// Nothing touches Firebase until [AuthService.ensureInitialized] returned
/// true, so a missing config simply means the app runs in guest mode.

/// Signed-in or signed-out snapshot of the current user.
class AppAuthState {
  const AppAuthState.signedOut() : uid = null, email = null;

  const AppAuthState.signedIn({required String this.uid, this.email});

  final String? uid;
  final String? email;

  bool get isSignedIn => uid != null;
}

/// Alias for the element type of [AuthService.stateChanges].
typedef AuthStateValue = AppAuthState;

/// Sign-in failure reason as a stable message key ('wrongPassword',
/// 'networkRequested', ...) that the UI maps through AppLocalizations.
class AuthException implements Exception {
  const AuthException(this.key);

  final String key;

  @override
  String toString() => 'AuthException($key)';
}

class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  final StreamController<AppAuthState> _states = StreamController<AppAuthState>.broadcast();
  final StreamController<String?> _tokens = StreamController<String?>.broadcast();

  StreamSubscription<User?>? _sub;
  User? _user;
  AppAuthState _current = const AppAuthState.signedOut();
  Future<bool>? _initFuture;

  /// Broadcast of signed-out / signed-in states. Never errors.
  Stream<AuthStateValue> get stateChanges => _states.stream;

  /// Latest snapshot without subscribing.
  AppAuthState get current => _current;

  /// Fresh Firebase ID token on every auth change; null when signed out.
  Stream<String?> get idTokenStream => _tokens.stream;

  /// Memoized and never throws. False means no config or init failed.
  Future<bool> ensureInitialized() => _initFuture ??= _init();

  Future<void> signUp({required String email, required String password}) => _withFirebase(
    () => FirebaseAuth.instance.createUserWithEmailAndPassword(email: email, password: password),
  );

  Future<void> signIn({required String email, required String password}) =>
      _withFirebase(() => FirebaseAuth.instance.signInWithEmailAndPassword(email: email, password: password));

  Future<void> signOut() async {
    if (await ensureInitialized()) {
      try {
        await FirebaseAuth.instance.signOut();
      } catch (e, st) {
        debugPrint('Sign out failed: ${_brief(e, st)}');
      }
    }
    await EntitlementsService.instance.onSignedOut();
  }

  /// Current Firebase ID token, or null when signed out / unavailable.
  Future<String?> idToken() async {
    if (!await ensureInitialized()) return null;
    try {
      return await _user?.getIdToken();
    } catch (e, st) {
      debugPrint('Token fetch failed: ${_brief(e, st)}');
      return null;
    }
  }

  Future<bool> _init() async {
    try {
      final options = _buildOptions();
      if (options.projectId.isEmpty) return false; // no config -> guest mode
      await Firebase.initializeApp(options: options);
      final auth = FirebaseAuth.instance;
      _user = auth.currentUser;
      _current = _snapshot(_user);
      _sub = auth.userChanges().listen(_onUser, onError: (Object e) => debugPrint('Auth stream error: $e'));
      _states.add(_current);
      unawaited(_pushToken());
      return true;
    } catch (e, st) {
      debugPrint('Firebase init unavailable: ${_brief(e, st)}'); // never rethrow
      return false;
    }
  }

  Future<void> _withFirebase(Future<UserCredential> Function() op) async {
    if (!await ensureInitialized()) throw const AuthException('unknown');
    try {
      await op();
    } on FirebaseAuthException catch (e) {
      throw AuthException(_keyOf(e.code));
    } catch (e, st) {
      debugPrint('Sign in failed: ${_brief(e, st)}');
      throw const AuthException('unknown');
    }
  }

  void _onUser(User? user) {
    _user = user;
    final snapshot = _snapshot(user);
    if (snapshot.uid != _current.uid || snapshot.email != _current.email) {
      _current = snapshot;
      _states.add(snapshot);
    }
    unawaited(_pushToken());
  }

  Future<void> _pushToken() async {
    String? token;
    try {
      token = await _user?.getIdToken();
    } catch (e, st) {
      debugPrint('Token refresh failed: ${_brief(e, st)}');
    }
    _tokens.add(token);
  }

  AppAuthState _snapshot(User? user) =>
      user == null ? const AppAuthState.signedOut() : AppAuthState.signedIn(uid: user.uid, email: user.email);

  String _keyOf(String code) => switch (code) {
    'invalid-email' => 'invalidEmail',
    'wrong-password' => 'wrongPassword',
    'user-not-found' => 'userNotFound',
    'email-already-in-use' => 'emailAlreadyInUse',
    'weak-password' => 'weakPassword',
    'too-many-requests' => 'tooManyRequests',
    'network-request-failed' => 'networkRequested',
    _ => 'unknown',
  };

  /// Placeholder options from dart-defines; empty by default (guest mode).
  FirebaseOptions _buildOptions() => FirebaseOptions(
    apiKey: const String.fromEnvironment('FB_API_KEY'),
    appId: const String.fromEnvironment('FB_APP_ID'),
    messagingSenderId: const String.fromEnvironment('FB_SENDER_ID'),
    projectId: const String.fromEnvironment('FB_PROJECT_ID'),
    authDomain: const String.fromEnvironment('FB_AUTH_DOMAIN'),
    storageBucket: const String.fromEnvironment('FB_STORAGE_BUCKET'),
  );

  void dispose() {
    unawaited(_sub?.cancel());
    _states.close();
    _tokens.close();
  }

  String _brief(Object e, StackTrace st) {
    final text = '$e';
    return text.length > 200 ? '${text.substring(0, 200)}…' : text;
  }
}
