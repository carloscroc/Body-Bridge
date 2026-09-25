import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/entitlements_service.dart';

/// Entitlements service tests (card C4 item 2) against C2's real service.
///
/// Test environment runs with NO dart-defines, i.e. CONVEX_URL is empty:
/// the service is dormant, which exercises exactly the missing-config and
/// offline-degradation paths of the offline-first invariant. The Convex happy
/// path (ensureUser -> entitlements:get -> premium matrix) is NOT injectable
/// in C2's design (ConvexClient.instance is hardcoded); that gap is recorded
/// on the card and needs a seam before it can be covered.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('server payload contract (Entitlements.fromJson)', () {
    test('premium doc decodes with premium features unlocked', () {
      final value = Entitlements.fromJson(const {
        'tier': 'premium',
        'entitlements': {
          'canTrain': true,
          'canTrackStats': true,
          'canUsePremiumWorkouts': true,
          'canUseAiCoach': true,
        },
      });

      expect(value.tier, Tier.premium);
      expect(value.can(EntitlementFeature.canUsePremiumWorkouts), isTrue);
      expect(value.can(EntitlementFeature.canUseAiCoach), isTrue);
      expect(value.can(EntitlementFeature.canTrain), isTrue);
    });

    test('normal tier unlocks premium workouts but not aiCoach', () {
      final value = Entitlements.fromJson(const {
        'tier': 'normal',
        'entitlements': {
          'canTrain': true,
          'canTrackStats': true,
          'canUsePremiumWorkouts': true,
          'canUseAiCoach': false,
        },
      });

      expect(value.tier, Tier.normal);
      expect(value.can(EntitlementFeature.canUsePremiumWorkouts), isTrue);
      expect(value.can(EntitlementFeature.canUseAiCoach), isFalse);
    });

    test('free tier gets the core app but no premium features', () {
      final value = Entitlements.fromJson(const {
        'tier': 'free',
        'entitlements': {
          'canTrain': true,
          'canTrackStats': true,
          'canUsePremiumWorkouts': false,
          'canUseAiCoach': false,
        },
      });

      expect(value.tier, Tier.free);
      expect(value.can(EntitlementFeature.canTrain), isTrue);
      expect(value.can(EntitlementFeature.canTrackStats), isTrue);
      expect(value.can(EntitlementFeature.canUsePremiumWorkouts), isFalse);
      expect(value.can(EntitlementFeature.canUseAiCoach), isFalse);
    });

    test('missing fields fall back to safe defaults', () {
      final value = Entitlements.fromJson(const {});

      expect(value.tier, Tier.free);
      expect(value.can(EntitlementFeature.canTrain), isTrue,
          reason: 'core flows default OPEN (offline-first invariant)');
      expect(value.can(EntitlementFeature.canUseAiCoach), isFalse,
          reason: 'premium features default LOCKED');
    });

    test('a malformed payload throws at the decoder and is contained upstream',
        () {
      // CLASSIFICATION (C4, product note for C2/V1): fromJson tolerates
      // MISSING fields but throws on WRONG TYPES (the `as Map cast` at
      // entitlements_service.dart:45). The app-level guarantee lives in
      // EntitlementsService._apply, whose try/catch swallows this and falls
      // back to Entitlements.free — so the app never crashes. If fromJson is
      // ever called outside _apply, malformed input becomes a crash: a
      // hardening candidate, not a defect today.
      expect(
        () => Entitlements.fromJson(const {
          'tier': 42,
          'entitlements': 'not-a-map',
        }),
        throwsA(isA<TypeError>()),
      );
    });

    test('the exact wire shape round-trips through JSON', () {
      const wire = '{"tier":"normal","entitlements":{"canTrain":true,'
          '"canTrackStats":true,"canUsePremiumWorkouts":true,'
          '"canUseAiCoach":false}}';
      final value =
          Entitlements.fromJson(jsonDecode(wire) as Map<String, dynamic>);

      expect(value.tier, Tier.normal);
      expect(value.can(EntitlementFeature.canUsePremiumWorkouts), isTrue);
      expect(value.can(EntitlementFeature.canUseAiCoach), isFalse);
    });

    test('tier names outside the contract degrade to free', () {
      expect(Tier.fromName('ultra'), Tier.free);
      expect(Tier.fromName(null), Tier.free);
      expect(Tier.fromName(''), Tier.free);
      expect(Tier.fromName('normal'), Tier.normal);
      expect(Tier.fromName('premium'), Tier.premium);
    });
  });

  group('missing CONVEX_URL (test env = no dart-defines)', () {
    test('service stays dormant: core open, premium locked, never throws',
        () async {
      final service = EntitlementsService.instance;

      await service.init();

      expect(service.current.tier, Tier.free);
      expect(service.canAccess(EntitlementFeature.canTrain), isTrue,
          reason: 'training never gates on the cloud');
      expect(service.canAccess(EntitlementFeature.canTrackStats), isTrue);
      expect(service.canAccess(EntitlementFeature.canUseAiCoach), isFalse);
      expect(service.canAccess(EntitlementFeature.canUsePremiumWorkouts),
          isFalse);
    });

    test('refresh with no token degrades to free without throwing', () async {
      final service = EntitlementsService.instance;

      await service.refresh();

      expect(service.current.tier, Tier.free);
      expect(service.canAccess(EntitlementFeature.canUseAiCoach), isFalse);
    });

    test('onSignedOut clears to free without touching the network', () async {
      final service = EntitlementsService.instance;

      await service.onSignedOut();

      expect(service.current.tier, Tier.free);
      expect(
          service.canAccess(EntitlementFeature.canUsePremiumWorkouts), isFalse);
    });
  });

  group('entitlements stream (offline degradation broadcast)', () {
    test('subscribers receive the degraded free value, never an error',
        () async {
      final service = EntitlementsService.instance;
      final seen = <Entitlements>[];
      late final StreamSubscription<Entitlements> sub;
      sub = service.entitlements.listen(seen.add,
          onError: (Object e) => fail('stream must not error: $e'));

      await service.onSignedOut();
      await pumpEventQueue();
      await sub.cancel();

      expect(seen, isNotEmpty);
      expect(seen.last.tier, Tier.free);
    });
  });
}
