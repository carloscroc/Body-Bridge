// Custom workout detail (card t_d788f36e) — trainer-sent workout: "sent by
// your trainer on <date>", top-level coach note, guided exercise rows with
// warm-gradient video thumbs + per-exercise coach notes, anchored
// "Start workout" pill + "Ask Marcus about this".
// Mockup: workout-detail.png.

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../services/trainer_data.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/liquid_notch.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class TrainerWorkoutDetailScreen extends StatefulWidget {
  const TrainerWorkoutDetailScreen({super.key});

  @override
  State<TrainerWorkoutDetailScreen> createState() =>
      _TrainerWorkoutDetailScreenState();
}

class _TrainerWorkoutDetailScreenState extends State<TrainerWorkoutDetailScreen> {
  TrainerAssignment? _assignment;
  TrainerProfile? _profile;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    await trainer.ensureLoaded();
    final id = trainer.openAssignmentId;
    TrainerAssignment? a;
    if (id != null) a = await trainer.repo.assignmentsGet(id);
    if (!mounted) return;
    setState(() {
      _assignment = a;
      _profile = trainer.profile;
      _loaded = true;
    });
  }

  void _openChat() {
    final a = _assignment;
    if (a != null) trainer.openThreadId = 'thr_chat_marcus';
    fit.pushRoute('trainer-chat');
  }

  void _startWorkout() {
    showNotchToast(
      context,
      t.startSoonTitle,
      subtitle: t.startSoonBody,
      icon: PhosphorIconsFill.play,
      accent: context.gc.accent,
    );
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final a = _assignment;

    if (!_loaded) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }
    if (a == null) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
          child: ScreenHeader(title: t.myTrainer, onBack: () => fit.popRoute()),
        ),
      );
    }

    final dark = trainerIsDark(context);
    final sent = DateTime.fromMillisecondsSinceEpoch(a.createdAt);

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              clipBehavior: Clip.none,
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ScreenHeader(title: a.title, onBack: () => fit.popRoute(), titleSize: 19),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      TrainerStateChip(
                        kind: trainer.progressOf(a) >= 1
                            ? TrainerChipKind.completed
                            : (trainer.progressOf(a) > 0 ||
                                    trainer.openedThreads.contains(a.threadId)
                                ? TrainerChipKind.inProgress
                                : TrainerChipKind.isNew),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          t.sentByTrainerOn(t.shortDate(sent)),
                          style: AppTheme.f(11.5,
                              weight: FontWeight.w600, color: gc.textSecondary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    trainerExercisesMeta(t, a.exercises.length, a.estimatedMinutes ?? 0),
                    style: AppTheme.f(11.5,
                        weight: FontWeight.w500, color: gc.textTertiary),
                  ),
                  if (a.trainerNote != null) ...[
                    const SizedBox(height: 16),
                    TrainerCoachNote(
                        note: a.trainerNote!,
                        trainerName: _profile?.displayName ?? ''),
                  ],
                  const SizedBox(height: 18),
                  for (final ex in a.exercises) ...[
                    _exerciseRow(context, gc, ex),
                    if (ex.notes != null) ...[
                      const SizedBox(height: 8),
                      TrainerCoachNote(
                          note: ex.notes!,
                          trainerName: _profile?.displayName ?? ''),
                    ],
                    const SizedBox(height: 14),
                  ],
                ],
              ),
            ),
          ),
          // Anchored bottom actions (mockup: pill + link above home indicator).
          Container(
            padding: EdgeInsets.fromLTRB(
                20, 10, 20, 10 + MediaQuery.paddingOf(context).bottom),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [gc.bg.withValues(alpha: 0), gc.bg],
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Pressable(
                  onTap: _startWorkout,
                  child: Container(
                    height: 54,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: trainerPrimaryBg(gc, dark),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      t.startWorkout,
                      style: AppTheme.f(15.5,
                          weight: FontWeight.w800,
                          color: trainerPrimaryFg(gc, dark),
                          letterSpacing: 0.2),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                TextButton(
                  onPressed: _openChat,
                  child: Text(
                    t.askAboutThis(_profile?.displayName ?? ''),
                    style: AppTheme.f(12.5,
                        weight: FontWeight.w700, color: gc.textSecondary),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _exerciseRow(
      BuildContext context, GymColors gc, TrainerAssignmentExercise ex) {
    return SoftCard(
      radius: 18,
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          TrainerVideoThumb(duration: ex.thumbDuration, size: 64),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ex.titleSnapshot,
                  style: AppTheme.f(14, weight: FontWeight.w800, color: gc.text),
                ),
                const SizedBox(height: 4),
                Text(
                  '${ex.sets} × ${ex.reps}',
                  style: AppTheme.f(12,
                      weight: FontWeight.w600, color: gc.textSecondary),
                ),
                if (ex.rest != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    t.restLabel(ex.rest!),
                    style: AppTheme.f(11,
                        weight: FontWeight.w500, color: gc.textTertiary),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
