import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/auth_form.dart';
import '../widgets/entrance.dart';
import '../widgets/ui_kit.dart';

/// Full-screen blocking sign-up/sign-in wall. With mandatory auth
/// there is no guest path: the only way past this screen is a real
/// account, created here or signed into here.
class AuthWallScreen extends StatelessWidget {
  const AuthWallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(20, 12, 20, 32 + MediaQuery.viewInsetsOf(context).bottom),
          child: RiseScope(
            id: 'authwall',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: riseAll([
                _brand(context),
                SoftCard(child: AuthForm(strings: () => t)),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  // Brand block: the white 'B' mark (the one Colors.white exception the
  // contract allows), the kicker and the guest blurb above the form card.
  Widget _brand(BuildContext context) {
    final gc = context.gc;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [gc.accent, gc.brass],
            ),
          ),
          child: Text('B', style: AppTheme.f(22, weight: FontWeight.w800, color: Colors.white)),
        ),
        const SizedBox(height: 16),
        Kicker(t.brandKicker, color: gc.brass, size: 11.5, spacing: 3),
        const SizedBox(height: 10),
        Text('Body Bridge', style: AppTheme.f(34, weight: FontWeight.w800, color: gc.text)),
        const SizedBox(height: 10),
        Text(
          t.accountGuestBlurb,
          style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}
