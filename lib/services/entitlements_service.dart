import 'dart:async';
import 'dart:convert';

import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:gymmane/services/convex_gateway.dart';

/// Convex-backed account tier and capabilities, offline-first: without a
/// CONVEX_URL, or while offline, the service stays dormant and reports free.

// KEEP IN SYNC with motionletics-backend convex/lib.ts
const List<String> kTiers = <String>['free', 'basic', 'advanced', 'enterprise'];

// KEEP IN SYNC with motionletics-backend convex/lib.ts
const List<String> kCapabilities = <String>[
  'workout_tracking',
  'recent_history',
  'full_history',
  'cloud_backup',
  'cloud_sync',
  'unlimited_routines',
  'progress_charts',
  'advanced_analytics',
  'personalized_programs',
  'premium_programs',
  'premium_videos',
  'trainer_features',
  'community_browse',
  'community_post',
  'community_media_upload',
  'organization_management',
];

// KEEP IN SYNC with motionletics-backend convex/lib.ts (monotonic supersets)
const Map<String, List<String>> kPlanCapabilities = <String, List<String>>{
  'free': <String>['workout_tracking', 'recent_history'],
  'basic': <String>[
    'workout_tracking',
    'recent_history',
    'full_history',
    'cloud_backup',
    'cloud_sync',
    'unlimited_routines',
    'progress_charts',
    'community_browse',
    'community_post',
    'community_media_upload',
  ],
  'advanced': <String>[
    'workout_tracking',
    'recent_history',
    'full_history',
    'cloud_backup',
    'cloud_sync',
    'unlimited_routines',
    'progress_charts',
    'community_browse',
    'community_post',
    'community_media_upload',
    'advanced_analytics',
    'personalized_programs',
    'premium_programs',
    'premium_videos',
    'trainer_features',
  ],
  'enterprise': <String>[
    'workout_tracking',
    'recent_history',
    'full_history',
    'cloud_backup',
    'cloud_sync',
    'unlimited_routines',
    'progress_charts',
    'community_browse',
    'community_post',
    'community_media_upload',
    'advanced_analytics',
    'personalized_programs',
    'premium_programs',
    'premium_videos',
    'trainer_features',
    'organization_management',
  ],
};

enum Tier {
  free,
  basic,
  advanced,
  enterprise;

  /// Tolerant: anything unknown (including null) falls back to free.
  static Tier fromName(String? name) => switch (name) {
    'basic' => Tier.basic,
    'advanced' => Tier.advanced,
    'enterprise' => Tier.enterprise,
    _ => Tier.free,
  };
}

class Entitlements {
  const Entitlements({this.tier = Tier.free, this.capabilities = const <String>[]});

  /// Dormant / guest value: the free plan's capabilities.
  static final Entitlements free = Entitlements(capabilities: List.unmodifiable(kPlanCapabilities['free']!));

  final Tier tier;
  final List<String> capabilities;

  /// Maps the Convex `entitlements:get` document to the capability model —
  /// `{tier, capabilities: string[], cloud_retention_until}`. Tolerant of
  /// missing/old fields: when the doc carries only a tier, capabilities are
  /// derived from the kPlanCapabilities mirror.
  factory Entitlements.fromJson(Map<String, dynamic> json) {
    final tier = Tier.fromName(json['tier'] as String?);
    final raw = json['capabilities'];
    final caps = <String>[
      if (raw is List)
        for (final c in raw)
          if (c is String) c,
    ];
    return Entitlements(
      tier: tier,
      capabilities: caps.isNotEmpty ? caps : kPlanCapabilities[tier.name] ?? const <String>[],
    );
  }

  bool can(String capability) => capabilities.contains(capability);
}

class EntitlementsService {
  EntitlementsService._();

  static final EntitlementsService instance = EntitlementsService._();

  // Test seam: every Convex touch routes through this gateway so tests can
  // install a fake; production keeps the real ConvexClient singleton. This
  // closes the seam gap the existing entitlements test file documents.
  static ConvexGateway gateway = RustConvexGateway();

  // Test knobs: how long _onToken waits for the auth-applied signal, and the
  // single ensureUser retry's backoff before it gives up and degrades.
  static Duration authSettleTimeout = const Duration(seconds: 10);
  static Duration unauthenticatedRetryDelay = const Duration(milliseconds: 800);

  /// Empty by default, which keeps the service dormant (guest/free).
  static const String _convexUrl = String.fromEnvironment('CONVEX_URL');

  final StreamController<Entitlements> _changes = StreamController<Entitlements>.broadcast();

  Entitlements _current = Entitlements.free;
  String? _latestToken;
  ConvexAuthHandle? _authHandle;
  ConvexSubscription? _subHandle;
  StreamSubscription<String?>? _tokenSub;
  bool _ready = false;
  bool _provisioned = false;
  Future<void>? _initFuture;

  /// Cached value; free while dormant or offline.
  Entitlements get current => _current;

  Stream<Entitlements> get entitlements => _changes.stream;

  bool can(String capability) => _current.can(capability);

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
      if (_ready) await gateway.clearAuth();
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
    // A fake gateway (the test seam) is always safe to initialize; the real
    // bridge stays dormant without a CONVEX_URL, exactly as before.
    if (_convexUrl.isEmpty && gateway is RustConvexGateway) return;
    try {
      await gateway.initialize(
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
        _authHandle = await gateway.setAuthWithRefresh(
          fetchToken: _fetchToken,
          onAuthChange: (authenticated) {
            if (!authenticated) _degradeToFree();
          },
        );
        _provisioned = false; // fresh sign-in: ensureUser runs once
      }
      // The race: setAuthWithRefresh returns once the token fetcher is
      // REGISTERED, but the authenticated reconnect lands later — ensureUser
      // used to ride the pre-auth connection and the server rejected it with
      // Unauthenticated. Wait (bounded) for the applied signal first; on
      // timeout we still attempt one refresh, and the retry + degrade in
      // _refresh contains the failure.
      if (!gateway.isAuthenticated) {
        final applied = await gateway.authState
            .firstWhere((authenticated) => authenticated)
            .timeout(authSettleTimeout, onTimeout: () => false);
        if (!applied) {
          debugPrint('Convex auth not confirmed after '
              '${authSettleTimeout.inSeconds}s; attempting refresh anyway');
        }
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
      if (!_provisioned) {
        try {
          await gateway.mutation(name: 'users:ensureUser', args: {});
        } catch (e) {
          if (!'$e'.toLowerCase().contains('unauthenticated')) rethrow;
          // One bounded retry: auth can land just after the first attempt.
          await Future<void>.delayed(unauthenticatedRetryDelay);
          await gateway.mutation(name: 'users:ensureUser', args: {});
        }
        _provisioned = true;
      }
      _apply(await gateway.query('entitlements:get', {}));
      _subHandle?.cancel();
      _subHandle = await gateway.subscribe(
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
