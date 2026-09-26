import 'dart:async';
import 'dart:convert';

import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter/foundation.dart';

/// Convex-backed account tier and feature flags, offline-first: without a
/// CONVEX_URL, or while offline, the service stays dormant and reports free.

enum Tier {
  free,
  normal,
  premium;

  /// Tolerant: anything unknown (including null) falls back to free.
  static Tier fromName(String? name) => switch (name) {
    'normal' => Tier.normal,
    'premium' => Tier.premium,
    _ => Tier.free,
  };
}

enum EntitlementFeature { canTrain, canTrackStats, canUsePremiumWorkouts, canUseAiCoach }

class Entitlements {
  const Entitlements({
    this.tier = Tier.free,
    this.canTrain = true,
    this.canTrackStats = true,
    this.canUsePremiumWorkouts = false,
    this.canUseAiCoach = false,
  });

  static const Entitlements free = Entitlements();

  final Tier tier;
  final bool canTrain;
  final bool canTrackStats;
  final bool canUsePremiumWorkouts;
  final bool canUseAiCoach;

  /// Maps the Convex `entitlements:get` document 1:1 — camelCase keys as the
  /// server sends them, tolerant of missing fields.
  factory Entitlements.fromJson(Map<String, dynamic> json) {
    final flags = (json['entitlements'] as Map<String, dynamic>?) ?? const {};
    return Entitlements(
      tier: Tier.fromName(json['tier'] as String?),
      canTrain: flags['canTrain'] as bool? ?? true,
      canTrackStats: flags['canTrackStats'] as bool? ?? true,
      canUsePremiumWorkouts: flags['canUsePremiumWorkouts'] as bool? ?? false,
      canUseAiCoach: flags['canUseAiCoach'] as bool? ?? false,
    );
  }

  bool can(EntitlementFeature feature) => switch (feature) {
    EntitlementFeature.canTrain => canTrain,
    EntitlementFeature.canTrackStats => canTrackStats,
    EntitlementFeature.canUsePremiumWorkouts => canUsePremiumWorkouts,
    EntitlementFeature.canUseAiCoach => canUseAiCoach,
  };
}

class EntitlementsService {
  EntitlementsService._();

  static final EntitlementsService instance = EntitlementsService._();

  /// Empty by default, which keeps the service dormant (guest/free).
  static const String _convexUrl = String.fromEnvironment('CONVEX_URL');

  final StreamController<Entitlements> _changes = StreamController<Entitlements>.broadcast();

  Entitlements _current = Entitlements.free;
  String? _latestToken;
  AuthHandleWrapper? _authHandle;
  SubscriptionHandle? _subHandle;
  StreamSubscription<String?>? _tokenSub;
  bool _ready = false;
  bool _provisioned = false;
  Future<void>? _initFuture;

  /// Cached value; free while dormant or offline.
  Entitlements get current => _current;

  Stream<Entitlements> get entitlements => _changes.stream;

  bool canAccess(EntitlementFeature feature) => _current.can(feature);

  /// Memoized and never throws. Empty CONVEX_URL means dormant free mode with
  /// no connection attempt beyond what initialize does locally.
  Future<void> init() => _initFuture ??= _init();

  /// Wires Convex auth to the AuthService token stream; a null token clears.
  Future<void> onSignedIn(Stream<String?> tokens) async {
    try {
      await init();
      if (!_ready) return;
      await _tokenSub?.cancel();
      _tokenSub = tokens.listen(
        (token) => unawaited(_onToken(token)),
        onError: (Object e, StackTrace st) => debugPrint('Token stream error: ${_brief(e, st)}'),
      );
    } catch (e, st) {
      debugPrint('Convex auth wiring failed: ${_brief(e, st)}');
    }
  }

  /// Clears Convex auth and falls back to free. Never throws.
  Future<void> onSignedOut() async {
    _latestToken = null;
    _provisioned = false;
    try {
      _authHandle?.dispose();
      _authHandle = null;
      if (_ready) await ConvexClient.instance.clearAuth();
    } catch (e, st) {
      debugPrint('Convex clearAuth failed: ${_brief(e, st)}');
    }
    _degradeToFree();
  }

  /// Manual re-read of the entitlements; never throws.
  Future<void> refresh() async {
    try {
      if (_latestToken == null) {
        _degradeToFree();
        return;
      }
      await init();
      if (!_ready) return;
      await _refresh();
    } catch (e, st) {
      debugPrint('Entitlements refresh failed: ${_brief(e, st)}');
    }
  }

  Future<void> _init() async {
    if (_convexUrl.isEmpty) return;
    try {
      await ConvexClient.initialize(
        ConvexConfig(
          deploymentUrl: _convexUrl,
          clientId: 'gymmane-flutter',
          operationTimeout: const Duration(seconds: 30),
        ),
      );
    } catch (e, st) {
      debugPrint('Convex init unavailable: ${_brief(e, st)}');
    }
    _ready = true;
  }

  Future<void> _onToken(String? token) async {
    _latestToken = token;
    try {
      if (token == null) {
        await onSignedOut();
        return;
      }
      if (_authHandle == null) {
        _authHandle = await ConvexClient.instance.setAuthWithRefresh(
          fetchToken: _fetchToken,
          onAuthChange: (authenticated) {
            if (!authenticated) _degradeToFree();
          },
        );
        _provisioned = false; // fresh sign-in: ensureUser runs once
      }
      await _refresh();
    } on TimeoutException catch (e) {
      debugPrint('Convex auth timed out: $e');
      _degradeToFree();
    } catch (e, st) {
      debugPrint('Convex auth failed: ${_brief(e, st)}');
      _degradeToFree();
    }
  }

  Future<String?> _fetchToken() async => _latestToken;

  /// ensureUser once per sign-in, then entitlements:get: an immediate read
  /// plus a live subscription. Any failure degrades to free.
  Future<void> _refresh() async {
    try {
      final client = ConvexClient.instance;
      if (!_provisioned) {
        await client.mutation(name: 'users:ensureUser', args: {});
        _provisioned = true;
      }
      _apply(await client.query('entitlements:get', {}));
      _subHandle?.cancel();
      _subHandle = await client.subscribe(
        name: 'entitlements:get',
        args: {},
        onUpdate: _apply,
        onError: (String message, String? value) => debugPrint('entitlements:get error: $message'),
      );
    } on TimeoutException catch (e) {
      debugPrint('Entitlements refresh timed out: $e');
      _degradeToFree();
    } catch (e, st) {
      debugPrint('Entitlements refresh failed: ${_brief(e, st)}');
      _degradeToFree();
    }
  }

  void _apply(String json) {
    try {
      final decoded = jsonDecode(json);
      final value = decoded is Map<String, dynamic> ? Entitlements.fromJson(decoded) : Entitlements.free;
      _current = value;
      _changes.add(value);
    } catch (e, st) {
      debugPrint('Entitlements parse failed: ${_brief(e, st)}');
    }
  }

  void _degradeToFree() {
    _current = Entitlements.free;
    _changes.add(Entitlements.free);
  }

  void dispose() {
    unawaited(_tokenSub?.cancel());
    _subHandle?.cancel();
    _changes.close();
  }

  String _brief(Object e, StackTrace st) {
    final text = '$e';
    return text.length > 200 ? '${text.substring(0, 200)}…' : text;
  }
}
