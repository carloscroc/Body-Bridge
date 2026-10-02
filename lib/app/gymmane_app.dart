import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../l10n/l10n.dart';
import '../state/account_gate.dart';
import '../state/account_gate_impl.dart';
import '../state/fit_state.dart';
import '../theme/app_theme.dart';
import '../widgets/premium_gate.dart';
import 'app_shell.dart';

class GymManeApp extends StatelessWidget {
  const GymManeApp({super.key});

  /// The single production gate, created once at composition time and provided
  /// to the whole tree through [PremiumGate].
  static final AccountGate gate = RealAccountGate();

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: fit,
      builder: (context, _) => PremiumGate(
        gate: gate,
        child: MaterialApp(
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
          home: const AppShell(),
        ),
      ),
    );
  }
}
