import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/l10n.dart';
import '../../state/account_gate.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui_kit.dart';

const String kCommunityUrl = 'https://bodybridge.net';

/// Community is a paid-tier feature: basic and above unlock the feed.
bool communityUnlocked(AccountSnapshot snapshot) => switch (snapshot.tier) {
      AccountTier.basic || AccountTier.advanced || AccountTier.enterprise => true,
      _ => false,
    };

/// Opens the hosted community landing page outside the app.
Future<void> openCommunityLanding(BuildContext context) async {
  try {
    await launchUrl(Uri.parse(kCommunityUrl), mode: LaunchMode.externalApplication);
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(t.gateLinkOut)));
    }
  }
}

/// Wraps the community experience: locked tiers see a blurred veil of the
/// feed behind an upsell card instead of the feed itself.
class CommunityGate extends StatelessWidget {
  const CommunityGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AccountGate.instance,
      builder: (context, _) {
        final snapshot = AccountGate.instance.snapshot;
        if (communityUnlocked(snapshot)) return child;
        return _LockedVeil(child: child);
      },
    );
  }
}

class _LockedVeil extends StatelessWidget {
  const _LockedVeil({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Stack(
      fit: StackFit.expand,
      children: [
        IgnorePointer(
          child: Opacity(
            opacity: 0.35,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
              child: child,
            ),
          ),
        ),
        ColoredBox(color: gc.pageBg.withValues(alpha: 0.55)),
        Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: const GateCard(),
          ),
        ),
      ],
    );
  }
}

/// Upsell card for locked tiers. CTA leaves the app; the ghost row goes home.
class GateCard extends StatelessWidget {
  const GateCard({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return SoftCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: gc.accentSoft, shape: BoxShape.circle),
            child: Icon(PhosphorIconsRegular.lockKey, size: 20, color: gc.accent),
          ),
          const SizedBox(height: 14),
          Text(t.gateTitle, style: AppTheme.f(20, weight: FontWeight.w800, color: gc.text)),
          const SizedBox(height: 8),
          Text(
            t.gateBody,
            textAlign: TextAlign.center,
            style: AppTheme.s(13, weight: FontWeight.w500, color: gc.textSecondary),
          ),
          const SizedBox(height: 18),
          PrimaryButton(
            label: t.gateCta,
            bg: dark ? gc.accent : gc.ember,
            onTap: () => openCommunityLanding(context),
          ),
          const SizedBox(height: 12),
          Pressable(
            onTap: () => openCommunityLanding(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Text(
                t.gateLinkOut,
                style: AppTheme.f(13, weight: FontWeight.w700, color: gc.accent),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Pressable(
            onTap: () => await AccountGate.instance.snapshot(),
            child: Container(
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: gc.border),
              ),
              child: Text(
                t.gateNotNow,
                style: AppTheme.f(14, weight: FontWeight.w700, color: gc.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
