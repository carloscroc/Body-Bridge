import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/l10n/l10n.dart';
import 'package:gymmane/screens/account_screen.dart';
import 'package:gymmane/services/auth_service.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/premium_gate.dart';
import 'package:gymmane/widgets/ui_kit.dart';

/// Delete-account UI flow: destructive confirm with the EXACT contract body,
/// busy state while the gate runs, and the three endings (deleted -> signed
/// out, requiresRecentLogin -> stays signed in, generic failure -> stays
/// signed in). No Firebase, no Convex — the gate seam is scripted.
class ScriptedGate extends AccountGate {
  ScriptedGate();

  bool signedIn = true;
  bool deleteCalled = false;
  Completer<void>? blocker;
  Object? thrown;

  @override
  AccountSnapshot get snapshot => signedIn
      ? const AccountSnapshot(tier: AccountTier.free, email: 'a@b.c')
      : const AccountSnapshot(tier: AccountTier.signedOut);

  @override
  bool canAccess(String feature) => tierCan(snapshot.tier, feature);

  @override
  Future<void> deleteAccount() async {
    deleteCalled = true;
    final wait = blocker;
    if (wait != null) await wait.future;
    final failure = thrown;
    if (failure != null) throw failure; // stays signed in
    signedIn = false;
    notifyListeners();
  }

  @override
  Future<void> signIn(String email, String password) async {}

  @override
  Future<void> signUp(String email, String password) async {}

  @override
  Future<void> signOut() async {
    signedIn = false;
    notifyListeners();
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // The exact contract copy for the destructive confirm.
  final confirmBody = t.deleteAccountConfirmBody;
  assert(
    confirmBody ==
        'This deletes your account and cloud profile. '
            'Local workouts stay on this phone.',
    'deleteAccountConfirmBody must carry the contract wording verbatim',
  );

  Future<void> pumpAccount(WidgetTester tester, ScriptedGate gate) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: PremiumGate(
          gate: gate,
          child: const Scaffold(body: AccountScreen()),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  }

  Future<void> confirmDelete(WidgetTester tester) async {
    await tester.tap(find.text(t.deleteAccount));
    await tester.pump(const Duration(milliseconds: 300));
    expect(
      find.text(confirmBody),
      findsOneWidget,
      reason: 'the destructive confirm shows the exact contract body',
    );
    expect(find.text(t.deleteAccountConfirmTitle), findsOneWidget);
    await tester.tap(find.text(t.deleteAccountDelete));
    await tester.pump();
  }

  testWidgets('confirm -> busy state -> delete path invoked -> signed out + done snackbar', (tester) async {
    final gate = ScriptedGate()..blocker = Completer<void>();
    await pumpAccount(tester, gate);
    expect(find.byType(TextField), findsNothing, reason: 'signed-in card first');

    await confirmDelete(tester);

    expect(gate.deleteCalled, isTrue, reason: 'the delete path was invoked');
    expect(
      find.byType(CircularProgressIndicator),
      findsOneWidget,
      reason: 'the destructive button is in its busy state while awaiting',
    );
    expect(find.byType(TextField), findsNothing, reason: 'still on the signed-in card while the gate runs');

    gate.blocker!.complete();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(CircularProgressIndicator), findsNothing);
    expect(find.text(t.deleteAccountDone), findsOneWidget, reason: 'success shows the done snackbar');
    expect(find.byType(TextField), findsNWidgets(2), reason: 'the signed-out form renders automatically');
    expect(find.text(titleCase(t.startFree)), findsOneWidget);
  });

  testWidgets('requiresRecentLogin -> reauth snackbar, user stays signed in', (tester) async {
    final gate = ScriptedGate()..thrown = const AuthException('requiresRecentLogin');
    await pumpAccount(tester, gate);

    await confirmDelete(tester);
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text(t.deleteAccountReauth), findsOneWidget, reason: 'the re-auth message is shown');
    expect(find.byType(TextField), findsNothing, reason: 'the user stays signed in on the account screen');
    expect(
      find.text(titleCase(t.deleteAccount)),
      findsOneWidget,
      reason: 'the delete button is back, no busy spinner stuck',
    );
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('generic failure -> failed snackbar, user stays signed in', (tester) async {
    final gate = ScriptedGate()..thrown = const AuthException('networkRequested');
    await pumpAccount(tester, gate);

    await confirmDelete(tester);
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text(t.deleteAccountFailed), findsOneWidget);
    expect(find.byType(TextField), findsNothing, reason: 'generic failures never sign the user out');
  });

  testWidgets('cancel keeps everything untouched', (tester) async {
    final gate = ScriptedGate();
    await pumpAccount(tester, gate);

    await tester.tap(find.text(t.deleteAccount));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.text(t.cancel));
    await tester.pump(const Duration(milliseconds: 300));

    expect(gate.deleteCalled, isFalse, reason: 'cancel must not invoke the delete path');
    expect(find.text(confirmBody), findsNothing);
  });
}
