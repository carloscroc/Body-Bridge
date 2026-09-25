import 'package:flutter/material.dart';

import '../state/account_gate.dart';
import '../state/fit_state.dart';
import 'ui_kit.dart';

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
}

class FeatureGate extends StatelessWidget {
  const FeatureGate({super.key, required this.feature, required this.onTap, required this.child});

  final String feature;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) => Pressable(
        onTap: context.canAccess(feature) ? onTap : fit.goPaywall,
        child: IgnorePointer(child: child),
      );
}
