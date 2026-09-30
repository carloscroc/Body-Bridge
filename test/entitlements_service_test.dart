import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/entitlements_service.dart';

/// Entitlements service tests against the 4-tier capability contract.
///
/// Test environment runs with NO dart-defines, i.e. CONVEX_URL is empty:
/// the service is dormant, which exercises exactly the missing-config and
/// offline-degradation paths of the offline-first invariant. The Convex happy
/// path (ensureUser -> entitlements:get -> plan matrix) is NOT injectable
/// in the service design (ConvexClient.instance is hardcoded); that gap is
/// recorded on the card and needs a seam before it can be covered.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('server payload contract (Entitlements.fromJson)', () {
    test('advanced doc decodes with its capability list', () {
      final value = Entitlements.fromJson(const {
        'tier': 'advanced',
        'capabilities': ['workout_tracking', 'recent_history', 'personalized_programs', 'premium_videos'],
      });

      expect(value.tier, Tier.advanced);
      expect(value.can('personalized_programs'), isTrue);
      expect(value.can('premium_videos'), isTrue);
      expect(value.can('workout_tracking'), isTrue);
      expect(
        value.can('organization_management'),
        isFalse,
        reason: 'capabilities are the server list, not the tier ladder',
      );
    });

    test('a doc carrying only a tier derives capabilities from the plan mirror', () {
      final value = Entitlements.fromJson(const {'tier': 'basic'});

      expect(value.tier, Tier.basic);
      expect(value.can('full_history'), isTrue);
      expect(value.can('unlimited_routines'), isTrue);
      expect(value.can('community_post'), isTrue);
      expect(
        value.can('personalized_programs'),
        isFalse,
        reason: 'basic must not leak advanced capabilities',
      );
    });

    test('free tier gets the core app but no paid capabilities', () {
      final value = Entitlements.fromJson(const {
        'tier': 'free',
        'capabilities': ['workout_tracking', 'recent_history'],
      });

      expect(value.tier, Tier.free);
      expect(value.can('workout_tracking'), isTrue);
      expect(value.can('recent_history'), isTrue);
      expect(value.can('personalized_programs'), isFalse);
      expect(value.can('full_history'), isFalse);
    });

    test('missing fields fall back to safe defaults', () {
      final value = Entitlements.fromJson(const {});

      expect(value.tier, Tier.free);
      expect(
        value.can('workout_tracking'),
        isTrue,
        reason: 'core flows default OPEN (offline-first invariant)',
      );
      expect(value.can('personalized_programs'), isFalse, reason: 'paid capabilities default LOCKED');
      expect(value.capabilities, kPlanCapabilities['free'], reason: 'dormant/guest value is the free plan');
    });

    test('a malformed payload throws at the decoder and is contained upstream', () {
      // CLASSIFICATION: fromJson tolerates MISSING fields but throws on
      // WRONG TYPES (the `as String?` cast). The app-level guarantee lives in
      // EntitlementsService._apply, whose try/catch swallows this and falls
      // back to Entitlements.free — so the app never crashes. If fromJson is
      // ever called outside _apply, malformed input becomes a crash: a
      // hardening candidate, not a defect today.
      expect(
        () => Entitlements.fromJson(const {'tier': 42, 'capabilities': 'not-a-list'}),
        throwsA(isA<TypeError>()),
      );
    });

    test('a non-string entry inside capabilities is dropped, not fatal', () {
      final value = Entitlements.fromJson(const {
        'tier': 'basic',
        'capabilities': ['full_history', 42, null, 'unlimited_routines'],
      });

      expect(value.can('full_history'), isTrue);
      expect(value.can('unlimited_routines'), isTrue);
      expect(value.capabilities, ['full_history', 'unlimited_routines']);
    });

    test('the exact wire shape round-trips through JSON', () {
      const wire =
          '{"tier":"enterprise","capabilities":'
          '["workout_tracking","recent_history","organization_management"],'
          '"cloud_retention_until": 1790000000000}';
      final value = Entitlements.fromJson(jsonDecode(wire) as Map<String, dynamic>);

      expect(value.tier, Tier.enterprise);
      expect(value.can('organization_management'), isTrue);
      expect(value.can('premium_videos'), isFalse, reason: 'the server list wins over the tier ladder');
    });

    test('tier names outside the contract degrade to free', () {
      expect(Tier.fromName('ultra'), Tier.free);
      expect(Tier.fromName(null), Tier.free);
      expect(Tier.fromName(''), Tier.free);
      expect(Tier.fromName('basic'), Tier.basic);
      expect(Tier.fromName('advanced'), Tier.advanced);
      expect(Tier.fromName('enterprise'), Tier.enterprise);
    });
  });

  group('missing CONVEX_URL (test env = no dart-defines)', () {
    test('service stays dormant: free plan capabilities, never throws', () async {
      final service = EntitlementsService.instance;

      await service.init();

      expect(service.current.tier, Tier.free);
      expect(service.can('workout_tracking'), isTrue, reason: 'training never gates on the cloud');
      expect(service.can('recent_history'), isTrue);
      expect(service.can('personalized_programs'), isFalse);
      expect(service.can('full_history'), isFalse);
      expect(service.can('organization_management'), isFalse);
    });

    test('refresh with no token degrades to free without throwing', () async {
      final service = EntitlementsService.instance;

      await service.refresh();

      expect(service.current.tier, Tier.free);
      expect(service.can('personalized_programs'), isFalse);
    });

    test('onSignedOut clears to free without touching the network', () async {
      final service = EntitlementsService.instance;

      await service.onSignedOut();

      expect(service.current.tier, Tier.free);
      expect(service.can('full_history'), isFalse);
    });
  });

  group('entitlements stream (offline degradation broadcast)', () {
    test('subscribers receive the degraded free value, never an error', () async {
      final service = EntitlementsService.instance;
      final seen = <Entitlements>[];
      late final StreamSubscription<Entitlements> sub;
      sub = service.entitlements.listen(seen.add, onError: (Object e) => fail('stream must not error: $e'));

      await service.onSignedOut();
      await pumpEventQueue();
      await sub.cancel();

      expect(seen, isNotEmpty);
      expect(seen.last.tier, Tier.free);
    });
  });
}
