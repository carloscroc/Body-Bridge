import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/services/trainer_data.dart';
import 'package:gymmane/state/trainer_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('Consultation funnel seam (trainer_data.dart)', () {
    TestWidgetsFlutterBinding.ensureInitialized();

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('gymmane_consultation_v1');
      // Ensure the trainer state singleton resets for each test
      TrainerState.instance.resetForTest();
    });

    // Contract: consultations:getMine — null before first request.
    test('consultations:getMine returns null initially', () async {
      final repo = LocalTrainerRepository();
      final result = await repo.consultationGetMine();
      expect(result, isNull);
    });

    // Contract: consultations:request — first request wins; duplicate tap returns unchanged.
    test('consultations:request creates first record and duplicate returns same', () async {
      final repo = LocalTrainerRepository();
      final first = await repo.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Test request',
      );
      expect(first, isNotNull);
      expect(first.goal, 'strength');
      expect(first.experience, 'new');
      expect(first.timeWindow, 'morning');
      expect(first.notes, 'Test request');
      expect(first.createdAt, greaterThan(0));

      // Second call with different data should still return the first request unchanged.
      final second = await repo.consultationRequest(
        goal: 'fat_loss', // different goal
        experience: 'returning',
        timeWindow: 'evening',
        notes: 'Different notes',
      );
      // First-wins: the duplicate call returns the identical first record.
      expect(second, same(first));
      expect(second.goal, 'strength'); // unchanged, still first request
      expect(second.experience, 'new');
      expect(second.timeWindow, 'morning');
      expect(second.notes, 'Test request');
      expect(second.createdAt, first.createdAt);
    });

    // Contract: persistence across repo re-instantiation (service restart).
    test('consultation persists after repo re-instantiation', () async {
      final repo1 = LocalTrainerRepository();
      await repo1.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Persist test',
      );

      // Recreate the repository (simulating a process restart).
      final repo2 = LocalTrainerRepository();
      final retrieved = await repo2.consultationGetMine();
      expect(retrieved, isNotNull);
      expect(retrieved!.goal, 'strength');
      expect(retrieved.notes, 'Persist test');
    });

    // Contract: resetForTest clears the consultation.
    test('resetForTest clears consultation', () async {
      final repo = LocalTrainerRepository();
      await repo.consultationRequest(
        goal: 'strength',
        experience: 'new',
        timeWindow: 'morning',
        notes: 'Will be reset',
      );

      final beforeReset = await repo.consultationGetMine();
      expect(beforeReset, isNotNull);

      // Reset the test seam (as provided by trainer_state).
      TrainerState.instance.resetForTest();
      // Flush the best-effort prefs purge fired by resetForTest.
      await Future<void>.delayed(Duration.zero);

      // A fresh repository instance (what a restart would see) has none.
      final fresh = LocalTrainerRepository();
      final afterReset = await fresh.consultationGetMine();
      expect(afterReset, isNull);
    });

    // UI (RED evidence) placeholder: screens not yet exist → compilation failure.
    // We will add integration tests once screens exist.
    // Skipping for now to keep compile error visible.
  });
}