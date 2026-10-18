// Consultation confirmation (card t_aaa15e0d) — SUBMITTED state + a read-only
// summary of what the client asked for. Reached right after the request form
// submits, and again from the sheet's "View request" door. The only response
// expectation shown anywhere is the 24-48h flag on the welcome screen.

import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class ConsultationConfirmationScreen extends StatelessWidget {
  const ConsultationConfirmationScreen({super.key});

  String _goalLabel(String id) => switch (id) {
        'fat_loss' => t.goalFatLoss,
        'mobility' => t.goalMobility,
        'consistency' => t.goalConsistency,
        _ => t.goalStrength,
      };

  String _expLabel(String id) => switch (id) {
        'returning' => t.expReturning,
        'seasoned' => t.expSeasoned,
        _ => t.expNew,
      };

  String _timeLabel(String id) => switch (id) {
        'afternoon' => t.timeAfternoon,
        'evening' => t.timeEvening,
        _ => t.timeMorning,
      };

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    final r = trainer.consultation;
    final rows = <(String, String)>[
      (
        t.requestGoalKicker,
        r != null ? _goalLabel(r.goal) : '—',
      ),
      (
        t.requestExpKicker,
        r != null ? _expLabel(r.experience) : '—',
      ),
      (
        t.requestTimeKicker,
        r != null ? _timeLabel(r.timeWindow) : '—',
      ),
      (
        t.requestNotesKicker,
        (r != null && r.notes.isNotEmpty) ? r.notes : '—',
      ),
    ];
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: riseAll([
            ScreenHeader(title: t.sentTitle, onBack: () => fit.popRoute()),
            const SizedBox(height: 18),
            Text(
              t.sentBody,
              style: AppTheme.s(
                  13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: gc.sage.withValues(alpha: dark ? 0.16 : 0.12),
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: gc.sage.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPathIcon(Ic.checkBold, size: 10, color: gc.sage),
                    const SizedBox(width: 6),
                    Text(
                      t.sentChip,
                      style: AppTheme.f(9.5,
                          weight: FontWeight.w800,
                          color: gc.sage,
                          letterSpacing: 1.6),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              t.sentSummaryKicker,
              style: AppTheme.f(9.5,
                  weight: FontWeight.w800,
                  color: gc.textTertiary,
                  letterSpacing: 1.6),
            ),
            const SizedBox(height: 12),
            SoftCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (var i = 0; i < rows.length; i++) ...[
                    if (i > 0) ...[
                      const SizedBox(height: 12),
                      Container(height: 1, color: gc.border),
                      const SizedBox(height: 12),
                    ],
                    Text(
                      rows[i].$1,
                      style: AppTheme.f(9,
                          weight: FontWeight.w700,
                          color: gc.textTertiary,
                          letterSpacing: 1.2),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      rows[i].$2,
                      style:
                          AppTheme.f(13.5, weight: FontWeight.w600, color: gc.text),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: t.sentContinue,
              bg: trainerPrimaryBg(gc, dark),
              fg: trainerPrimaryFg(gc, dark),
              onTap: () => fit.pushRoute('coaching-welcome'),
            ),
          ]),
        ),
      ),
    );
  }
}
