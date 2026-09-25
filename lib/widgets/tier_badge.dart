import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../state/account_gate.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

class TierBadge extends StatelessWidget {
  const TierBadge(this.tier, {super.key});

  final AccountTier tier;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final (label, textColor, decoration) = switch (tier) {
      AccountTier.premium => (
          t.tierPremium,
          gc.bg,
          BoxDecoration(
            gradient: LinearGradient(colors: [gc.accent, gc.brass]),
            borderRadius: BorderRadius.circular(100),
          ),
        ),
      AccountTier.normal => (
          t.tierNormal,
          gc.info,
          BoxDecoration(color: gc.info.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(100)),
        ),
      AccountTier.free || AccountTier.signedOut => (
          t.tierFree,
          gc.textSecondary,
          BoxDecoration(color: gc.mutedFill, borderRadius: BorderRadius.circular(100)),
        ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: decoration,
      child: Text(label, style: AppTheme.f(9.5, weight: FontWeight.w700, color: textColor, letterSpacing: 1.1)),
    );
  }
}
