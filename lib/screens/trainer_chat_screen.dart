// Trainer chat — 1:1 thread (card t_d788f36e). Trainer left on surface-2,
// client right on terracotta (radius 16, 4px tail corner); workouts and
// exercises travel as inline attachment cards (2px accent hairline); day
// dividers; micro timestamps with a sage double-check on the thread's most
// recent send; composer with terracotta send button.
// Mockup: trainer-chat.png. Contract seam: chat:getThread / sendMessage /
// markRead (CONTRACT.md §5).

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../services/trainer_data.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class TrainerChatScreen extends StatefulWidget {
  const TrainerChatScreen({super.key});

  @override
  State<TrainerChatScreen> createState() => _TrainerChatScreenState();
}

class _TrainerChatScreenState extends State<TrainerChatScreen> {
  List<TrainerChatMessage> _messages = [];
  bool _loaded = false;
  final _composer = TextEditingController();

  String get _threadId => trainer.openThreadId ?? 'thr_chat_marcus';

  @override
  void initState() {
    super.initState();
    _load(markRead: true);
  }

  @override
  void dispose() {
    _composer.dispose();
    super.dispose();
  }

  Future<void> _load({bool markRead = false}) async {
    await trainer.ensureLoaded();
    if (markRead) await trainer.markThreadRead(_threadId);
    final msgs = await trainer.repo.chatGetThread(_threadId);
    if (!mounted) return;
    setState(() {
      _messages = msgs;
      _loaded = true;
    });
  }

  Future<void> _send() async {
    final text = _composer.text.trim();
    if (text.isEmpty) return;
    _composer.clear();
    await trainer.sendMessage(text);
    final msgs = await trainer.repo.chatGetThread(_threadId);
    if (!mounted) return;
    setState(() => _messages = msgs);
  }

  void _openCard(TrainerMessageCard card) {
    if (card.isWorkout && card.assignmentId != null) {
      trainer.openAssignmentId = card.assignmentId;
      fit.pushRoute('trainer-workout');
      return;
    }
    // Exercise card: tombstone-tolerant v0 — open the assignment that owns
    // the video when we can find it (offline seeds), otherwise stay put.
    final videoId = card.videoId;
    if (videoId == null) return;
    for (final a in trainer.assignments) {
      if (a.exercises.any((e) => e.videoId == videoId)) {
        trainer.openAssignmentId = a.id;
        fit.pushRoute('trainer-workout');
        return;
      }
    }
  }

  String _cardMeta(TrainerMessageCard card) {
    if (card.isWorkout) {
      // Resolve live numbers from the owning assignment when available;
      // fall back to the denormalized card payload (deleted-version tombstones).
      TrainerAssignment? a;
      for (final x in trainer.assignments) {
        if (x.id == card.assignmentId) a = x;
      }
      return trainerExercisesMeta(
        t,
        a?.exercises.length ?? card.exerciseCount ?? 0,
        a?.estimatedMinutes ?? card.estimatedMinutes ?? 0,
      );
    }
    return t.trainerVideoMeta(card.thumbDuration ?? '');
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    final profile = trainer.profile;
    final clientSideId = LocalTrainerRepository.clientId;

    if (!_loaded) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
              child: Row(
                children: [
                  RoundBtn(icon: Ic.chevronLeft, onTap: () => fit.popRoute()),
                  const SizedBox(width: 12),
                  TrainerAvatarDisc(initials: profile?.initials ?? '—', size: 38),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(profile?.displayName ?? '',
                            style: AppTheme.f(15,
                                weight: FontWeight.w800, color: gc.text)),
                        Text(
                          profile == null
                              ? ''
                              : t.replyWindow(profile.replyWindowHours),
                          style: AppTheme.f(11,
                              weight: FontWeight.w500, color: gc.textTertiary),
                        ),
                      ],
                    ),
                  ),
                  Icon(PhosphorIconsRegular.phone,
                      size: 20, color: gc.textTertiary),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                reverse: true,
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 12),
                itemCount: _messages.length,
                itemBuilder: (context, i) {
                  // reversed index -> chronological
                  final idx = _messages.length - 1 - i;
                  final m = _messages[idx];
                  final prev = idx > 0 ? _messages[idx - 1] : null;
                  return _bubble(
                    context,
                    gc,
                    dark,
                    m,
                    mine: m.senderId == clientSideId,
                    latest: idx == _messages.length - 1,
                    showDayDivider: prev == null ||
                        !_sameDay(prev.createdAt, m.createdAt),
                  );
                },
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(
                  16, 10, 16, 10 + MediaQuery.paddingOf(context).bottom),
              decoration: BoxDecoration(
                color: gc.bg,
                border: Border(top: BorderSide(color: gc.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _composer,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      style: AppTheme.s(13.5, color: gc.text),
                      decoration: InputDecoration(
                        hintText: t.messageHint(
                            trainerFirstName(profile?.displayName ?? '')),
                        hintStyle:
                            AppTheme.f(13, weight: FontWeight.w500, color: gc.textTertiary),
                        filled: true,
                        fillColor: gc.bgRaised,
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(100),
                          borderSide: BorderSide(color: gc.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(100),
                          borderSide: BorderSide(color: gc.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(100),
                          borderSide: BorderSide(color: gc.accent),
                        ),
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Pressable(
                    onTap: _send,
                    child: Container(
                      width: 42,
                      height: 42,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: gc.accent,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(PhosphorIconsFill.paperPlaneRight,
                          size: 19, color: trainerPrimaryFg(gc, dark)),
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

  bool _sameDay(int a, int b) {
    final da = DateTime.fromMillisecondsSinceEpoch(a);
    final db = DateTime.fromMillisecondsSinceEpoch(b);
    return da.year == db.year && da.month == db.month && da.day == db.day;
  }

  Widget _bubble(BuildContext context, GymColors gc, bool dark, TrainerChatMessage m,
      {required bool mine, required bool latest, required bool showDayDivider}) {
    final isCard = m.type != TrainerMessageType.text;
    final bg = mine ? gc.accent : gc.bgRaised;
    final fg = mine ? trainerPrimaryFg(gc, dark) : gc.text;
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(16),
      topRight: const Radius.circular(16),
      bottomLeft: Radius.circular(mine ? 16 : 4),
      bottomRight: Radius.circular(mine ? 4 : 16),
    );

    final sent = DateTime.fromMillisecondsSinceEpoch(m.createdAt);

    final Widget content = isCard
        ? TrainerAttachmentCard(
            title: m.card?.title ?? '',
            meta: _cardMeta(m.card!),
            duration: m.card?.thumbDuration,
            onOpen: () => _openCard(m.card!),
          )
        : Text(
            m.body ?? '',
            style: AppTheme.s(13.5, weight: FontWeight.w500, color: fg, height: 1.42),
          );

    final Widget bubble = Container(
      padding: isCard
          ? const EdgeInsets.fromLTRB(3, 3, 3, 3)
          : const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
      decoration: BoxDecoration(color: bg, borderRadius: radius),
      child: content,
    );

    final Widget timeRow = Padding(
      padding: EdgeInsets.only(top: 4, left: mine ? 0 : 36, right: mine ? 4 : 0),
      child: Row(
        mainAxisAlignment:
            mine ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          Text(
            t.shortTime(sent),
            style: AppTheme.f(9.5, weight: FontWeight.w600, color: gc.textTertiary),
          ),
          if (latest) ...[
            const SizedBox(width: 4),
            Icon(PhosphorIconsFill.checks, size: 11, color: gc.sage),
          ],
        ],
      ),
    );

    final Widget message = Column(
      crossAxisAlignment:
          mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!mine) ...[
              TrainerAvatarDisc(initials: trainer.profile?.initials ?? '—', size: 26),
              const SizedBox(width: 8),
            ],
            Flexible(child: bubble),
          ],
        ),
        timeRow,
      ],
    );

    return Column(
      children: [
        if (showDayDivider)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Center(
              child: Text(
                _dayDividerLabel(sent),
                style: AppTheme.f(10,
                    weight: FontWeight.w800,
                    color: gc.textTertiary,
                    letterSpacing: 2),
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: message,
        ),
      ],
    );
  }

  String _dayDividerLabel(DateTime d) {
    final now = DateTime.now();
    final isToday = now.year == d.year && now.month == d.month && now.day == d.day;
    return isToday ? t.todayDivider : t.shortDate(d);
  }
}
