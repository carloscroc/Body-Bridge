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

  test('clobber simulation: community data survives stale full-store writer', () {
    final repo = CommunityRepo();

    // 1. Capture stale store state BEFORE any mutations.
    final staleStoreState = Store.instance.load();

    // 2. Create a post and mutate a seed post.
    final newPost = repo.createPost(
      kind: PostKind.progress,
      caption: 'Test post for clobber simulation',
      authorName: 'Test User',
      authorInitials: 'TU',
    );
    repo.toggleLike(newPost.id);
    repo.addComment(
      newPost.id,
      authorName: 'Test User',
      authorInitials: 'TU',
      authorLevel: 1,
      text: 'Test comment',
    );
    repo.toggleLike('wk8-pullup');
    repo.addComment(
      'wk8-pullup',
      authorName: 'Test User',
      authorInitials: 'TU',
      authorLevel: 1,
      text: 'Test comment on seed',
    );

    // 3. Simulate stale writer saving old map (shared-store clobber).
    Store.instance.save(staleStoreState);

    // 4. Fresh reload reads only the dedicated community_v1 key.
    final fresh = CommunityRepo.fresh();

    // 5. Assert mutations SURVIVE despite stale shared-store writer.
    final restoredNewPost = fresh.postById(newPost.id);
    expect(restoredNewPost, isNotNull, reason: 'created post must survive clobber');
    expect(restoredNewPost!.liked, isTrue, reason: 'like must survive');
    expect(restoredNewPost.likeCount, 1);
    expect(restoredNewPost.comments.length, 1);
    expect(restoredNewPost.comments.first.text, 'Test comment');

    final restoredSeedPost = fresh.postById('wk8-pullup');
    expect(restoredSeedPost, isNotNull, reason: 'seed post must exist');
    expect(restoredSeedPost!.liked, isTrue, reason: 'seed like must survive');
    expect(restoredSeedPost.likeCount, 25); // 24 + 1
    expect(restoredSeedPost.comments.length, 4); // 3 + 1
    expect(
      restoredSeedPost.comments.map((c) => c.text),
      contains('Test comment on seed'),
    );
  });
}
