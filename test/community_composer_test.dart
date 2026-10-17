// Community composer (P2): CTA stays dead until there is text, then the
// post lands on the repo and the composer pops. The screen is pushed from a
// host page exactly like the feed does, so pop lands on a real route stack.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/community/community_composer.dart';
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

  Future<void> pumpHostAndOpen(WidgetTester tester) async {
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
  }

  testWidgets('CTA is inert before any text is typed', (tester) async {
    await pumpHostAndOpen(tester);

    expect(find.text(t.postToCommunity), findsOneWidget);
    await tester.tap(find.text(t.postToCommunity));
    await tester.pump(const Duration(milliseconds: 300));

    expect(CommunityRepo().posts.length, 3);
    expect(find.byType(CommunityComposerScreen), findsOneWidget);
  });

  testWidgets('progress post: caption enables CTA, submit lands and pops', (tester) async {
    await pumpHostAndOpen(tester);

    await tester.enterText(find.byType(TextField), 'Feeling stronger!');
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text(t.postToCommunity));
    await tester.pump(); // first frame starts the pop-transition ticker
    await tester.pump(const Duration(seconds: 1)); // runs the 450ms reverse transition to completion

    final repo = CommunityRepo();
    expect(repo.posts.length, 4);
    expect(repo.posts.first.caption, 'Feeling stronger!');
    expect(repo.posts.first.kind, PostKind.progress);
    expect(repo.posts.first.isOwn, isTrue);
    expect(find.byType(CommunityComposerScreen), findsNothing);
    expect(find.text('OPEN_COMPOSER'), findsOneWidget);
  });

  testWidgets('workout post attaches today\'s session', (tester) async {
    await pumpHostAndOpen(tester);

    await tester.tap(find.text(t.modeWorkout));
    await tester.pump(const Duration(milliseconds: 300));

    await tester.enterText(find.byType(TextField), 'Crushed push day');
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text(t.postToCommunity));
    await tester.pump(); // first frame starts the pop-transition ticker
    await tester.pump(const Duration(seconds: 1)); // runs the 450ms reverse transition to completion

    final repo = CommunityRepo();
    expect(repo.posts.length, 4);
    expect(repo.posts.first.kind, PostKind.workout);
    expect(repo.posts.first.caption, 'Crushed push day');
    expect(repo.posts.first.workout, isNotNull);
    expect(find.byType(CommunityComposerScreen), findsNothing);
  });

  testWidgets('submit bar clears the system bottom inset with the keyboard down', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    tester.view.viewPadding = const FakeViewPadding(bottom: 48);
    tester.view.padding = const FakeViewPadding(bottom: 48);
    addTearDown(tester.view.reset);
    await pumpHostAndOpen(tester);

    final barBottom = tester.getBottomRight(find.text(t.postToCommunity)).dy;
    expect(
      barBottom,
      lessThanOrEqualTo(844 - 48),
      reason: 'keyboard down: CTA must sit above the system nav inset, not inside it',
    );
  });

  testWidgets('submit bar stays above the keyboard when it is up', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    tester.view.viewPadding = const FakeViewPadding(bottom: 48);
    tester.view.padding = FakeViewPadding.zero;
    addTearDown(tester.view.reset);
    await pumpHostAndOpen(tester);

    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    await tester.pump();

    final barBottom = tester.getBottomRight(find.text(t.postToCommunity)).dy;
    expect(barBottom, lessThanOrEqualTo(844 - 300));
  });

  testWidgets('Add photo is visibly disabled with a picker-dependency reason chip', (tester) async {
    await pumpHostAndOpen(tester);

    expect(find.text(t.photoPickerPending), findsOneWidget);

    await tester.tap(find.text(t.addPhotoTile), warnIfMissed: false);
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text(t.progressPhotosCount(2)), findsOneWidget); // nothing was staged
    expect(find.text(t.progressPhotosCount(3)), findsNothing);
  });
}
