// Advanced gate sheet (card t_d788f36e) — what Free/Basic members see when
// they tap a trainer feature. iOS-safe per the approved mockup: NO prices,
// NO tier ranking, NO external-purchase callouts; a single link-out to
// bodybridge.net ("See Advanced") and a footnote explaining upgrades happen
// on web so plan management stays in-app.

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'glass.dart';
import 'trainer_kit.dart';
import 'ui_kit.dart';

const String kBodyBridgeUrl = 'https://bodybridge.net';

Future<void> _openSeeAdvanced() async {
  try {
    await launchUrl(Uri.parse(kBodyBridgeUrl), mode: LaunchMode.externalApplication);
  } catch (_) {
    // No url-launcher implementation in this environment (tests/desktop);
    // the CTA simply stays inert rather than crashing the gate.
  }
}

/// Presents the Advanced gate. Both entry points (My Trainer tab-tap and the
/// Message button) route here — one sheet (mockup: both entries reach the
/// same sheet).
Future<void> showTrainerGate(BuildContext context) {
  return showAppSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => const TrainerGateSheet(),
  );
}

class TrainerGateSheet extends StatelessWidget {
  const TrainerGateSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return Container(
      padding: sheetPad(context, bottom: 20),
      decoration: BoxDecoration(
        color: gc.bgRaised,
        border: Border.all(color: gc.border),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SheetHandle(),
          const SizedBox(height: 18),
          Center(
            child: Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: gc.brass.withValues(alpha: dark ? 0.16 : 0.12),
                shape: BoxShape.circle,
                border: Border.all(color: gc.brass.withValues(alpha: 0.35)),
              ),
              child: Icon(PhosphorIconsRegular.lockSimple,
                  size: 24, color: gc.brass),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            t.trainerGateTitle,
            textAlign: TextAlign.center,
            style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              t.trainerGateBody,
              textAlign: TextAlign.center,
              style: AppTheme.s(12.5,
                  weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
            ),
          ),
          const SizedBox(height: 18),
          _benefit(context, PhosphorIconsRegular.barbell, t.gateBenefitWorkouts),
          const SizedBox(height: 10),
          _benefit(context, PhosphorIconsRegular.chatCircleDots, t.gateBenefitChat),
          const SizedBox(height: 10),
          _benefit(context, PhosphorIconsRegular.videoCamera, t.gateBenefitVideo),
          const SizedBox(height: 22),
          Pressable(
            onTap: _openSeeAdvanced,
            child: Container(
              height: 54,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: trainerPrimaryBg(gc, dark),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                t.trainerGateCta,
                style: AppTheme.f(15.5,
                    weight: FontWeight.w800,
                    color: trainerPrimaryFg(gc, dark),
                    letterSpacing: 0.2),
              ),
            ),
          ),
          const SizedBox(height: 6),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              t.gateDismiss,
              style: AppTheme.f(13.5, weight: FontWeight.w600, color: gc.textSecondary),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            t.gateFootnote,
            textAlign: TextAlign.center,
            style: AppTheme.f(10.5, weight: FontWeight.w500, color: gc.textTertiary),
          ),
        ],
      ),
    );
  }

  Widget _benefit(BuildContext context, IconData icon, String label) {
    final gc = context.gc;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: gc.bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: gc.border),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: gc.mutedFill,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, size: 19, color: gc.text),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: AppTheme.f(13, weight: FontWeight.w600, color: gc.text),
            ),
          ),
        ],
      ),
    );
  }
}
