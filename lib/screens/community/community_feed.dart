import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../l10n/l10n.dart';
import '../../services/community_repo.dart';
import '../../state/account_gate.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui_kit.dart';
import 'community_composer.dart';
import 'community_gate.dart';
import 'community_post_detail.dart';
import 'community_sheets.dart';

const List<Color> kTerracottaPlaceholder = [Color(0xFFD9A184), Color(0xFFB98F72)];
const List<Color> kSagePlaceholder = [Color(0xFF8FA377), Color(0xFF56634A)];

String communityTimeAgo(int minutes) {
  if (minutes < 1) return t.timeAgoNow;
  if (minutes < 60) return t.timeAgoMinutes(minutes);
  if (minutes < 1440) return t.timeAgoHours(minutes ~/ 60);
  return t.timeAgoDays(minutes ~/ 1440);
}

/// Thousands grouping without intl: 6140 -> '6,140'.
String formatCommunityVolume(int kg) {
  final s = kg.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    buf.write(s[i]);
    final rest = s.length - 1 - i;
    if (rest > 0 && rest % 3 == 0) buf.write(',');
  }
  return buf.toString();
}

/// Segmented control matching the mockup: raised pill on the active side.
class CommunitySeg extends StatelessWidget {
  const CommunitySeg({super.key, required this.options});

  final List<SegOption> options;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(100)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final o in options)
            GestureDetector(
              onTap: o.onTap,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                curve: Curves.easeOut,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                decoration: BoxDecoration(
                  color: o.selected ? gc.bgRaised : Colors.transparent,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  o.label,
                  style: AppTheme.f(
                    12.5,
                    weight: o.selected ? FontWeight.w800 : FontWeight.w600,
                    color: o.selected ? gc.text : gc.textSecondary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class MemberAvatar extends StatelessWidget {
  const MemberAvatar({super.key, required this.initials, this.trainer = false, this.size = 36});

  final String initials;
  final bool trainer;
  final double size;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final avatar = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: gc.mutedFill, shape: BoxShape.circle),
      child: Text(
        initials,
        style: AppTheme.f(size * 0.34, weight: FontWeight.w800, color: gc.text),
      ),
    );
    if (!trainer) return avatar;
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: gc.sage, width: 1.4),
      ),
      child: avatar,
    );
  }
}

class LevelBadge extends StatelessWidget {
  const LevelBadge({super.key, required this.level});

  final int level;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: gc.brass.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text('$level', style: AppTheme.f(10, weight: FontWeight.w800, color: gc.brass)),
    );
  }
}

class TrainerChip extends StatelessWidget {
  const TrainerChip({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: gc.sage.withValues(alpha: 0.6)),
      ),
      child: Text(
        t.trainerChip,
        style: AppTheme.f(9.5, weight: FontWeight.w800, color: gc.sage, letterSpacing: 1.2),
      ),
    );
  }
}

class KindChip extends StatelessWidget {
  const KindChip({super.key, required this.kind});

  final PostKind kind;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final progress = kind == PostKind.progress;
    final color = progress ? gc.accent : gc.sage;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        progress ? t.progressChip : t.workoutChip,
        style: AppTheme.f(9.5, weight: FontWeight.w800, color: color, letterSpacing: 1.4),
      ),
    );
  }
}

class PlaceholderTile extends StatelessWidget {
  const PlaceholderTile({super.key, this.sage = false});

  final bool sage;

  @override
  Widget build(BuildContext context) {
    final colors = sage ? kSagePlaceholder : kTerracottaPlaceholder;
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: colors,
              ),
            ),
          ),
          Center(
            child: Icon(PhosphorIconsRegular.user, size: 22, color: Colors.white.withValues(alpha: 0.5)),
          ),
          Positioned(
            left: 10,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.28),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                t.progressPhotoLabel.toUpperCase(),
                style: AppTheme.f(
                  8.5,
                  weight: FontWeight.w800,
                  color: Colors.white.withValues(alpha: 0.92),
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MediaTiles extends StatelessWidget {
  const MediaTiles({super.key, required this.media});

  final List<MediaPlaceholder> media;

  @override
  Widget build(BuildContext context) {
    if (media.length == 1) {
      return AspectRatio(aspectRatio: 16 / 10, child: PlaceholderTile(sage: media.first.sage));
    }
    return Row(
      children: [
        for (var i = 0; i < media.length && i < 2; i++) ...[
          if (i > 0) const SizedBox(width: 6),
          Expanded(child: AspectRatio(aspectRatio: 1, child: PlaceholderTile(sage: media[i].sage))),
        ],
      ],
    );
  }
}

class WorkoutTile extends StatelessWidget {
  const WorkoutTile({super.key, required this.workout});

  final WorkoutSummary workout;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return SoftCard(
      radius: 14,
      color: gc.bgRaised2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(workout.title, style: AppTheme.f(14.5, weight: FontWeight.w800, color: gc.text)),
          const SizedBox(height: 2),
          Text(
            t.workoutStats(workout.minutes, workout.sets, formatCommunityVolume(workout.volumeKg)),
            style: AppTheme.s(11.5, weight: FontWeight.w600, color: gc.textSecondary),
          ),
          const SizedBox(height: 10),
          Divider(height: 1, thickness: 1, color: gc.border),
          const SizedBox(height: 10),
          WorkoutRows(workout: workout),
        ],
      ),
    );
  }
}

class WorkoutRows extends StatelessWidget {
  const WorkoutRows({super.key, required this.workout});

  final WorkoutSummary workout;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Column(
      children: [
        for (var i = 0; i < workout.rows.length; i++) ...[
          if (i > 0) const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  workout.rows[i].name,
                  style: AppTheme.f(12.5, weight: FontWeight.w700, color: gc.text),
                ),
              ),
              Text(
                '${workout.rows[i].scheme} @ ${workout.rows[i].weight}',
                style: AppTheme.s(12, weight: FontWeight.w600, color: gc.textSecondary),
              ),
              if (workout.rows[i].pr) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: gc.accent.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    t.prChip,
                    style: AppTheme.f(9, weight: FontWeight.w800, color: gc.accent, letterSpacing: 1),
                  ),
                ),
              ],
            ],
          ),
        ],
      ],
    );
  }
}

class GhostPill extends StatelessWidget {
  const GhostPill({super.key, required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Pressable(
      onTap: onTap,
      child: Container(
        height: 46,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: gc.border),
        ),
        child: Text(label, style: AppTheme.f(14, weight: FontWeight.w700, color: gc.textSecondary)),
      ),
    );
  }
}

class _StatButton extends StatelessWidget {
  const _StatButton({required this.icon, required this.color, required this.label, this.onTap});

  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 17, color: color),
            const SizedBox(width: 6),
            Text(label, style: AppTheme.f(12.5, weight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}

class PostCard extends StatelessWidget {
  const PostCard({
    super.key,
    required this.post,
    this.onOpen,
    this.onOptions,
    this.detail = false,
  });

  final CommunityPost post;
  final VoidCallback? onOpen;
  final VoidCallback? onOptions;
  final bool detail;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return SoftCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              MemberAvatar(initials: post.authorInitials, trainer: post.authorTrainer),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            post.authorName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTheme.f(14, weight: FontWeight.w800, color: gc.text),
                          ),
                        ),
                        const SizedBox(width: 6),
                        LevelBadge(level: post.authorLevel),
                        if (post.authorTrainer) ...[
                          const SizedBox(width: 6),
                          const TrainerChip(),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          communityTimeAgo(post.minutesAgo),
                          style: AppTheme.s(11.5, weight: FontWeight.w600, color: gc.textTertiary),
                        ),
                        const SizedBox(width: 8),
                        KindChip(kind: post.kind),
                      ],
                    ),
                  ],
                ),
              ),
              if (onOptions != null)
                RoundAction(
                  onTap: onOptions!,
                  child: Icon(PhosphorIconsRegular.dotsThree, size: 16, color: gc.textSecondary),
                ),
            ],
          ),
          if (post.workout != null) ...[
            const SizedBox(height: 12),
            WorkoutTile(workout: post.workout!),
          ],
          if (post.media.isNotEmpty) ...[
            const SizedBox(height: 12),
            MediaTiles(media: post.media),
          ],
          if (post.caption.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              post.caption,
              style: AppTheme.s(13, weight: FontWeight.w500, color: gc.text, height: 1.4),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatButton(
                  icon: post.liked ? PhosphorIconsFill.heart : PhosphorIconsRegular.heart,
                  color: post.liked ? gc.accent : gc.textSecondary,
                  label: '${post.likeCount}',
                  onTap: () => CommunityRepo().toggleLike(post.id),
                ),
              ),
              Expanded(
                child: _StatButton(
                  icon: PhosphorIconsRegular.chatCircle,
                  color: gc.textSecondary,
                  label: '${post.commentCount}',
                  onTap: detail ? null : onOpen,
                ),
              ),
              if (detail)
                Expanded(
                  child: _StatButton(
                    icon: PhosphorIconsRegular.shareNetwork,
                    color: gc.textSecondary,
                    label: '${post.shareCount}',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({super.key});

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  bool _members = false;

  void _openComposer({CommunityPost? editing}) {
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => CommunityComposerScreen(editing: editing),
    ));
  }

  void _openComposerEntry() {
    final snapshot = AccountGate.instance.snapshot;
    if (!communityUnlocked(snapshot)) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(t.composeDisabledHint)));
      return;
    }
    _openComposer();
  }

  void _openDetail(String postId) {
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => CommunityPostDetailScreen(postId: postId),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final repo = CommunityRepo();
    return CommunityGate(
      child: Scaffold(
        backgroundColor: gc.pageBg,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 16, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'BODY BRIDGE',
                            style: AppTheme.f(11, weight: FontWeight.w800, color: gc.brass, letterSpacing: 3),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            t.communityTab,
                            style: AppTheme.f(28, weight: FontWeight.w800, color: gc.text, letterSpacing: -0.5),
                          ),
                        ],
                      ),
                    ),
                    RoundAction(
                      onTap: () {
                        ScaffoldMessenger.of(context)
                          ..hideCurrentSnackBar()
                          ..showSnackBar(SnackBar(content: Text(t.inboxComingSoon)));
                      },
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Icon(PhosphorIconsRegular.chatCircle, size: 18, color: gc.text),
                          Positioned(
                            right: -5,
                            top: -5,
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(color: gc.ember, shape: BoxShape.circle),
                              child: Text(
                                '2',
                                style: AppTheme.f(8, weight: FontWeight.w800, color: gc.onEmber),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    RoundAction(
                      filled: true,
                      onTap: _openComposerEntry,
                      child: Icon(PhosphorIconsRegular.plus, size: 16, color: gc.onEmber),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: CommunitySeg(
                  options: [
                    SegOption(t.feedTab, !_members, () => setState(() => _members = false)),
                    SegOption(t.membersTab, _members, () => setState(() => _members = true)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: AnimatedBuilder(
                  animation: repo,
                  builder: (context, _) => _members
                      ? MembersList(members: repo.members)
                      : FeedList(
                          posts: repo.posts,
                          onOpen: _openDetail,
                          onOptions: (post) => showPostOptionsSheet(
                            context,
                            post: post,
                            onEdit: () => _openComposer(editing: post),
                          ),
                          onCompose: _openComposerEntry,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class FeedList extends StatelessWidget {
  const FeedList({
    super.key,
    required this.posts,
    required this.onOpen,
    required this.onOptions,
    required this.onCompose,
  });

  final List<CommunityPost> posts;
  final ValueChanged<String> onOpen;
  final ValueChanged<CommunityPost> onOptions;
  final VoidCallback onCompose;

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      final gc = context.gc;
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(color: gc.accentSoft, shape: BoxShape.circle),
                child: Icon(PhosphorIconsRegular.chatCircle, size: 22, color: gc.accent),
              ),
              const SizedBox(height: 14),
              Text(t.noPostsTitle, style: AppTheme.f(18, weight: FontWeight.w800, color: gc.text)),
              const SizedBox(height: 6),
              Text(
                t.noPostsBody,
                textAlign: TextAlign.center,
                style: AppTheme.s(13, weight: FontWeight.w500, color: gc.textSecondary),
              ),
              const SizedBox(height: 16),
              GhostPill(label: t.createFirstPost, onTap: onCompose),
            ],
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      itemCount: posts.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, i) {
        final post = posts[i];
        return PostCard(
          post: post,
          onOpen: () => onOpen(post.id),
          onOptions: () => onOptions(post),
        );
      },
    );
  }
}

class MembersList extends StatelessWidget {
  const MembersList({super.key, required this.members});

  final List<CommunityMember> members;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      children: [
        SoftCard(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              for (var i = 0; i < members.length; i++) ...[
                if (i > 0) ...[
                  const SizedBox(height: 12),
                  Divider(height: 1, thickness: 1, color: gc.border),
                  const SizedBox(height: 12),
                ],
                Row(
                  children: [
                    MemberAvatar(
                      initials: members[i].initials,
                      trainer: members[i].trainer,
                      size: 44,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  members[i].name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppTheme.f(14, weight: FontWeight.w800, color: gc.text),
                                ),
                              ),
                              const SizedBox(width: 6),
                              LevelBadge(level: members[i].level),
                              if (members[i].trainer) ...[
                                const SizedBox(width: 6),
                                const TrainerChip(),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            members[i].bio,
                            style: AppTheme.s(12, weight: FontWeight.w500, color: gc.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
