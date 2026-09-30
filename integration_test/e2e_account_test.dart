// T-C E2E device test: sign-up -> Convex user doc -> re-login -> delete account.
//
// Runs the REAL app on the device (real Firebase Auth cloud + real Convex
// local backend via `adb reverse tcp:3210 tcp:3210`). The boot sequence below
// replicates lib/main.dart for phone (integration tests replace main.dart as
// the entry point), so production native plugin paths are exercised.
//
// Host-side verification (Firebase REST account checks, Convex doc dumps) is
// performed by the bash driver around this run and posted to the Kanban card.
//
// Run (from worktree root):
//   adb reverse tcp:3210 tcp:3210
//   flutter test integration_test/e2e_account_test.dart \
//     --dart-define=FB_API_KEY=... --dart-define=FB_APP_ID=... \
//     --dart-define=FB_SENDER_ID=... --dart-define=FB_PROJECT_ID=motionletics \
//     --dart-define=FB_AUTH_DOMAIN=... --dart-define=FB_STORAGE_BUCKET=... \
//     --dart-define=CONVEX_URL=http://127.0.0.1:3210
library;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart'; // RenderParagraph for _visibleTexts
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/app/gymmane_app.dart';
import 'package:gymmane/l10n/l10n.dart' as l10n;
import 'package:gymmane/services/alarm_store.dart';
import 'package:gymmane/services/local_store.dart';
import 'package:gymmane/services/media_store.dart';
import 'package:gymmane/services/rest_alarm.dart';
import 'package:gymmane/services/workout_import.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/fit_state.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:integration_test/integration_test.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

const String kEmail = 'tc-e2e-20260930@motionletics-test.com';
const String kPassword = 'Tc!E2ePass2026x';

late final l10n.AppLocalizations t;

/// Pumps until [finder] finds at least one widget, or times out. Tolerates
/// ambiguous finders (treated as found) and keeps live timers running.
Future<void> _pumpUntil(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 45),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
    try {
      if (finder.evaluate().isNotEmpty) return;
    } on StateError {
      return; // multiple matches -> found
    }
  }
  fail('Timed out waiting for $finder. Visible texts: ${_visibleTexts()}');
}

/// Collects rendered strings from the render tree (catches Text.rich etc.).
String _visibleTexts() {
  final out = <String>[];
  void walk(RenderObject ro) {
    if (ro is RenderParagraph) {
      final s = ro.text.toPlainText();
      if (s.trim().isNotEmpty) out.add(s.trim());
    }
    ro.visitChildren(walk);
  }

  final view = RendererBinding.instance.renderViews.first;
  if (view.child == null) return '<no render tree>';
  walk(view.child!);
  return out.take(50).toSet().join(' | ');
}

void _dump(String stage) {
  final snap = AccountGate.instance.snapshot;
  debugPrint('E2E_STATE|$stage|signedIn=${snap.tier.isSignedIn}'
      '|tier=${snap.tier.name}|email=${snap.email}');
}

/// Dismisses the award celebration overlay if it is on screen (the "Awesome!"
/// button closes it). Awards fire ~4s after guest workouts are seeded and sit
/// on top of everything, swallowing taps meant for the UI below.
Future<void> _dismissAwardIfShown(WidgetTester tester) async {
  for (var i = 0; i < 3; i++) {
    await tester.pump(const Duration(milliseconds: 300));
    final nice = find.text(t.awardNice);
    if (nice.evaluate().isEmpty) return;
    debugPrint('E2E_STATE|award-overlay-dismissed');
    await tester.tap(nice.first);
    await tester.pump(const Duration(milliseconds: 600));
  }
}

/// Mirrors lib/main.dart phone path (watch branch not applicable on device).
Future<void> _bootLikeMain() async {
  await initializeDateFormatting();
  await Store.instance.init();
  await MediaStore.init();
  await AlarmStore.init();
  fit.loadFromStore();
  await RestAlarm.instance.init();
  fit.syncPhotoReminder();
  fit.syncTrainReminder();
}

/// Seeds two guest workouts through the public import API; one is 10 days old
/// (outside the free 7-day history window) so the preservation check below
/// counts total data, not windowed visibility.
void _seedGuestWorkouts() {
  final now = DateTime.now();
  final added = fit.importParsedSessions([
    ParsedSession(now.subtract(const Duration(days: 1)), 2400)
      ..exercises.add(
        ParsedExercise('Bench Press', 'chest', id: 'bench-press')
          ..sets.addAll([ParsedSet(8, 60), ParsedSet(8, 60), ParsedSet(6, 62.5)]),
      ),
    ParsedSession(now.subtract(const Duration(days: 10)), 1800)
      ..exercises.add(
        ParsedExercise('Squat', 'quads', id: 'squat')
          ..sets.addAll([ParsedSet(5, 100), ParsedSet(5, 102.5)]),
      ),
  ]);
  if (added != 2) throw StateError('seed import added $added sessions, expected 2');
}

Future<void> main() async {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;
  t = l10n.lookupAppLocalizations(const Locale('en'));

  testWidgets('T-C signup -> convex user -> relogin -> delete account', (tester) async {
    await _bootLikeMain();

    await tester.pumpWidget(const GymManeApp());
    await tester.pump(const Duration(seconds: 2));
    _dump('boot');

    // ---------- Real onboarding (fresh install) ----------
    // The top bar's Skip button calls _finish() from any page (a real-user
    // path), which seeds default places and completes onboarding.
    await _pumpUntil(tester, find.text('GymMane'), timeout: const Duration(seconds: 30));
    await tester.pump(const Duration(milliseconds: 400));
    await tester.tap(find.text('Skip'));
    await tester.pump(const Duration(seconds: 1));
    await _pumpUntil(tester, find.text(t.home), timeout: const Duration(seconds: 30));
    _dump('onboarded');

    // Seed guest workouts through the public import API (persists locally).
    // Gamification off first: seeded workouts would otherwise queue award
    // celebrations that pop over the UI (4s/6s timers) and swallow taps.
    fit.gamification = false;
    _seedGuestWorkouts();
    final guestCountBefore = fit.sessions.length;
    expect(guestCountBefore, 2, reason: 'seeded workouts must be present before the delete step');
    debugPrint('E2E_STATE|seeded|sessions=$guestCountBefore');

    // ---------- Settings -> Account ----------
    // Route 'settings' renders ProfileScreen (app_shell.dart); preferences
    // (with the account row) opens via the gear button. An award celebration
    // overlay (from the seeded workouts) may pop on top — dismiss it first.
    fit.goSettings();
    await _pumpUntil(tester, find.text(t.editProfile), timeout: const Duration(seconds: 30));
    await _dismissAwardIfShown(tester);
    await tester.tap(find.byIcon(PhosphorIconsRegular.gearSix));
    await tester.pump(const Duration(seconds: 1));
    await _pumpUntil(tester, find.text(t.accountRowGuest));
    await _dismissAwardIfShown(tester);
    await tester.tap(find.text(t.accountRowGuest));
    await tester.pump(const Duration(seconds: 1));
    _dump('account-screen-signed-out');

    // ---------- Create account ("Create account" segment is the default) ----------
    // Field layout: label Text is a SIBLING of its TextField (Column), so
    // target fields positionally: index 0 = email, index 1 = password.
    await _pumpUntil(tester, find.text(t.emailLabel));
    await tester.enterText(find.byType(TextField).at(0), kEmail);
    await tester.enterText(find.byType(TextField).at(1), kPassword);
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump(const Duration(milliseconds: 400));
    await tester.tap(find.text(t.startFree));
    debugPrint('E2E_STATE|signup-submitted');

    // Signed-in view replaces the form: FREE badge + Sign out only render once
    // Firebase auth resolved AND entitlements came back from Convex
    // (users:ensureUser + entitlements:get).
    await _pumpUntil(tester, find.text(t.tierFree), timeout: const Duration(seconds: 90));
    await _pumpUntil(tester, find.text(t.signOut), timeout: const Duration(seconds: 60));
    _dump('signed-up');
    await tester.pump(const Duration(seconds: 2));
    expect(AccountGate.instance.snapshot.tier.isSignedIn, isTrue);
    expect(AccountGate.instance.snapshot.email, kEmail);

    // ---------- Sign out ----------
    await tester.tap(find.text(t.signOut));
    await _pumpUntil(tester, find.text(t.startFree), timeout: const Duration(seconds: 60));
    _dump('signed-out');
    expect(AccountGate.instance.snapshot.tier.isSignedIn, isFalse);

    // ---------- Sign back in (same user; driver checks no duplicate doc) ----------
    await tester.tap(find.text(t.signIn).last);
    await tester.pump();
    await tester.enterText(find.byType(TextField).at(0), kEmail);
    await tester.enterText(find.byType(TextField).at(1), kPassword);
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump(const Duration(milliseconds: 400));
    await tester.tap(find.text(t.signIn).last);
    debugPrint('E2E_STATE|signin-submitted');
    await _pumpUntil(tester, find.text(t.tierFree), timeout: const Duration(seconds: 90));
    _dump('signed-back-in');
    expect(AccountGate.instance.snapshot.email, kEmail);

    // ---------- Delete account ----------
    await _pumpUntil(tester, find.text(t.deleteAccount));
    await tester.tap(find.text(t.deleteAccount));
    await tester.pump();
    await _pumpUntil(tester, find.text(t.deleteAccountConfirmTitle));
    debugPrint('E2E_STATE|confirm-dialog-shown');
    await tester.tap(find.text(t.deleteAccountDelete));
    debugPrint('E2E_STATE|delete-confirmed');

    // App returns to guest mode: the signed-out form (email/password fields)
    // renders again. Note: the form keeps its last segment (Sign in) after a
    // delete, so the submit button reads "Sign in", not "Start free".
    await _pumpUntil(tester, find.byType(TextField), timeout: const Duration(seconds: 90));
    _dump('after-delete');
    expect(AccountGate.instance.snapshot.tier.isSignedIn, isFalse);
    await _pumpUntil(tester, find.text(t.deleteAccountDone), timeout: const Duration(seconds: 30));

    // ---------- Local workouts preserved ----------
    expect(
      fit.sessions.length,
      guestCountBefore,
      reason: 'delete account must not touch local workout data',
    );
    debugPrint('E2E_STATE|local-preserved|sessions=${fit.sessions.length}');
    debugPrint('E2E_DONE|ok');
  });
}
