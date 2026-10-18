// Coaching welcome (card t_aaa15e0d) — what happens after SUBMITTED. The
// sage flag pill carries the ONLY response expectation the app ever states:
// the trainer replies within 24-48 hours. Done returns to My Trainer.

import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class CoachingWelcomeScreen extends StatelessWidget {
  const CoachingWelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: riseAll([
            ScreenHeader(title: t.welcomeTitle, onBack: () => fit.goTrainer()),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: gc.sage.withValues(alpha: dark ? 0.16 : 0.12),
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: gc.sage.withValues(alpha: 0.4)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SvgPathIcon(Ic.clock, size: 13, color: gc.sage),
                  const SizedBox(width: 7),
                  Flexible(
                    child: Text(
                      t.welcomeFlag,
                      style:
                          AppTheme.f(11.5, weight: FontWeight.w700, color: gc.sage),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            SoftCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (var i = 0; i < 3; i++) ...[
                    if (i > 0) ...[
                      const SizedBox(height: 14),
                      Container(height: 1, color: gc.border),
                      const SizedBox(height: 14),
                    ],
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: gc.accent.withValues(alpha: dark ? 0.18 : 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '${i + 1}',
                            style: AppTheme.f(11,
                                weight: FontWeight.w800, color: gc.accent),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            [t.welcomeStep1, t.welcomeStep2, t.welcomeStep3][i],
                            style: AppTheme.s(
                                13, weight: FontWeight.w500, color: gc.text, height: 1.45),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: t.welcomeDone,
              bg: trainerPrimaryBg(gc, dark),
              fg: trainerPrimaryFg(gc, dark),
              onTap: () => fit.goTrainer(),
            ),
          ]),
        ),
      ),
    );
  }
}
