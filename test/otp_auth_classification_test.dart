import 'dart:async';

import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/convex_gateway.dart';
import 'package:gymmane/services/otp_auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Service-level classification for the typed convex_flutter client errors
/// (defect D1 root cause): the FFI bridge surfaces offline sends as
/// `ClientError.internalError`, whose `toString()` is just the variant name
/// — the old marker scan matched NOTHING and fell through to `unknown`,
/// which the form then treated as "request committed" and advanced to a
/// lying "check your email" step. The contract under test:
/// transport-local (`internalError`) ⇒ `network`; backend-reached
/// (`convexError`/`serverError`) ⇒ payload parse / `unknown`, NEVER
/// `network`; every other error type keeps the marker scan.
class _ThrowingGateway implements ConvexGateway {
  _ThrowingGateway(this.error);

  final Object error;

  @override
  Future<String> action(String name, Map<String, dynamic> args) async {
    throw error;
  }

  @override
  Future<void> initialize(ConvexConfig config) async {}

  @override
  Future<void> clearAuth() async {}

  /// Implements does not inherit the seam's concrete default: this fake is
  /// connected-by-default, so any proactive probe loop stops after one call.
  @override
  Future<bool> probeConnection() async => true;

  @override
  Stream<bool> get authState => const Stream.empty();

  @override
  bool get isAuthenticated => false;

  @override
  Future<String> query(String name, Map<String, dynamic> args) async => '';

  @override
  Future<String> mutation({
    required String name,
    required Map<String, dynamic> args,
  }) async => '';

  @override
  Future<ConvexSubscription> subscribe({
    required String name,
    required Map<String, dynamic> args,
    required void Function(String) onUpdate,
    void Function(String, String?)? onError,
  }) => throw UnimplementedError();

  @override
  Future<ConvexAuthHandle> setAuthWithRefresh({
    required TokenFetcher fetchToken,
    AuthStateCallback? onAuthChange,
  }) => throw UnimplementedError();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  tearDown(() {
    OtpAuthService.gateway = RustConvexGateway();
  });

  Future<Object> sendFailure(Object error) async {
    OtpAuthService.gateway = _ThrowingGateway(error);
    try {
      await OtpAuthService.instance.requestEmailCode('racer@gymmane.dev');
      return StateError('requestEmailCode did not throw');
    } on OtpAuthException catch (e) {
      return e;
    }
  }

  test('ClientError.internalError classifies as network regardless of message',
      () async {
    // The REAL offline shape from the device: a typed frb error whose text
    // ('ClientError.internalError(msg: ...)') matches no network marker.
    final e = await sendFailure(ClientError.internalError(msg: 'not connected'));
    expect(e, isA<OtpAuthException>());
    expect((e as OtpAuthException).key, 'network',
        reason: 'internalError is transport-local — the request never left'
            ' the device');
  });

  test('ClientError.convexError parses the backend payload', () async {
    final e = await sendFailure(ClientError.convexError(data: 'too many requests'));
    expect((e as OtpAuthException).key, 'rateLimit',
        reason: 'the backend was reached — its payload text is parsed');
  });

  test('ClientError.serverError never yields network', () async {
    // Even a server message stuffed with transport words stays backend:
    // a backend answer is not a transport failure.
    final e =
        await sendFailure(ClientError.serverError(msg: 'socket unreachable'));
    expect((e as OtpAuthException).key, 'unknown',
        reason: 'backend-reached errors run the payload parse, never the'
            ' network markers');
  });

  test('a plain TimeoutException still maps to network', () async {
    final e = await sendFailure(
        TimeoutException('the request timed out', const Duration(seconds: 5)));
    expect((e as OtpAuthException).key, 'network',
        reason: 'the marker scan is unchanged for non-ClientError errors');
  });
}
