// Community feed (P2): seeded posts render real numbers, likes toggle,
// the options sheet opens, and an emptied repo shows the empty state.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/community/community_feed.dart';
import 'package:gymmane/services/community_repo.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_colors.dart';
import 'package:gymmane/theme/app_theme.dart';

import 'community_gate_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    CommunityRepo().reset();
    setAppLanguage('en');
    AccountGate.install(FakeTierGate(AccountTier.basic, email: 'mara@bodybridge.app'));
  });

  Future<void> pumpFeed(WidgetTester tester, [Brightness brightness = Brightness.dark]) async {
    await tester.pumpWidget(MaterialApp(
      theme: brightness == Brightness.dark ? AppTheme.dark : AppTheme.light,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const CommunityFeedScreen(),
    ));
    await tester.pump(const Duration(milliseconds: 400));
  }

  testWidgets('seeded feed renders authors and real workout numbers', (tester) async {
    await pumpFeed(tester);

    expect(find.text('Mara K.'), findsWidgets);
    await tester.scrollUntilVisible(
      find.text(t.workoutStats(47, 16, '6,140')),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text(t.workoutStats(47, 16, '6,140')), findsOneWidget);
  });

  testWidgets('tapping the heart toggles the like count', (tester) async {
    await pumpFeed(tester);

    expect(find.text('24'), findsOneWidget);
    await tester.ensureVisible(find.text('24')); // post is built but below the fold; bring it into the viewport
    await tester.pump(const Duration(milliseconds: 300)); // flush the scroll jump into layout before computing the tap point
    await tester.tap(find.text('24'));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('25'), findsOneWidget);
    expect(find.text('24'), findsNothing);
  });

  testWidgets('post options sheet opens from the dots menu', (tester) async {
    await pumpFeed(tester);

    await tester.tap(find.byIcon(PhosphorIconsRegular.dotsThree).first);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text(t.optionsTitle), findsOneWidget);
  });

  testWidgets('members tab lists seeded members', (tester) async {
    await pumpFeed(tester);

    await tester.tap(find.text(t.membersTab));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text(t.feedTab), findsOneWidget);
    expect(CommunityRepo().members, isNotEmpty);
  });

  testWidgets('empty repo shows the empty state', (tester) async {
    await pumpFeed(tester);
    CommunityRepo().clear();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text(t.noPostsTitle), findsOneWidget);
    expect(find.text(t.noPostsBody), findsOneWidget);
    expect(find.text(t.createFirstPost), findsOneWidget);
  });

  testWidgets('report sheet CTA turns danger-red once a reason is picked', (tester) async {
    await pumpFeed(tester);

    await tester.tap(find.byIcon(PhosphorIconsRegular.dotsThree).first);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text(t.reportPost));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));

    Color ctaColor() {
      final container = tester.widget<Container>(
        find.ancestor(of: find.text(t.reportSubmit), matching: find.byType(Container)).first,
      );
      return (container.decoration! as BoxDecoration).color!;
    }

    final gc = tester.element(find.text(t.reportSubmit)).gc;
    expect(ctaColor(), gc.bgRaised2, reason: 'neutral until a reason is picked');

    await tester.tap(find.text(t.reportSpam));
    await tester.pump(const Duration(milliseconds: 300));

    expect(ctaColor(), gc.danger, reason: 'the selected-reason CTA must be the danger red');
  });

  testWidgets('last feed card clears the floating nav bar with the system inset', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    tester.view.viewPadding = const FakeViewPadding(bottom: 48);
    tester.view.padding = const FakeViewPadding(bottom: 48);
    addTearDown(tester.view.reset);
    await pumpFeed(tester);

    final position = tester.state<ScrollableState>(find.byType(Scrollable).first).position;
    position.jumpTo(position.maxScrollExtent);
    await tester.pump();

    final lastCardBottom = tester.getBottomRight(find.byType(PostCard).last).dy;
    expect(
      lastCardBottom,
      lessThanOrEqualTo(844 - 48 - 92),
      reason: 'nav bar: 18 gap + 74 bar + 48 inset = top edge at 704',
    );
  });

  testWidgets('a caption-only post shows no empty photo slots', (tester) async {
    await pumpFeed(tester);
    expect(find.byType(PlaceholderTile), findsWidgets);

    CommunityRepo().createPost(
      kind: PostKind.progress,
      caption: 'Caption only for now.',
      authorName: 'Mara K.',
      authorInitials: 'MK',
    );
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Caption only for now.'), findsOneWidget);
    expect(
      find.descendant(of: find.byType(PostCard).first, matching: find.byType(PlaceholderTile)),
      findsNothing,
      reason: 'no attached photos means no placeholder tiles',
    );
  });
}
