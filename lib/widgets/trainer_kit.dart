// Shared widgets for the trainer surfaces (card t_d788f36e) — avatar discs,
// warm-gradient video thumbs, state chips, count pill, progress bar, coach
// note callout, chat attachment cards. Self-contained: no external images,
// no video-player dependency (static thumbs per brief).

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../constants/billing.dart';
import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'premium_gate.dart';
import 'consultation_sheet.dart';
import 'ui_kit.dart' show Pressable;

/// Trainer primary pill: terracotta in dark, deep green in light (mockup).
Color trainerPrimaryBg(GymColors gc, bool dark) => dark ? gc.accent : gc.ember;

/// Ink text on the dark-theme terracotta pill; onEmber (ivory) in light.
Color trainerPrimaryFg(GymColors gc, bool dark) => dark ? gc.pageBg : gc.onEmber;

bool trainerIsDark(BuildContext context) =>
    Theme.of(context).brightness == Brightness.dark;

/// "Marcus Reyes" -> "Marcus" (the mockups sign notes and banners with the
/// trainer's first name).
String trainerFirstName(String displayName) => displayName.split(' ').first;

class TrainerAvatarDisc extends StatelessWidget {
  const TrainerAvatarDisc({super.key, required this.initials, this.size = 46});

  final String initials;
  final double size;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final fg = trainerPrimaryFg(gc, trainerIsDark(context));
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [gc.accent, gc.brass],
        ),
        shape: BoxShape.circle,
      ),
      child: Text(
        initials,
        style: AppTheme.f(size * 0.36, weight: FontWeight.w800, color: fg),
      ),
    );
  }
}

/// Warm-gradient video thumbnail tile with play glyph + duration chip
/// (DECISIONS #9 — self-contained asset).
class TrainerVideoThumb extends StatelessWidget {
  const TrainerVideoThumb({super.key, this.duration, this.size = 64});

  final String? duration;
  final double size;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final fg = trainerPrimaryFg(gc, trainerIsDark(context));
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [gc.accent, gc.brass],
        ),
        borderRadius: BorderRadius.circular(size * 0.19),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(PhosphorIconsFill.play, size: size * 0.3, color: fg),
          if (duration != null)
            Positioned(
              right: size * 0.07,
              bottom: size * 0.07,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Text(
                  duration!,
                  style: AppTheme.f(8.5,
                      weight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.3),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

enum TrainerChipKind { isNew, inProgress, completed }

class TrainerStateChip extends StatelessWidget {
  const TrainerStateChip({super.key, required this.kind});

  final TrainerChipKind kind;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    final (label, color) = switch (kind) {
      TrainerChipKind.isNew => (t.chipNew, gc.accent),
      TrainerChipKind.inProgress => (t.chipInProgress, gc.brass),
      TrainerChipKind.completed => (t.chipCompleted, gc.sage),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: dark ? 0.16 : 0.12),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: AppTheme.f(9,
            weight: FontWeight.w800, color: color, letterSpacing: 0.8),
      ),
    );
  }
}

/// Terracotta unread-count pill (chat messages).
class TrainerCountPill extends StatelessWidget {
  const TrainerCountPill({super.key, required this.count, this.size = 18});

  final int count;
  final double size;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final fg = trainerPrimaryFg(gc, trainerIsDark(context));
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: gc.accent, shape: BoxShape.circle),
      child: Text(
        count > 99 ? '99+' : '$count',
        style: AppTheme.f(size * 0.58, weight: FontWeight.w800, color: fg),
      ),
    );
  }
}

class TrainerProgressBar extends StatelessWidget {
  const TrainerProgressBar({super.key, required this.value, this.color});

  final double value; // 0..1
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return ClipRRect(
      borderRadius: BorderRadius.circular(3),
      child: SizedBox(
        height: 4,
        child: Stack(
          children: [
            ColoredBox(color: gc.mutedFill),
            FractionallySizedBox(
              widthFactor: value.clamp(0.0, 1.0),
              child: ColoredBox(color: color ?? gc.accent),
            ),
          ],
        ),
      ),
    );
  }
}

/// Coach note callout — inset 2px brass bar, "COACH NOTE" label + trainer
/// name, rounded 12 (DECISIONS #4 + polish-pass fix).
class TrainerCoachNote extends StatelessWidget {
  const TrainerCoachNote(
      {super.key, required this.note, required this.trainerName});

  final String note;
  final String trainerName;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: gc.brass.withValues(alpha: dark ? 0.10 : 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: gc.brass.withValues(alpha: 0.25)),
      ),
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 10,
            bottom: 10,
            width: 2.5,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: gc.brass,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(t.coachNote,
                        style: AppTheme.f(9.5,
                            weight: FontWeight.w800,
                            color: gc.brass,
                            letterSpacing: 1.6)),
                    Text(trainerName.toUpperCase(),
                        style: AppTheme.f(9,
                            weight: FontWeight.w700,
                            color: gc.brass.withValues(alpha: 0.75),
                            letterSpacing: 1.2)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  note,
                  style: AppTheme.s(12.5,
                      weight: FontWeight.w500,
                      color: gc.textSecondary,
                      height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Inline workout/exercise attachment card (chat) — 2px accent hairline left
/// edge, 48px warm-gradient thumb, title + meta, "Tap to open".
class TrainerAttachmentCard extends StatelessWidget {
  const TrainerAttachmentCard({
    super.key,
    required this.title,
    required this.meta,
    required this.onOpen,
    this.duration,
  });

  final String title;
  final String meta;
  final VoidCallback onOpen;
  final String? duration;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Pressable(
      onTap: onOpen,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: gc.bgRaised,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: gc.border),
        ),
        child: Stack(
          children: [
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              child: ColoredBox(color: gc.accent),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  TrainerVideoThumb(duration: duration, size: 48),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.f(13,
                              weight: FontWeight.w700, color: gc.text),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          meta,
                          style: AppTheme.f(11,
                              weight: FontWeight.w500,
                              color: gc.textSecondary),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          t.tapToOpen,
                          style: AppTheme.f(11,
                              weight: FontWeight.w700, color: gc.accent),
                        ),
                      ],
                    ),
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

/// Meta line builder: "6 exercises · ~35 min" (mockup meta line).
String trainerExercisesMeta(AppLocalizations t, int count, int minutes) =>
    t.exercisesMeta(count, minutes);

/// Tier-aware 38dp coach disc for the Exercises header (contract t_a9afb1b7):
/// both tiers render the outlined chat glyph — the coach button per Carlos
/// mockup t_ec882f80 — with advanced tiers adding the unread-count pill and
/// opening the trainer hub; free tiers open the consultation sheet.
class ExercisesCoachDisc extends StatelessWidget {
  const ExercisesCoachDisc({
    super.key = const ValueKey('exercises-coach-disc'),
    this.size = 38,
  });

  final double size;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: trainer,
      builder: (context, _) =>
          context.can(kCapCustomExercises) ? _advanced(context) : _consult(context),
    );
  }

  Widget _advanced(BuildContext context) {
    final gc = context.gc;
    return Semantics(
      button: true,
      label: t.myTrainer,
      child: Pressable(
        onTap: () => fit.pushRoute('trainer'),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: size,
              height: size,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [gc.accent, gc.brass],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(PhosphorIconsRegular.chatCircle,
                  size: size * 0.5,
                  color: trainerPrimaryFg(gc, trainerIsDark(context))),
            ),
            if (trainer.unreadTotal > 0)
              Positioned(
                right: -2,
                top: -2,
                child: TrainerCountPill(
                  count: trainer.unreadTotal,
                  size: 17,
                  key: const ValueKey('disc-unread'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _consult(BuildContext context) {
    final gc = context.gc;
    return Semantics(
      button: true,
      label: t.talkToTrainer,
      child: Pressable(
        onTap: () => showConsultationSheet(context),
        child: Container(
          width: size,
          height: size,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: gc.bgRaised, shape: BoxShape.circle),
          child: Icon(PhosphorIconsRegular.chatCircle, size: 19, color: gc.accent),
        ),
      ),
    );
  }
}

/// Shared in-app banner card (notifications.png right frame) — slides in
/// under the top edge and floats over hub / home / exercises (t_fcd4945b).
class TrainerBannerCard extends StatelessWidget {
  const TrainerBannerCard({super.key, required this.banner, required this.onTap});

  final TrainerBanner banner;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 320),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, anim) => SlideTransition(
        position: Tween(begin: const Offset(0, -1.2), end: Offset.zero)
            .animate(anim),
        child: child,
      ),
      child: Pressable(
        key: ValueKey(banner.key),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: gc.bgRaised,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: gc.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: dark ? 0.4 : 0.12),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [gc.accent, gc.brass],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text('B',
                    style: AppTheme.f(14,
                        weight: FontWeight.w900,
                        color: trainerPrimaryFg(gc, dark))),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t.bannerNewWorkout(
                          trainerFirstName(trainer.profile?.displayName ?? '')),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.f(12.5,
                          weight: FontWeight.w800, color: gc.text),
                    ),
                    Text(t.bannerTapToView,
                        style: AppTheme.f(10.5,
                            weight: FontWeight.w500, color: gc.textSecondary)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Single hook that floats the NEW-WORKOUT banner over a tab body (home +
/// exercises, card t_fcd4945b). Advanced tier only and restricted to the
/// workout kind — chat nudges stay hub-only.
class TrainerBannerOverlay extends StatefulWidget {
  const TrainerBannerOverlay({super.key, required this.child});

  final Widget child;

  @override
  State<TrainerBannerOverlay> createState() => _TrainerBannerOverlayState();
}

class _TrainerBannerOverlayState extends State<TrainerBannerOverlay> {
  @override
  void initState() {
    super.initState();
    unawaited(trainer.ensureLoaded());
  }

  /// Like trainer.activeBanner but NEW-WORKOUT only.
  TrainerBanner? _bannerFor(BuildContext context) {
    if (!context.can(kCapCustomExercises)) return null;
    final newWorkout = trainer.assignments.where(trainer.isNewAssignment).toList();
    if (newWorkout.isEmpty) return null;
    final key = 'workout:${newWorkout.first.threadId}';
    if (trainer.dismissedBanners.contains(key)) return null;
    return TrainerBanner(kind: TrainerBannerKind.newWorkout, key: key);
  }

  void _open(TrainerBanner banner) {
    trainer.dismissBanner(banner.key);
    final a = trainer.assignments.firstWhere(
      (x) => trainer.isNewAssignment(x),
      orElse: () => trainer.assignments.first,
    );
    trainer.markAssignmentOpened(a);
    trainer.openAssignmentId = a.id;
    fit.pushRoute('trainer-workout');
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: trainer,
      builder: (context, _) {
        final banner = _bannerFor(context);
        return Stack(
          children: [
            Positioned.fill(child: widget.child),
            if (banner != null)
              Positioned(
                left: 14,
                right: 14,
                top: 8,
                child: TrainerBannerCard(
                  banner: banner,
                  onTap: () => _open(banner),
                ),
              ),
          ],
        );
      },
    );
  }
}
