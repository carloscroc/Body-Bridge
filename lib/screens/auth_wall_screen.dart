import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/premium_gate.dart';
import '../widgets/ui_kit.dart';

/// Full-screen blocking sign-up/sign-in wall. With mandatory auth
/// there is no guest path: the only way past this screen is a real
/// account, created here or signed into here.
class AuthWallScreen extends StatefulWidget {
  const AuthWallScreen({super.key});

  @override
  State<AuthWallScreen> createState() => _AuthWallScreenState();
}

class _AuthWallScreenState extends State<AuthWallScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _createMode = true;
  bool _submitting = false;
  String? _emailError;
  String? _passwordError;
  String? _authError;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(20, 12, 20, 32 + MediaQuery.viewInsetsOf(context).bottom),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Body Bridge',
                style: AppTheme.f(34, weight: FontWeight.w800, color: gc.text),
              ),
              const SizedBox(height: 8),
              Text(
                t.accountGuestBlurb,
                style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
              ),
              const SizedBox(height: 24),
              SoftCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SegToggle([
                      SegOption(t.createAccount, _createMode, () => setState(() => _createMode = true)),
                      SegOption(t.signIn, !_createMode, () => setState(() => _createMode = false)),
                    ], hPad: 12),
                    const SizedBox(height: 20),
                    _field(
                      controller: _email,
                      label: t.emailLabel,
                      error: _emailError,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 14),
                    _field(
                      controller: _password,
                      label: t.passwordLabel,
                      error: _passwordError,
                      obscureText: true,
                    ),
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
                            decoration: BoxDecoration(
                              color: gc.ember,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2, color: gc.onEmber),
                            ),
                          )
                        : PrimaryButton(label: _createMode ? t.startFree : t.signIn, onTap: _submit),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
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

  Future<void> _submit() async {
    final gate = context.accountGate;
    final email = _email.text.trim();
    final password = _password.text;
    setState(() {
      _emailError = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email) ? null : t.emailInvalid;
      _passwordError = password.length >= 6 ? null : t.passwordTooShort;
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
          () => _authError = detail.isEmpty || detail == t.authFailedGeneric
              ? t.authFailedGeneric
              : '${t.authFailedGeneric}\n$detail',
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}
