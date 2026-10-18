// Consultation entry sheet (card t_aaa15e0d) — the two-door sheet opened
// from My Trainer. Door 1 "How it works" walks the funnel intro; door 2
// flips once a request is on file: "Send request" opens the form, "View
// request" opens the confirmation screen.

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'glass.dart';
import 'svg_icon.dart';
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

  void _go(BuildContext context, String route) {
    Navigator.of(context).pop();
    fit.pushRoute(route);
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Padding(
      padding: sheetPad(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t.consultCardKicker,
            style: AppTheme.f(9.5,
                weight: FontWeight.w800,
                color: gc.textTertiary,
                letterSpacing: 1.6),
          ),
          const SizedBox(height: 6),
          Text(
            t.consultSheetTitle,
            style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
          ),
          const SizedBox(height: 8),
          Text(
            t.consultSheetBody,
            style: AppTheme.s(
                13, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
          ),
          const SizedBox(height: 18),
          _door(
            context,
            icon: PhosphorIconsFill.listChecks,
            title: t.consultDoorHow,
            sub: t.consultDoorHowSub,
            onTap: () => _go(context, 'coaching-intro'),
          ),
          const SizedBox(height: 10),
          AnimatedBuilder(
            animation: trainer,
            builder: (context, _) {
              final hasRequest = trainer.consultation != null;
              return _door(
                context,
                icon: hasRequest
                    ? PhosphorIconsFill.checkCircle
                    : PhosphorIconsFill.paperPlaneTilt,
                title: hasRequest ? t.consultDoorView : t.consultDoorRequest,
                sub: hasRequest ? t.consultDoorViewSub : t.consultDoorRequestSub,
                onTap: () => _go(
                  context,
                  hasRequest ? 'consultation-confirmation' : 'consultation-request',
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _door(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String sub,
    required VoidCallback onTap,
  }) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return Pressable(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: gc.bgRaised,
          border: Border.all(color: gc.border),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: gc.accent.withValues(alpha: dark ? 0.16 : 0.10),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 19, color: gc.accent),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTheme.f(14, weight: FontWeight.w800, color: gc.text),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: AppTheme.f(
                        11.5, weight: FontWeight.w500, color: gc.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            SvgPathIcon(Ic.chevronRight, size: 16, color: gc.textTertiary),
          ],
        ),
      ),
    );
  }
}
