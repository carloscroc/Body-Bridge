// D6: the comment count IS the thread — one source of truth for the feed
// stat, the detail header and the repo. R4: composer posts go through the
// repo's single creation path, so they carry a share slug like seeds do.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/community/community_composer.dart';
import 'package:gymmane/screens/community/community_post_detail.dart';
import 'package:gymmane/services/community_repo.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';

import 'community_gate_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    CommunityRepo().reset();
    setAppLanguage('en');
    AccountGate.install(FakeTierGate(AccountTier.basic, email: 'mara@bodybridge.app'));
  });

  test('every comment count equals its thread, on every seeded post', () {
    for (final p in CommunityRepo().posts) {
      expect(p.commentCount, p.comments.length, reason: '${p.id}: the count must be derived from the thread');
      expect(p.comments, isNotEmpty, reason: '${p.id}: seeded threads are real, scrollable content');
    }
  });

  test('adding a comment grows the one true count', () {
    final repo = CommunityRepo();
    final before = repo.postById('wk8-pullup')!.commentCount;
    repo.addComment(
      'wk8-pullup',
      authorName: 'Nadia R.',
      authorInitials: 'NR',
      authorLevel: 2,
      text: 'Trying the singles today.',
    );
    expect(repo.postById('wk8-pullup')!.commentCount, before + 1);
  });

  testWidgets('detail header count is the thread, not a stale number', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityPostDetailScreen(postId: 'push-day-a'),
    ));
    await tester.pump(const Duration(milliseconds: 400));

    final post = CommunityRepo().postById('push-day-a')!;
    expect(find.text('${t.commentsTitle} ${post.comments.length}'), findsOneWidget);
  });

  testWidgets('the comment thread scrolls to its last comment', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityPostDetailScreen(postId: 'push-day-a'),
    ));
    await tester.pump(const Duration(milliseconds: 400));

    final post = CommunityRepo().postById('push-day-a')!;
    await tester.scrollUntilVisible(
      find.text(post.comments.last.text),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text(post.comments.last.text), findsOneWidget);
  });

  testWidgets('composer posts land through the repo path with a share slug', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.dark,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(
        body: Center(
          child: Builder(
            builder: (context) => TextButton(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                fullscreenDialog: true,
                builder: (_) => const CommunityComposerScreen(),
              )),
              child: const Text('OPEN_COMPOSER'),
            ),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('OPEN_COMPOSER'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    await tester.enterText(find.byType(EditableText), 'Back at it, week one!');
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text(t.postToCommunity));
    await tester.pump(); // first frame starts the pop-transition ticker
    await tester.pump(const Duration(seconds: 1)); // runs the 450ms reverse transition to completion

    final created = CommunityRepo().posts.first;
    expect(created.isOwn, isTrue);
    expect(created.kind, PostKind.progress);
    expect(created.caption, 'Back at it, week one!');
    expect(created.slug, 'back-at-it-week-one', reason: 'R4: repo-owned creation assigns the share slug');
  });
}
