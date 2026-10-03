import 'dart:async';

import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/convex_gateway.dart';
import 'package:gymmane/services/entitlements_service.dart';

/// Regression tests for the Convex auth race: `users:ensureUser` used to be
/// sent before the Rust side applied the auth token, so the server rejected it
/// with "Unauthenticated: sign in via Firebase Auth before calling this
/// function" and the app silently degraded to local FREE.
///
/// Everything runs against a [FakeConvexGateway] through the service's
/// gateway seam — no dart-defines needed. The service is a shared singleton,
/// so each test resets it via onSignedOut() and installs a fresh fake; real
/// async with short durations (no fake_async).
const String _unauthenticated =
    'Unauthenticated: sign in via Firebase Auth before calling this function';

final EntitlementsService _service = EntitlementsService.instance;

class FakeConvexAuthHandle implements ConvexAuthHandle {
  FakeConvexAuthHandle(this._gateway);

  final FakeConvexGateway _gateway;

  @override
  bool get isAuthenticated => _gateway.isAuthenticated;

  @override
  void dispose() => _gateway.events.add('disposeAuth');
}

class FakeConvexSubscription implements ConvexSubscription {
  const FakeConvexSubscription();

  @override
  void cancel() {}
}

/// Scriptable ConvexGateway: configurable auth delay, a number of
/// Unauthenticated failures for users:ensureUser, and the JSON the
/// entitlements:get read returns. Every seam call appends to [events] in call
/// order so the tests can assert ORDER, not just outcomes.
class FakeConvexGateway implements ConvexGateway {
  FakeConvexGateway({
    this.authDelay = Duration.zero,
    this.ensureUserUnauthFailures = 0,
    this.queryResponseJson = '{"tier":"basic"}',
    this.authAppliedByEnsureUser = false,
  });

  /// How long after setAuthWithRefresh the applied signal lands.
  final Duration authDelay;

  /// The first N users:ensureUser calls throw the exact server error string.
  final int ensureUserUnauthFailures;

  /// JSON returned by query and pushed via onUpdate from subscribe.
  final String queryResponseJson;

  /// When true, the first successful ensureUser applies auth (models the
  /// post-timeout attempt being the one that finally connects).
  final bool authAppliedByEnsureUser;

  /// Ordered log of the seam calls the service makes.
  final List<String> events = <String>[];

  int ensureUserCalls = 0;

  final StreamController<bool> _authState = StreamController<bool>.broadcast();
  Timer? _authTimer;
  AuthStateCallback? _onAuthChange;
  bool _authApplied = false;

  @override
  bool get isAuthenticated => _authApplied;

  @override
  Stream<bool> get authState => _authState.stream;

  @override
  Future<void> initialize(ConvexConfig config) async {}

  @override
  Future<ConvexAuthHandle> setAuthWithRefresh({
    required TokenFetcher fetchToken,
    AuthStateCallback? onAuthChange,
  }) async {
    events.add('setAuth');
    _onAuthChange = onAuthChange;
    _authTimer = Timer(authDelay, () {
      _authApplied = true;
      events.add('authApplied');
      _authState.add(true);
      _onAuthChange?.call(true);
    });
    return FakeConvexAuthHandle(this);
  }

  @override
  Future<void> clearAuth() async {
    _authTimer?.cancel();
    _authApplied = false;
    events.add('clearAuth');
  }

  @override
  Future<String> query(String name, Map<String, dynamic> args) async {
    events.add('query:$name');
    return queryResponseJson;
  }

  @override
  Future<String> mutation({required String name, required Map<String, dynamic> args}) async {
    if (name != 'users:ensureUser') {
      throw StateError('unexpected mutation: $name');
    }
    ensureUserCalls++;
    events.add('mutation:$name');
    if (ensureUserCalls <= ensureUserUnauthFailures) {
      throw StateError(_unauthenticated);
    }
    if (authAppliedByEnsureUser) {
      _authApplied = true;
      events.add('authApplied');
      _authState.add(true);
      _onAuthChange?.call(true);
    }
    return 'null';
  }

  @override
  Future<ConvexSubscription> subscribe({
    required String name,
    required Map<String, dynamic> args,
    required void Function(String) onUpdate,
    void Function(String, String?)? onError,
  }) async {
    events.add('subscribe:$name');
    onUpdate(queryResponseJson);
    return const FakeConvexSubscription();
  }
}

/// Waits until [condition] holds (polling short real durations), then lets a
/// small margin elapse so trailing async work settles before assertions.
Future<void> _settle(bool Function() condition) async {
  final deadline = DateTime.now().add(const Duration(seconds: 5));
  while (!condition() && DateTime.now().isBefore(deadline)) {
    await Future<void>.delayed(const Duration(milliseconds: 5));
  }
  await Future<void>.delayed(const Duration(milliseconds: 100));
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    // Short real durations: the retry backoff is the one the service actually
    // delays with; authSettleTimeout is per-test below.
    EntitlementsService.unauthenticatedRetryDelay = const Duration(milliseconds: 10);
    EntitlementsService.authSettleTimeout = const Duration(seconds: 10);
  });

  tearDown(() {
    // Restore the production knobs the service ships with.
    EntitlementsService.unauthenticatedRetryDelay = const Duration(milliseconds: 800);
    EntitlementsService.authSettleTimeout = const Duration(seconds: 10);
  });

  /// Installs [fake] and resets the shared singleton: onSignedOut disposes the
  /// previous auth handle, nulls it and clears _provisioned, so the next
  /// sign-in runs setAuthWithRefresh + ensureUser again from a clean slate.
  Future<void> reinstall(FakeConvexGateway fake) async {
    EntitlementsService.gateway = fake;
    await _service.onSignedOut();
    fake.events.clear();
  }

  test('late auth ordering: ensureUser only rides the authenticated connection', () async {
    final fake = FakeConvexGateway(authDelay: const Duration(milliseconds: 150));
    await reinstall(fake);

    await _service.onSignedIn(Stream<String?>.value('token-a'));
    await _settle(() => fake.events.contains('subscribe:entitlements:get'));

    expect(
      fake.events.indexOf('authApplied'),
      lessThan(fake.events.indexOf('mutation:users:ensureUser')),
      reason: 'auth must apply before the first ensureUser is sent',
    );
    expect(
      fake.events.where((e) => e == 'mutation:users:ensureUser'),
      hasLength(1),
      reason: 'exactly one ensureUser per sign-in',
    );
    expect(_service.current.tier, Tier.basic, reason: 'the fake query tier is applied');
  });

  test('a single retry saves an Unauthenticated ensureUser', () async {
    final fake = FakeConvexGateway(
      authDelay: Duration.zero,
      ensureUserUnauthFailures: 1,
    );
    await reinstall(fake);

    await _service.onSignedIn(Stream<String?>.value('token-b'));
    await _settle(
      () => fake.ensureUserCalls >= 2 && fake.events.contains('subscribe:entitlements:get'),
    );

    expect(
      fake.ensureUserCalls,
      2,
      reason: 'exactly one bounded retry after the Unauthenticated reject',
    );
    expect(_service.current.tier, Tier.basic, reason: 'the retry succeeds: no degrade');
  });

  test('permanent Unauthenticated degrades to free and never throws', () async {
    final fake = FakeConvexGateway(
      authDelay: Duration.zero,
      ensureUserUnauthFailures: 99,
    );
    await reinstall(fake);

    // onSignedIn is awaited bare: the test completing is the never-throws proof.
    await _service.onSignedIn(Stream<String?>.value('token-c'));
    await _settle(() => fake.ensureUserCalls >= 2);

    expect(fake.ensureUserCalls, 2, reason: 'one bounded retry, then give up');
    expect(_service.current.tier, Tier.free, reason: 'unrecoverable auth failure degrades to free');
  });

  test('auth never confirmed, server accepts anyway: the post-timeout attempt recovers', () async {
    final fake = FakeConvexGateway(
      authDelay: const Duration(seconds: 30), // never lands within the test
      authAppliedByEnsureUser: true,
    );
    EntitlementsService.authSettleTimeout = const Duration(milliseconds: 150);
    await reinstall(fake);

    await _service.onSignedIn(Stream<String?>.value('token-d'));
    await _settle(() => fake.events.contains('subscribe:entitlements:get'));

    final firstMutation = fake.events.indexOf('mutation:users:ensureUser');
    expect(firstMutation, greaterThan(fake.events.indexOf('setAuth')));
    expect(
      fake.events.indexOf('authApplied'),
      greaterThan(firstMutation),
      reason: 'auth applies only via the post-timeout ensureUser attempt',
    );
    expect(fake.ensureUserCalls, 1);
    expect(
      _service.current.tier,
      Tier.basic,
      reason: 'the timeout path still attempts once, and the server accepts',
    );
  });

  test('auth never confirmed, server rejects: degrades to free, never throws', () async {
    final fake = FakeConvexGateway(
      authDelay: const Duration(seconds: 30),
      ensureUserUnauthFailures: 99,
    );
    EntitlementsService.authSettleTimeout = const Duration(milliseconds: 150);
    await reinstall(fake);

    await _service.onSignedIn(Stream<String?>.value('token-e'));
    await _settle(() => fake.ensureUserCalls >= 2);

    expect(
      fake.ensureUserCalls,
      2,
      reason: 'the post-timeout attempt still gets its single retry',
    );
    expect(_service.current.tier, Tier.free);
  });
}
