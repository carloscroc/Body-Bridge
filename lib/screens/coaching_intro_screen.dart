// Coaching funnel intro (card t_aaa15e0d) — "How it works": what the 1:1
// consultation is, the three promises, and the CTA into the request form.
// Reached from the consultation sheet, door 1.

import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class CoachingIntroScreen extends StatelessWidget {
  const CoachingIntroScreen({super.key});

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
            ScreenHeader(title: t.introTitle, onBack: () => fit.popRoute()),
            const SizedBox(height: 22),
            Text(
              t.introP1,
              style: AppTheme.s(15, weight: FontWeight.w500, color: gc.text, height: 1.5),
            ),
            const SizedBox(height: 12),
            Text(
              t.introP2,
              style: AppTheme.s(
                  13, weight: FontWeight.w500, color: gc.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 24),
            SoftCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (var i = 0; i < 3; i++) ...[
                    if (i > 0) const SizedBox(height: 14),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: gc.accent.withValues(alpha: dark ? 0.18 : 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: SvgPathIcon(Ic.checkBold, size: 10, color: gc.accent),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            [t.introPoint1, t.introPoint2, t.introPoint3][i],
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
              label: t.introCta,
              bg: trainerPrimaryBg(gc, dark),
              fg: trainerPrimaryFg(gc, dark),
              onTap: () => fit.pushRoute('consultation-request'),
            ),
          ]),
        ),
      ),
    );
  }
}
