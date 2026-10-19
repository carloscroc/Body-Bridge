// Seam tests for the trainer data layer (card t_d788f36e).
//
// The seam mirrors the verified backend contract (CONTRACT.md t_79f16c1b):
// §4 assignments — immutable versions folded to latest per thread;
// §5 chat — pair-unique thread, typed cards, thread-level read markers.
// The LocalTrainerRepository is the offline implementation the backend
// wiring will replace, so these tests pin the behavior the UI relies on.

import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/constants/billing.dart';
import 'package:gymmane/services/trainer_data.dart';
import 'package:gymmane/state/account_gate.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  group('assignments (contract §4)', () {
    test('listForMe folds to the LATEST version per thread, newest first', () async {
      final repo = LocalTrainerRepository();
      final list = await repo.assignmentsListForMe();

      expect(list.map((a) => a.id).toList(), [
        'asg_lower', // Oct 12
        'asg_mobility', // Oct 8
        'asg_posture_w2', // Oct 1, version 2 — week 1 hidden
      ]);
      expect(list.every((a) => a.clientId == 'client_me'), isTrue);
    });

    test('getThread returns ALL versions ascending (audit trail)', () async {
      final repo = LocalTrainerRepository();
      final versions = await repo.assignmentsGetThread('thr_posture');

      expect(versions.map((a) => a.version), [1, 2]);
      expect(versions[1].previousVersionId, versions[0].id);
    });

    test('get returns the exact version doc or null', () async {
      final repo = LocalTrainerRepository();
      expect((await repo.assignmentsGet('asg_lower'))?.title, 'Lower Body — Knee-Safe Progression');
      expect(await repo.assignmentsGet('missing_id'), isNull);
    });

    test('exercises carry contract fields + display extras, ordered', () async {
      final repo = LocalTrainerRepository();
      final a = (await repo.assignmentsGet('asg_lower'))!;
      expect(a.exercises.length, 6);
      expect(a.exercises[0].titleSnapshot, 'Goblet Box Squat');
      expect(a.exercises[0].sets, 3);
      expect(a.exercises[0].reps, '6-8');
      expect(a.exercises[0].notes, isNotNull);
      expect(a.exercises.map((e) => e.order), everyElement(isNonNegative));
      expect(a.exercises.map((e) => e.order).toList(), List.generate(6, (i) => i));
    });
  });

  group('chat (contract §5)', () {
    test('listThreads exposes the pair-unique thread with unread count', () async {
      final repo = LocalTrainerRepository();
      final threads = await repo.chatListThreads();
      expect(threads, hasLength(1));
      expect(threads.single.clientUnreadCount, 2);
      expect(threads.single.trainerUnreadCount, 0);
    });

    test('getThread returns messages ascending, typed cards intact', () async {
      final repo = LocalTrainerRepository();
      final msgs = await repo.chatGetThread('thr_chat_marcus');
      expect(msgs, hasLength(7));
      expect(msgs.map((m) => m.type).toList(), [
        TrainerMessageType.text,
        TrainerMessageType.workoutCard,
        TrainerMessageType.text,
        TrainerMessageType.text,
        TrainerMessageType.exerciseCard,
        TrainerMessageType.text,
        TrainerMessageType.text,
      ]);
      expect(msgs[1].card?.title, 'Lower Body — Knee-Safe Progression');
      expect(msgs[4].card?.title, 'Goblet Box Squat');
    });

    test('sendMessage bumps recipient counter, resets sender, appends', () async {
      final repo = LocalTrainerRepository();
      final before = (await repo.chatListThreads()).single;
      expect(before.clientUnreadCount, 2);

      await repo.chatSendMessage(type: TrainerMessageType.text, body: 'Sounds good — starting tomorrow.');

      final thread = (await repo.chatListThreads()).single;
      expect(thread.trainerUnreadCount, before.trainerUnreadCount + 1);
      expect(thread.clientUnreadCount, 0); // sender counter resets (§5.2)
      expect(thread.clientLastReadAt, isNotNull);
      expect(thread.lastMessagePreview, 'Sounds good — starting tomorrow.');
      final msgs = await repo.chatGetThread(thread.id);
      expect(msgs.last.body, 'Sounds good — starting tomorrow.');
    });

    test('markRead zeroes the caller counter', () async {
      final repo = LocalTrainerRepository();
      await repo.chatMarkRead('thr_chat_marcus');
      expect(await repo.chatListUnreadCountsTotal(), 0);
      final thread = (await repo.chatListThreads()).single;
      expect(thread.clientUnreadCount, 0);
    });

    test('unread total sums per-thread client counters', () async {
      final repo = LocalTrainerRepository();
      expect(await repo.chatListUnreadCountsTotal(), 2);
    });
  });

  group('badge logic (TrainerState)', () {
    testWidgets('seeded state drives pill / NEW chip / banner', (tester) async {
      final state = TrainerState.forTest(LocalTrainerRepository());
      await state.ensureLoaded();

      // count pill = chat unread
      expect(state.unreadTotal, 2);
      // NEW chip = unopened 0% assignment
      expect(state.newAssignmentCount, 1); // lower body; mobility 40%, posture 100%
      // banner: new-workout only (repair D2) — chat unread never surfaces one
      expect(state.activeBanner?.kind, TrainerBannerKind.newWorkout);

      final lower = state.assignments.firstWhere((a) => a.id == 'asg_lower');
      state.markAssignmentOpened(lower);
      expect(state.newAssignmentCount, 0); // chip clears on open
      // With no workout signal left there is NO banner, even though chat
      // unread is still 2 (repair D2 regression):
      expect(state.activeBanner, isNull);
    });

    test('progress drives the chip kind thresholds', () async {
      final state = TrainerState.forTest(LocalTrainerRepository());
      await state.ensureLoaded();
      expect(state.progressOf(state.assignments.first), 0.0); // lower NEW
      final mobility = state.assignments.firstWhere((a) => a.id == 'asg_mobility');
      expect(state.progressOf(mobility), closeTo(0.4, 0.001)); // IN PROGRESS
      final posture = state.assignments.firstWhere((a) => a.id == 'asg_posture_w2');
      expect(state.progressOf(posture), 1.0); // COMPLETED
    });
  });

  group('tier gating (locked facts)', () {
    test('trainer_features is Advanced-only on the shared mirror', () {
      expect(tierCan(AccountTier.free, kCapCustomExercises), isFalse);
      expect(tierCan(AccountTier.basic, kCapCustomExercises), isFalse);
      expect(tierCan(AccountTier.advanced, kCapCustomExercises), isTrue);
      expect(tierCan(AccountTier.signedOut, kCapCustomExercises), isFalse);
    });

    test('FREE cap regression: routine limit unchanged by the trainer work', () {
      expect(routineCreationAllowed(AccountTier.free, 2), isTrue);
      expect(routineCreationAllowed(AccountTier.free, 3), isFalse);
      expect(routineCreationAllowed(AccountTier.basic, 99), isTrue);
    });
  });

  group('call requests (repair D3)', () {
    test('callGetMine is null until a request is filed', () async {
      final repo = LocalTrainerRepository();
      expect(await repo.callGetMine(), isNull);
    });

    test('callRequest keeps the LATEST request, trims notes, persists', () async {
      final repo = LocalTrainerRepository();
      await repo.callRequest(day: 2, timeWindow: 'morning', notes: 'before work');
      await repo.callRequest(day: 5, timeWindow: 'evening', notes: '  late start  ');

      final latest = await repo.callGetMine();
      expect(latest!.day, 5);
      expect(latest.timeWindow, 'evening');
      expect(latest.notes, 'late start');

      // Fresh repo instance (new "app launch") reads the persisted record.
      final fresh = LocalTrainerRepository();
      expect((await fresh.callGetMine())!.day, 5);
    });

    test('resetForTest clears the filed request and its prefs entry', () async {
      final repo = LocalTrainerRepository();
      await repo.callRequest(day: 1, timeWindow: 'morning');
      repo.resetForTest();
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('gymmane_call_v1'), isNull);
      expect(await LocalTrainerRepository().callGetMine(), isNull);
    });
  });
}
