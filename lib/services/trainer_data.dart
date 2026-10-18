// Trainer data seam — client custom-workouts + trainer chat (card t_d788f36e).
//
// Type and function names mirror the verified backend contract
// (CONTRACT.md, card t_79f16c1b — §4 assignments, §5 chat) so the backend
// wiring is a repository swap, not a UI refactor:
//   assignments:listForMe / assignments:getThread / assignments:get
//   chat:listThreads / chat:getThread / chat:sendMessage / chat:markRead
//   chat:listUnreadCounts
//
// NO backend dependency: [LocalTrainerRepository] seeds everything locally
// and the app is fully functional offline. v0 has no push (contract §7.4);
// new-assignment / new-message signals surface as in-app banners + badges.

import 'dart:async';

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// --- Wire-shape types (contract §4.1 / §5.1) ---

enum TrainerMessageType { text, workoutCard, exerciseCard }

const Map<TrainerMessageType, String> kTrainerMessageTypeWire = {
  TrainerMessageType.text: 'text',
  TrainerMessageType.workoutCard: 'workout_card',
  TrainerMessageType.exerciseCard: 'exercise_card',
};

/// One exercise line of an assignment (contract §4.1 `assignments.exercises[]`).
@immutable
class TrainerAssignmentExercise {
  const TrainerAssignmentExercise({
    required this.videoId,
    required this.titleSnapshot,
    required this.sets,
    required this.reps,
    this.notes,
    required this.order,
    this.rest,
    this.thumbDuration,
  });

  final String videoId; // Id<"trainerVideos">
  final String titleSnapshot; // denormalized, survives video deletion
  final int sets; // 1..50
  final String reps; // free-form: "8-12", "AMRAP", "30s"
  final String? notes; // PER-EXERCISE trainer note
  final int order; // 0-based display order

  // Seed-only display fields — no contract counterpart yet; they render for
  // local seeds only and are dropped if the backend never ships them.
  final String? rest; // "90s"
  final String? thumbDuration; // "0:48"
}

/// One SEND = one immutable version (contract §4.1).
@immutable
class TrainerAssignment {
  const TrainerAssignment({
    required this.id,
    required this.threadId,
    this.previousVersionId,
    required this.version,
    required this.trainerId,
    required this.clientId,
    required this.title,
    this.trainerNote,
    required this.exercises,
    required this.createdAt,
    this.estimatedMinutes,
  });

  final String id;
  final String threadId; // id of version 1
  final String? previousVersionId;
  final int version;
  final String trainerId;
  final String clientId; // STRICTLY private to this client
  final String title;
  final String? trainerNote; // top-level note
  final List<TrainerAssignmentExercise> exercises;
  final int createdAt; // epoch millis

  final int? estimatedMinutes; // seed-only display field

  /// "Lower Body — Knee-Safe Progression" -> "LOWER BODY" (card kicker).
  String get kicker {
    final dash = title.indexOf(' — ');
    return (dash > 0 ? title.substring(0, dash) : title).toUpperCase();
  }
}

/// Chat thread (contract §5.1 `chatThreads`). Pair-unique: one per
/// (clientId, trainerId).
@immutable
class TrainerChatThread {
  const TrainerChatThread({
    required this.id,
    required this.clientId,
    required this.trainerId,
    required this.lastMessageAt,
    required this.lastMessagePreview,
    required this.clientUnreadCount,
    required this.trainerUnreadCount,
    this.clientLastReadAt,
    this.trainerLastReadAt,
    required this.createdAt,
  });

  final String id;
  final String clientId;
  final String trainerId;
  final int lastMessageAt;
  final String lastMessagePreview;
  final int clientUnreadCount;
  final int trainerUnreadCount;
  final int? clientLastReadAt;
  final int? trainerLastReadAt;
  final int createdAt;
}

/// Card payload attached to non-text messages (contract §5.1 `chatMessages.card`).
@immutable
class TrainerMessageCard {
  const TrainerMessageCard.workout({
    required this.assignmentId,
    required this.title,
    required this.version,
  })  : isWorkout = true,
        videoId = null,
        sets = null,
        reps = null,
        exerciseCount = null,
        estimatedMinutes = null,
        thumbDuration = null;

  const TrainerMessageCard.exercise({
    required this.videoId,
    required this.title,
    this.sets,
    this.reps,
    this.thumbDuration,
  })  : isWorkout = false,
        assignmentId = null,
        version = null,
        exerciseCount = null,
        estimatedMinutes = null;

  final bool isWorkout; // kind: workout | exercise
  final String? assignmentId; // workout cards
  final int? version; // workout cards
  final String? videoId; // exercise cards
  final String title;
  final int? sets;
  final String? reps;
  final int? exerciseCount; // seed-only display
  final int? estimatedMinutes; // seed-only display
  final String? thumbDuration; // seed-only display
}

/// Chat message (contract §5.1 `chatMessages`).
@immutable
class TrainerChatMessage {
  const TrainerChatMessage({
    required this.id,
    required this.threadId,
    required this.senderId,
    required this.type,
    this.body,
    this.card,
    required this.createdAt,
  });

  final String id;
  final String threadId;
  final String senderId;
  final TrainerMessageType type;
  final String? body; // text: 1..4000; cards: optional caption
  final TrainerMessageCard? card; // required when type != text
  final int createdAt;
}

/// Trainer intro-card data (client side of users:lookupForTrainer-style
/// directory resolution).
@immutable
class TrainerProfile {
  const TrainerProfile({
    required this.userId,
    required this.displayName,
    required this.credential,
    required this.memberSince,
    required this.replyWindowHours,
  });

  final String userId;
  final String displayName;
  final String credential; // "NASM-CSCS · Corrective exercise"
  final DateTime memberSince; // "Your trainer since March 2026"
  final int replyWindowHours; // "Usually replies within 2h"

  String get initials {
    final parts = displayName
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .take(2)
        .map((p) => p[0].toUpperCase())
        .join();
    return parts.isEmpty ? '?' : parts;
  }
}

/// One consultation request (client coaching funnel, card t_aaa15e0d).
/// Choice fields hold stable ids — the UI maps ids to localized labels,
/// so the stored record stays locale-independent.
@immutable
class TrainerConsultationRequest {
  const TrainerConsultationRequest({
    required this.goal,
    required this.experience,
    required this.timeWindow,
    required this.notes,
    required this.createdAt,
  });

  final String goal; // strength | fat_loss | mobility | consistency
  final String experience; // new | returning | seasoned
  final String timeWindow; // morning | afternoon | evening
  final String notes; // free-form, may be empty
  final int createdAt; // epoch millis
}

// --- Repository seam (contract-named operations) ---

abstract class TrainerRepository {
  /// assignments:listForMe — latest version per thread for the caller,
  /// newest first.
  Future<List<TrainerAssignment>> assignmentsListForMe();

  /// assignments:getThread — ALL versions of one thread, ascending.
  Future<List<TrainerAssignment>> assignmentsGetThread(String threadId);

  /// assignments:get — one version doc.
  Future<TrainerAssignment?> assignmentsGet(String assignmentId);

  /// chat:listThreads — caller's threads, desc by lastMessageAt.
  Future<List<TrainerChatThread>> chatListThreads();

  /// chat:getThread — messages ascending.
  Future<List<TrainerChatMessage>> chatGetThread(String threadId);

  /// chat:sendMessage — get-or-create pair thread, append, bump counters.
  Future<void> chatSendMessage({
    required TrainerMessageType type,
    String? body,
    TrainerMessageCard? card,
  });

  /// chat:markRead — zeroes the caller's unread counter.
  Future<void> chatMarkRead(String threadId);

  /// chat:listUnreadCounts — {total, perThread}.
  Future<int> chatListUnreadCountsTotal();

  /// Trainer directory entry for the intro card.
  Future<TrainerProfile> trainerProfile();

  /// consultations:getMine — the caller's consultation request, or null.
  Future<TrainerConsultationRequest?> consultationGetMine();

  /// consultations:request — file the caller's request. ONE per client:
  /// when a request already exists it is returned unchanged, so double
  /// taps / re-entry can never create a second record (dup-protection).
  Future<TrainerConsultationRequest> consultationRequest({
    required String goal,
    required String experience,
    required String timeWindow,
    String notes = '',
  });
}

// --- Local seed implementation (offline, no backend) ---

class LocalTrainerRepository implements TrainerRepository {
  static const _trainerId = 'trainer_marcus';
  static const _clientId = 'client_me';

  /// The seeded client-side participant id (message sender checks).
  static String get clientId => _clientId;

  final List<TrainerAssignment> _assignments = _seedAssignments();
  final List<TrainerChatThread> _threads = [_seedThread()];
  final List<TrainerChatMessage> _messages = _seedMessages();
  int _msgSeq = _seedMessages().length + 1;

  /// The caller's consultation request — null until filed. Persisted under
  /// its own prefs key so the SUBMITTED card survives restarts (the repo is
  /// otherwise a process-lifetime in-memory store).
  TrainerConsultationRequest? _consultation;
  static const _consultPrefsKey = 'gymmane_consultation_v1';

  /// Test/diagnostic reset: restore the offline seed state. The repo is a
  /// process-lifetime in-memory store; without this, a chat mark-read in one
  /// test leaks into every later test in the same process.
  @visibleForTesting
  void resetForTest() {
    _assignments
      ..clear()
      ..addAll(_seedAssignments());
    _threads
      ..clear()
      ..addAll([_seedThread()]);
    _messages
      ..clear()
      ..addAll(_seedMessages());
    _msgSeq = _seedMessages().length + 1;
    _consultation = null;
    // Purge the persisted blob too — a fresh instance must start clean.
    unawaited(
      SharedPreferences.getInstance().then<void>(
        (p) => p.remove(_consultPrefsKey),
        onError: (Object _, StackTrace _) {},
      ),
    );
  }

  @override
  Future<List<TrainerAssignment>> assignmentsListForMe() async {
    // Fold to the LATEST version per thread, newest thread first.
    final byThread = <String, TrainerAssignment>{};
    for (final a in _assignments) {
      final cur = byThread[a.threadId];
      if (cur == null || a.version > cur.version) byThread[a.threadId] = a;
    }
    final list = byThread.values.toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  @override
  Future<List<TrainerAssignment>> assignmentsGetThread(String threadId) async =>
      _assignments.where((a) => a.threadId == threadId).toList()
        ..sort((a, b) => a.version.compareTo(b.version));

  @override
  Future<TrainerAssignment?> assignmentsGet(String assignmentId) async {
    for (final a in _assignments) {
      if (a.id == assignmentId) return a;
    }
    return null;
  }

  /// consultations:getMine — memory first, then the persisted record.
  @override
  Future<TrainerConsultationRequest?> consultationGetMine() async {
    if (_consultation != null) return _consultation;
    try {
      final prefs = await SharedPreferences.getInstance();
      final blob = prefs.getString(_consultPrefsKey);
      if (blob == null) return null;
      final d = jsonDecode(blob) as Map<String, dynamic>;
      return _consultation = TrainerConsultationRequest(
        goal: d['goal'] as String? ?? '',
        experience: d['experience'] as String? ?? '',
        timeWindow: d['timeWindow'] as String? ?? '',
        notes: d['notes'] as String? ?? '',
        createdAt: (d['createdAt'] as num?)?.toInt() ?? 0,
      );
    } catch (_) {
      return null; // corrupt blob -> no request
    }
  }

  /// consultations:request — duplicate-safe: the FIRST request wins and is
  /// returned unchanged on every later call.
  @override
  Future<TrainerConsultationRequest> consultationRequest({
    required String goal,
    required String experience,
    required String timeWindow,
    String notes = '',
  }) async {
    final existing = await consultationGetMine();
    if (existing != null) return existing;
    final r = TrainerConsultationRequest(
      goal: goal,
      experience: experience,
      timeWindow: timeWindow,
      notes: notes.trim(),
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );
    return _consultation = await _persistThen(r);
  }

  Future<TrainerConsultationRequest> _persistThen(
      TrainerConsultationRequest r) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _consultPrefsKey,
        jsonEncode({
          'goal': r.goal,
          'experience': r.experience,
          'timeWindow': r.timeWindow,
          'notes': r.notes,
          'createdAt': r.createdAt,
        }),
      );
    } catch (_) {
      // Persistence is best-effort: the in-memory record still wins.
    }
    return r;
  }

  @override
  Future<List<TrainerChatThread>> chatListThreads() async =>
      _threads.toList()..sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));

  @override
  Future<List<TrainerChatMessage>> chatGetThread(String threadId) async =>
      _messages.where((m) => m.threadId == threadId).toList()
        ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

  @override
  Future<void> chatSendMessage({
    required TrainerMessageType type,
    String? body,
    TrainerMessageCard? card,
  }) async {
    var thread = _threads.firstWhere(
      (t) => t.clientId == _clientId && t.trainerId == _trainerId,
    );
    final now = DateTime.now().millisecondsSinceEpoch;
    final preview = (body != null && body.isNotEmpty)
        ? (body.length > 80 ? body.substring(0, 80) : body)
        : type == TrainerMessageType.workoutCard
            ? card?.title ?? 'Workout'
            : card?.title ?? 'Exercise';
    _threads.remove(thread);
    // Send: recipient (trainer) unread++, sender (client) counter resets,
    // lastReadAt stamps now — contract §5.2, one transaction server-side.
    _threads.add(TrainerChatThread(
      id: thread.id,
      clientId: thread.clientId,
      trainerId: thread.trainerId,
      lastMessageAt: now,
      lastMessagePreview: preview,
      clientUnreadCount: 0,
      trainerUnreadCount: thread.trainerUnreadCount + 1,
      clientLastReadAt: now,
      trainerLastReadAt: thread.trainerLastReadAt,
      createdAt: thread.createdAt,
    ));
    _messages.add(TrainerChatMessage(
      id: 'msg_seed_${_msgSeq++}',
      threadId: thread.id,
      senderId: _clientId,
      type: type,
      body: body,
      card: card,
      createdAt: now,
    ));
  }

  @override
  Future<void> chatMarkRead(String threadId) async {
    final i = _threads.indexWhere((t) => t.id == threadId);
    if (i < 0) return;
    final t = _threads[i];
    _threads[i] = TrainerChatThread(
      id: t.id,
      clientId: t.clientId,
      trainerId: t.trainerId,
      lastMessageAt: t.lastMessageAt,
      lastMessagePreview: t.lastMessagePreview,
      clientUnreadCount: 0,
      trainerUnreadCount: t.trainerUnreadCount,
      clientLastReadAt: DateTime.now().millisecondsSinceEpoch,
      trainerLastReadAt: t.trainerLastReadAt,
      createdAt: t.createdAt,
    );
  }

  @override
  Future<int> chatListUnreadCountsTotal() async =>
      _threads.fold<int>(0, (sum, t) => sum + t.clientUnreadCount);

  @override
  Future<TrainerProfile> trainerProfile() async => TrainerProfile(
        userId: _trainerId,
        displayName: 'Marcus Reyes',
        credential: 'NASM-CSCS · Corrective exercise',
        memberSince: DateTime(2026, 3, 1),
        replyWindowHours: 2,
      );

  // --- Seeds (approved mockup content, verbatim where user-visible) ---

  static List<TrainerAssignment> _seedAssignments() {
    int at(int y, int mo, int d, [int h = 9, int mi = 0]) =>
        DateTime(y, mo, d, h, mi).millisecondsSinceEpoch;
    return [
      // v2 of the posture thread — proves version folding in listForMe.
      TrainerAssignment(
        id: 'asg_posture_w1',
        threadId: 'thr_posture',
        version: 1,
        trainerId: _trainerId,
        clientId: _clientId,
        title: 'Posture Foundations — Week 1',
        exercises: [],
        createdAt: at(2026, 9, 24),
        estimatedMinutes: 20,
      ),
      TrainerAssignment(
        id: 'asg_lower',
        threadId: 'thr_lower',
        version: 1,
        trainerId: _trainerId,
        clientId: _clientId,
        title: 'Lower Body — Knee-Safe Progression',
        trainerNote: 'Built this to keep load off your knee. Tell me how one '
            "feels and I'll adjust box height next week.",
        createdAt: at(2026, 10, 12, 9, 14),
        estimatedMinutes: 35,
        exercises: [
          const TrainerAssignmentExercise(
            videoId: 'vid_box_squat',
            titleSnapshot: 'Goblet Box Squat',
            sets: 3,
            reps: '6-8',
            notes: 'Heels flat, box tap light. If the knee complains, raise '
                'the box one inch.',
            order: 0,
            rest: '90s',
            thumbDuration: '0:48',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_glute_bridge',
            titleSnapshot: 'Banded Glute Bridge',
            sets: 3,
            reps: '12 @ 2-2-2',
            notes: 'Squeeze at the top. You should feel this in the glutes, '
                'never the lower back.',
            order: 1,
            rest: '60s',
            thumbDuration: '0:36',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_hip_flexor',
            titleSnapshot: 'Half-Kneeling Hip Flexor Stretch',
            sets: 2,
            reps: '45s / side',
            notes: 'Tall spine, squeeze the glute. Feel the stretch in the '
                'front of the hip, never the back.',
            order: 2,
            rest: '30s',
            thumbDuration: '0:52',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_split_squat',
            titleSnapshot: 'Supported Split Squat',
            sets: 3,
            reps: '8 @ 2-1-2',
            notes: 'Back knee tracks straight down. Hold the rack until the '
                'pattern feels automatic.',
            order: 3,
            rest: '90s',
            thumbDuration: '1:04',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_tke',
            titleSnapshot: 'Terminal Knee Extension — Band',
            sets: 3,
            reps: '15',
            notes: 'Full lock-out each rep. This teaches the knee to trust '
                'straightening again.',
            order: 4,
            rest: '45s',
            thumbDuration: '0:41',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_calf',
            titleSnapshot: 'Calf Raise — Slow Eccentric',
            sets: 3,
            reps: '12 @ 3-1-1',
            notes: 'Three seconds down. The calf protects the knee when it '
                'is strong and controlled.',
            order: 5,
            rest: '45s',
            thumbDuration: '0:33',
          ),
        ],
      ),
      TrainerAssignment(
        id: 'asg_mobility',
        threadId: 'thr_mobility',
        version: 1,
        trainerId: _trainerId,
        clientId: _clientId,
        title: 'Mobility Reset — Hips & T-Spine',
        trainerNote: 'Ten quiet minutes. Run this as your warm-up on lifting '
            'days and standalone on the rest.',
        createdAt: at(2026, 10, 8),
        estimatedMinutes: 25,
        exercises: [
          const TrainerAssignmentExercise(
            videoId: 'vid_90_90',
            titleSnapshot: '90/90 Hip Switch',
            sets: 2,
            reps: '8 / side',
            notes: 'Slow switches, chest tall.',
            order: 0,
            rest: '30s',
            thumbDuration: '0:58',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_couch',
            titleSnapshot: 'Couch Stretch — Ease In',
            sets: 2,
            reps: '60s / side',
            notes: 'Ease in: the first 20 seconds should feel like nothing.',
            order: 1,
            rest: '20s',
            thumbDuration: '1:12',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_thread_needle',
            titleSnapshot: 'Thread the Needle — T-Spine',
            sets: 2,
            reps: '8 / side',
            notes: 'Exhale as you reach through.',
            order: 2,
            rest: '20s',
            thumbDuration: '0:47',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_world_greatest',
            titleSnapshot: "World's Greatest Stretch",
            sets: 2,
            reps: '5 / side',
            notes: 'Reach the ceiling, then elbow to instep.',
            order: 3,
            rest: '30s',
            thumbDuration: '1:03',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_cat_camel',
            titleSnapshot: 'Cat — Camel, Segmented',
            sets: 2,
            reps: '10',
            notes: 'Move one vertebra at a time.',
            order: 4,
            rest: '20s',
            thumbDuration: '0:39',
          ),
        ],
      ),
      TrainerAssignment(
        id: 'asg_posture_w2',
        threadId: 'thr_posture',
        previousVersionId: 'asg_posture_w1',
        version: 2,
        trainerId: _trainerId,
        clientId: _clientId,
        title: 'Posture Foundations — Week 2',
        trainerNote: 'Same moves, one more round. Week 1 built the pattern; '
            'week 2 makes it stick.',
        createdAt: at(2026, 10, 1),
        estimatedMinutes: 20,
        exercises: [
          const TrainerAssignmentExercise(
            videoId: 'vid_wall_angel',
            titleSnapshot: 'Wall Angel',
            sets: 3,
            reps: '10',
            notes: 'Ribs down, wrists light on the wall.',
            order: 0,
            rest: '45s',
            thumbDuration: '0:44',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_face_pull',
            titleSnapshot: 'Band Face Pull',
            sets: 3,
            reps: '15',
            notes: 'Pull to the eyebrows, not the chest.',
            order: 1,
            rest: '45s',
            thumbDuration: '0:37',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_dead_bug',
            titleSnapshot: 'Dead Bug — Slow',
            sets: 3,
            reps: '8 / side',
            notes: 'Low back stays glued down.',
            order: 2,
            rest: '30s',
            thumbDuration: '0:51',
          ),
          const TrainerAssignmentExercise(
            videoId: 'vid_chin_tuck',
            titleSnapshot: 'Chin Tuck — Wall',
            sets: 2,
            reps: '10',
            notes: 'Glide the head back, never tilt.',
            order: 3,
            rest: '30s',
            thumbDuration: '0:29',
          ),
        ],
      ),
    ];
  }

  static TrainerChatThread _seedThread() {
    final created = DateTime(2026, 10, 12, 9, 13).millisecondsSinceEpoch;
    final last = DateTime(2026, 10, 16, 8, 15).millisecondsSinceEpoch;
    return TrainerChatThread(
      id: 'thr_chat_marcus',
      clientId: _clientId,
      trainerId: _trainerId,
      lastMessageAt: last,
      lastMessagePreview: "That's the progression working. We'll add load ne…",
      clientUnreadCount: 2,
      trainerUnreadCount: 0,
      clientLastReadAt: DateTime(2026, 10, 12, 9, 41).millisecondsSinceEpoch,
      trainerLastReadAt: DateTime(2026, 10, 16, 8, 16).millisecondsSinceEpoch,
      createdAt: created,
    );
  }

  static List<TrainerChatMessage> _seedMessages() {
    int at(int y, int mo, int d, [int h = 9, int mi = 0]) =>
        DateTime(y, mo, d, h, mi).millisecondsSinceEpoch;
    return [
      TrainerChatMessage(
        id: 'msg_1',
        threadId: 'thr_chat_marcus',
        senderId: _trainerId,
        type: TrainerMessageType.text,
        body: "Program's ready. I built the lower-body day around keeping "
            'load off the knee. Run the mobility reset as your warm-up.',
        createdAt: at(2026, 10, 12, 9, 13),
      ),
      TrainerChatMessage(
        id: 'msg_2',
        threadId: 'thr_chat_marcus',
        senderId: _trainerId,
        type: TrainerMessageType.workoutCard,
        card: const TrainerMessageCard.workout(
          assignmentId: 'asg_lower',
          title: 'Lower Body — Knee-Safe Progression',
          version: 1,
        ),
        createdAt: at(2026, 10, 12, 9, 14),
      ),
      TrainerChatMessage(
        id: 'msg_3',
        threadId: 'thr_chat_marcus',
        senderId: _clientId,
        type: TrainerMessageType.text,
        body: "Got it — I'll do it tomorrow before work.",
        createdAt: at(2026, 10, 12, 9, 41),
      ),
      TrainerChatMessage(
        id: 'msg_4',
        threadId: 'thr_chat_marcus',
        senderId: _trainerId,
        type: TrainerMessageType.text,
        body: 'One cue for the box squat: heels stay flat, tap the box light.',
        createdAt: at(2026, 10, 12, 9, 42),
      ),
      TrainerChatMessage(
        id: 'msg_5',
        threadId: 'thr_chat_marcus',
        senderId: _trainerId,
        type: TrainerMessageType.exerciseCard,
        card: const TrainerMessageCard.exercise(
          videoId: 'vid_box_squat',
          title: 'Goblet Box Squat',
          sets: 3,
          reps: '6-8',
          thumbDuration: '0:48',
        ),
        createdAt: at(2026, 10, 12, 9, 42),
      ),
      TrainerChatMessage(
        id: 'msg_6',
        threadId: 'thr_chat_marcus',
        senderId: _clientId,
        type: TrainerMessageType.text,
        body: 'That cue helped. Last set felt strong.',
        createdAt: at(2026, 10, 16, 8, 3),
      ),
      TrainerChatMessage(
        id: 'msg_7',
        threadId: 'thr_chat_marcus',
        senderId: _trainerId,
        type: TrainerMessageType.text,
        body: "That's the progression working. We'll add load next week.",
        createdAt: at(2026, 10, 16, 8, 15),
      ),
    ];
  }
}
