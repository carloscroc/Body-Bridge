import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/l10n.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';
import '../../widgets/svg_icon.dart';
import '../../widgets/ui_kit.dart';

class TrainerLockScrim extends StatelessWidget {
  const TrainerLockScrim({super.key, required this.visible});

  final bool visible;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return IgnorePointer(
      ignoring: !visible,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        opacity: visible ? 1 : 0,
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 7, sigmaY: 7),
            child: Container(color: gc.bg.withValues(alpha: 0.78)),
          ),
        ),
      ),
    );
  }
}

class TrainerLockOverlay extends StatelessWidget {
  const TrainerLockOverlay({super.key, required this.visible, required this.onDismiss});

  final bool visible;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Positioned.fill(
      child: IgnorePointer(
        ignoring: !visible,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
          opacity: visible ? 1 : 0,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onDismiss,
            child: Align(
              alignment: const Alignment(0, -0.55),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(color: gc.mutedFill, shape: BoxShape.circle),
                      child: Icon(PhosphorIconsRegular.lockSimple, size: 26, color: gc.text),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      t.lockAdvancedMessage,
                      textAlign: TextAlign.center,
                      style: AppTheme.f(13.5, weight: FontWeight.w700, color: gc.text),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> showTrainerUpsellSheet(BuildContext context) async {
  final gc = context.gc;
  await showAppSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: gc.bgRaised,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    blurBarrier: false,
    modalBarrierColor: Colors.transparent,
    builder: (sheetCtx) => Padding(
      padding: sheetPad(sheetCtx),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SheetHandle(),
          const SizedBox(height: 18),
          Text(
            titleCase(t.unlockAdvancedTitle),
            textAlign: TextAlign.center,
            style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
          ),
          const SizedBox(height: 18),
          _benefit(gc, t.benefitTrainerLibrary),
          const SizedBox(height: 12),
          _benefit(gc, t.benefitCoachAssignments),
          const SizedBox(height: 12),
          _benefit(gc, t.benefitMonthlySessions),
          const SizedBox(height: 22),
          PrimaryButton(
            label: t.continueOnSite,
            icon: const [IconPath('M7 17L17 7', strokeWidth: 2), IconPath('M7 7H17V17', strokeWidth: 2)],
            onTap: () async {
              try {
                await launchUrl(Uri.parse('https://bodybridge.fit'), mode: LaunchMode.externalApplication);
              } catch (_) {}
            },
          ),
          const SizedBox(height: 6),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => Navigator.pop(sheetCtx),
            child: Container(
              height: 44,
              alignment: Alignment.center,
              child: Text(
                t.notNow,
                style: AppTheme.f(13, weight: FontWeight.w600, color: gc.accent),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

Widget _benefit(GymColors gc, String label) {
  return Row(
    children: [
      Icon(PhosphorIconsRegular.checkCircle, size: 18, color: gc.sage),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          label,
          style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.textSecondary),
        ),
      ),
    ],
  );
}
