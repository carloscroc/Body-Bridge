import 'dart:async';

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../catalog/trainer_catalog.dart';
import '../catalog/trainer_exercises.dart';
import '../models/exercise.dart';
import '../theme/app_theme.dart';

const Color _kVideoSurface = Color(0xFF1C1C1C);

class TrainerExerciseMedia extends StatefulWidget {
  const TrainerExerciseMedia({
    super.key,
    required this.ex,
    required this.height,
    this.radius = 20,
    this.interactive = false,
  });

  final Exercise ex;
  final double height;
  final double radius;
  final bool interactive;

  @override
  State<TrainerExerciseMedia> createState() => _TrainerExerciseMediaState();
}

class _TrainerExerciseMediaState extends State<TrainerExerciseMedia> {
  TrainerVideoHost? _host;

  TrainerSession get _session => trainerSessionForExerciseId(widget.ex.id);

  @override
  void initState() {
    super.initState();
    if (widget.interactive) {
      _host = trainerVideoHostFactory(_session);
      unawaited(_host!.load(_session.videoUrl));
    }
  }

  @override
  void dispose() {
    _host?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assignment = trainerAssignmentForExerciseId(widget.ex.id);
    final duration = assignment?.durationLabel ?? _session.durationLabel;
    final glyph = (widget.height * 0.55).clamp(24.0, widget.interactive ? 64.0 : 38.0);
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: _kVideoSurface,
        borderRadius: BorderRadius.circular(widget.radius),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(painter: widget.interactive ? _VideoArcs() : _MiniArcs()),
          ),
          Center(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: widget.interactive ? () => setState(_host!.togglePlay) : null,
              child: Container(
                width: glyph,
                height: glyph,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  widget.interactive && (_host?.playing ?? false)
                      ? PhosphorIconsFill.pause
                      : PhosphorIconsFill.play,
                  size: widget.interactive ? 26 : 14,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          if (widget.interactive)
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
                      final host = _host!;
                      final frac = host.durationSec <= 0
                          ? 0.0
                          : (host.positionSec / host.durationSec).clamp(0.0, 1.0);
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
                        _fmt(_host!.positionSec),
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
            )
          else
            Positioned(
              left: 8,
              bottom: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  duration,
                  style: AppTheme.f(10.5, weight: FontWeight.w600, color: Colors.white),
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
}

class _VideoArcs extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p1 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.12);
    canvas.drawArc(
      Rect.fromCircle(
          center: Offset(size.width * 0.78, size.height * 0.86), radius: size.width * 0.55),
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
      Rect.fromCircle(
          center: Offset(size.width * 0.15, size.height * 0.14), radius: size.width * 0.4),
      0.4,
      1.1,
      false,
      p2,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MiniArcs extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p1 = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.14);
    canvas.drawArc(
      Rect.fromCircle(
          center: Offset(size.width * 0.72, size.height * 0.9), radius: size.height * 0.62),
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
      Rect.fromCircle(
          center: Offset(size.width * 0.12, size.height * 0.12), radius: size.height * 0.5),
      0.3,
      1.2,
      false,
      p2,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
