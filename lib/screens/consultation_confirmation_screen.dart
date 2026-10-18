// Consultation confirmation (card t_aaa15e0d, repair t_db30a5d3 R1) —
// consultation-confirmation.html mockup-verbatim: "received, not booked".
// Sage SUBMITTED chip inside a status card that carries the facts without
// promising a clock, note that nothing changes until a plan is chosen, and
// the Back-to-Exercises exit. Reached right after the request form submits,
// and again from the sheet's door when a request is already on file.

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/account_gate.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class ConsultationConfirmationScreen extends StatelessWidget {
  const ConsultationConfirmationScreen({super.key});

  // New mockup chip ids first; pre-mockup ids keep their labels so an old
  // persisted record still reads correctly.
  String _goalLabel(String id) => switch (id) {
        'recover' => t.goalRecover,
        'mobility' => t.goalMobility,
        'unsure' => t.goalUnsure,
        'fat_loss' => t.goalFatLoss,
        'consistency' => t.goalConsistency,
        _ => t.goalStrength,
      };

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    final r = trainer.consultation;
    final email = AccountGate.instance.snapshot.email;
    final dt =
        (r != null && r.createdAt > 0) ? DateTime.fromMillisecondsSinceEpoch(r.createdAt) : null;
    final requested = dt == null
        ? '—'
        : '${t.shortDate(dt)} · ${TimeOfDay.fromDateTime(dt).format(context)}';
    final contact = (email == null || email.isEmpty) ? '—' : '${t.emailLabel} · $email';
    final rows = <(String, String)>[
      (t.sentRequestedLabel, requested),
      (t.sentContactLabel, contact),
      (t.sentGoalLabel, r != null ? _goalLabel(r.goal) : '—'),
    ];
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: riseAll([
            ScreenHeader(title: t.requestTitle, onBack: () => fit.popRoute()),
            const SizedBox(height: 20),
            Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: gc.sage.withValues(alpha: dark ? 0.16 : 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(PhosphorIconsBold.check, size: 26, color: gc.sage),
                ),
                const SizedBox(height: 14),
                Text(
                  t.sentTitle,
                  textAlign: TextAlign.center,
                  style: AppTheme.f(20, weight: FontWeight.w800, color: gc.text),
                ),
                const SizedBox(height: 8),
                Text(
                  t.sentBody,
                  textAlign: TextAlign.center,
                  style: AppTheme.s(
                      13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.5),
                ),
              ],
            ),
            const SizedBox(height: 22),
            SoftCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        t.sentSummaryKicker,
                        style: AppTheme.f(9.5,
                            weight: FontWeight.w800,
                            color: gc.textTertiary,
                            letterSpacing: 1.6),
                      ),
                      Container(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: gc.sage.withValues(alpha: dark ? 0.16 : 0.12),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          t.sentChip,
                          style: AppTheme.f(9.5,
                              weight: FontWeight.w800,
                              color: gc.sage,
                              letterSpacing: 1.2),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  for (var i = 0; i < rows.length; i++) ...[
                    if (i > 0) const SizedBox(height: 9),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rows[i].$1,
                          style: AppTheme.f(12,
                              weight: FontWeight.w600, color: gc.textTertiary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            rows[i].$2,
                            textAlign: TextAlign.right,
                            style: AppTheme.f(13,
                                weight: FontWeight.w700, color: gc.text),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text(
              t.sentNote,
              textAlign: TextAlign.center,
              style: AppTheme.s(
                  12, weight: FontWeight.w600, color: gc.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: t.sentContinue,
              bg: trainerPrimaryBg(gc, dark),
              fg: trainerPrimaryFg(gc, dark),
              onTap: () => fit.goExercises(),
            ),
          ]),
        ),
      ),
    );
  }
}
