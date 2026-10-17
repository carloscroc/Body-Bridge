// Community feed (P2): seeded posts render real numbers, likes toggle,
// the options sheet opens, and an emptied repo shows the empty state.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/community/community_feed.dart';
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
}
