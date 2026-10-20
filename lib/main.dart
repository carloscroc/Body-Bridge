import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app/boot_app.dart';
import 'services/alarm_store.dart';
import 'services/device_kind.dart';
import 'services/home_widget_bridge.dart';
import 'services/live_workout.dart';
import 'services/local_store.dart';
import 'services/media_store.dart';
import 'services/rest_alarm.dart';
import 'services/screen_awake.dart';
import 'state/fit_state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarDividerColor: Colors.transparent,
    systemNavigationBarContrastEnforced: false,
    systemStatusBarContrastEnforced: false,
  ));

  runApp(const BootApp());
  await _finishStartup();
}

Future<void> _finishStartup() async {
  await initializeDateFormatting();
  await Store.instance.init();
  await MediaStore.init();
  await AlarmStore.init();
  fit.loadFromStore();
  await RestAlarm.instance.init();
  fit.syncPhotoReminder();
  fit.syncTrainReminder();
  final watch = await DeviceKind.isWatch();
  _onWatch = watch;
  BootApp.resolve(watch);
  fit.addListener(_sessionSideEffects);
  _sessionSideEffects();
  if (!watch) {
    fit.onWidgetsShouldUpdate = HomeWidgetBridge.update;
    WidgetsBinding.instance.addPostFrameCallback((_) => HomeWidgetBridge.update());
  }
}

bool _onWatch = false;

void _sessionSideEffects() {
  if (!_onWatch) LiveWorkout.sync();
  final live = fit.isSessionActive && fit.session?.manual == false;
  ScreenAwake.keepOn(fit.keepScreenOn && live);
}
