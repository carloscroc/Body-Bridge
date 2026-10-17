import 'package:flutter/foundation.dart' show ChangeNotifier;

import 'package:gymmane/services/local_store.dart';

/// Kind of a community post.
enum PostKind { progress, workout }

/// Placeholder media tile (community media ships without real images).
class MediaPlaceholder {
  const MediaPlaceholder({this.sage = false});

  /// Sage-gradient variant; the default is the terracotta gradient.
  final bool sage;
}

/// One exercise line inside a workout summary tile.
class ExerciseRow {
  const ExerciseRow({
    required this.name,
    required this.scheme,
    required this.weight,
    this.pr = false,
  });

  final String name;
  final String scheme;
  final String weight;
  final bool pr;
}

/// Workout summary attached to a post or the composer preview.
class WorkoutSummary {
  const WorkoutSummary({
    required this.title,
    required this.minutes,
    required this.sets,
    required this.volumeKg,
    required this.rows,
  });

  final String title;
  final int minutes;
  final int sets;
  final int volumeKg;
  final List<ExerciseRow> rows;
}

/// A comment on a community post. Replies carry [replyToName].
class CommunityComment {
  const CommunityComment({
    required this.id,
    required this.authorName,
    required this.authorInitials,
    required this.authorLevel,
    required this.minutesAgo,
    required this.text,
    this.replyToName,
  });

  final String id;
  final String authorName;
  final String authorInitials;
  final int authorLevel;
  final int minutesAgo;
  final String text;
  final String? replyToName;

  bool get isReply => replyToName != null;
}

/// A community post. Mutable fields back the local-only actions.
class CommunityPost {
  CommunityPost({
    required this.id,
    required this.authorName,
    required this.authorInitials,
    this.authorLevel = 0,
    this.authorTrainer = false,
    required this.minutesAgo,
    required this.kind,
    required this.caption,
    this.media = const [],
    this.workout,
    this.slug = '',
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    this.isOwn = false,
    List<CommunityComment>? comments,
  }) : comments = comments ?? <CommunityComment>[];

  final String id;
  final String authorName;
  final String authorInitials;
  final int authorLevel;
  final bool authorTrainer;
  final int minutesAgo;
  final PostKind kind;
  String caption;
  final List<MediaPlaceholder> media;
  final WorkoutSummary? workout;
  final String slug;
  int likeCount;
  int commentCount;
  int shareCount;
  bool liked = false;
  bool saved = false;
  bool hidden = false;
  bool reported = false;
  final bool isOwn;
  final List<CommunityComment> comments;
}

/// A member shown on the Members tab.
class CommunityMember {
  const CommunityMember({
    required this.name,
    required this.initials,
    required this.level,
    this.trainer = false,
    required this.bio,
  });

  final String name;
  final String initials;
  final int level;
  final bool trainer;
  final String bio;
}

/// Display name derived from the account email (local-only community).
String communityDisplayName(String? email) {
  if (email == null || email.isEmpty) return 'B.B.';
  final local = email.split('@').first;
  final clean = local.replaceAll(RegExp(r'[._\-+0-9]+'), ' ').trim();
  if (clean.isEmpty) return 'B.B.';
  return clean
      .split(RegExp(r'\s+'))
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}

/// Initials derived from the account email (local-only community).
String communityInitials(String? email) {
  final name = communityDisplayName(email);
  if (name == 'B.B.') return 'BB';
  final parts = name.split(RegExp(r'\s+'));
  if (parts.length == 1) {
    final w = parts.first;
    return w.length < 2 ? w.toUpperCase() : w.substring(0, 2).toUpperCase();
  }
  return (parts.first[0] + parts.last[0]).toUpperCase();
}

/// Local community state: seeded posts, members and today's session.
/// Every mutation stays in memory — no network, no persistence.
class CommunityRepo extends ChangeNotifier {
  CommunityRepo._();

  static final CommunityRepo instance = CommunityRepo._();

  factory CommunityRepo() => instance;

  final List<CommunityPost> _posts = _seed();
  final List<CommunityMember> members = _seedMembers();
  WorkoutSummary todaysSession = _pushDayA();

  /// Visible posts, newest first, hidden ones removed.
  List<CommunityPost> get posts =>
      List.unmodifiable(_posts.where((p) => !p.hidden));

  CommunityPost? postById(String id) {
    for (final p in _posts) {
      if (p.id == id) return p;
    }
    return null;
  }

  void addPost(CommunityPost post) {
    _posts.insert(0, post);
    _persist();
    notifyListeners();
  }

  void editPost(String id, String caption) {
    postById(id)?.caption = caption;
    _persist();
    notifyListeners();
  }

  void removePost(String id) {
    _posts.removeWhere((p) => p.id == id);
    _persist();
    notifyListeners();
  }

  void toggleLike(String id) {
    final p = postById(id);
    if (p == null) return;
    p.liked = !p.liked;
    p.likeCount += p.liked ? 1 : -1;
    _persist();
    notifyListeners();
  }

  void toggleSave(String id) {
    final p = postById(id);
    if (p == null) return;
    p.saved = !p.saved;
    _persist();
    notifyListeners();
  }

  void hidePost(String id) {
    final p = postById(id);
    if (p == null) return;
    p.hidden = true;
    _persist();
    notifyListeners();
  }

  void unhidePost(String id) {
    final p = postById(id);
    if (p == null) return;
    p.hidden = false;
    _persist();
    notifyListeners();
  }

  void reportPost(String id) {
    final p = postById(id);
    if (p == null) return;
    p.reported = true;
    _persist();
    notifyListeners();
  }

  void addComment(
    String postId, {
    required String authorName,
    required String authorInitials,
    required int authorLevel,
    required String text,
    String? replyToName,
  }) {
    final p = postById(postId);
    final trimmed = text.trim();
    if (p == null || trimmed.isEmpty) return;
    p.comments.add(CommunityComment(
      id: 'c${p.comments.length + 1}-$postId',
      authorName: authorName,
      authorInitials: authorInitials,
      authorLevel: authorLevel,
      minutesAgo: 0,
      text: trimmed,
      replyToName: replyToName,
    ));
    p.commentCount++;
    _persist();
    notifyListeners();
  }

  /// Persist community posts through the app's Store (local-only, no network).
  void _persist() {
    // Route created posts through the same local persistence used by routines/settings.
    Store.instance.save({
      'posts': _posts.map((p) => {
        'id': p.id,
        'caption': p.caption,
        'kind': p.kind.index,
        'likeCount': p.likeCount,
        'commentCount': p.comments.length,
        'hidden': p.hidden,
        'isOwn': p.isOwn,
        'authorName': p.authorName,
        'authorInitials': p.authorInitials,
        'authorLevel': p.authorLevel,
        'authorTrainer': p.authorTrainer,
        'minutesAgo': p.minutesAgo,
        'media': p.media.map((m) => m.sage).toList(),
        'likeCount': p.likeCount,
        'shareCount': p.shareCount,
        'slug': p.slug,
      }).toList(),
    });
  }

  /// Test hook: restore the seeded feed.
  void reset() {
    _posts
      ..clear()
      ..addAll(_seed());
    _persist();
    notifyListeners();
  }

  /// Test hook: empty the feed to exercise the empty state.
  void clear() {
    _posts.clear();
    _persist();
    notifyListeners();
  }

  }

List<CommunityPost> _seed() => [
      CommunityPost(
        id: 'wk8-pullup',
        authorName: 'Mara K.',
        authorInitials: 'MK',
        authorLevel: 6,
        minutesAgo: 120,
        kind: PostKind.progress,
        caption:
            'Week 8: down 6 kg and my first strict pull-up. Slow negatives, '
            'three easy singles a day, no hero sets. Six months of showing up '
            'is finally compounding.',
        media: const [MediaPlaceholder()],
        likeCount: 24,
        commentCount: 0,
        shareCount: 3,
        slug: 'wk8-pullup',
        comments: [
          const CommunityComment(
            id: 'c1-wk8-pullup',
            authorName: 'Priya S.',
            authorInitials: 'PS',
            authorLevel: 3,
            minutesAgo: 60,
            text: 'Eight weeks out and a strict pull-up is fast. '
                'What actually changed?',
          ),
          const CommunityComment(
            id: 'c2-wk8-pullup',
            authorName: 'Mara K.',
            authorInitials: 'MK',
            authorLevel: 6,
            minutesAgo: 58,
            text: 'Grease the groove. Three easy singles a day, '
                'none to failure.',
            replyToName: 'Priya S.',
          ),
        ],
      ),
      CommunityPost(
        id: 'push-day-a',
        authorName: 'Deion',
        authorInitials: 'DE',
        authorLevel: 4,
        minutesAgo: 240,
        kind: PostKind.workout,
        caption: '',
        workout: _pushDayA(),
        likeCount: 42,
        commentCount: 0,
        shareCount: 7,
        slug: 'push-day-a',
        comments: [
          const CommunityComment(
            id: 'c1-push-day-a',
            authorName: 'Tomás L.',
            authorInitials: 'TL',
            authorLevel: 2,
            minutesAgo: 200,
            text: 'First time running this scheme. The 5×5 is heavy but the '
                'rest timer is doing its job.',
          ),
          const CommunityComment(
            id: 'c2-push-day-a',
            authorName: 'Deion',
            authorInitials: 'DE',
            authorLevel: 4,
            minutesAgo: 195,
            text: 'Keep the incline DB at 28 — it owns the upper chest.',
            replyToName: 'Tomás L.',
          ),
          const CommunityComment(
            id: 'c3-push-day-a',
            authorName: 'Nadia R.',
            authorInitials: 'NR',
            authorLevel: 9,
            minutesAgo: 190,
            text: 'Watch the bar path on the bench. Stay over the pad.',
          ),
        ],
      ),
      CommunityPost(
        id: 'hip-hinge-pair',
        authorName: 'Priya S.',
        authorInitials: 'PS',
        authorLevel: 3,
        minutesAgo: 1500,
        kind: PostKind.progress,
        caption:
            'Hip hinge day. Both pairs on film — the bar path finally stays '
            'one clean line.',
        media: const [
          MediaPlaceholder(sage: true),
          MediaPlaceholder(sage: true),
        ],
        likeCount: 17,
        commentCount: 0,
        shareCount: 1,
        slug: 'hip-hinge-pair',
      ),
    ];

List<CommunityMember> _seedMembers() => const [
      CommunityMember(
        name: 'Nadia R.',
        initials: 'NR',
        level: 9,
        trainer: true,
        bio: 'Head coach · strength and conditioning',
      ),
      CommunityMember(
        name: 'Mara K.',
        initials: 'MK',
        level: 6,
        bio: 'Pull-up project, week 8',
      ),
      CommunityMember(
        name: 'Deion',
        initials: 'DE',
        level: 4,
        bio: 'Push/pull split, chasing a 100 kg bench',
      ),
      CommunityMember(
        name: 'Priya S.',
        initials: 'PS',
        level: 3,
        bio: 'Hinge mechanics and photo check-ins',
      ),
      CommunityMember(
        name: 'Tomás L.',
        initials: 'TL',
        level: 2,
        bio: 'Back after a two-year break',
      ),
    ];

WorkoutSummary _pushDayA() => const WorkoutSummary(
      title: 'Push Day A',
      minutes: 47,
      sets: 16,
      volumeKg: 6140,
      rows: [
        ExerciseRow(name: 'Bench press', scheme: '5×5', weight: '82.5 kg', pr: true),
        ExerciseRow(name: 'Incline DB press', scheme: '3×10', weight: '28 kg'),
        ExerciseRow(name: 'Cable fly', scheme: '3×12', weight: '15 kg'),
      ],
    );
