import 'dart:async';

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../catalog/trainer_catalog.dart';
import '../../constants/billing.dart';
import '../../l10n/l10n.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/premium_gate.dart';
import '../../widgets/svg_icon.dart';
import '../../widgets/ui_kit.dart';
import 'lock_overlay.dart';

const Color _kVideoSurface = Color(0xFF1C1C1C);

class TrainerVideoScreen extends StatefulWidget {
  const TrainerVideoScreen({super.key, required this.sessionId});
  final String sessionId;

  @override
  State<TrainerVideoScreen> createState() => _TrainerVideoScreenState();
}

class _TrainerVideoScreenState extends State<TrainerVideoScreen> {
  late final TrainerSession _session = trainerSessionById(widget.sessionId);
  late final _host = trainerVideoHostFactory(_session);
  bool _saved = false;
  int _sets = 3;
  int _reps = 10;

  @override
  void initState() {
    super.initState();
    _sets = int.tryParse(_session.setsHint) ?? 3;
    _reps = int.tryParse(_session.repsHint) ?? 10;
    unawaited(_host.load(_session.videoUrl));
  }

  @override
  void dispose() {
    _host.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final can = context.can(kCapCustomExercises);
    final frac = _host.positionSec / _host.durationSec;
    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 16, 4),
            child: Row(
              children: [
                RoundBtn(icon: Ic.chevronLeft, onTap: () => Navigator.of(context).pop()),
                const Spacer(),
                RoundAction(
                  size: 40,
                  onTap: () => setState(() => _saved = !_saved),
                  child: Icon(
                    _saved ? PhosphorIconsFill.bookmarkSimple : PhosphorIconsRegular.bookmarkSimple,
                    size: 17,
                    color: _saved ? gc.accent : gc.text,
                  ),
                ),
              ],
            ),
          ),
          if (!can)
            Expanded(
              child: Stack(
                children: [TrainerLockOverlay(visible: true, onDismiss: () => Navigator.of(context).pop())],
              ),
            )
          else
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 110),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: FractionallySizedBox(
                        widthFactor: 0.62,
                        child: AspectRatio(
                          aspectRatio: 9 / 16,
                          child: Container(
                            decoration: BoxDecoration(
                              color: _kVideoSurface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Stack(
                              children: [
                                Positioned.fill(child: CustomPaint(painter: _VideoArcs())),
                                Positioned(
                                  left: 12,
                                  top: 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.14),
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                    child: Text(
                                      t.trainerSessionBadge,
                                      style: AppTheme.f(
                                        9,
                                        weight: FontWeight.w800,
                                        color: Colors.white,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                  ),
                                ),
                                Center(
                                  child: GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => setState(_host.togglePlay),
                                    child: Container(
                                      width: 64,
                                      height: 64,
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.18),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        _host.playing ? PhosphorIconsFill.pause : PhosphorIconsFill.play,
                                        size: 26,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  left: 12,
                                  right: 12,
                                  bottom: 12,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      LayoutBuilder(
                                        builder: (context, box) {
                                          final w = box.maxWidth;
                                          return Stack(
                                            children: [
                                              Container(
                                                height: 4,
                                                margin: const EdgeInsets.symmetric(vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.white.withValues(alpha: 0.25),
                                                  borderRadius: BorderRadius.circular(2),
                                                ),
                                              ),
                                              Positioned(
                                                left: 0,
                                                top: 4,
                                                child: Container(
                                                  width: w * frac,
                                                  height: 4,
                                                  decoration: BoxDecoration(
                                                    color: Colors.white.withValues(alpha: 0.9),
                                                    borderRadius: BorderRadius.circular(2),
                                                  ),
                                                ),
                                              ),
                                              Positioned(
                                                left: (w * frac - 5).clamp(0.0, w - 10).toDouble(),
                                                top: 1,
                                                child: Container(
                                                  width: 10,
                                                  height: 10,
                                                  decoration: const BoxDecoration(
                                                    color: Colors.white,
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          );
                                        },
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Text(
                                            _fmt(_host.positionSec),
                                            style: AppTheme.f(
                                              10.5,
                                              weight: FontWeight.w600,
                                              color: Colors.white.withValues(alpha: 0.75),
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            _session.playerLabel,
                                            style: AppTheme.f(
                                              10.5,
                                              weight: FontWeight.w600,
                                              color: Colors.white.withValues(alpha: 0.75),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      _session.title,
                      style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _avatar(gc, 34),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                kTrainerProfile.name,
                                style: AppTheme.f(13.5, weight: FontWeight.w700, color: gc.text),
                              ),
                              Text(
                                kTrainerProfile.credentials,
                                style: AppTheme.f(11.5, weight: FontWeight.w500, color: gc.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (_session.cues.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      for (final cue in _session.cues) ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 5,
                              height: 5,
                              margin: const EdgeInsets.only(top: 7),
                              decoration: BoxDecoration(color: gc.sage, shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                cue,
                                style: AppTheme.f(
                                  13.5,
                                  weight: FontWeight.w500,
                                  color: gc.textSecondary,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                      ],
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(child: _stepper(gc, t.setsLabel, _sets, (v) => setState(() => _sets = v))),
                        const SizedBox(width: 12),
                        Expanded(child: _stepper(gc, t.repsLabel, _reps, (v) => setState(() => _reps = v))),
                      ],
                    ),
                    const SizedBox(height: 20),
                    PrimaryButton(
                      label: t.addSessionToWorkout,
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.addedToWorkout)));
                      },
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _fmt(double sec) {
    final s = sec.floor();
    return '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
  }

  Widget _stepper(GymColors gc, String label, int value, ValueChanged<int> onChange) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      decoration: BoxDecoration(color: gc.bgRaised, borderRadius: BorderRadius.circular(18)),
      child: Column(
        children: [
          Text(
            label.toUpperCase(),
            style: AppTheme.f(10.5, weight: FontWeight.w700, color: gc.textTertiary, letterSpacing: 1.2),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _stepBtn(gc, PhosphorIconsRegular.minus, () => onChange((value - 1).clamp(0, 999))),
              Expanded(
                child: Text(
                  '$value',
                  textAlign: TextAlign.center,
                  style: AppTheme.f(17, weight: FontWeight.w800, color: gc.text),
                ),
              ),
              _stepBtn(gc, PhosphorIconsRegular.plus, () => onChange((value + 1).clamp(0, 999))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _stepBtn(GymColors gc, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: gc.border),
        ),
        child: Icon(icon, size: 15, color: gc.textSecondary),
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
        style: AppTheme.f(12.5, weight: FontWeight.w800, color: gc.accent),
      ),
    );
  }
}

class _VideoArcs extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p1 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.12);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(size.width * 0.78, size.height * 0.86), radius: size.width * 0.55),
      -2.4,
      1.5,
      false,
      p1,
    );
    final p2 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.08);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(size.width * 0.15, size.height * 0.14), radius: size.width * 0.4),
      0.4,
      1.1,
      false,
      p2,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
