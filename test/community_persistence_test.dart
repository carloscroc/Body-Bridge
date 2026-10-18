// F1: the community feed survives a restart. The repo loads stored posts from
// prefs at construction when present, mirroring how the settings state comes
// back through the Store — a created post, its like state and its comment
// thread all round-trip.
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/community_repo.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await Store.instance.init();
    CommunityRepo().reset();
  });

  test('created post survives a fresh Store load with likes and comments intact',
      () {
    final repo = CommunityRepo();
    final post = repo.createPost(
      kind: PostKind.progress,
      caption: 'Back at it, week one!',
      authorName: 'Mara K.',
      authorInitials: 'MK',
    );
    repo.toggleLike(post.id);
    repo.addComment(
      post.id,
      authorName: 'Nadia R.',
      authorInitials: 'NR',
      authorLevel: 9,
      text: 'Welcome back. Slow and steady.',
    );

    final fresh = CommunityRepo.fresh();
    final restored = fresh.postById(post.id);
    expect(restored, isNotNull, reason: 'the created post must load back');
    expect(restored!.caption, 'Back at it, week one!');
    expect(restored.isOwn, isTrue);
    expect(restored.slug, 'back-at-it-week-one');
    expect(restored.liked, isTrue, reason: 'the like must survive the restart');
    expect(restored.likeCount, 1);
    expect(restored.comments.length, 1,
        reason: 'the comment must survive the restart');
    expect(restored.comments.first.text, 'Welcome back. Slow and steady.');
    expect(restored.comments.first.authorName, 'Nadia R.');
  });

  test('likes and comment edits on a seeded post round-trip too', () {
    final repo = CommunityRepo();
    repo.toggleLike('wk8-pullup');
    repo.addComment(
      'wk8-pullup',
      authorName: 'Tomás L.',
      authorInitials: 'TL',
      authorLevel: 2,
      text: 'Starting the negatives today.',
    );

    final fresh = CommunityRepo.fresh();
    final restored = fresh.postById('wk8-pullup')!;
    expect(restored.liked, isTrue);
    expect(restored.likeCount, 25);
    expect(restored.comments.length, 4);
    expect(restored.comments.map((c) => c.text),
        contains('Starting the negatives today.'));
  });

  test('a Store without posts keeps the seeded feed', () {
    Store.instance.save({'units': 'kg'});
    final fresh = CommunityRepo.fresh();
    expect(
      fresh.posts.map((p) => p.id),
      containsAll(['wk8-pullup', 'push-day-a', 'hip-hinge-pair']),
    );
  });
}
