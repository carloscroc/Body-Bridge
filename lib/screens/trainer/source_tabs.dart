import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../l10n/l10n.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';

enum SourceTab { free, trainer, custom }

class PremiumSourceTabs extends StatelessWidget {
  const PremiumSourceTabs({
    super.key,
    required this.active,
    required this.onSelected,
    this.trainerLocked = false,
    this.customLocked = false,
  });

  final SourceTab active;
  final ValueChanged<SourceTab> onSelected;
  final bool trainerLocked;
  final bool customLocked;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(100)),
      child: Row(
        children: [
          Expanded(child: _segment(gc, SourceTab.free, t.sourceFree)),
          Expanded(
            child: _segment(
              gc,
              SourceTab.trainer,
              t.sourceTrainer,
              locked: trainerLocked,
              badge: t.advancedBadge,
            ),
          ),
          Expanded(child: _segment(gc, SourceTab.custom, t.sourceCustom, locked: customLocked)),
        ],
      ),
    );
  }

  Widget _segment(GymColors gc, SourceTab tab, String label, {bool locked = false, String? badge}) {
    final selected = active == tab;
    final fg = selected ? gc.onEmber : gc.textSecondary;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => onSelected(tab),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? gc.ember : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (locked) ...[
              Icon(PhosphorIconsRegular.lockSimple, size: 9, color: fg),
              const SizedBox(width: 1),
            ],
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTheme.f(11, weight: FontWeight.w600, color: fg),
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 1),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
                decoration: BoxDecoration(
                  color: (selected ? gc.onEmber : gc.textTertiary).withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  badge,
                  style: AppTheme.f(7.5, weight: FontWeight.w800, color: fg, letterSpacing: 0.2),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
