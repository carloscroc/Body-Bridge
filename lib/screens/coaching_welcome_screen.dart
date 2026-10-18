// Coaching welcome (card t_aaa15e0d, repair t_db30a5d3 R5) —
// coaching-welcome.html + DECISIONS §3, mockup-verbatim: the welcome card
// carries the 24-48h INITIAL-OUTREACH window (first hello, never a per-message
// SLA), the "what happens next" card matches the mockup's three honest steps,
// and a dashed pending-assignment placeholder stands in until a real trainer
// is assigned — no fabricated trainer, avatar or chat history.

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class CoachingWelcomeScreen extends StatelessWidget {
  const CoachingWelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: riseAll([
            ScreenHeader(title: t.welcomeTitle, onBack: () => fit.goTrainer()),
            const SizedBox(height: 18),
            SoftCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: gc.brass.withValues(alpha: dark ? 0.18 : 0.14),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(PhosphorIconsFill.sparkle,
                        size: 20, color: gc.brass),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    t.welcomeTitle,
                    style: AppTheme.f(18, weight: FontWeight.w800, color: gc.text),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t.welcomeBody,
                    style: AppTheme.s(
                        13, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            SoftCard(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.welcomeStepsLabel,
                    style: AppTheme.f(9.5,
                        weight: FontWeight.w800,
                        color: gc.textTertiary,
                        letterSpacing: 1.6),
                  ),
                  const SizedBox(height: 14),
                  _step(
                    context,
                    icon: SvgPathIcon(Ic.checkBold, size: 13,
                        color: gc.sage),
                    discColor: gc.sage.withValues(alpha: dark ? 0.16 : 0.12),
                    title: t.welcomeStep1T,
                    sub: t.welcomeStep1S,
                  ),
                  const SizedBox(height: 14),
                  Container(height: 1, color: gc.border),
                  const SizedBox(height: 14),
                  _step(
                    context,
                    icon: Icon(PhosphorIconsRegular.hourglassMedium,
                        size: 15, color: gc.brass),
                    discColor: gc.brass.withValues(alpha: dark ? 0.18 : 0.14),
                    title: t.welcomeStep2T,
                    sub: t.welcomeStep2S,
                  ),
                  const SizedBox(height: 14),
                  Container(height: 1, color: gc.border),
                  const SizedBox(height: 14),
                  _step(
                    context,
                    icon: SvgPathIcon(Ic.clock, size: 14,
                        color: gc.textTertiary),
                    discColor: gc.mutedFill,
                    title: t.welcomeStep3T,
                    sub: t.welcomeStep3S,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            _pendingCard(context),
            const SizedBox(height: 12),
            Text(
              t.welcomeFootnote,
              style: AppTheme.f(12, weight: FontWeight.w600, color: gc.textTertiary),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: t.welcomeDone,
              bg: trainerPrimaryBg(gc, dark),
              fg: trainerPrimaryFg(gc, dark),
              onTap: () => fit.goTrainer(),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _step(
    BuildContext context, {
    required Widget icon,
    required Color discColor,
    required String title,
    required String sub,
  }) {
    final gc = context.gc;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: discColor, shape: BoxShape.circle),
          child: icon,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTheme.f(14, weight: FontWeight.w700, color: gc.text),
              ),
              const SizedBox(height: 2),
              Text(
                sub,
                style:
                    AppTheme.f(12, weight: FontWeight.w500, color: gc.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pendingCard(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return CustomPaint(
      foregroundPainter: _DashedRRectPainter(
        color: gc.border,
        radius: 20,
        strokeWidth: 1.5,
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: dark ? gc.mutedFill : gc.bgRaised2,
                shape: BoxShape.circle,
              ),
              child: Icon(PhosphorIconsRegular.userPlus,
                  size: 20, color: gc.textTertiary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.welcomePendingT,
                    style: AppTheme.f(14, weight: FontWeight.w700, color: gc.text),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    t.welcomePendingS,
                    style: AppTheme.f(
                        12, weight: FontWeight.w500, color: gc.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Hairline dashed rounded-rect border for the pending-assignment placeholder
/// (mockup: 1.5px dashed border, transparent fill).
class _DashedRRectPainter extends CustomPainter {
  _DashedRRectPainter({
    required this.color,
    required this.radius,
    required this.strokeWidth,
  });

  final Color color;
  final double radius;
  final double strokeWidth;
  final double dash = 5;
  final double gap = 4;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );
    final source = Path()..addRRect(rrect);
    final dashed = Path();
    for (final metric in source.computeMetrics()) {
      var dist = 0.0;
      while (dist < metric.length) {
        final end = (dist + dash > metric.length) ? metric.length : dist + dash;
        dashed.addPath(metric.extractPath(dist, end), Offset.zero);
        dist += dash + gap;
      }
    }
    canvas.drawPath(
      dashed,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) =>
      oldDelegate.color != color ||
      oldDelegate.radius != radius ||
      oldDelegate.strokeWidth != strokeWidth;
}
