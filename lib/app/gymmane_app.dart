import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../l10n/l10n.dart';
import '../screens/auth_wall_screen.dart';
import '../state/account_gate.dart';
import '../state/account_gate_impl.dart';
import '../state/account_state.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/premium_gate.dart';
import '../widgets/ui_kit.dart';
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
          home: const _EntryGate(),
        ),
      ),
    );
  }
}

/// Boot router: splash while the account state warms up, the offline error
/// wall on a failed warm-up, the mandatory-auth wall when signed out, and the
/// app itself once an account exists.
class _EntryGate extends StatelessWidget {
  const _EntryGate();

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return AnimatedBuilder(
      animation: account,
      builder: (context, _) {
        if (!account.warmedUp) return _splash(gc);
        return switch (account.phase) {
          AccountPhase.error => _offlineWall(gc),
          AccountPhase.signedOut => const AuthWallScreen(),
          _ => const AppShell(),
        };
      },
    );
  }

  Widget _splash(GymColors gc) => ColoredBox(
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

  Widget _offlineWall(GymColors gc) => ColoredBox(
        color: gc.bg,
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(child: Icon(Icons.wifi_off, color: gc.textSecondary)),
                  const SizedBox(height: 16),
                  Text(
                    t.authWallOfflineTitle,
                    textAlign: TextAlign.center,
                    style: AppTheme.f(18, weight: FontWeight.w700, color: gc.text),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t.authWallOfflineBody,
                    textAlign: TextAlign.center,
                    style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(label: t.authWallRetry, onTap: () => account.retry()),
                ],
              ),
            ),
          ),
        ),
      );
}
