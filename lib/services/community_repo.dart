/// Local, in-memory Community repository (no backend dependency).
/// Seeded with realistic sample content. Hides future cloud wiring
/// behind this interface so backend wiring later is a zero-UI-change edit.
class CommunityRepo {
  static final _posts = <CommunityPost>[
    CommunityPost(
      id: 'c1',
      authorName: 'Mara K.',
      authorInitials: 'MK',
      timeAgo: '2h',
      type: 'Progress',
      caption: 'Week 8, down 6 kg — first strict pull-up this cycle. Slow and steady.',
      stats: [
        PostStat(label: 'Duration', value: '—'),
        PostStat(label: 'Sets', value: '—'),
        PostStat(label: 'Volume', value: '—'),
      ],
      likeCount: 24,
      commentCount: 8,
      shareCount: 3,
    ),
    CommunityPost(
      id: 'c2',
      authorName: 'Deion',
      authorInitials: 'DE',
      timeAgo: '4h',
      type: 'Workout',
      caption: 'Push Day A — 47 min · 16 sets · PR bench 82.5 kg × 5.',
      stats: [
        PostStat(label: 'Duration', value: '47 min'),
        PostStat(label: 'Sets', value: '16'),
        PostStat(label: 'Volume', value: '1,240 kg'),
      ],
      likeCount: 42,
      commentCount: 15,
      shareCount: 7,
    ),
  ];

  List<CommunityPost> get posts => List.unmodifiable(_posts);

  CommunityPost postById(String id) =>
      _posts.firstWhere((p) => p.id == id, orElse: () => throw StateError('Post $id not found'));

  void addPost(CommunityPost post) => _posts.insert(0, post);
}

class CommunityPost {
  CommunityPost({
    required this.id,
    required this.authorName,
    required this.authorInitials,
    required this.timeAgo,
    required this.type,
    required this.caption,
    required this.stats,
    required this.likeCount,
    required this.commentCount,
    required this.shareCount,
  });

  final String id;
  final String authorName;
  final String authorInitials;
  final String timeAgo;
  final String type;
  final String caption;
  final List<PostStat> stats;
  final int likeCount;
  final int commentCount;
  final int shareCount;
}

class PostStat {
  PostStat({required this.label, required this.value});
  final String label;
  final String value;
}
