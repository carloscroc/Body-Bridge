import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/entitlements_service.dart';

import 'data/capabilities_fixture.dart';

/// Capability mirror: the app-side kPlanCapabilities must be a 1:1 mirror of
/// the backend contract in convex/lib.ts. The fixture is a verbatim copy of
/// the server declaration; any backend change must be mirrored here and in
/// lib/services/entitlements_service.dart.
void main() {
  group('tier registry', () {
    test('tiers match the backend exactly, in order', () {
      expect(kTiers, kBackendTiers);
    });

    test('the 16 capabilities match the backend exactly, in order', () {
      expect(kCapabilities.length, 16);
      expect(kCapabilities, kBackendCapabilities);
    });

    test('every declared tier has a plan-capability entry', () {
      for (final tier in kTiers) {
        expect(kPlanCapabilities.containsKey(tier), isTrue, reason: '$tier missing from kPlanCapabilities');
      }
      expect(kPlanCapabilities.keys.toSet(), kBackendTiers.toSet());
    });
  });

  group('plan capabilities mirror, tier by tier', () {
    for (final tier in kBackendTiers) {
      test('$tier matches the backend set exactly', () {
        expect(kPlanCapabilities[tier]!.toSet(), kBackendPlanCapabilities[tier]!.toSet());
      });
    }
  });

  group('monotonic supersets', () {
    test('free is a strict subset of basic', () {
      expect(kPlanCapabilities['basic']!.toSet().containsAll(kPlanCapabilities['free']!), isTrue);
      expect(kPlanCapabilities['basic']!.length, greaterThan(kPlanCapabilities['free']!.length));
    });

    test('basic is a strict subset of advanced', () {
      expect(kPlanCapabilities['advanced']!.toSet().containsAll(kPlanCapabilities['basic']!), isTrue);
      expect(kPlanCapabilities['advanced']!.length, greaterThan(kPlanCapabilities['basic']!.length));
    });

    test('advanced is a strict subset of enterprise', () {
      expect(kPlanCapabilities['enterprise']!.toSet().containsAll(kPlanCapabilities['advanced']!), isTrue);
      expect(kPlanCapabilities['enterprise']!.length, greaterThan(kPlanCapabilities['advanced']!.length));
    });
  });

  group('contract invariants', () {
    test('no unknown capability appears in any plan', () {
      for (final entry in kPlanCapabilities.entries) {
        for (final cap in entry.value) {
          expect(
            kBackendCapabilities.contains(cap),
            isTrue,
            reason: '${entry.key} carries unknown capability $cap',
          );
        }
      }
    });

    test('free does NOT contain community_post', () {
      expect(kPlanCapabilities['free']!.contains('community_post'), isFalse);
    });

    test('organization_management appears only in enterprise', () {
      expect(kPlanCapabilities['free']!.contains('organization_management'), isFalse);
      expect(kPlanCapabilities['basic']!.contains('organization_management'), isFalse);
      expect(kPlanCapabilities['advanced']!.contains('organization_management'), isFalse);
      expect(kPlanCapabilities['enterprise']!.contains('organization_management'), isTrue);
    });
  });
}
