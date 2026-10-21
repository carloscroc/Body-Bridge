import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'glass.dart';
import 'ui_kit.dart';

Future<void> showUpgradeSheet(BuildContext context) {
  return showAppSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => const UpgradeSheet(),
  );
}

class UpgradeSheet extends StatefulWidget {
  const UpgradeSheet({super.key});

  @override
  State<UpgradeSheet> createState() => _UpgradeSheetState();
}

class _UpgradeSheetState extends State<UpgradeSheet> {
  bool _annual = false;
  bool _stub = false;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Container(
      padding: sheetPad(context),
      decoration: BoxDecoration(
        color: gc.bgRaised,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.92),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SheetHandle(),
              const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.upgradeSheetTitle,
                            style: AppTheme.d(22, weight: FontWeight.w800, color: gc.text)),
                        const SizedBox(height: 4),
                        Text(t.upgradeSheetSubtitle,
                            style: AppTheme.f(13, weight: FontWeight.w500, color: gc.textSecondary)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Semantics(
                    button: true,
                    label: t.upgradeClose,
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: gc.bgRaised2,
                          shape: BoxShape.circle,
                          border: Border.all(color: gc.border),
                        ),
                        child: Icon(PhosphorIconsRegular.x, size: 14, color: gc.textSecondary),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _periodToggle(gc),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: _planCard(
                          gc,
                          name: titleCase(t.paywallPlanBasic),
                          price: '\$10',
                          facts: [
                            t.planFactFullHistory,
                            t.planFactCloudSync,
                            t.planFactUnlimitedRoutines,
                            t.planFactChartsCommunity,
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _planCard(
                          gc,
                          name: titleCase(t.paywallPlanAdvanced),
                          price: '\$20',
                          popular: true,
                          facts: [
                            t.planFactEverythingInBasic,
                            t.planFactAdvancedAnalytics,
                            t.planFactPremiumPrograms,
                            t.planFactTrainerContent,
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              if (_stub)
                _comingSoon(gc)
              else ...[
                PrimaryButton(
                  label: t.upgradeCtaContinueOnWeb,
                  height: 52,
                  onTap: () => setState(() => _stub = true),
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => setState(() => _stub = true),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Text(
                      t.enterpriseContactSales,
                      textAlign: TextAlign.center,
                      style: AppTheme.f(11, weight: FontWeight.w700, color: gc.accent, letterSpacing: 1),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Text.rich(
                TextSpan(children: _finePrintSpans(gc)),
                textAlign: TextAlign.center,
                style: AppTheme.f(11, weight: FontWeight.w500, color: gc.textTertiary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _periodToggle(GymColors gc) {
    Widget seg(String label, bool selected, VoidCallback onTap) => Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onTap,
            child: Container(
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? gc.accent : Colors.transparent,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                label,
                style: AppTheme.f(
                  11,
                  weight: FontWeight.w700,
                  color: selected ? gc.onEmber : gc.textSecondary,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
        );
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: gc.bgRaised2,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: gc.border),
      ),
      child: Row(
        children: [
          seg(t.billingMonthly, !_annual, () => setState(() => _annual = false)),
          seg(t.billingAnnual, _annual, () => setState(() => _annual = true)),
        ],
      ),
    );
  }

  Widget _planCard(
    GymColors gc, {
    required String name,
    required String price,
    required List<String> facts,
    bool popular = false,
  }) {
    final card = Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: gc.bgRaised2,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: popular ? gc.brass : gc.border, width: popular ? 1.5 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(name, style: AppTheme.f(13, weight: FontWeight.w800, color: gc.text)),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(price, style: AppTheme.f(18, weight: FontWeight.w800, color: gc.text)),
              const SizedBox(width: 3),
              Text('/mo', style: AppTheme.f(11, weight: FontWeight.w700, color: gc.textSecondary)),
            ],
          ),
          const SizedBox(height: 12),
          Container(height: 1, color: gc.border),
          const SizedBox(height: 12),
          for (final fact in facts) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(PhosphorIconsBold.check, size: 11, color: gc.sage),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    fact,
                    style: AppTheme.f(12, weight: FontWeight.w500, color: gc.textSecondary, height: 1.3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
    if (!popular) return card;
    return Stack(
      clipBehavior: Clip.none,
      fit: StackFit.passthrough,
      children: [
        card,
        Positioned(
          top: -9,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: gc.brass, borderRadius: BorderRadius.circular(999)),
            child: Text(
              t.planMostPopular.toUpperCase(),
              style: AppTheme.f(9, weight: FontWeight.w700, color: gc.onEmber, letterSpacing: 0.8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _comingSoon(GymColors gc) {
    return Container(
      height: 52,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(PhosphorIconsBold.check, size: 16, color: gc.sage),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              t.checkoutComingSoon,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.f(13, weight: FontWeight.w600, color: gc.text),
            ),
          ),
        ],
      ),
    );
  }

  List<InlineSpan> _finePrintSpans(GymColors gc) {
    const site = 'bodybridge.fit';
    final full = t.finePrintBilling;
    final base = AppTheme.f(11, weight: FontWeight.w500, color: gc.textTertiary);
    final i = full.indexOf(site);
    if (i < 0) return [TextSpan(text: full, style: base)];
    return [
      TextSpan(text: full.substring(0, i), style: base),
      TextSpan(text: site, style: AppTheme.f(11, weight: FontWeight.w700, color: gc.textSecondary)),
      TextSpan(text: full.substring(i + site.length), style: base),
    ];
  }
}
