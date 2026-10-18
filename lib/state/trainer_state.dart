// Trainer feature state — badges, read markers, banner + seen-state
// (card t_d788f36e). Wraps the [TrainerRepository] seam and owns the
// client-side "three-signal" unread model from the approved mockups:
//   · count pill  = unread CHAT messages (header + Message button)
//   · 8px tab dot = unseen list activity (clears when the list is viewed)
//   · NEW chip    = unopened assignment (clears when the workout is opened)
// Progress % is client-side only in v0 (contract §4.2 — no completion
// tracking server-side; checkbox state is local).

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/trainer_data.dart';

enum TrainerBannerKind { newWorkout, newMessage }

@immutable
class TrainerBanner {
  const TrainerBanner({required this.kind, required this.key});
  final TrainerBannerKind kind;
  final String key; // dismissal identity
}

class TrainerState extends ChangeNotifier {
  TrainerState._() : repo = LocalTrainerRepository();

  /// Test seam: swap the repository without touching the global singleton
  /// pattern used by the app.
  @visibleForTesting
  TrainerState.forTest(this.repo);

  static final TrainerState instance = TrainerState._();

  final TrainerRepository repo;

  bool loaded = false;
  bool _loading = false;

  TrainerProfile? profile;
  List<TrainerAssignment> assignments = [];
  List<TrainerChatThread> threads = [];
  int unreadTotal = 0;

  /// The caller's consultation request — null until filed (client coaching
  /// funnel, t_aaa15e0d). Mirrors the repo record for UI reactivity.
  TrainerConsultationRequest? consultation;
  // Open selections for the parameterized sub-routes (app_shell reads these).
  String? openAssignmentId;
  String? openThreadId;

  // Seen-state (persisted under its own prefs key — separate from fit's blob
  // so shared shell files stay untouched).
  final Set<String> openedThreads = {}; // NEW chip cleared
  final Set<String> seenInList = {}; // hub list seen
  final Set<String> dismissedBanners = {};

  // Client-side progress (0..1) per assignment thread, seeded to the mockup.
  static const Map<String, double> _seedProgress = {
    'thr_lower': 0.0,
    'thr_mobility': 0.4,
    'thr_posture': 1.0,
  };
  Map<String, double> progress = Map.of(_seedProgress);

  static const _prefsKey = 'gymmane_trainer_v1';

  Future<void> ensureLoaded() async {
    if (loaded || _loading) return;
    _loading = true;
    try {
      final results = await Future.wait([
        repo.trainerProfile(),
        repo.assignmentsListForMe(),
        repo.chatListThreads(),
        repo.chatListUnreadCountsTotal(),
        _loadSeen(),
        repo.consultationGetMine(),
      ]);
      profile = results[0] as TrainerProfile;
      assignments = results[1] as List<TrainerAssignment>;
      threads = results[2] as List<TrainerChatThread>;
      unreadTotal = results[3] as int;
      consultation = results[5] as TrainerConsultationRequest?;
      loaded = true;
      notifyListeners();
    } finally {
      _loading = false;
    }
  }

  Future<void> _loadSeen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      if (raw == null) return;
      final data = jsonDecode(raw) as Map<String, dynamic>;
      openedThreads
        ..clear()
        ..addAll((data['openedThreads'] as List<dynamic>? ?? []).cast<String>());
      seenInList
        ..clear()
        ..addAll((data['seenInList'] as List<dynamic>? ?? []).cast<String>());
      dismissedBanners
        ..clear()
        ..addAll((data['dismissedBanners'] as List<dynamic>? ?? []).cast<String>());
      final stored = (data['progress'] as Map<String, dynamic>? ?? {}).map(
        (k, v) => MapEntry(k, (v as num).toDouble()),
      );
      progress
        ..clear()
        ..addAll(stored.isEmpty ? _seedProgress : stored);
    } catch (_) {
      // Corrupt blob -> fall back to seed state.
    }
  }

  Future<void> _persistSeen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _prefsKey,
        jsonEncode({
          'openedThreads': openedThreads.toList(),
          'seenInList': seenInList.toList(),
          'dismissedBanners': dismissedBanners.toList(),
          'progress': progress,
        }),
      );
    } catch (_) {}
  }

  // --- Badge logic (pure, testable) ---

  double progressOf(TrainerAssignment a) => progress[a.threadId] ?? 0;

  bool isNewAssignment(TrainerAssignment a) => progressOf(a) <= 0 && !openedThreads.contains(a.threadId);

  /// NEW chip assignment count (0% and never opened).
  int get newAssignmentCount => assignments.where(isNewAssignment).length;

  TrainerBanner? get activeBanner {
    final newWorkout = assignments.where(isNewAssignment).toList();
    if (newWorkout.isNotEmpty) {
      final key = 'workout:${newWorkout.first.threadId}';
      if (!dismissedBanners.contains(key)) {
        return TrainerBanner(kind: TrainerBannerKind.newWorkout, key: key);
      }
    }
    if (unreadTotal > 0) {
      const key = 'chat';
      if (!dismissedBanners.contains(key)) {
        return const TrainerBanner(kind: TrainerBannerKind.newMessage, key: key);
      }
    }
    return null;
  }

  // --- Mutations ---

  void markListSeen() {
    var changed = false;
    for (final a in assignments) {
      if (seenInList.add(a.threadId)) changed = true;
    }
    if (changed) {
      _persistSeen();
      notifyListeners();
    }
  }

  void markAssignmentOpened(TrainerAssignment a) {
    if (openedThreads.add(a.threadId)) {
      _persistSeen();
      notifyListeners();
    }
  }

  void dismissBanner(String key) {
    if (dismissedBanners.add(key)) {
      _persistSeen();
      notifyListeners();
    }
  }

  TrainerChatThread? threadById(String id) {
    for (final t in threads) {
      if (t.id == id) return t;
    }
    return null;
  }

  /// chat:markRead + local refresh.
  Future<void> markThreadRead(String threadId) async {
    await repo.chatMarkRead(threadId);
    unreadTotal = await repo.chatListUnreadCountsTotal();
    threads = await repo.chatListThreads();
    notifyListeners();
  }

  /// chat:sendMessage (client side) + local refresh.
  Future<void> sendMessage(String body) async {
    final text = body.trim();
    if (text.isEmpty) return;
    await repo.chatSendMessage(type: TrainerMessageType.text, body: text);
    unreadTotal = 0; // my send resets my counter (contract §5.2)
    threads = await repo.chatListThreads();
    notifyListeners();
  }

  /// consultations:request + local refresh. The repository is duplicate-safe
  /// (first request wins and is returned unchanged), so a double tap or
  /// re-entry can never create a second record.
  Future<TrainerConsultationRequest> requestConsultation({
    required String goal,
    required String experience,
    required String timeWindow,
    String notes = '',
  }) async {
    final r = await repo.consultationRequest(
      goal: goal,
      experience: experience,
      timeWindow: timeWindow,
      notes: notes,
    );
    consultation = r;
    notifyListeners();
    return r;
  }

  /// Test/diagnostic reset.
  ///
  /// Restores the full instance state (not just the seen-sets) so the test
  /// singleton cannot leak between tests.
  @visibleForTesting
  void resetForTest() {
    final r = repo;
    // ignore: invalid_use_of_visible_for_testing_member
    if (r is LocalTrainerRepository) r.resetForTest();
    _loading = false;
    loaded = false;
    profile = null;
    assignments = [];
    threads = [];
    unreadTotal = 0;
    consultation = null;
    openAssignmentId = null;
    openThreadId = null;
    openedThreads.clear();
    seenInList.clear();
    dismissedBanners.clear();
    progress = Map.of(_seedProgress);
  }
}

final trainer = TrainerState.instance;
