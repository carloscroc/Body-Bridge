// Consultation entry sheet (card t_aaa15e0d, repair t_db30a5d3 R3) — the
// two-door sheet over dimmed Exercises, mockup-verbatim (coaching-intro.html).
// Primary "Request Consultation" opens the account-prefilled form; once a
// request is on file the primary door flips to the SUBMITTED status instead
// (first-wins — repeat taps never reopen a fresh form). Secondary "Explore
// Coaching Plans" hands off to the app's EXISTING upgrade journey (the
// bodybridge.fit link-out already used by the gate — zero invented pricing).

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'glass.dart';
import 'trainer_gate_sheet.dart' show kBodyBridgeUrl;
import 'trainer_kit.dart';
import 'ui_kit.dart';

Future<void> showConsultationSheet(BuildContext context) {
  return showAppSheet(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) => const ConsultationSheet(),
  );
}

class ConsultationSheet extends StatelessWidget {
  const ConsultationSheet({super.key});

  void _open(BuildContext context, String route) {
    Navigator.of(context).pop();
    fit.pushRoute(route);
  }

  Future<void> _explorePlans(BuildContext context) async {
    Navigator.of(context).pop();
    try {
      await launchUrl(Uri.parse(kBodyBridgeUrl), mode: LaunchMode.externalApplication);
    } catch (_) {
      // No url-launcher implementation in this environment (tests/desktop):
      // the door stays inert rather than crashing the sheet.
    }
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Padding(
      padding: sheetPad(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t.consultCardKicker,
            textAlign: TextAlign.center,
            style: AppTheme.f(9.5,
                weight: FontWeight.w800, color: gc.brass, letterSpacing: 1.6),
          ),
          const SizedBox(height: 6),
          Text(
            t.consultSheetTitle,
            textAlign: TextAlign.center,
            style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
          ),
          const SizedBox(height: 8),
          Text(
            t.consultSheetBody,
            textAlign: TextAlign.center,
            style: AppTheme.s(
                13, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
          ),
          const SizedBox(height: 18),
          _benefit(context, PhosphorIconsRegular.barbell, t.consultBenefit1),
          const SizedBox(height: 12),
          _benefit(context, PhosphorIconsRegular.chatCircleDots, t.consultBenefit2),
          const SizedBox(height: 12),
          _benefit(context, PhosphorIconsRegular.videoCamera, t.consultBenefit3),
          const SizedBox(height: 18),
          AnimatedBuilder(
            animation: trainer,
            builder: (context, _) {
              final hasRequest = trainer.consultation != null;
              return Pressable(
                onTap: () => _open(
                  context,
                  hasRequest ? 'consultation-confirmation' : 'consultation-request',
                ),
                child: Container(
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: trainerPrimaryBg(gc, trainerIsDark(context)),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        hasRequest
                            ? PhosphorIconsFill.checkCircle
                            : PhosphorIconsFill.paperPlaneTilt,
                        size: 17,
                        color: trainerPrimaryFg(gc, trainerIsDark(context)),
                      ),
                      const SizedBox(width: 9),
                      Flexible(
                        child: Text(
                          hasRequest ? t.consultDoorView : t.consultPrimary,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.f(15.5,
                              weight: FontWeight.w800,
                              color: trainerPrimaryFg(gc, trainerIsDark(context))),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 10),
          Pressable(
            onTap: () => _explorePlans(context),
            child: Container(
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: gc.border),
              ),
              child: Text(
                t.exploreCoachingPlans,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTheme.f(14.5, weight: FontWeight.w700, color: gc.text),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            t.consultFootnote,
            textAlign: TextAlign.center,
            style: AppTheme.f(11,
                weight: FontWeight.w600, color: gc.textTertiary, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _benefit(BuildContext context, IconData icon, String label) {
    final gc = context.gc;
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: gc.mutedFill, shape: BoxShape.circle),
          child: Icon(icon, size: 17, color: gc.textSecondary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: AppTheme.f(13.5, weight: FontWeight.w600, color: gc.text),
          ),
        ),
      ],
    );
  }
}
