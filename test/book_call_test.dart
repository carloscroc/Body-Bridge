// Book-a-call sheet widget tests (card t_9d175854 D3): the chat header
// calendar action replaces the dead phone icon, carries an a11y label,
// opens the sheet, validation files nothing, the happy path stores the
// record, and the two-door grammar opens on the confirmation when a
// request is already on file. NO dialer, NO phone numbers — the request
// is filed through the trainer seam.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/trainer_chat_screen.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/book_call_sheet.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FakeGate extends AccountGate {
  FakeGate(this.tier);
  final AccountTier tier;

  @override
  AccountSnapshot get snapshot =>
      AccountSnapshot(tier: tier, email: tier == AccountTier.signedOut ? null : 'a@b.c');

  @override
  bool canAccess(String feature) => tierCan(tier, feature);

  @override
  Future<void> requestEmailCode(String email) async {}

  @override
  Future<bool> verifyEmailCode(String email, String code) async => false;

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}

}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    fit.resetRoute('home');
    trainer.resetForTest();
    setAppLanguage('en');
  });

  tearDown(() {
    AccountGate.install(SignedOutGate());
    fit.resetRoute('home');
  });

  Future<void> pumpChat(WidgetTester tester) async {
    trainer.openThreadId = 'thr_chat_marcus';
    // Realistic phone surface (matches the capture harness) so the sheet
    // content and submit button sit on-screen at tap time.
    tester.view.physicalSize = const Size(411, 823);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final gate = FakeGate(AccountTier.advanced);
    AccountGate.install(gate);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: gate,
          child: AnimatedBuilder(
            animation: trainer,
            builder: (context, _) => const Scaffold(body: TrainerChatScreen()),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));
    // The chat surface never settles under pumpAndSettle on this host —
    // fixed pumps, mirroring trainer_tier_test's proven pattern.
    await tester.pump(const Duration(milliseconds: 400));
  }

  Future<void> openSheet(WidgetTester tester) async {
    await tester.tap(find.byIcon(PhosphorIconsRegular.calendarBlank));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));
  }

  // Scoped to the sheet so generic chip labels can't collide with any
  // screen content behind the modal.
  Finder inSheet(Finder child) =>
      find.descendant(of: find.byType(BookCallSheet), matching: child);

  // The sheet's note field (the chat composer is also a TextField).
  Finder noteField() => find.byWidgetPredicate(
      (w) => w is TextField && w.decoration?.hintText == t.callNotesHint);

  testWidgets('chat header: phone icon gone, calendar action present (repair D3)',
      (tester) async {
    await pumpChat(tester);
    expect(find.byIcon(PhosphorIconsRegular.phone), findsNothing);
    expect(find.byIcon(PhosphorIconsRegular.calendarBlank), findsOneWidget);
  });

  testWidgets('calendar action carries the a11y label', (tester) async {
    await pumpChat(tester);
    final handle = tester.ensureSemantics();
    expect(find.bySemanticsLabel(t.bookCallA11y), findsOneWidget);
    handle.dispose();
  });

  testWidgets('tapping the calendar action opens the book-a-call sheet',
      (tester) async {
    await pumpChat(tester);
    await openSheet(tester);
    expect(find.text(t.callKicker), findsOneWidget);
    expect(find.text(t.callSheetTitle), findsOneWidget);
    expect(inSheet(find.text(t.weekdayShort(1))), findsOneWidget);
    expect(inSheet(find.text(t.timeEvening)), findsOneWidget);
  });

  testWidgets('validation: nothing picked -> inline error, no record',
      (tester) async {
    await pumpChat(tester);
    await openSheet(tester);
    await tester.tap(inSheet(find.byType(PrimaryButton)));
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text(t.callPickDayTime), findsOneWidget);
    expect(trainer.call, isNull);
  });

  testWidgets('happy path: day + window + note -> confirmation + record',
      (tester) async {
    await pumpChat(tester);
    await openSheet(tester);
    await tester.tap(inSheet(find.text(t.weekdayShort(3))));
    await tester.pump();
    await tester.tap(inSheet(find.text(t.timeEvening)));
    await tester.pump();
    await tester.enterText(noteField(), 'Knee-friendly times please');
    await tester.pump();
    await tester.tap(inSheet(find.byType(PrimaryButton)));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text(t.callSentTitle), findsOneWidget);
    expect(find.text(t.callSentBody('Marcus')), findsOneWidget);
    expect(trainer.call!.day, 3);
    expect(trainer.call!.timeWindow, 'evening');
    expect(trainer.call!.notes, 'Knee-friendly times please');
  });

  testWidgets('two-door: request on file -> sheet opens on the confirmation',
      (tester) async {
    await pumpChat(tester);
    await tester.pump(const Duration(milliseconds: 100));
    await trainer.requestCall(day: 5, timeWindow: 'morning', notes: 'early');
    await tester.pump(const Duration(milliseconds: 100));
    await openSheet(tester);
    expect(find.text(t.callSentTitle), findsOneWidget);
    expect(find.text(t.callSheetTitle), findsNothing);
    expect(noteField(), findsNothing);
  });
}
