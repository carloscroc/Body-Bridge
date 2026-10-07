import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'premium_gate.dart';
import 'ui_kit.dart';

/// The sign-up / sign-in form shared by [AuthWallScreen] and AccountScreen.
///
/// Owns every auth sub-state (create vs sign-in, password reset, reset
/// confirmation) so the screens never duplicate field or submit logic.
/// Auth failures are always mapped onto localized [AppLocalizations] keys —
/// `AuthException.toString()` must never reach the UI.
class AuthForm extends StatefulWidget {
  const AuthForm({super.key, required this.strings, this.showBrandHeader = false});

  // Preserves AccountScreen's `_t` injection seam for widget tests: every
  // user-visible string comes from this instance, never the global `t`.
  final AppLocalizations Function() strings;

  // True only when the form renders without an outer brand block.
  final bool showBrandHeader;

  @override
  State<AuthForm> createState() => _AuthFormState();
}

enum _AuthPane { auth, reset, sent }

class _AuthFormState extends State<AuthForm> {
  static final RegExp _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  _AuthPane _pane = _AuthPane.auth;
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _resetEmail = TextEditingController();
  bool _createMode = true;
  bool _submitting = false;
  String? _emailError;
  String? _passwordError;
  String? _resetError;
  String? _authError;
  String _sentEmail = '';

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _resetEmail.dispose();
    super.dispose();
  }

  // Maps a stable AuthException key onto a localized message. The default
  // arm covers 'unknown' and 'requiresRecentLogin' (and anything else), so
  // raw exception text can never leak into the banner.
  String _mapKey(String key) {
    final tr = widget.strings();
    switch (key) {
      case 'wrongPassword':
        return tr.authErrorWrongPassword;
      case 'userNotFound':
        return tr.authErrorUserNotFound;
      case 'invalidEmail':
        return tr.authErrorInvalidEmail;
      case 'emailAlreadyInUse':
        return tr.authErrorEmailAlreadyInUse;
      case 'weakPassword':
        return tr.authErrorWeakPassword;
      case 'tooManyRequests':
        return tr.authErrorTooManyRequests;
      case 'networkRequested':
        return tr.authErrorNetwork;
      default:
        return tr.authErrorUnknown;
    }
  }

  // Shared run wrapper: inline loading on the submit button (no layout
  // swap) and a mapped banner on failure — never raw exception text.
  Future<void> _run(Future<void> Function() op) async {
    setState(() => _submitting = true);
    try {
      await op();
    } on AuthException catch (error) {
      if (mounted) setState(() => _authError = _mapKey(error.key));
    } catch (_) {
      if (mounted) setState(() => _authError = widget.strings().authFailedGeneric);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _submit() async {
    final tr = widget.strings();
    final gate = context.accountGate;
    final email = _email.text.trim();
    final password = _password.text;
    setState(() {
      _emailError = _emailPattern.hasMatch(email) ? null : tr.emailInvalid;
      _passwordError = password.length >= 6 ? null : tr.passwordTooShort;
      _authError = null;
    });
    if (_emailError != null || _passwordError != null) return;
    await _run(() => _createMode ? gate.signUp(email, password) : gate.signIn(email, password));
  }

  void _startReset() {
    setState(() {
      // Carry the sign-in email over so the user rarely retypes it.
      _resetEmail.text = _email.text;
      _resetError = null;
      _authError = null;
      _pane = _AuthPane.reset;
    });
  }

  Future<void> _submitReset() async {
    final tr = widget.strings();
    final email = _resetEmail.text.trim();
    setState(() => _resetError = _emailPattern.hasMatch(email) ? null : tr.emailInvalid);
    if (_resetError != null) return;
    await _run(() => context.accountGate.sendPasswordReset(email));
    if (mounted && _authError == null) {
      setState(() {
        _sentEmail = email;
        _pane = _AuthPane.sent;
      });
    }
  }

  void _backToSignIn() {
    setState(() {
      _pane = _AuthPane.auth;
      _createMode = false;
      _authError = null;
      _resetError = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return switch (_pane) {
      _AuthPane.auth => _authPane(context),
      _AuthPane.reset => _resetPane(context),
      _AuthPane.sent => _sentPane(context),
    };
  }

  Widget _authPane(BuildContext context) {
    final tr = widget.strings();
    final gc = context.gc;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.showBrandHeader) ...[
          Kicker(tr.brandKicker, color: gc.brass, size: 11.5, spacing: 3),
          const SizedBox(height: 16),
        ],
        SegToggle([
          SegOption(tr.createAccount, _createMode, () => setState(() => _createMode = true)),
          SegOption(tr.signIn, !_createMode, () => setState(() => _createMode = false)),
        ], hPad: 12),
        const SizedBox(height: 20),
        _AuthField(
          controller: _email,
          label: tr.emailLabel,
          hint: tr.emailHint,
          error: _emailError,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: PhosphorIconsRegular.envelopeSimple,
        ),
        const SizedBox(height: 14),
        _AuthField(
          controller: _password,
          label: tr.passwordLabel,
          hint: tr.passwordHint,
          error: _passwordError,
          obscure: true,
          prefixIcon: PhosphorIconsRegular.lockKey,
        ),
        if (!_createMode) ...[
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: Pressable(
              onTap: _startReset,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                child: Text(
                  tr.forgotPassword,
                  style: AppTheme.f(12.5, weight: FontWeight.w600, color: gc.accent),
                ),
              ),
            ),
          ),
        ],
        if (_authError != null) _errorBanner(),
        const SizedBox(height: 20),
        _submitButton(label: _createMode ? tr.startFree : tr.signIn, onTap: _submit),
      ],
    );
  }

  Widget _resetPane(BuildContext context) {
    final tr = widget.strings();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _AuthField(
          controller: _resetEmail,
          label: tr.emailLabel,
          hint: tr.emailHint,
          error: _resetError,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: PhosphorIconsRegular.envelopeSimple,
        ),
        if (_authError != null) _errorBanner(),
        const SizedBox(height: 20),
        _submitButton(label: tr.resetSend, onTap: _submitReset),
        const SizedBox(height: 8),
        GhostButton(label: tr.backToSignIn, icon: PhosphorIconsRegular.caretLeft, onTap: _backToSignIn),
      ],
    );
  }

  Widget _sentPane(BuildContext context) {
    final tr = widget.strings();
    final gc = context.gc;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Icon(PhosphorIconsRegular.checkCircle, size: 40, color: gc.sage),
        const SizedBox(height: 14),
        Text(
          tr.resetSentTitle,
          textAlign: TextAlign.center,
          style: AppTheme.f(17, weight: FontWeight.w700, color: gc.text),
        ),
        const SizedBox(height: 8),
        Text(
          tr.resetSentBody(_sentEmail),
          textAlign: TextAlign.center,
          style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
        ),
        const SizedBox(height: 20),
        GhostButton(label: tr.backToSignIn, icon: PhosphorIconsRegular.caretLeft, onTap: _backToSignIn),
      ],
    );
  }

  // Inline banner for mapped auth errors: subtle danger tint. The text is
  // always a localized message — never raw exception text.
  Widget _errorBanner() {
    final gc = context.gc;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: gc.danger.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: gc.danger.withValues(alpha: 0.35)),
          ),
          child: Text(
            _authError!,
            style: AppTheme.f(12, weight: FontWeight.w600, color: gc.danger),
          ),
        ),
      ],
    );
  }

  // Zero-layout-change loading: the button stays exactly where it is
  // (dimmed, taps ignored) and a small spinner overlays its center.
  Widget _submitButton({required String label, required Future<void> Function() onTap}) {
    final gc = context.gc;
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: Stack(
        alignment: Alignment.center,
        children: [
          IgnorePointer(
            ignoring: _submitting,
            child: Opacity(
              opacity: _submitting ? 0.55 : 1,
              child: PrimaryButton(label: label, onTap: () => onTap()),
            ),
          ),
          if (_submitting)
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2, color: gc.onEmber),
            ),
        ],
      ),
    );
  }
}

/// Labelled text field matching the legacy auth look (filled bgRaised,
/// radius 14) plus hint, leading icon, focus ring and per-field error.
class _AuthField extends StatefulWidget {
  const _AuthField({
    required this.controller,
    required this.label,
    required this.hint,
    this.error,
    this.keyboardType,
    this.obscure = false,
    this.prefixIcon,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final String? error;
  final TextInputType? keyboardType;
  final bool obscure;
  final IconData? prefixIcon;

  @override
  State<_AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends State<_AuthField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          widget.label,
          style: AppTheme.f(11, weight: FontWeight.w700, color: gc.textSecondary, letterSpacing: 1),
        ),
        const SizedBox(height: 7),
        TextField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          obscureText: widget.obscure && _obscure,
          autocorrect: false,
          enableSuggestions: !widget.obscure,
          style: AppTheme.f(14, weight: FontWeight.w500, color: gc.text),
          cursorColor: gc.accent,
          decoration: InputDecoration(
            filled: true,
            fillColor: gc.bgRaised,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: gc.accent, width: 1.4),
            ),
            hintStyle: AppTheme.f(14, weight: FontWeight.w500, color: gc.textSecondary),
            hintText: widget.hint,
            prefixIcon: widget.prefixIcon == null
                ? null
                : Icon(widget.prefixIcon, size: 18, color: gc.textTertiary),
            suffixIcon: widget.obscure
                ? Semantics(
                    // Screen readers get the field name; the icon alone
                    // carries no meaning.
                    button: true,
                    label: widget.label,
                    child: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(
                        _obscure ? PhosphorIconsRegular.eye : PhosphorIconsRegular.eyeSlash,
                        size: 18,
                        color: gc.textTertiary,
                      ),
                    ),
                  )
                : null,
          ),
        ),
        if (widget.error != null) ...[
          const SizedBox(height: 5),
          Text(
            widget.error!,
            style: AppTheme.f(11.5, weight: FontWeight.w600, color: gc.danger),
          ),
        ],
      ],
    );
  }
}
