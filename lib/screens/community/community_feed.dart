import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../services/community_repo.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui_kit.dart';

class CommunityFeedScreen extends StatelessWidget {
  const CommunityFeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final repo = CommunityRepo();
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: gc.bg,
            title: Text('Community', style: AppTheme.f(16, weight: FontWeight.w800, color: gc.text)),
            actions: [
              IconButton(
                icon: Icon(PhosphorIconsRegular.plus, size: 22, color: gc.accent),
                onPressed: () {},
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _PostCard(post: repo.posts[index]),
                ),
                childCount: repo.posts.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post});
  final CommunityPost post;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: gc.accentSoft,
                child: Text(
                  post.authorInitials,
                  style: AppTheme.f(11, weight: FontWeight.w800, color: gc.accent),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(post.authorName, style: AppTheme.f(14, weight: FontWeight.w600, color: gc.text)),
                    const SizedBox(height: 1),
                    Text(post.timeAgo, style: AppTheme.f(11, weight: FontWeight.w500, color: gc.textSecondary)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: post.type == 'Progress' ? gc.sageSoft : Color(0xFF3B2C1A),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  post.type,
                  style: AppTheme.f(10, weight: FontWeight.w700, color: post.type == 'Progress' ? gc.sage : gc.accent),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(post.caption, style: AppTheme.f(14.5, weight: FontWeight.w400, color: gc.text)),
          const SizedBox(height: 10),
          if (post.stats.isNotEmpty)
            Row(
              children: [
                for (final s in post.stats) ...[
                  Text('${s.label}: ${s.value}', style: AppTheme.f(12, weight: FontWeight.w600, color: gc.textSecondary)),
                  const SizedBox(width: 16),
                ],
              ],
            ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Icon(PhosphorIconsRegular.heart, size: 18, color: gc.textSecondary),
              const SizedBox(width: 4),
              Text('${post.likeCount}', style: AppTheme.f(13, weight: FontWeight.w600, color: gc.textSecondary)),
              const SizedBox(width: 16),
              Icon(PhosphorIconsRegular.chatCircle, size: 18, color: gc.textSecondary),
              const SizedBox(width: 4),
              Text('${post.commentCount}', style: AppTheme.f(13, weight: FontWeight.w600, color: gc.textSecondary)),
              const SizedBox(width: 16),
              Icon(PhosphorIconsRegular.share, size: 18, color: gc.textSecondary),
              const SizedBox(width: 4),
              Text('${post.shareCount}', style: AppTheme.f(13, weight: FontWeight.w600, color: gc.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}
