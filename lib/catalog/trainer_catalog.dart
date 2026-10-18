class TrainerProfile {
  final String id;
  final String name;
  final String credentials;

  const TrainerProfile({required this.id, required this.name, required this.credentials});

  String get initials {
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length < 2) return parts.isEmpty ? '' : parts.first.substring(0, 1);
    return '${parts[parts.length - 2].substring(0, 1)}${parts.last.substring(0, 1)}';
  }
}

class TrainerSession {
  final String id;
  final String title;
  final String category;
  final String equipmentLabel;
  final int durationSec;
  final int? playerDurationSec;
  final List<String> cues;
  final bool isNew;
  final String videoUrl;
  final String setsHint;
  final String repsHint;
  final String difficulty;

  const TrainerSession({
    required this.id,
    required this.title,
    required this.category,
    required this.equipmentLabel,
    required this.durationSec,
    this.playerDurationSec,
    this.cues = const [],
    this.isNew = false,
    this.videoUrl = '',
    this.setsHint = '',
    this.repsHint = '',
    this.difficulty = 'Beginner',
  });

  int get playerSec => playerDurationSec ?? durationSec;

  String get durationLabel {
    final m = durationSec ~/ 60;
    final s = durationSec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  String get playerLabel {
    final m = playerSec ~/ 60;
    final s = playerSec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}

class TrainerAssignment {
  final String sessionId;
  final String title;
  final String prescription;
  final int durationSec;
  final int year;
  final int month;
  final int day;
  final bool dueToday;

  const TrainerAssignment({
    required this.sessionId,
    required this.title,
    required this.prescription,
    required this.durationSec,
    required this.year,
    required this.month,
    required this.day,
    this.dueToday = false,
  });

  DateTime get assignedDate => DateTime(year, month, day);

  String get durationLabel {
    final m = durationSec ~/ 60;
    final s = durationSec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}

const TrainerProfile kTrainerProfile = TrainerProfile(
  id: 'coach-maya',
  name: 'Coach Maya Reyes',
  credentials: 'CSCS · Corrective exercise specialist',
);

const List<String> kTrainerCategories = ['all', 'strength', 'mobility', 'core', 'corrective', 'warmup'];

const List<TrainerSession> kTrainerSessions = [
  TrainerSession(
    id: 'pallof-setup',
    title: 'Pallof Press — setup',
    category: 'core',
    equipmentLabel: 'Band',
    durationSec: 130,
    playerDurationSec: 90,
    cues: [
      'Brace your trunk before each rep',
      'Exhale as you rotate away',
      'Stop at the pinch, not into pain',
    ],
    setsHint: '3',
    repsHint: '10',
    difficulty: 'Beginner',
  ),
  TrainerSession(
    id: 'hip-switch',
    title: '90/90 Hip Switch',
    category: 'mobility',
    equipmentLabel: 'Mat',
    durationSec: 95,
    isNew: true,
    difficulty: 'Intermediate',
  ),
  TrainerSession(
    id: 'copenhagen-plank',
    title: 'Copenhagen Plank',
    category: 'strength',
    equipmentLabel: 'Bench',
    durationSec: 110,
    difficulty: 'Advanced',
  ),
  TrainerSession(
    id: 'tibialis-raise',
    title: 'Tibialis Raise',
    category: 'corrective',
    equipmentLabel: 'Wall',
    durationSec: 45,
    difficulty: 'Beginner',
  ),
  TrainerSession(
    id: 'goblet-bracing',
    title: 'Goblet Squat — bracing',
    category: 'strength',
    equipmentLabel: 'Kettlebell',
    durationSec: 200,
    difficulty: 'Intermediate',
  ),
  TrainerSession(
    id: 'worlds-greatest-stretch',
    title: "World's Greatest Stretch",
    category: 'warmup',
    equipmentLabel: 'Mat',
    durationSec: 160,
    difficulty: 'Beginner',
  ),
];

const List<TrainerAssignment> kTrainerAssignments = [
  TrainerAssignment(
    sessionId: 'pallof-setup',
    title: 'Pallof Press — tall kneeling',
    prescription: '3×10, pause 2s at top',
    durationSec: 50,
    year: 2026,
    month: 10,
    day: 12,
    dueToday: true,
  ),
  TrainerAssignment(
    sessionId: 'tibialis-raise',
    title: 'Wall Slide — tempo',
    prescription: '2×12, 3s up, 3s down',
    durationSec: 75,
    year: 2026,
    month: 10,
    day: 12,
  ),
  TrainerAssignment(
    sessionId: 'pallof-setup',
    title: 'Dead Bug — breath pacing',
    prescription: '3×8 per side, exhale fully',
    durationSec: 105,
    year: 2026,
    month: 10,
    day: 9,
  ),
  TrainerAssignment(
    sessionId: 'copenhagen-plank',
    title: 'Copenhagen — short lever',
    prescription: '3×20s per side',
    durationSec: 80,
    year: 2026,
    month: 10,
    day: 9,
  ),
];

const String kTrainerCoachNote = 'Your shoulder is clearing — slow tempo this week.';

typedef TrainerVideoHostFactory = TrainerVideoHost Function(TrainerSession session);

abstract class TrainerVideoHost {
  double get positionSec;
  double get durationSec;
  bool get playing;

  Future<void> load(String url);
  void togglePlay();
  void seekTo(double sec);
  void dispose();
}

class StaticTrainerVideoHost implements TrainerVideoHost {
  StaticTrainerVideoHost({required int durationSec, double positionSec = 12})
    : _duration = durationSec.toDouble(),
      _position = positionSec.clamp(0.0, durationSec.toDouble());

  double _position;
  final double _duration;
  bool _playing = false;

  @override
  double get positionSec => _position;

  @override
  double get durationSec => _duration;

  @override
  bool get playing => _playing;

  @override
  Future<void> load(String url) async {}

  @override
  void togglePlay() => _playing = !_playing;

  @override
  void seekTo(double sec) => _position = sec.clamp(0.0, _duration);

  @override
  void dispose() {}
}

TrainerVideoHost defaultTrainerVideoHost(TrainerSession session) =>
    StaticTrainerVideoHost(durationSec: session.playerSec);

TrainerVideoHostFactory trainerVideoHostFactory = defaultTrainerVideoHost;

TrainerSession trainerSessionById(String id) =>
    kTrainerSessions.firstWhere((s) => s.id == id, orElse: () => kTrainerSessions.first);
