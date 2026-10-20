import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/account_gate.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'premium_gate.dart';
import 'upgrade_sheet.dart';

class ProBadge extends StatelessWidget {
  const ProBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: context.accountGate,
      builder: (context, _) {
        final tier = context.accountGate.snapshot.tier;
        if (tier != AccountTier.free) return const SizedBox.shrink();
        final gc = context.gc;
        return Semantics(
          button: true,
          label: t.upgradeSheetTitle,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => showUpgradeSheet(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Container(
                height: 28,
                padding: const EdgeInsets.symmetric(horizontal: 13),
                decoration: BoxDecoration(color: gc.accent, borderRadius: BorderRadius.circular(999)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(PhosphorIconsFill.sparkle, size: 10, color: gc.onEmber),
                    const SizedBox(width: 6),
                    Text(
                      t.proBadgeLabel,
                      style: AppTheme.f(11, weight: FontWeight.w700, color: gc.onEmber, letterSpacing: 1.1),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
