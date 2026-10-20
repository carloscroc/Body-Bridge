import 'dart:async';

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/account_state.dart';
import '../state/onboarding_gate.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/ui_kit.dart';

enum _Stage { checking, onboarded, needsOnboarding }

/// Post-verification interstitial. Resolves cloud onboarding state, shows the
/// matching variant for at least 1.2s, then hands off to the app shell by
/// consuming the fresh sign-in flag.
class AuthHandoff extends StatefulWidget {
  const AuthHandoff({super.key});

  @override
  State<AuthHandoff> createState() => _AuthHandoffState();
}

class _AuthHandoffState extends State<AuthHandoff> {
  _Stage _stage = _Stage.checking;
  bool _handedOff = false;

  @override
  void initState() {
    super.initState();
    unawaited(_run());
  }

  Future<void> _run() async {
    final start = DateTime.now();
    await onboardingGate.resolve();
    // The variant is worth seeing: hold the checking frame for >= 1.2s total.
    final elapsed = DateTime.now().difference(start);
    const floor = Duration(milliseconds: 1200);
    if (elapsed < floor) await Future<void>.delayed(floor - elapsed);
    if (!mounted) return;
    setState(() {
      _stage = onboardingGate.resolution == OnboardingResolution.onboarded
          ? _Stage.onboarded
          : _Stage.needsOnboarding;
    });
    await Future<void>.delayed(floor);
    if (!mounted || _handedOff) return;
    _handedOff = true;
    // Flips the fresh flag (and notifies) so _EntryGate swaps in AppShell.
    account.consumeFreshSignIn();
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final checking = _stage == _Stage.checking;
    final setup = _stage == _Stage.needsOnboarding;
    final name = onboardingGate.handoffName;
    final kicker = setup ? _t.authSetupKicker : _t.authWelcomeBackKicker;
    final title = name.isEmpty
        ? kicker
        : (setup ? _t.authSetupTitle(name) : _t.authWelcomeBackTitle(name));
    final body = setup ? _t.authSetupBody : _t.authWelcomeBackBody;
    return Scaffold(
      backgroundColor: gc.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
            child: RiseScope(
              id: 'authhandoff',
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: riseAll([
                  _hero(gc, checking),
                  if (!checking) ...[
                    const SizedBox(height: 22),
                    Kicker(kicker, color: gc.accent, size: 11.5),
                    const SizedBox(height: 8),
                    Text(title,
                        textAlign: TextAlign.center,
                        style: AppTheme.d(24,
                            weight: FontWeight.w800, height: 1.12, color: gc.text)),
                    const SizedBox(height: 10),
                    Text(body,
                        textAlign: TextAlign.center,
                        style: AppTheme.f(13.5,
                            weight: FontWeight.w500,
                            color: gc.textSecondary,
                            height: 1.45)),
                    if (setup) ...[
                      const SizedBox(height: 20),
                      _chips(gc),
                    ],
                  ] else ...[
                    const SizedBox(height: 28),
                    SizedBox(
                      width: 24,
                      height: 24,
                      child:
                          CircularProgressIndicator(strokeWidth: 2.4, color: gc.sage),
                    ),
                  ],
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  AppLocalizations get _t => t;

  Widget _hero(GymColors gc, bool checking) {
    if (checking) {
      return SizedBox(
        width: 112,
        height: 112,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 112,
              height: 112,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: gc.sageSoft,
                border: Border.all(color: gc.sage, width: 2),
              ),
            ),
            _mark(gc),
          ],
        ),
      );
    }
    if (_stage == _Stage.needsOnboarding) {
      return _mark(gc);
    }
    return Container(
      width: 112,
      height: 112,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: gc.sageSoft,
        border: Border.all(color: gc.sage, width: 2),
      ),
      child: Icon(PhosphorIconsFill.check, size: 30, color: gc.sage),
    );
  }

  Widget _mark(GymColors gc) {
    return Container(
      width: 56,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [gc.accent, gc.brass],
        ),
        boxShadow: [
          BoxShadow(
            color: gc.accent.withValues(alpha: 0.32),
            blurRadius: 28,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Text('B',
          style: AppTheme.d(26, weight: FontWeight.w800, color: gc.onEmber)),
    );
  }

  Widget _chips(GymColors gc) {
    Widget chip(String label, bool lit) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: lit ? gc.accentSoft : gc.bgRaised,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: lit ? gc.accent : gc.border),
          ),
          child: Text(label,
              style: AppTheme.f(11.5,
                  weight: FontWeight.w700,
                  color: lit ? gc.accent : gc.textTertiary,
                  letterSpacing: 0.6)),
        );
    Widget arrow() => Icon(PhosphorIconsRegular.arrowRight,
        size: 12, color: gc.accent);
    return Column(
      children: [
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            chip(_t.authChipName, true),
            arrow(),
            chip(_t.authChipUnits, false),
            arrow(),
            chip(_t.authChipBody, false),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            chip(_t.authChipGoal, false),
            arrow(),
            chip(_t.authChipPlaces, false),
          ],
        ),
      ],
    );
  }
}
