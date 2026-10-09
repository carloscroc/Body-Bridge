import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/entitlements_service.dart';
import '../services/otp_auth_service.dart';
import 'fit_state.dart';

enum OnboardingResolution { checking, needsOnboarding, onboarded }

/// Decides where a just-signed-in account lands: the handoff interstitial or
/// straight into the app. The local flag wins (offline-first, never
/// downgraded); otherwise one memoized `users:getMe` read decides. Never
/// throws.
class OnboardingGate extends ChangeNotifier {
  OnboardingGate._();
  static final OnboardingGate instance = OnboardingGate._();

  /// Test seam: replaces the `users:getMe` read entirely.
  @visibleForTesting
  static Future<Map<String, dynamic>?> Function()? meQueryOverride;

  OnboardingResolution resolution = OnboardingResolution.checking;

  String? _displayName;
  Future<OnboardingResolution>? _inFlight;

  /// Handoff naming: the server displayName, else the capitalized email
  /// local-part, else empty (callers omit the name segment).
  String get handoffName {
    final name = _displayName?.trim() ?? '';
    if (name.isNotEmpty) return name;
    final mail = otpAuthService.email ?? '';
    final local = mail.split('@').first.trim();
    if (local.isEmpty) return '';
    return local[0].toUpperCase() + local.substring(1);
  }

  Future<OnboardingResolution> resolve() => _inFlight ??= _resolve();

  Future<OnboardingResolution> _resolve() async {
    try {
      if (fit.onboarded) return _set(OnboardingResolution.onboarded);
      final doc = meQueryOverride != null
          ? await meQueryOverride!()
          : await EntitlementsService.instance.queryMe();
      _remember(doc);
      if (doc != null && doc['onboardedAt'] != null) {
        fit.completeOnboarding();
        return _set(OnboardingResolution.onboarded);
      }
      return _set(OnboardingResolution.needsOnboarding);
    } catch (e) {
      debugPrint('Onboarding resolve failed: $e');
      return _set(OnboardingResolution.needsOnboarding);
    }
  }

  void _remember(Map<String, dynamic>? doc) {
    final name = doc?['displayName'];
    if (name is String && name.trim().isNotEmpty) _displayName = name;
  }

  /// Handoff completion: flip the local flag now and fire the cloud mutation
  /// best-effort.
  void completeOnboarding() {
    fit.completeOnboarding();
    unawaited(EntitlementsService.instance.completeCloudOnboarding());
    _set(OnboardingResolution.onboarded);
  }

  /// Re-arms the gate for the next sign-in (sign-out / account switch).
  void reset() {
    _inFlight = null;
    _displayName = null;
    _set(OnboardingResolution.checking);
  }

  @visibleForTesting
  void debugSetResolution(OnboardingResolution value) => _set(value);

  OnboardingResolution _set(OnboardingResolution value) {
    resolution = value;
    notifyListeners();
    return value;
  }
}

final onboardingGate = OnboardingGate.instance;
