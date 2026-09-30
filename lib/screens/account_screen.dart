import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../services/auth_service.dart';
import '../state/account_gate.dart';
import '../state/fit_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
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
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _createMode = true;
  bool _submitting = false;
  bool _deleting = false;
  String? _emailError;
  String? _passwordError;
  String? _authError;

  AppLocalizations get _t => widget.strings?.call() ?? t;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

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
                if (gate.snapshot.tier.isSignedIn) _signedIn(context, gate) else _signedOut(context, gate),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _signedOut(BuildContext context, AccountGate gate) {
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
          SegToggle([
            SegOption(_t.createAccount, _createMode, () => setState(() => _createMode = true)),
            SegOption(_t.signIn, !_createMode, () => setState(() => _createMode = false)),
          ], hPad: 12),
          const SizedBox(height: 20),
          _field(
            controller: _email,
            label: _t.emailLabel,
            error: _emailError,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 14),
          _field(controller: _password, label: _t.passwordLabel, error: _passwordError, obscureText: true),
          if (_authError != null) ...[
            const SizedBox(height: 10),
            Text(
              _authError!,
              style: AppTheme.f(12, weight: FontWeight.w600, color: gc.danger),
            ),
          ],
          const SizedBox(height: 20),
          _submitting
              ? Container(
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: gc.ember, borderRadius: BorderRadius.circular(100)),
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: gc.onEmber),
                  ),
                )
              : PrimaryButton(label: _createMode ? _t.startFree : _t.signIn, onTap: () => _submit(gate)),
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

  Widget _field({
    required TextEditingController controller,
    required String label,
    String? error,
    TextInputType? keyboardType,
    bool obscureText = false,
  }) {
    final gc = context.gc;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: AppTheme.f(11, weight: FontWeight.w700, color: gc.textSecondary, letterSpacing: 1),
        ),
        const SizedBox(height: 7),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          autocorrect: false,
          enableSuggestions: !obscureText,
          style: AppTheme.f(14, weight: FontWeight.w500, color: gc.text),
          cursorColor: gc.accent,
          decoration: InputDecoration(
            filled: true,
            fillColor: gc.bgRaised,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            hintStyle: AppTheme.f(14, weight: FontWeight.w500, color: gc.textSecondary),
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 5),
          Text(
            error,
            style: AppTheme.f(11.5, weight: FontWeight.w600, color: gc.danger),
          ),
        ],
      ],
    );
  }

  Future<void> _submit(AccountGate gate) async {
    final email = _email.text.trim();
    final password = _password.text;
    setState(() {
      _emailError = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email) ? null : _t.emailInvalid;
      _passwordError = password.length >= 6 ? null : _t.passwordTooShort;
      _authError = null;
    });
    if (_emailError != null || _passwordError != null) return;
    setState(() => _submitting = true);
    try {
      if (_createMode) {
        await gate.signUp(email, password);
      } else {
        await gate.signIn(email, password);
      }
    } catch (error) {
      if (mounted) {
        final detail = error.toString().replaceFirst(RegExp(r'^(StateError|Exception):\s*'), '');
        setState(
          () => _authError = detail.isEmpty || detail == _t.authFailedGeneric
              ? _t.authFailedGeneric
              : '${_t.authFailedGeneric}\n$detail',
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}
