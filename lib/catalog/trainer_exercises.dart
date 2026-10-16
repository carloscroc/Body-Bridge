import '../l10n/l10n.dart';
import '../models/exercise.dart';
import 'trainer_catalog.dart';

const Set<String> kTrainerCategoryIds = {'strength', 'mobility', 'core', 'corrective', 'warmup'};

String _mappedEquipment(String label) => switch (label) {
      'Band' => 'Band',
      'Kettlebell' => 'Kettlebell',
      _ => 'Bodyweight',
    };

Exercise trainerSessionExercise(TrainerSession s) => Exercise(
      id: 'tr-${s.id}',
      name: s.title,
      primary: s.category,
      secondary: const [],
      equipment: _mappedEquipment(s.equipmentLabel),
      difficulty: s.difficulty,
      art: '',
      steps: s.cues,
      mode: '',
    );

int _assignmentSeat(int index) {
  var k = 0;
  for (var j = 0; j < index; j++) {
    if (kTrainerAssignments[j].sessionId == kTrainerAssignments[index].sessionId) k++;
  }
  return k;
}

Exercise trainerAssignmentExercise(TrainerAssignment a, int k) {
  final base = trainerSessionById(a.sessionId);
  return Exercise(
    id: 'as-${a.sessionId}-$k',
    name: a.title,
    primary: base.category,
    secondary: const [],
    equipment: _mappedEquipment(base.equipmentLabel),
    difficulty: base.difficulty,
    art: '',
    steps: [a.prescription, ...base.cues],
    mode: '',
  );
}

List<Exercise> get trainerExercises => [
      for (final s in kTrainerSessions) trainerSessionExercise(s),
    ];

List<Exercise> get assignedExercises => [
      for (var i = 0; i < kTrainerAssignments.length; i++)
        trainerAssignmentExercise(kTrainerAssignments[i], _assignmentSeat(i)),
    ];

bool isTrainerSourcedId(String id) => id.startsWith('tr-') || id.startsWith('as-');

String exerciseSectionLabel(Exercise e) => kTrainerCategoryIds.contains(e.primary)
    ? t.trainerCategory(e.primary)
    : muscleLabel(e.primary);
