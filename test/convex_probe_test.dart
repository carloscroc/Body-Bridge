import 'dart:async';

import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/convex_gateway.dart';
import 'package:gymmane/services/entitlements_service.dart';

/// Regression tests for the proactive Convex connect (F2): the native
/// client opens its WebSocket lazily on the FIRST operation only, so a
/// cold start used to sit in "connecting" until a user poke triggered an
/// op. init() must drive gateway.probeConnection() attempts with backoff
/// until connected, bounded by the attempt budget, without blocking its
/// callers.
///
/// Everything runs against a [ProbeCountingGateway] through the shared
/// gateway seam — no dart-defines needed. In the test environment
/// CONVEX_URL is empty, so these tests are non-dormant ONLY because a
/// fake gateway is installed. Real async with short durations (no
/// fake_async); the service singleton is per-test-file isolate, so a
/// fresh file starts fresh.

final EntitlementsService _service = EntitlementsService.instance;

class _TrivialAuthHandle implements ConvexAuthHandle {
  @override
  bool get isAuthenticated => false;

  @override
  void dispose() {}
}

class _TrivialSubscription implements ConvexSubscription {
  const _TrivialSubscription();

  @override
  void cancel() {}
}

/// Scriptable ConvexGateway for the probe loop: counts initialize/probe
/// calls, logs them in order into [events], and pops scripted booleans off
/// [probeResults] (repeating the last). Everything else no-ops.
class ProbeCountingGateway implements ConvexGateway {
  ProbeCountingGateway(this.probeResults);

  /// Booleans probeConnection returns, in call order; the last repeats.
  final List<bool> probeResults;

  /// Ordered log of the seam calls under test.
  final List<String> events = <String>[];

  int initializeCalls = 0;
  int probeCalls = 0;

  final StreamController<bool> _authState = StreamController<bool>.broadcast();

  @override
  bool get isAuthenticated => false;

  @override
  Stream<bool> get authState => _authState.stream;

  @override
  Future<void> initialize(ConvexConfig config) async {
    initializeCalls++;
    events.add('initialize');
  }

  @override
  Future<bool> probeConnection() async {
    probeCalls++;
    events.add('probe');
    if (probeCalls <= probeResults.length) {
      return probeResults[probeCalls - 1];
    }
    return probeResults.isEmpty ? false : probeResults.last;
  }

  @override
  Future<ConvexAuthHandle> setAuthWithRefresh({
    required TokenFetcher fetchToken,
    AuthStateCallback? onAuthChange,
  }) async => _TrivialAuthHandle();

  @override
  Future<void> clearAuth() async {}

  @override
  Future<String> query(String name, Map<String, dynamic> args) async => '{}';

  @override
  Future<String> mutation(
      {required String name, required Map<String, dynamic> args}) async {
    return '{}';
  }

  @override
  Future<String> action(String name, Map<String, dynamic> args) async => '{}';

  @override
  Future<ConvexSubscription> subscribe({
    required String name,
    required Map<String, dynamic> args,
    required void Function(String) onUpdate,
    void Function(String, String?)? onError,
  }) async => const _TrivialSubscription();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    // Zero backoff: the loop's retry pacing collapses so only the attempt
    // count and the call order remain under test.
    EntitlementsService.probeBackoffBase = Duration.zero;
  });

  tearDown(() {
    // Restore the production knobs the service ships with.
    EntitlementsService.probeMaxAttempts = 6;
    EntitlementsService.probeBackoffBase = const Duration(milliseconds: 500);
    EntitlementsService.gateway = RustConvexGateway();
  });

  test('init drives the proactive connect and stops once connected', () async {
    final gateway = ProbeCountingGateway([false, false, true]);
    EntitlementsService.probeMaxAttempts = 5;
    EntitlementsService.gateway = gateway;

    await _service.init();
    await pumpEventQueue();
    // A short real delay lets the zero-backoff retry chain finish.
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(gateway.initializeCalls, 1, reason: 'init initializes once');
    expect(
      gateway.probeCalls,
      3,
      reason: 'two failed probes retry; the connected third stops the loop '
          'before the budget is spent',
    );
    expect(
      gateway.events.indexOf('initialize') < gateway.events.indexOf('probe'),
      isTrue,
      reason: 'the transport initializes before the first probe is issued',
    );
  });

  test('the probe budget bounds retries when the transport never opens',
      () async {
    final gateway = ProbeCountingGateway([false]);
    EntitlementsService.probeMaxAttempts = 4;
    EntitlementsService.gateway = gateway;

    await _service.init();
    await pumpEventQueue();
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(
      gateway.probeCalls,
      4,
      reason: 'a never-connecting transport gets exactly the attempt budget',
    );
    expect(
      _service.current.tier,
      Tier.free,
      reason: 'the spent budget leaves the dormant free tier in place',
    );
  });
}
