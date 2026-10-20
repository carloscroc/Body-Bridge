import 'package:convex_flutter/convex_flutter.dart';

/// Test seam over the convex_flutter singleton: the entitlements service talks
/// to Convex only through this interface, so tests can install a fake gateway
/// instead of the hardcoded `ConvexClient.instance` (whose frb opaque handles
/// cannot be constructed in tests).
abstract class ConvexGateway {
  Future<void> initialize(ConvexConfig config);

  Future<ConvexAuthHandle> setAuthWithRefresh({
    required TokenFetcher fetchToken,
    AuthStateCallback? onAuthChange,
  });

  Future<void> clearAuth();

  /// Broadcast stream: true when the Rust side applies auth, false when
  /// cleared. The apply lands AFTER [setAuthWithRefresh] returns — that delay
  /// is the auth race window.
  Stream<bool> get authState;

  /// Synchronous snapshot of the applied auth state.
  bool get isAuthenticated;

  Future<String> query(String name, Map<String, dynamic> args);

  Future<String> mutation({required String name, required Map<String, dynamic> args});

  /// One-shot server action call (e.g. `auth:signIn`); returns the raw JSON
  /// payload.
  Future<String> action(String name, Map<String, dynamic> args);

  Future<ConvexSubscription> subscribe({
    required String name,
    required Map<String, dynamic> args,
    required void Function(String) onUpdate,
    void Function(String, String?)? onError,
  });

  /// Best-effort transport probe: issues one lightweight operation so a
  /// lazily-connecting client opens its WebSocket; never throws. Returns
  /// whether the transport reports connected afterwards. The default
  /// reports connected — fakes only override this to observe probing.
  Future<bool> probeConnection() async => true;
}

/// Auth session handle. Seam-owned wrapper type: the package's
/// AuthHandleWrapper has a private constructor, so tests fake this one.
abstract class ConvexAuthHandle {
  bool get isAuthenticated;

  void dispose();
}

/// Live subscription handle, seam-owned for the same reason.
abstract class ConvexSubscription {
  void cancel();
}

/// Production gateway: a thin delegate to `ConvexClient.instance` that wraps
/// the package's frb opaque handles in the seam wrapper types.
class RustConvexGateway implements ConvexGateway {
  static const Duration _probeOpTimeout = Duration(seconds: 5);

  @override
  Future<void> initialize(ConvexConfig config) => ConvexClient.initialize(config);

  @override
  Future<ConvexAuthHandle> setAuthWithRefresh({
    required TokenFetcher fetchToken,
    AuthStateCallback? onAuthChange,
  }) async {
    final handle = await ConvexClient.instance.setAuthWithRefresh(
      fetchToken: fetchToken,
      onAuthChange: onAuthChange,
    );
    return _RustAuthHandle(handle);
  }

  @override
  Future<void> clearAuth() => ConvexClient.instance.clearAuth();

  @override
  Stream<bool> get authState => ConvexClient.instance.authState;

  @override
  bool get isAuthenticated => ConvexClient.instance.isAuthenticated;

  @override
  Future<String> query(String name, Map<String, dynamic> args) =>
      ConvexClient.instance.query(name, args);

  @override
  Future<String> mutation({required String name, required Map<String, dynamic> args}) =>
      ConvexClient.instance.mutation(name: name, args: args);

  @override
  Future<String> action(String name, Map<String, dynamic> args) =>
      ConvexClient.instance.action(name: name, args: args);

  @override
  Future<ConvexSubscription> subscribe({
    required String name,
    required Map<String, dynamic> args,
    required void Function(String) onUpdate,
    void Function(String, String?)? onError,
  }) async {
    // The package requires a non-null onError callback; the service always
    // supplies one, the default only keeps the delegate total.
    final handle = await ConvexClient.instance.subscribe(
      name: name,
      args: args,
      onUpdate: onUpdate,
      onError: onError ?? (_, _) {},
    );
    return _RustSubscription(handle);
  }

  @override
  Future<bool> probeConnection() async {
    try {
      // Any answer — value or server error — proves the transport
      // opened; the socket-open signal lands in the cached state while
      // the op is in flight. users:getMe needs auth, so the expected
      // unauthenticated answer is an error over an OPEN socket.
      await ConvexClient.instance
          .query('users:getMe', <String, dynamic>{})
          .timeout(_probeOpTimeout);
    } catch (_) {
      // Offline / not yet initialized: fall through to the cached state.
    }
    return ConvexClient.instance.isConnected;
  }
}

class _RustAuthHandle implements ConvexAuthHandle {
  _RustAuthHandle(this._handle);

  final AuthHandleWrapper _handle;

  @override
  bool get isAuthenticated => _handle.isAuthenticated;

  @override
  void dispose() => _handle.dispose();
}

class _RustSubscription implements ConvexSubscription {
  _RustSubscription(this._handle);

  final SubscriptionHandle _handle;

  @override
  void cancel() => _handle.cancel();
}
