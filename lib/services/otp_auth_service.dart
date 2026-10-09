import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'convex_gateway.dart';
import 'local_store.dart';

/// Thrown by the OTP auth legs; [key] selects a localized message — raw
/// exception text never reaches the UI.
class OtpAuthException implements Exception {
  const OtpAuthException(this.key, {this.retryAfterSeconds, this.cause});

  /// invalidEmail | codeFormat | codeInvalid | codeExpired | rateLimit |
  /// network | unknown.
  final String key;

  /// Server-advertised cool-down for `rateLimit`; null when unknown — callers
  /// must never fabricate a countdown.
  final int? retryAfterSeconds;

  final Object? cause;

  @override
  String toString() => 'OtpAuthException($key'
      '${retryAfterSeconds == null ? '' : ', retryAfter: $retryAfterSeconds'})';
}

/// Persisted Convex auth pair plus the owning email; survives cold starts
/// offline.
class OtpSession {
  const OtpSession({
    required this.token,
    required this.refreshToken,
    required this.email,
  });

  final String token;
  final String refreshToken;
  final String email;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'token': token,
        'refreshToken': refreshToken,
        'email': email,
      };

  /// Tolerant: any shape problem => null (the stored note is dropped).
  static OtpSession? tryDecode(String stored) {
    try {
      final json = utf8.decode(base64Decode(stored));
      final decoded = jsonDecode(json);
      if (decoded is! Map<String, dynamic>) return null;
      final token = decoded['token'];
      final refreshToken = decoded['refreshToken'];
      final email = decoded['email'];
      if (token is! String || token.isEmpty) return null;
      if (refreshToken is! String) return null;
      if (email is! String || email.isEmpty) return null;
      return OtpSession(token: token, refreshToken: refreshToken, email: email);
    } catch (_) {
      return null;
    }
  }
}

/// Immutable auth snapshot pushed on [OtpAuthService.stateChanges]. [fresh] is
/// true ONLY for a runtime signed-out -> signed-in transition (a code
/// verified this session), never for a restored cold start.
class OtpAuthState {
  const OtpAuthState({
    required this.signedIn,
    required this.fresh,
    this.email,
  });

  final bool signedIn;
  final bool fresh;
  final String? email;
}

/// Email-OTP auth over the Convex action seam, offline-first: the session is
/// persisted locally, restored on init and refreshed lazily by the Convex
/// token fetcher. Without a CONVEX_URL (and with the default gateway) the
/// service stays dormant — auth attempts map to `unknown` and the Rust client
/// is never touched, the same guard as EntitlementsService.
class OtpAuthService {
  OtpAuthService._();
  static final OtpAuthService instance = OtpAuthService._();

  /// Test seam: every Convex touch routes through this gateway.
  static ConvexGateway gateway = RustConvexGateway();

  static const String _convexUrl = String.fromEnvironment('CONVEX_URL');
  static const String _noteKey = 'otp_session';
  static final RegExp _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
  static final RegExp _codeRe = RegExp(r'^\d{6}$');

  final StreamController<OtpAuthState> _changes =
      StreamController<OtpAuthState>.broadcast();

  OtpSession? _session;
  Future<void>? _initFuture;

  OtpSession? get current => _session;

  bool get isSignedIn => _session != null;

  String? get email => _session?.email;

  Stream<OtpAuthState> get stateChanges => _changes.stream;

  bool get _live => !(_convexUrl.isEmpty && gateway is RustConvexGateway);

  /// Restores the persisted session once; late listeners read [current]
  /// instead of waiting for a replay.
  Future<void> ensureInitialized() => _initFuture ??= _restore();

  Future<void> _restore() async {
    await Store.instance.init();
    final raw = Store.instance.note(_noteKey);
    if (raw == null || raw.isEmpty) return;
    final session = OtpSession.tryDecode(raw);
    if (session == null) {
      Store.instance.setNote(_noteKey, '');
      return;
    }
    _session = session;
    _emit();
  }

  /// Step 1: `auth:signIn {provider: resend-otp}` sends the 6-digit code.
  Future<void> requestEmailCode(String email) async {
    await ensureInitialized();
    final normalized = email.trim();
    if (!_emailRe.hasMatch(normalized)) {
      throw const OtpAuthException('invalidEmail');
    }
    if (!_live) throw const OtpAuthException('unknown');
    try {
      final raw = await gateway.action('auth:signIn', <String, dynamic>{
        'provider': 'resend-otp',
        'params': <String, dynamic>{'email': normalized},
      });
      final decoded = _tryDecode(raw);
      if (decoded == null || decoded['started'] != true) {
        throw const OtpAuthException('unknown');
      }
    } on OtpAuthException {
      rethrow;
    } catch (e) {
      throw _classify(e);
    }
  }

  /// Step 2: `auth:signIn {params: {email, code}}`. A wrong code (tokens
  /// null) returns false — a value, not an exception; `codeInvalid` stays
  /// available to callers as the documented return contract.
  Future<bool> verifyEmailCode(String email, String code) async {
    await ensureInitialized();
    final normalizedEmail = email.trim();
    final normalizedCode = code.trim();
    if (!_codeRe.hasMatch(normalizedCode)) {
      throw const OtpAuthException('codeFormat');
    }
    if (!_live) throw const OtpAuthException('unknown');
    try {
      final raw = await gateway.action('auth:signIn', <String, dynamic>{
        'params': <String, dynamic>{
          'email': normalizedEmail,
          'code': normalizedCode,
        },
      });
      final decoded = _tryDecode(raw);
      final tokens = decoded?['tokens'];
      if (tokens is! Map<String, dynamic>) return false;
      final token = tokens['token'];
      if (token is! String || token.isEmpty) return false;
      final refresh = tokens['refreshToken'];
      final wasSignedIn = isSignedIn;
      _session = OtpSession(
        token: token,
        refreshToken: refresh is String ? refresh : '',
        email: normalizedEmail,
      );
      _persist();
      _emit(fresh: !wasSignedIn);
      return true;
    } on OtpAuthException {
      rethrow;
    } catch (e) {
      throw _classify(e);
    }
  }

  /// Token-source rotation via `auth:refreshTokens`. A null/malformed answer
  /// signs out locally; a transport error keeps the current pair for one
  /// more attempt. Never throws.
  Future<bool> refreshSession() async {
    await ensureInitialized();
    final session = _session;
    if (session == null) return false;
    if (!_live) return true;
    try {
      final raw = await gateway.action('auth:refreshTokens', <String, dynamic>{
        'refreshToken': session.refreshToken,
      });
      final decoded = _tryDecode(raw);
      final tokens = decoded?['tokens'];
      final token = tokens is Map<String, dynamic> ? tokens['token'] : null;
      if (token is! String || token.isEmpty) {
        await _dropSession();
        return false;
      }
      final refresh = tokens is Map<String, dynamic> ? tokens['refreshToken'] : null;
      _session = OtpSession(
        token: token,
        refreshToken: refresh is String && refresh.isNotEmpty ? refresh : session.refreshToken,
        email: session.email,
      );
      _persist();
      return true;
    } catch (e) {
      debugPrint('OTP refresh kept the stored pair: $e');
      return false;
    }
  }

  /// Never throws; returns the current access token, if any.
  Future<String?> fetchToken() async {
    await ensureInitialized();
    return _session?.token;
  }

  /// Server `auth:signOut` best-effort, then always clear locally and emit.
  Future<void> signOut() async {
    await ensureInitialized();
    if (_live) {
      try {
        await gateway.action('auth:signOut', <String, dynamic>{});
      } catch (_) {
        // Local sign-out always proceeds.
      }
    }
    await _dropSession();
  }

  /// `users:deleteAccount` best-effort, then [signOut]. Never throws.
  Future<void> deleteAccount() async {
    await ensureInitialized();
    if (_live && isSignedIn) {
      try {
        await gateway.action('users:deleteAccount', <String, dynamic>{});
      } catch (_) {
        // The local sign-out below still runs.
      }
    }
    await signOut();
  }

  Future<void> _dropSession() async {
    _session = null;
    Store.instance.setNote(_noteKey, '');
    _emit();
  }

  void _persist() {
    final session = _session;
    if (session == null) {
      Store.instance.setNote(_noteKey, '');
      return;
    }
    Store.instance.setNote(
      _noteKey,
      base64Encode(utf8.encode(jsonEncode(session.toJson()))),
    );
  }

  void _emit({bool fresh = false}) {
    if (_changes.isClosed) return;
    _changes
        .add(OtpAuthState(signedIn: isSignedIn, fresh: fresh, email: _session?.email));
  }

  Map<String, dynamic>? _tryDecode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      return null;
    }
  }

  OtpAuthException _classify(Object error) {
    final text = '$error'.toLowerCase();
    const networkMarkers = <String>[
      'socket',
      'network',
      'unreachable',
      'connection',
      'offline',
      'timed out',
      'timeout',
      'handshake',
    ];
    if (networkMarkers.any(text.contains)) return const OtpAuthException('network');
    if (text.contains('too many') || text.contains('rate limit')) {
      return OtpAuthException(
        'rateLimit',
        retryAfterSeconds: _parseSeconds('$error'),
        cause: error,
      );
    }
    if (text.contains('expired')) return OtpAuthException('codeExpired', cause: error);
    if (text.contains('invalid code') || text.contains('wrong code')) {
      return OtpAuthException('codeInvalid', cause: error);
    }
    return OtpAuthException('unknown', cause: error);
  }

  /// Server cool-down extraction; null when the message carries no number.
  int? _parseSeconds(String text) {
    final lower = text.toLowerCase();
    final named = RegExp(r'(?:retry[-_ ]?after|try again in|again in)[^\d]{0,24}(\d{1,5})')
        .firstMatch(lower);
    if (named != null) return int.tryParse(named.group(1)!);
    final bare = RegExp(r'\b(\d{2,5})\s*(?:s\b|sec\b|second)').firstMatch(lower);
    if (bare != null) return int.tryParse(bare.group(1)!);
    return null;
  }

  void dispose() {
    unawaited(_changes.close());
  }
}

final otpAuthService = OtpAuthService.instance;
