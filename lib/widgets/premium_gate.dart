import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/account_gate.dart';
import '../theme/app_colors.dart';
import 'liquid_notch.dart';
import 'ui_kit.dart';
import 'upgrade_sheet.dart';

class PremiumGate extends InheritedWidget {
  const PremiumGate({super.key, required this.gate, required super.child});

  final AccountGate gate;

  static PremiumGate? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PremiumGate>();

  static PremiumGate of(BuildContext context) =>
      maybeOf(context) ?? PremiumGate(gate: AccountGate.instance, child: const SizedBox.shrink());

  @override
  bool updateShouldNotify(PremiumGate oldWidget) => oldWidget.gate != gate;
}

extension PremiumContext on BuildContext {
  AccountGate get accountGate => PremiumGate.maybeOf(this)?.gate ?? AccountGate.instance;

  bool canAccess(String feature) => accountGate.canAccess(feature);

  /// Capability-flavored alias of [canAccess]: [capability] is a server
  /// capability key (kCap*).
  bool can(String capability) => accountGate.canAccess(capability);
}

class FeatureGate extends StatelessWidget {
  const FeatureGate({super.key, required this.feature, required this.onTap, required this.child});

  final String feature;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final unlocked = context.canAccess(feature);
    if (unlocked) return Pressable(onTap: onTap, child: IgnorePointer(child: child));
    final gc = context.gc;
    return Pressable(
      onTap: () {
        showNotchToast(context, t.upgradeUpsellToast, icon: PhosphorIconsRegular.lockSimple, accent: gc.brass);
        showUpgradeSheet(context);
      },
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Opacity(opacity: 0.45, child: IgnorePointer(child: child)),
          Positioned(
            top: 6,
            right: 6,
            child: Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: gc.bgRaised2,
                shape: BoxShape.circle,
                border: Border.all(color: gc.border),
              ),
              child: Icon(PhosphorIconsRegular.lockSimple, size: 13, color: gc.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
