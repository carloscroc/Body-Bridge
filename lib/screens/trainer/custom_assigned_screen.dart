import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../catalog/trainer_catalog.dart';
import '../../constants/billing.dart';
import '../../l10n/l10n.dart';
import '../../state/fit_state.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/premium_gate.dart';
import '../../widgets/ui_kit.dart';
import 'lock_overlay.dart';
import 'source_tabs.dart';

const Color _kVideoSurface = Color(0xFF1C1C1C);

class CustomAssignedScreen extends StatelessWidget {
  const CustomAssignedScreen({super.key});

  void _onTab(BuildContext context, SourceTab tab) {
    if (tab == SourceTab.custom) return;
    if (tab == SourceTab.free) {
      Navigator.of(context).pop();
    } else {
      fit.goTrainerLibrary();
    }
  }

  void _start(BuildContext context) {
    final target = kTrainerAssignments.firstWhere((a) => a.dueToday, orElse: () => kTrainerAssignments.first);
    fit.goTrainerVideo(target.sessionId);
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final can = context.can(kCapCustomExercises);
    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: ScreenHeader(title: t.customAssignedTitle, onBack: () => Navigator.of(context).pop()),
          ),
          if (!can)
            Expanded(
              child: Stack(
                children: [TrainerLockOverlay(visible: true, onDismiss: () => Navigator.of(context).pop())],
              ),
            )
          else ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: PremiumSourceTabs(active: SourceTab.custom, onSelected: (tab) => _onTab(context, tab)),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: gc.bgRaised, borderRadius: BorderRadius.circular(20)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: gc.sageSoft, borderRadius: BorderRadius.circular(100)),
                      child: Text(
                        '+ ${t.fromYourTrainerBadge}'.toUpperCase(),
                        style: AppTheme.f(9.5, weight: FontWeight.w800, color: gc.sage, letterSpacing: 0.8),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _avatar(gc, 30),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                kTrainerProfile.name,
                                style: AppTheme.f(13, weight: FontWeight.w700, color: gc.text),
                              ),
                              Text(
                                kTrainerProfile.credentials,
                                style: AppTheme.f(11, weight: FontWeight.w500, color: gc.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      kTrainerCoachNote,
                      style: AppTheme.f(
                        13.5,
                        weight: FontWeight.w500,
                        color: gc.textSecondary,
                        height: 1.4,
                      ).copyWith(fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                children: [
                  for (final a in kTrainerAssignments) ...[
                    _AssignmentRow(assignment: a),
                    const SizedBox(height: 12),
                  ],
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: PrimaryButton(label: t.startAssignedWork, onTap: () => _start(context)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _avatar(GymColors gc, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: gc.bgRaised2,
        border: Border.all(color: gc.accent, width: 1.5),
      ),
      alignment: Alignment.center,
      child: Text(
        kTrainerProfile.initials,
        style: AppTheme.f(12, weight: FontWeight.w800, color: gc.accent),
      ),
    );
  }
}

class _AssignmentRow extends StatelessWidget {
  const _AssignmentRow({required this.assignment});
  final TrainerAssignment assignment;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final session = trainerSessionById(assignment.sessionId);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => fit.goTrainerVideo(assignment.sessionId),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: gc.bgRaised, borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 92,
              decoration: BoxDecoration(color: _kVideoSurface, borderRadius: BorderRadius.circular(12)),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  Positioned.fill(child: CustomPaint(painter: _MiniArcs())),
                  Center(
                    child: Icon(PhosphorIconsFill.play, size: 20, color: Colors.white.withValues(alpha: 0.8)),
                  ),
                  Positioned(
                    left: 4,
                    bottom: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        session.durationLabel,
                        style: AppTheme.f(9, weight: FontWeight.w600, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          assignment.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.f(14.5, weight: FontWeight.w600, color: gc.text),
                        ),
                      ),
                      if (assignment.dueToday) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: gc.sageSoft,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            t.dueToday.toUpperCase(),
                            style: AppTheme.f(9, weight: FontWeight.w800, color: gc.sage, letterSpacing: 0.6),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    assignment.prescription,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTheme.f(
                      13,
                      weight: FontWeight.w500,
                      color: gc.textSecondary,
                    ).copyWith(fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    t.assignedOn(t.shortDate(assignment.assignedDate)),
                    style: AppTheme.f(12, weight: FontWeight.w500, color: gc.textTertiary),
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

class _MiniArcs extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p1 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.14);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(size.width * 0.75, size.height * 0.9), radius: size.width * 0.6),
      -2.5,
      1.5,
      false,
      p1,
    );
    final p2 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.09);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(size.width * 0.2, size.height * 0.1), radius: size.width * 0.45),
      0.4,
      1.1,
      false,
      p2,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
