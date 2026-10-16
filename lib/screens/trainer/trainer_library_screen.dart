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

class TrainerLibraryScreen extends StatefulWidget {
  const TrainerLibraryScreen({super.key});

  @override
  State<TrainerLibraryScreen> createState() => _TrainerLibraryScreenState();
}

class _TrainerLibraryScreenState extends State<TrainerLibraryScreen> {
  late final TextEditingController _c = TextEditingController();
  String _category = 'all';

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final can = context.can(kCapCustomExercises);
    final tileW = (MediaQuery.sizeOf(context).width - 52) / 2;
    final tileH = tileW / 1.6 + 46;
    final q = _c.text.trim().toLowerCase();
    final sessions = [
      for (final s in kTrainerSessions)
        if ((_category == 'all' || s.category == _category) &&
            (q.isEmpty || s.title.toLowerCase().contains(q)))
          s,
    ];
    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: ScreenHeader(title: t.trainerLibraryTitle, onBack: () => Navigator.of(context).pop()),
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
              child: PremiumSourceTabs(active: SourceTab.trainer, onSelected: _onTab),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  _avatar(gc, 38),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          kTrainerProfile.name,
                          style: AppTheme.f(14.5, weight: FontWeight.w700, color: gc.text),
                        ),
                        Text(
                          kTrainerProfile.credentials,
                          style: AppTheme.f(12, weight: FontWeight.w500, color: gc.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: SearchField(
                controller: _c,
                hint: t.searchTrainerSessions,
                onChanged: (_) => setState(() {}),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final id in kTrainerCategories)
                    Pill(
                      label: _catLabel(id).toUpperCase(),
                      bg: _category == id ? gc.ember : gc.bgRaised2,
                      fg: _category == id ? gc.onEmber : gc.textSecondary,
                      onTap: () => setState(() => _category = id),
                      hPad: 12,
                      vPad: 6,
                      fontSize: 11,
                    ),
                ],
              ),
            ),
            Expanded(
              child: GridView(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 110),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 14,
                  childAspectRatio: tileW / tileH,
                ),
                children: [for (final s in sessions) _SessionCard(session: s)],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _onTab(SourceTab tab) {
    if (tab == SourceTab.trainer) return;
    if (tab == SourceTab.free) {
      Navigator.of(context).pop();
    } else {
      fit.goTrainerAssigned();
    }
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
        style: AppTheme.f(12.5, weight: FontWeight.w800, color: gc.accent),
      ),
    );
  }
}

String _catLabel(String id) => switch (id) {
  'all' => t.categoryAll,
  'strength' => t.categoryStrength,
  'mobility' => t.categoryMobility,
  'core' => t.categoryCore,
  'corrective' => t.categoryCorrective,
  _ => t.categoryWarmup,
};

class _SessionCard extends StatelessWidget {
  const _SessionCard({required this.session});
  final TrainerSession session;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => fit.goTrainerVideo(session.id),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1.6,
            child: Container(
              decoration: BoxDecoration(color: _kVideoSurface, borderRadius: BorderRadius.circular(16)),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  Positioned.fill(child: CustomPaint(painter: _ThumbArcs())),
                  Center(
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(PhosphorIconsFill.play, size: 16, color: Colors.white),
                    ),
                  ),
                  if (session.isNew)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: gc.sageSoft,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          t.newBadge,
                          style: AppTheme.f(9, weight: FontWeight.w800, color: gc.sage, letterSpacing: 0.8),
                        ),
                      ),
                    ),
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        session.durationLabel,
                        style: AppTheme.f(10.5, weight: FontWeight.w600, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            session.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTheme.f(14.5, weight: FontWeight.w600, color: gc.text),
          ),
          const SizedBox(height: 2),
          Text(
            '${_catLabel(session.category)} · ${session.equipmentLabel}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTheme.f(12, weight: FontWeight.w500, color: gc.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _ThumbArcs extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p1 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.14);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(size.width * 0.72, size.height * 0.9), radius: size.height * 0.62),
      -2.6,
      1.6,
      false,
      p1,
    );
    final p2 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.09);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(size.width * 0.12, size.height * 0.12), radius: size.height * 0.5),
      0.3,
      1.2,
      false,
      p2,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
