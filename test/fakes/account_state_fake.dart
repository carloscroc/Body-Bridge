import 'dart:async';

/// Scriptable stand-in for the account state controller the UI (card C3) is
/// contracted to watch, plus a tiny mirror of its status enum.
///
/// The enum is re-declared here — deliberately NOT imported from lib/ — so
/// this suite stays compilable while sibling cards C2/C3 are in flight. A
/// contract-sync test asserts the lib/ declaration matches this shape once
/// C2 lands; a drift then fails loudly instead of mysteriously.
class FakeAccountState {
  FakeAccountStatus _status = FakeAccountStatus.signedOut;

  /// Backing field the C3 contract calls `status` on the real controller.
  FakeAccountStatus get status => _status;

  set status(FakeAccountStatus value) {
    _status = value;
    if (!statusesController.isClosed) {
      statusesController.add(value);
    }
  }

  bool get signedIn => _status != FakeAccountStatus.signedOut;

  final StreamController<FakeAccountStatus> statusesController =
      StreamController<FakeAccountStatus>.broadcast();

  /// Contract name on the real controller: `authStateChanges`.
  Stream<FakeAccountStatus> get authStateChanges => statusesController.stream;

  Future<void> dispose() => statusesController.close();
}

enum FakeAccountStatus { signedOut, signedInFree, signedInBasic, signedInAdvanced, signedInEnterprise }
