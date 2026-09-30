import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../constants/billing.dart';
import '../l10n/l10n.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/ui_kit.dart';

class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key, this.strings});

  final AppLocalizations Function()? strings;

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  AppLocalizations get _t => widget.strings?.call() ?? t;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return RiseScope(
      id: 'paywall',
      child: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: riseAll([
              ScreenHeader(title: _t.paywallTitle, onBack: fit.backFromPaywall),
              const SizedBox(height: 24),
              SoftCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(PhosphorIconsRegular.crownSimple, size: 34, color: gc.brass),
                    const SizedBox(height: 16),
                    Text(
                      _t.paywallTitle,
                      style: AppTheme.d(28, weight: FontWeight.w800, color: gc.text),
                    ),
                    const SizedBox(height: 20),
                    _benefit(gc, _t.paywallBenefit1),
                    const SizedBox(height: 12),
                    _benefit(gc, _t.paywallBenefit2),
                    const SizedBox(height: 12),
                    _benefit(gc, _t.paywallBenefit3),
                  ],
                ),
              ),
              for (final tier in const ['basic', 'advanced']) ...[
                const SizedBox(height: 18),
                _planCard(gc, tier),
              ],
              const SizedBox(height: 18),
              Text(
                _t.paywallFootnote,
                textAlign: TextAlign.center,
                style: AppTheme.f(11.5, weight: FontWeight.w500, color: gc.textTertiary),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  /// One card per plan tier with its monthly + yearly placeholder options.
  /// Every CTA is a coming-soon stub: real billing is a later project.
  Widget _planCard(GymColors gc, String tier) {
    final options = [
      for (final p in kPaywallPlans)
        if (p.tier == tier) p,
    ];
    final title = tier == 'basic' ? _t.paywallPlanBasic : _t.paywallPlanAdvanced;
    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppTheme.d(20, weight: FontWeight.w800, color: gc.text),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: gc.brass.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  _t.paywallComingSoonBadge,
                  style: AppTheme.f(9.5, weight: FontWeight.w700, color: gc.brass, letterSpacing: 1.1),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          for (final option in options) ...[
            _periodOption(gc, option),
            if (option != options.last) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  Widget _periodOption(GymColors gc, PlanOption option) {
    final period = option.period == 'monthly' ? _t.paywallMonthly : _t.paywallYearly;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  option.priceLabel,
                  style: AppTheme.d(22, weight: FontWeight.w800, color: gc.accent),
                ),
                const SizedBox(height: 2),
                Text(
                  period,
                  style: AppTheme.f(11.5, weight: FontWeight.w600, color: gc.textTertiary, letterSpacing: 1),
                ),
              ],
            ),
          ),
          Pressable(
            onTap: () =>
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_t.billingComingSoon))),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(color: gc.ember, borderRadius: BorderRadius.circular(100)),
              child: Text(
                titleCase(_t.paywallCtaUpgrade),
                style: AppTheme.f(13, weight: FontWeight.w700, color: gc.onEmber),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _benefit(GymColors gc, String label) => Row(
    children: [
      Icon(PhosphorIconsRegular.checkCircle, size: 18, color: gc.sage),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          label,
          style: AppTheme.f(13.5, weight: FontWeight.w600, color: gc.text),
        ),
      ),
    ],
  );
}
