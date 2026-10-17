import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../l10n/l10n.dart';
import '../../services/community_repo.dart';
import '../../state/account_gate.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/svg_icon.dart';
import '../../widgets/ui_kit.dart';
import 'community_composer.dart';
import 'community_feed.dart';
import 'community_sheets.dart';

class CommunityPostDetailScreen extends StatefulWidget {
  const CommunityPostDetailScreen({super.key, required this.postId});

  final String postId;

  @override
  State<CommunityPostDetailScreen> createState() => _CommunityPostDetailScreenState();
}

class _CommunityPostDetailScreenState extends State<CommunityPostDetailScreen> {
  final TextEditingController _comment = TextEditingController();

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  void _openEditor(CommunityPost post) {
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => CommunityComposerScreen(editing: post),
    ));
  }

  void _submitComment() {
    final repo = CommunityRepo();
    final text = _comment.text.trim();
    if (text.isEmpty) return;
    final snapshot = AccountGate.instance.snapshot;
    repo.addComment(
      widget.postId,
      authorName: communityDisplayName(snapshot.email),
      authorInitials: communityInitials(snapshot.email),
      authorLevel: 0,
      text: text,
    );
    _comment.clear();
  }

  Widget _commentRow(GymColors gc, CommunityPost post, CommunityComment c) {
    final isOp = c.authorName == post.authorName;
    final row = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MemberAvatar(initials: c.authorInitials, size: 28),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      c.authorName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.f(13, weight: FontWeight.w800, color: gc.text),
                    ),
                  ),
                  if (isOp) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: gc.accentSoft,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        t.opChip,
                        style: AppTheme.f(9, weight: FontWeight.w800, color: gc.accent),
                      ),
                    ),
                  ],
                  const SizedBox(width: 6),
                  Text(
                    communityTimeAgo(c.minutesAgo),
                    style: AppTheme.s(11, weight: FontWeight.w600, color: gc.textTertiary),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              if (c.isReply) ...[
                Text(
                  t.replyingTo(c.replyToName!),
                  style: AppTheme.f(11, weight: FontWeight.w700, color: gc.textTertiary),
                ),
                const SizedBox(height: 2),
              ],
              Text(
                c.text,
                style: AppTheme.s(12.5, weight: FontWeight.w500, color: gc.text, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
    if (!c.isReply) return row;
    return Padding(padding: const EdgeInsets.only(left: 38), child: row);
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final repo = CommunityRepo();
    return Scaffold(
      backgroundColor: gc.pageBg,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: repo,
          builder: (context, _) {
            final post = repo.postById(widget.postId);
            if (post == null || post.hidden) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted && Navigator.of(context).canPop()) Navigator.of(context).pop();
              });
              return const SizedBox.shrink();
            }
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                  child: Row(
                    children: [
                      RoundAction(
                        onTap: () => Navigator.of(context).maybePop(),
                        child: SvgPathIcon(Ic.chevronLeft, size: 18, color: gc.text),
                      ),
                      const Spacer(),
                      RoundAction(
                        onTap: () => showPostOptionsSheet(context, post: post, onEdit: () => _openEditor(post)),
                        child: Icon(PhosphorIconsRegular.dotsThree, size: 16, color: gc.text),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    children: [
                      PostCard(
                        post: post,
                        detail: true,
                        onOptions: () =>
                            showPostOptionsSheet(context, post: post, onEdit: () => _openEditor(post)),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        '${t.commentsTitle} ${post.commentCount}',
                        style: AppTheme.f(16, weight: FontWeight.w800, color: gc.text),
                      ),
                      const SizedBox(height: 12),
                      for (final c in post.comments) ...[
                        _commentRow(gc, post, c),
                        const SizedBox(height: 14),
                      ],
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 44,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: gc.bgRaised2,
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: gc.border),
                          ),
                          child: TextField(
                            controller: _comment,
                            style: AppTheme.s(13, weight: FontWeight.w500, color: gc.text),
                            decoration: InputDecoration(
                              isCollapsed: true,
                              border: InputBorder.none,
                              hintText: t.addCommentHint,
                              hintStyle: AppTheme.s(13, weight: FontWeight.w500, color: gc.textTertiary),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      RoundAction(
                        filled: true,
                        size: 40,
                        onTap: _submitComment,
                        child: Icon(PhosphorIconsRegular.paperPlaneRight, size: 16, color: gc.onEmber),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
