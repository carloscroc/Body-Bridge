import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../theme/app_colors.dart';
import '../widgets/app_background.dart';
import '../widgets/entrance.dart';
import '../widgets/otp_auth_form.dart';

/// Mandatory-auth wall: warm brand hero up top, the OTP form below, dots
/// background like OnboardingScreen. The form owns both steps; this screen
/// only supplies the chrome.
class AuthWallScreen extends StatelessWidget {
  const AuthWallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final compact = MediaQuery.viewInsetsOf(context).bottom > 0;
    final topPad = compact ? 24.0 : 64.0;
    return Scaffold(
      backgroundColor: gc.bg,
      body: Stack(
        children: [
          const Positioned.fill(child: AppBackground(pattern: 'dots')),
          SafeArea(
            bottom: false,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(24, topPad, 24, 24),
                  child: RiseScope(
                    id: 'authwall',
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: compact ? 0 : constraints.maxHeight - topPad - 24,
                      ),
                      child: IntrinsicHeight(
                        child: OtpAuthForm(
                          showBrandHeader: true,
                          strings: () => t,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
