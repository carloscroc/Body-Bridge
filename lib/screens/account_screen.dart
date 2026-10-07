import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../services/auth_service.dart';
import '../state/account_gate.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/auth_form.dart';
import '../widgets/dialogs.dart';
import '../widgets/entrance.dart';
import '../widgets/premium_gate.dart';
import '../widgets/tier_badge.dart';
import '../widgets/ui_kit.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key, this.strings});

  final AppLocalizations Function()? strings;

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _deleting = false;

  AppLocalizations get _t => widget.strings?.call() ?? t;

  @override
  Widget build(BuildContext context) {
    final gate = context.accountGate;
    return AnimatedBuilder(
      animation: gate,
      builder: (context, _) => RiseScope(
        id: 'account',
        child: SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 32 + MediaQuery.viewInsetsOf(context).bottom),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: riseAll([
                ScreenHeader(title: _t.accountTitle, onBack: fit.backFromAccount),
                const SizedBox(height: 24),
                if (gate.snapshot.tier.isSignedIn) _signedIn(context, gate) else _signedOut(context),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _signedOut(BuildContext context) {
    final gc = context.gc;
    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            _t.accountGuestBlurb,
            style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
          ),
          const SizedBox(height: 18),
          AuthForm(strings: () => _t),
        ],
      ),
    );
  }

  Widget _signedIn(BuildContext context, AccountGate gate) {
    final gc = context.gc;
    final snapshot = gate.snapshot;
    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            _t.accountSignedInAs(snapshot.email ?? ''),
            style: AppTheme.f(14, weight: FontWeight.w600, color: gc.text),
          ),
          const SizedBox(height: 14),
          Align(alignment: Alignment.centerLeft, child: TierBadge(snapshot.tier)),
          const SizedBox(height: 20),
          GhostButton(
            label: _t.signOut,
            icon: PhosphorIconsRegular.signOut,
            onTap: _deleting ? () {} : () => gate.signOut(),
          ),
          const SizedBox(height: 10),
          if (_deleting)
            Container(
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(100)),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: gc.danger),
              ),
            )
          else
            _dangerGhostButton(
              context,
              _t.deleteAccount,
              PhosphorIconsRegular.trash,
              () => _deleteAccount(context, gate),
            ),
        ],
      ),
    );
  }

  /// GhostButton-style button with destructive (gc.danger) styling.
  Widget _dangerGhostButton(BuildContext context, String label, IconData icon, VoidCallback onTap) {
    final gc = context.gc;
    return Pressable(
      onTap: onTap,
      child: Container(
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        alignment: Alignment.center,
        decoration: BoxDecoration(color: gc.bgRaised2, borderRadius: BorderRadius.circular(100)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: gc.danger),
            const SizedBox(width: 8),
            Text(
              titleCase(label),
              style: AppTheme.f(13.5, weight: FontWeight.w700, color: gc.danger),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteAccount(BuildContext context, AccountGate gate) async {
    final ok = await askConfirm(
      context,
      title: _t.deleteAccountConfirmTitle,
      body: _t.deleteAccountConfirmBody,
      confirmLabel: _t.deleteAccountDelete,
      danger: true,
    );
    if (!ok || !mounted) return;
    setState(() => _deleting = true);
    void snack(String message) =>
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    try {
      await gate.deleteAccount();
      if (mounted) snack(_t.deleteAccountDone);
    } on AuthException catch (e) {
      if (mounted) {
        snack(e.key == 'requiresRecentLogin' ? _t.deleteAccountReauth : _t.deleteAccountFailed);
      }
    } catch (e) {
      debugPrint('Delete account failed: $e');
      if (mounted) snack(_t.deleteAccountFailed);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }
}
