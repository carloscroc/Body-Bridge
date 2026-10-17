// My Trainer home (card t_d788f36e) — trainer intro card, assigned custom
// workouts with state chips + progress, unread chat count pill, in-app
// notification banner, and the Advanced gate state for lower tiers.
// Mockups: trainer-home.png + notifications.png (right frame) + advanced-gate.png.

import 'dart:async';
import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';

import '../constants/billing.dart';
import '../l10n/l10n.dart';
import '../services/trainer_data.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/premium_gate.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_gate_sheet.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class TrainerHomeScreen extends StatefulWidget {
  const TrainerHomeScreen({super.key});

  @override
  State<TrainerHomeScreen> createState() => _TrainerHomeScreenState();
}

class _TrainerHomeScreenState extends State<TrainerHomeScreen> {
  bool _gateOffered = false;

  @override
  void initState() {
    super.initState();
    unawaited(
      trainer.ensureLoaded().then((_) {
        if (mounted && context.can(kCapCustomExercises)) trainer.markListSeen();
      }),
    );
  }

  void _openWorkout(TrainerAssignment a) {
    trainer.markAssignmentOpened(a);
    trainer.openAssignmentId = a.id;
    fit.pushRoute('trainer-workout');
  }

  void _openChat() {
    if (!context.can(kCapCustomExercises)) {
      showTrainerGate(context);
      return;
    }
    trainer.openThreadId = trainer.threads.isNotEmpty ? trainer.threads.first.id : null;
    fit.pushRoute('trainer-chat');
  }

  void _offerGateIfNeeded(bool unlocked) {
    if (unlocked || _gateOffered || !mounted) return;
    _gateOffered = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) showTrainerGate(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final unlocked = context.can(kCapCustomExercises);
    _offerGateIfNeeded(unlocked);

    return AnimatedBuilder(
      animation: trainer,
      builder: (context, _) {
        final profile = trainer.profile;
        final unread = trainer.unreadTotal;
        final banner = unlocked ? trainer.activeBanner : null;

        Widget content = SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            clipBehavior: Clip.none,
            // The in-app banner slides in UNDER the status bar over the tab;
            // when it is up, the page content starts below it (mockup:
            // notifications.png right frame — banner above "My Trainer").
            padding: EdgeInsets.fromLTRB(20, banner == null ? 14 : 84, 20, 116),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    RoundBtn(icon: Ic.chevronLeft, onTap: () => fit.popRoute()),
                    const SizedBox(width: 12),
                    Expanded(child: ScreenTitle(t.myTrainer, size: 24)),
                    if (unlocked && unread > 0) TrainerCountPill(count: unread),
                  ],
                ),
                const SizedBox(height: 16),
                _introCard(context, gc, profile, unread, unlocked),
                if (unlocked) ...[
                  const SizedBox(height: 26),
                  Kicker(t.assignedWorkouts, color: gc.textTertiary, size: 10.5),
                  const SizedBox(height: 12),
                  for (final a in trainer.assignments) ...[
                    _assignmentCard(context, gc, a),
                    const SizedBox(height: 12),
                  ],
                ],
              ],
            ),
          ),
        );

        // Gate state: the approved mockup shows the sheet over a blurred
        // trainer surface — blur the intro surface but keep the Message
        // button tappable (the mockup's chat-entry gate opens from it).
        if (!unlocked) {
          content = ImageFiltered(imageFilter: ImageFilter.blur(sigmaX: 12, sigmaY: 12), child: content);
        }

        return Stack(
          children: [
            Positioned.fill(child: content),
            if (banner != null) _banner(context, banner),
          ],
        );
      },
    );
  }

  Widget _introCard(BuildContext context, GymColors gc, TrainerProfile? profile, int unread, bool unlocked) {
    final name = profile?.displayName ?? '—';
    return SoftCard(
      radius: 20,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              TrainerAvatarDisc(initials: profile?.initials ?? '—', size: 46),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: AppTheme.f(15, weight: FontWeight.w800, color: gc.text),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      profile?.credential ?? '',
                      style: AppTheme.f(11.5, weight: FontWeight.w500, color: gc.textSecondary),
                    ),
                    if (profile != null)
                      Text(
                        t.trainerSince(t.monthYear(profile.memberSince)),
                        style: AppTheme.f(10.5, weight: FontWeight.w500, color: gc.textTertiary),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Align(
            alignment: Alignment.centerLeft,
            child: Pressable(
              onTap: unlocked ? _openChat : () => showTrainerGate(context),
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                decoration: BoxDecoration(
                  color: trainerPrimaryBg(gc, trainerIsDark(context)),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      t.messageTrainer,
                      style: AppTheme.f(
                        13,
                        weight: FontWeight.w800,
                        color: trainerPrimaryFg(gc, trainerIsDark(context)),
                      ),
                    ),
                    if (unlocked && unread > 0) ...[
                      const SizedBox(width: 8),
                      TrainerCountPill(count: unread, size: 17, key: const ValueKey('message-pill')),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _assignmentCard(BuildContext context, GymColors gc, TrainerAssignment a) {
    final progress = trainer.progressOf(a);
    final kind = progress >= 1
        ? TrainerChipKind.completed
        : (progress > 0 || trainer.openedThreads.contains(a.threadId)
              ? TrainerChipKind.inProgress
              : TrainerChipKind.isNew);
    return Pressable(
      onTap: () => _openWorkout(a),
      child: SoftCard(
        radius: 18,
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    a.kicker,
                    overflow: TextOverflow.ellipsis,
                    style: AppTheme.f(
                      9.5,
                      weight: FontWeight.w800,
                      color: gc.textTertiary,
                      letterSpacing: 1.6,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                TrainerStateChip(kind: kind),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              a.title,
              style: AppTheme.f(14.5, weight: FontWeight.w800, color: gc.text),
            ),
            const SizedBox(height: 4),
            Text(
              t.sentCardMeta(
                t.shortDate(DateTime.fromMillisecondsSinceEpoch(a.createdAt)),
                a.exercises.length,
                a.estimatedMinutes ?? 0,
              ),
              style: AppTheme.f(11.5, weight: FontWeight.w500, color: gc.textSecondary),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TrainerProgressBar(
                    value: progress,
                    color: kind == TrainerChipKind.completed ? gc.sage : null,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  t.progressPct((progress * 100).round()),
                  style: AppTheme.f(10, weight: FontWeight.w700, color: gc.textTertiary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// In-app top banner (notifications.png right frame): slides in under the
  /// status bar over My Trainer while the app is awake. Visuals live in the
  /// shared [TrainerBannerCard]; the hub keeps both banner kinds.
  Widget _banner(BuildContext context, TrainerBanner banner) {
    final isNewWorkout = banner.kind == TrainerBannerKind.newWorkout;
    return Positioned(
      left: 14,
      right: 14,
      top: 8,
      child: TrainerBannerCard(
        banner: banner,
        onTap: () {
          trainer.dismissBanner(banner.key);
          if (isNewWorkout) {
            final a = trainer.assignments.firstWhere(
              (x) => trainer.isNewAssignment(x),
              orElse: () => trainer.assignments.first,
            );
            _openWorkout(a);
          } else {
            _openChat();
          }
        },
      ),
    );
  }
}
