import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../wear/wear_app.dart';
import 'gymmane_app.dart';

class BootApp extends StatefulWidget {
  const BootApp({super.key});

  static final ValueNotifier<bool> ready = ValueNotifier<bool>(false);
  static bool _watch = false;

  static void resolve(bool watch) {
    _watch = watch;
    ready.value = true;
  }

  @override
  State<BootApp> createState() => _BootAppState();
}

class _BootAppState extends State<BootApp> {
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: BootApp.ready,
      builder: (context, _) {
        if (!BootApp.ready.value) return _splashApp();
        return BootApp._watch ? const WearApp() : const GymManeApp();
      },
    );
  }

  Widget _splashApp() => MaterialApp(
        title: 'Body Bridge',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: fit.themeMode,
        locale: fit.locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const _BootSplash(),
      );
}

class _BootSplash extends StatelessWidget {
  const _BootSplash();

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return ColoredBox(
      color: gc.bg,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Body Bridge', style: AppTheme.f(34, weight: FontWeight.w800, color: gc.text)),
            const SizedBox(height: 12),
            CircularProgressIndicator(color: gc.accent),
          ],
        ),
      ),
    );
  }
}
