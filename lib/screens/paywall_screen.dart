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
                    Text(_t.paywallTitle, style: AppTheme.d(28, weight: FontWeight.w800, color: gc.text)),
                    const SizedBox(height: 6),
                    Text(_t.paywallPrice(kPremiumPriceLabel), style: AppTheme.d(18, weight: FontWeight.w700, color: gc.accent)),
                    const SizedBox(height: 20),
                    _benefit(gc, _t.paywallBenefit1),
                    const SizedBox(height: 12),
                    _benefit(gc, _t.paywallBenefit2),
                    const SizedBox(height: 12),
                    _benefit(gc, _t.paywallBenefit3),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              PrimaryButton(
                label: _t.paywallCtaUpgrade,
                onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_t.billingComingSoon))),
              ),
              const SizedBox(height: 14),
              Text(_t.paywallFootnote,
                  textAlign: TextAlign.center,
                  style: AppTheme.f(11.5, weight: FontWeight.w500, color: gc.textTertiary)),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _benefit(GymColors gc, String label) => Row(
        children: [
          Icon(PhosphorIconsRegular.checkCircle, size: 18, color: gc.sage),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: AppTheme.f(13.5, weight: FontWeight.w600, color: gc.text))),
        ],
      );
}
