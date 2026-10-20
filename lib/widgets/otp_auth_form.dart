import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../services/otp_auth_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'entrance.dart';
import 'otp_code_well.dart';
import 'premium_gate.dart';
import 'ui_kit.dart';

/// Two-step email-OTP sign-in form.
///
/// `showBrandHeader: true` renders the wall hero (the brand block collapses
/// when the keyboard opens); `false` renders the compact variant used on the
/// account screen. The code step looks identical in both hosts.
class OtpAuthForm extends StatefulWidget {
  const OtpAuthForm({super.key, this.showBrandHeader = false, this.strings});

  final bool showBrandHeader;
  final AppLocalizations Function()? strings;

  /// Injectable clock for expiry / resend / lock countdowns in tests.
  @visibleForTesting
  static DateTime Function() now = DateTime.now;

  /// Injectable send-leg timeout for tests: a hung request surfaces as
  /// the network-class failure instead of wedging the form.
  @visibleForTesting
  static Duration sendTimeout = const Duration(seconds: 20);

  @override
  State<OtpAuthForm> createState() => _OtpAuthFormState();
}

enum _Step { email, code, offline }

enum _CodeVerdict { invalid, expired, network, error }

class _OtpAuthFormState extends State<OtpAuthForm>
    with SingleTickerProviderStateMixin {
  static const _codeTtl = Duration(minutes: 5);
  static const _resendCooldown = Duration(seconds: 30);
  static const _maxAttempts = 3;

  final _emailController = TextEditingController();
  final _emailFocus = FocusNode();
  final _wellKey = GlobalKey<OtpCodeWellState>();

  _Step _step = _Step.email;
  String _email = '';
  bool _busy = false;
  bool _verifying = false;
  String? _emailError;
  String? _sendNotice;

  bool _codeArmed = false;

  int _attemptsLeft = _maxAttempts;
  DateTime _expiresAt = DateTime.now();
  DateTime _resendAvailableAt = DateTime.now();
  DateTime? _lockUntil;
  bool _lockCountdown = false;
  _CodeVerdict? _verdict;

  Timer? _ticker;
  AnimationController? _breathCtrl;

  AnimationController get _breath => _breathCtrl ??= AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1600),
        lowerBound: 0.96,
        upperBound: 1.04,
      );

  AppLocalizations get _t => widget.strings?.call() ?? t;

  @override
  void initState() {
    super.initState();
    _expiresAt = OtpAuthForm.now().add(_codeTtl);
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _breathCtrl?.dispose();
    _emailController.dispose();
    _emailFocus.dispose();
    super.dispose();
  }

  // -- countdowns -----------------------------------------------------------

  int _expiresIn() => _seconds(_expiresAt.difference(OtpAuthForm.now()));

  int _resendIn() => _seconds(_resendAvailableAt.difference(OtpAuthForm.now()));

  int _lockSeconds() => _lockUntil == null
      ? 0
      : _seconds(_lockUntil!.difference(OtpAuthForm.now()));

  static int _seconds(Duration d) {
    final s = d.inSeconds;
    return s < 0 ? 0 : s;
  }

  String _fmt(int s) => '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';

  String _fmtPadded(int s) =>
      '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  // -- legs -----------------------------------------------------------------

  Future<void> _send() async {
    if (_busy) return;
    final email = _emailController.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _emailError = _t.authErrorInvalidEmail);
      return;
    }
    setState(() {
      _busy = true;
      _emailError = null;
    });
    final gate = context.accountGate;
    var stayPut = false;
    String? sendNotice;
    try {
      await gate.requestEmailCode(email).timeout(OtpAuthForm.sendTimeout);
    } on TimeoutException {
      // A hung send must never wedge the form: the timeout converts it
      // into the network-class failure and re-arms the button.
      stayPut = true;
      if (!mounted) return;
      setState(() {
        _busy = false;
        _emailError = _t.authErrorNetwork;
      });
    } on OtpAuthException catch (e) {
      // Network NEVER advances — no request left the device, so a "check
      // your email" step would be a lie (defect D1): the blocking offline
      // wall owns that outcome and keeps the typed email for its Retry.
      // Rate limit reports the inline countdown on the email step (a
      // Retry from the wall that lands rate-limited drops back there).
      // Any other failure means the request row was committed — the code
      // step is still the right place to be, with a banner explaining the
      // send could not complete.
      if (e.key == 'network') {
        stayPut = true;
        if (!mounted) return;
        setState(() {
          _busy = false;
          _step = _Step.offline;
        });
      } else if (e.key == 'rateLimit') {
        stayPut = true;
        final secs = e.retryAfterSeconds;
        if (!mounted) return;
        setState(() {
          _busy = false;
          _step = _Step.email;
          _emailError = secs != null
              ? _t.authRateLimitBanner(_fmtPadded(secs))
              : _t.authErrorTooManyRequests;
        });
      } else {
        sendNotice = _t.authFailedGeneric;
      }
    } catch (_) {
      // Not an OtpAuthException — a raw transport error escaped the seam
      // (gate contract violated). It used to return without resetting
      // _busy, so every later tap hit the `if (_busy) return` guard and
      // the button died for the session. Stay put — on the wall when a
      // Retry produced this —, re-arm the CTA, and surface the unknown
      // error rather than staying silent. The wall ignores _emailError
      // while it is up; _backToEmail clears it on the way back.
      stayPut = true;
      if (!mounted) return;
      setState(() {
        _busy = false;
        _emailError = _t.authErrorUnknown;
      });
    }
    if (!mounted || stayPut) return;
    setState(() => _busy = false);
    _enterCodeStep(email, armed: sendNotice == null);
    // _enterCodeStep resets per-step state, so the notice lands after it.
    if (sendNotice != null) {
      setState(() => _sendNotice = sendNotice);
    }
  }

  void _enterCodeStep(String email, {required bool armed}) {
    setState(() {
      _email = email;
      _step = _Step.code;
      _emailError = null;
      _sendNotice = null;
      _verdict = null;
      _attemptsLeft = _maxAttempts;
      _expiresAt = OtpAuthForm.now().add(_codeTtl);
      _resendAvailableAt = OtpAuthForm.now().add(_resendCooldown);
      _codeArmed = armed;
    });
    _ticker ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _verify(String code) async {
    if (_verifying || _lockSeconds() > 0) return;
    setState(() {
      _verifying = true;
      _verdict = null;
    });
    final gate = context.accountGate;
    OtpAuthException? failure;
    var verified = false;
    try {
      verified = await gate.verifyEmailCode(_email, code);
    } on OtpAuthException catch (e) {
      failure = e;
    } catch (_) {
      failure = const OtpAuthException('unknown');
    }
    if (!mounted) return;
    setState(() => _verifying = false);
    final e = failure;
    if (e == null) {
      if (verified) return; // success — AccountState routes to the handoff
      // The real gate returns FALSE for a wrong code (a value, not an
      // exception); treat it exactly like the codeInvalid throw below.
      setState(() {
        _attemptsLeft = (_attemptsLeft - 1).clamp(1, _maxAttempts);
        _verdict = _CodeVerdict.invalid;
      });
      _wellKey.currentState?.clear();
      return;
    }
    switch (e.key) {
      case 'rateLimit':
        setState(() {
          _lockUntil =
              OtpAuthForm.now().add(Duration(seconds: e.retryAfterSeconds ?? 3600));
          _lockCountdown = e.retryAfterSeconds != null;
          _verdict = null;
        });
      case 'codeExpired':
        setState(() {
          _expiresAt = OtpAuthForm.now();
          _resendAvailableAt = OtpAuthForm.now();
          _verdict = _CodeVerdict.expired;
        });
      case 'codeInvalid':
        setState(() {
          _attemptsLeft = (_attemptsLeft - 1).clamp(1, _maxAttempts);
          _verdict = _CodeVerdict.invalid;
        });
        _wellKey.currentState?.clear();
      default:
        setState(() {
          _verdict =
              e.key == 'network' ? _CodeVerdict.network : _CodeVerdict.error;
        });
        _wellKey.currentState?.clear();
    }
  }

  Future<void> _resend() async {
    if (_busy || _resendIn() > 0) return;
    setState(() => _busy = true);
    final gate = context.accountGate;
    var networkFail = false;
    String? notice;
    try {
      await gate.requestEmailCode(_email);
    } on OtpAuthException catch (e) {
      if (e.key == 'rateLimit') {
        // A rate-limited resend must not re-arm the cooldown or reset
        // attempts/expiry — only the banner shows.
        final secs = e.retryAfterSeconds;
        notice = secs != null
            ? _t.authRateLimitBanner(_fmtPadded(secs))
            : _t.authFailedGeneric;
      } else {
        networkFail = e.key == 'network';
      }
    } catch (_) {
      networkFail = true;
    }
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (notice != null) {
        _sendNotice = notice;
      } else if (networkFail) {
        _verdict = _CodeVerdict.network;
      } else {
        _sendNotice = null;
        _verdict = null;
        _attemptsLeft = _maxAttempts;
        _expiresAt = OtpAuthForm.now().add(_codeTtl);
        _resendAvailableAt = OtpAuthForm.now().add(_resendCooldown);
        _codeArmed = true;
      }
    });
    if (notice == null && !networkFail) _wellKey.currentState?.clear();
  }

  void _backToEmail() {
    _ticker?.cancel();
    _ticker = null;
    setState(() {
      _step = _Step.email;
      _verdict = null;
      _emailError = null;
      _sendNotice = null;
      _codeArmed = false;
    });
  }

  // -- build ----------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final locked = _step == _Step.code && _lockSeconds() > 0;
      final Widget step = switch (_step) {
        _Step.email => _emailStep(context),
        _Step.code => _codeStep(context),
        _Step.offline => _offlineWall(context),
      };
      return SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: constraints.hasBoundedHeight ? constraints.maxHeight : 0,
          ),
          // The lock calm and the offline wall bring their own full-height
          // ConstrainedBox (a LayoutBuilder reports 0 intrinsic height, so
          // IntrinsicHeight would collapse them to nothing) — every other
          // step needs the IntrinsicHeight wrapper for its Spacers.
          child: (locked || _step == _Step.offline)
              ? step
              : IntrinsicHeight(child: step),
        ),
      );
    });
  }

  Widget _emailStep(BuildContext context) {
    final gc = context.gc;
    final dark = Theme.brightnessOf(context) == Brightness.dark;
    final compact =
        widget.showBrandHeader && View.of(context).viewInsets.bottom > 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...riseAll([
          // t_0abdb4f5: ALL NINE hero slots must ALWAYS exist. The compact
          // flip must substitute each slot's content (_HeroSlot / zero-height
          // box), never remove list slots: a removal shifts every later
          // index, and because every content slot is wrapped in the unkeyed
          // generic Rise, the backward tail pass pairs the shifted children
          // wrong, deactivating the focused EditableText and closing the
          // text-input connection (keyboard self-dismiss defect).
          compact
              ? const _HeroSlot()
              : Center(
                  child: SizedBox(
                    width: 240,
                    height: 96,
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.center,
                      children: [
                        Positioned(
                          top: -72,
                          child: Container(
                            width: 240,
                            height: 240,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  gc.accent.withValues(
                                      alpha: dark ? 0.18 : 0.10),
                                  gc.accent.withValues(alpha: 0),
                                ],
                                stops: const [0, 0.7],
                              ),
                            ),
                          ),
                        ),
                        _brandMark(gc, 96, 24, 46),
                      ],
                    ),
                  ),
                ),
          compact ? const SizedBox(height: 0) : const SizedBox(height: 32),
          compact
              ? const _HeroSlot()
              : Center(
                  child: Kicker(_t.brandKicker,
                      color: gc.accent, size: 11, spacing: 0.88),
                ),
          compact ? const SizedBox(height: 0) : const SizedBox(height: 6),
          compact
              ? const _HeroSlot()
              : Center(
                  child: Text('Body Bridge'.toUpperCase(),
                      textAlign: TextAlign.center,
                      style: AppTheme.d(14,
                          weight: FontWeight.w900,
                          letterSpacing: 4.2,
                          color: gc.text)),
                ),
          compact ? const SizedBox(height: 0) : const SizedBox(height: 32),
          compact
              ? const _HeroSlot()
              : Center(
                  child: _ClampedText(
                    maxWidth: 250,
                    child: Text(_t.authWelcomeTitle,
                        textAlign: TextAlign.center,
                        style: AppTheme.d(34,
                            weight: FontWeight.w900,
                            height: 1.18,
                            letterSpacing: -0.34,
                            color: gc.text)),
                  ),
                ),
          compact ? const SizedBox(height: 0) : const SizedBox(height: 8),
          compact
              ? const _HeroSlot()
              : Text(_t.authWelcomeSubline,
                  textAlign: TextAlign.center,
                  style: AppTheme.f(15,
                      weight: FontWeight.w400,
                      color: gc.textSecondary,
                      height: 1.6)),
        ]),
        const Spacer(),
        ...riseAll([
          Text(_t.emailLabel.toUpperCase(),
              style: AppTheme.f(11,
                  weight: FontWeight.w700,
                  letterSpacing: 0.88,
                  color: gc.textSecondary)),
          const SizedBox(height: 8),
          _emailField(gc),
          AnimatedSize(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            alignment: Alignment.topCenter,
            child: _emailError == null
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_emailError!,
                        textAlign: TextAlign.center,
                        style: AppTheme.f(12.5,
                            weight: FontWeight.w600, color: gc.danger)),
                  ),
          ),
          const SizedBox(height: 16),
        _cta(context, label: _t.authCtaContinueEmail, onTap: _send, busy: _busy),
          if (!compact) ...[
            const SizedBox(height: 16),
            Text(_t.authTrustMicrocopy,
                textAlign: TextAlign.center,
                style: AppTheme.f(13,
                    weight: FontWeight.w600, color: gc.textTertiary)),
            const SizedBox(height: 24),
            Column(
              children: [
                Icon(PhosphorIconsRegular.lockSimple,
                    size: 14, color: gc.textTertiary),
                const SizedBox(height: 8),
                Text(_t.authPrivacyLine1,
                    textAlign: TextAlign.center,
                    style: AppTheme.f(13,
                        weight: FontWeight.w600, color: gc.textTertiary)),
                const SizedBox(height: 8),
                Text(_t.authPrivacyLine2,
                    textAlign: TextAlign.center,
                    style: AppTheme.f(13,
                        weight: FontWeight.w600, color: gc.textTertiary)),
              ],
            ),
          ],
        ]),
      ],
    );
  }

  Widget _codeStep(BuildContext context) {
    final gc = context.gc;
    final animates = RiseScope.animates(context);
    final locked = _lockSeconds() > 0;
    if (animates && !_breath.isAnimating) {
      _breath
        ..duration = locked
            ? const Duration(seconds: 3)
            : const Duration(milliseconds: 1600)
        ..repeat(reverse: true);
    }
    if (locked) {
      return _lockCalm(gc,
          motionOk:
              animates && MediaQuery.maybeDisableAnimationsOf(context) != true);
    }
    final expired = _codeArmed && _expiresIn() <= 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Spacer(),
        ...riseAll([
          Center(
            child: animates
                ? AnimatedBuilder(
                    animation: _breath,
                    builder: (context, child) =>
                        Transform.scale(scale: _breath.value, child: child),
                    child: _brandMark(gc, 44, 12, 20,
                        shadowBlur: 20, shadowDy: 8, shadowAlpha: 0.24),
                  )
                : _brandMark(gc, 44, 12, 20,
                    shadowBlur: 20, shadowDy: 8, shadowAlpha: 0.24),
          ),
          const SizedBox(height: 24),
          Center(
            child: Kicker(_t.authCodeKicker.toUpperCase(),
                color: gc.accent, size: 11, spacing: 0.88),
          ),
          const SizedBox(height: 8),
          Text(_t.authCodeTitle,
              textAlign: TextAlign.center,
              style: AppTheme.d(28,
                  weight: FontWeight.w800, height: 1.21, color: gc.text)),
          const SizedBox(height: 8),
          Center(
            child: _ClampedText(
              maxWidth: 300,
              child: _sentTo(gc),
            ),
          ),
          const SizedBox(height: 40),
          Center(
            child: OtpCodeWell(
              key: _wellKey,
              enabled: !_verifying && !locked,
              expired: expired,
              hasError: _verdict == _CodeVerdict.invalid,
              onCompleted: _verify,
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            alignment: Alignment.topCenter,
            child: _verdictBlock(gc),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            alignment: Alignment.topCenter,
            child: _sendNoticeBlock(gc),
          ),
          const SizedBox(height: 24),
          _codeMeta(gc, expired: expired),
        ]),
        if (!_verifying) const Spacer(),
        if (!_verifying)
          Align(alignment: Alignment.center, child: _backLink(gc)),
      ],
    );
  }

  // -- pieces ---------------------------------------------------------------

  Widget _brandMark(GymColors gc, double size, double radius, double fontSize,
      {double shadowBlur = 36,
      double shadowDy = 16,
      double shadowAlpha = 0.28}) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [gc.accent, gc.brass],
        ),
        boxShadow: [
          BoxShadow(
            color: gc.accent.withValues(alpha: shadowAlpha),
            blurRadius: shadowBlur,
            offset: Offset(0, shadowDy),
          ),
        ],
      ),
      child: Text('B',
          style: AppTheme.d(fontSize, weight: FontWeight.w900, color: gc.onEmber)),
    );
  }

  Widget _emailField(GymColors gc) {
    return Focus(
      child: Builder(
        builder: (context) {
          final focused = Focus.of(context).hasFocus;
          final dark = Theme.brightnessOf(context) == Brightness.dark;
          return Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                width: 2,
                color: focused
                    ? gc.accent.withValues(alpha: 0.40)
                    : Colors.transparent,
              ),
            ),
            child: Container(
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: gc.bgRaised,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  width: 1,
                  color: dark ? gc.accent.withValues(alpha: 0.14) : gc.border,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _emailController,
                      focusNode: _emailFocus,
                      autofocus: widget.showBrandHeader,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      textInputAction: TextInputAction.done,
                      autocorrect: false,
                      style: AppTheme.f(15, weight: FontWeight.w600, color: gc.text),
                      cursorColor: gc.accent,
                      decoration: InputDecoration(
                        hintText: _t.emailHint,
                        hintStyle: AppTheme.f(15,
                            weight: FontWeight.w400, color: gc.textTertiary),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _cta(BuildContext context,
      {required String label, required VoidCallback onTap, required bool busy}) {
    final gc = context.gc;
    final dark = Theme.brightnessOf(context) == Brightness.dark;
    final fill = dark ? gc.accent : gc.ember;
    return Opacity(
      opacity: busy ? 0.55 : 1,
      child: Pressable(
        onTap: busy ? () {} : onTap,
        child: Container(
          width: double.infinity,
          height: 52,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(100),
            boxShadow: [
              BoxShadow(
                color: fill.withValues(alpha: dark ? 0.22 : 0.16),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: busy
              ? SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2.2, color: gc.onEmber))
              : Text(label,
                  style:
                      AppTheme.f(15, weight: FontWeight.w700, color: gc.onEmber)),
        ),
      ),
    );
  }

  Widget _sentTo(GymColors gc) {
    const marker = '{email}';
    final template = _t.otpSentTo(marker);
    final i = template.indexOf(marker);
    final before = i < 0 ? template : template.substring(0, i);
    final after = i < 0 ? '' : template.substring(i + marker.length);
    return Text.rich(
      TextSpan(children: [
        TextSpan(text: before),
        TextSpan(
            text: _email,
            style: AppTheme.f(15, weight: FontWeight.w700, color: gc.text)),
        TextSpan(text: after),
      ]),
      textAlign: TextAlign.center,
      style: AppTheme.f(15,
          weight: FontWeight.w400, color: gc.textSecondary, height: 1.6),
    );
  }

  Widget _verdictBlock(GymColors gc) {
    final v = _verdict;
    if (v == null) return const SizedBox(width: double.infinity);
    if (v == _CodeVerdict.expired) {
      return _verdictRow(gc, _t.authCodeExpired);
    }
    if (v == _CodeVerdict.network) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: gc.danger.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(_t.authErrorNetwork,
              textAlign: TextAlign.center,
              style: AppTheme.f(12.5, weight: FontWeight.w600, color: gc.danger)),
        ),
      );
    }
    final text =
        v == _CodeVerdict.invalid ? _t.authCodeInvalid(_attemptsLeft) : _t.authErrorUnknown;
    return _verdictRow(gc, text);
  }

  Widget _verdictRow(GymColors gc, String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(PhosphorIconsFill.warning, size: 14, color: gc.danger),
          const SizedBox(width: 8),
          Flexible(
            child: Text(text,
                textAlign: TextAlign.center,
                style: AppTheme.f(13, weight: FontWeight.w700, color: gc.danger)),
          ),
        ],
      ),
    );
  }

  Widget _sendNoticeBlock(GymColors gc) {
    final notice = _sendNotice;
    if (notice == null) return const SizedBox(width: double.infinity);
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: gc.danger.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(notice,
            textAlign: TextAlign.center,
            style: AppTheme.f(12.5, weight: FontWeight.w600, color: gc.danger)),
      ),
    );
  }

  Widget _codeMeta(GymColors gc, {required bool expired}) {
    if (_verifying) {
      return SizedBox(
        height: 36,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
                width: 14,
                height: 14,
                child:
                    CircularProgressIndicator(strokeWidth: 2, color: gc.accent)),
            const SizedBox(width: 8),
            Text(_t.authVerifying,
                style: AppTheme.f(13,
                    weight: FontWeight.w600, color: gc.textSecondary)),
          ],
        ),
      );
    }
    if (!_codeArmed) return _resendControl(gc);
    final secs = _expiresIn();
    final metaColor = expired
        ? gc.danger
        : secs <= 60
            ? gc.textTertiary
            : gc.textSecondary;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIconsRegular.timer, size: 14, color: metaColor),
            const SizedBox(width: 6),
            Text(
              expired
                  ? _t.authCodeExpiredVerdict
                  : _t.authCodeExpires(_fmt(secs)),
              style: AppTheme.f(13, weight: FontWeight.w600, color: metaColor)
                  .copyWith(fontFeatures: [FontFeature.tabularFigures()]),
            ),
          ],
        ),
        const SizedBox(height: 6),
        _resendControl(gc),
      ],
    );
  }

  Widget _resendControl(GymColors gc) {
    final wait = _resendIn();
    if (wait > 0) {
      return Text(_t.authResendIn(_fmt(wait)),
          textAlign: TextAlign.center,
          style: AppTheme.f(13, weight: FontWeight.w600, color: gc.textTertiary)
              .copyWith(fontFeatures: [FontFeature.tabularFigures()]));
    }
    return Text.rich(
      TextSpan(children: [
        TextSpan(text: _t.authResendPrompt),
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Pressable(
            onTap: _busy ? () {} : _resend,
            child: Text(_t.authResendAction,
                style:
                    AppTheme.f(13, weight: FontWeight.w700, color: gc.accent)),
          ),
        ),
      ]),
      textAlign: TextAlign.center,
      style: AppTheme.f(13, weight: FontWeight.w600, color: gc.textSecondary),
    );
  }

  Widget _lockCalm(GymColors gc, {required bool motionOk}) {
    final ring = Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: gc.sage.withValues(alpha: 0.06),
        border: Border.all(color: gc.sage, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: gc.sage.withValues(alpha: 0.07),
            blurRadius: 0,
            spreadRadius: 12,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Container(
        width: 28,
        height: 28,
        decoration:
            BoxDecoration(shape: BoxShape.circle, color: gc.sageSoft),
      ),
    );
    return LayoutBuilder(builder: (context, constraints) {
      final minH = constraints.hasBoundedHeight
          ? constraints.maxHeight
          : MediaQuery.sizeOf(context).height;
      return ConstrainedBox(
        constraints: BoxConstraints(minHeight: minH),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: riseAll([
            motionOk
                ? AnimatedBuilder(
                    animation: _breath,
                    builder: (context, child) =>
                        Transform.scale(scale: _breath.value, child: child),
                    child: ring,
                  )
                : ring,
            const SizedBox(height: 32),
            Text(_t.authRateLimitTitle,
                textAlign: TextAlign.center,
                style:
                    AppTheme.d(28, weight: FontWeight.w800, color: gc.text)),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 280),
              child: Text(_t.authRateLimitBody,
                  textAlign: TextAlign.center,
                  style: AppTheme.f(15,
                      weight: FontWeight.w400,
                      color: gc.textSecondary,
                      height: 1.6)),
            ),
            const SizedBox(height: 40),
            if (_lockCountdown) ...[
              Container(
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 32),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: gc.bgRaised2,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: gc.border),
                ),
                child: Text(_t.authRateLimitCta(_fmtPadded(_lockSeconds())),
                    style: AppTheme.f(15,
                            weight: FontWeight.w700, color: gc.textSecondary)
                        .copyWith(
                            fontFeatures: [FontFeature.tabularFigures()])),
              ),
              const SizedBox(height: 16),
            ],
            Text(_t.authRateLimitRule,
                textAlign: TextAlign.center,
                style: AppTheme.f(12,
                    weight: FontWeight.w500, color: gc.textTertiary)),
          ]),
        ),
      );
    });
  }

  /// Defect D1 wall: a network failure on the send leg is a blocking
  /// full-step state — no email was sent, so advancing to "check your
  /// email" would mislead. Mirrors [_lockCalm]'s centered calm layout
  /// (danger-tinted); the typed email survives in the controller and the
  /// Retry re-runs the same [_send] path.
  Widget _offlineWall(BuildContext context) {
    final gc = context.gc;
    final animates = RiseScope.animates(context);
    if (animates && !_breath.isAnimating) {
      _breath.repeat(reverse: true);
    }
    final motionOk =
        animates && MediaQuery.maybeDisableAnimationsOf(context) != true;
    final disc = Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: gc.danger.withValues(alpha: 0.06),
        border: Border.all(color: gc.danger, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: gc.danger.withValues(alpha: 0.07),
            blurRadius: 0,
            spreadRadius: 12,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Icon(PhosphorIconsRegular.wifiSlash, size: 28, color: gc.danger),
    );
    return LayoutBuilder(builder: (context, constraints) {
      final minH = constraints.hasBoundedHeight
          ? constraints.maxHeight
          : MediaQuery.sizeOf(context).height;
      return ConstrainedBox(
        constraints: BoxConstraints(minHeight: minH),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: riseAll([
            motionOk
                ? AnimatedBuilder(
                    animation: _breath,
                    builder: (context, child) =>
                        Transform.scale(scale: _breath.value, child: child),
                    child: disc,
                  )
                : disc,
            const SizedBox(height: 32),
            Text(_t.authOfflineTitle,
                textAlign: TextAlign.center,
                style:
                    AppTheme.d(28, weight: FontWeight.w800, color: gc.text)),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 280),
              child: Text(_t.authOfflineBody,
                  textAlign: TextAlign.center,
                  style: AppTheme.f(15,
                      weight: FontWeight.w400,
                      color: gc.textSecondary,
                      height: 1.6)),
            ),
            const SizedBox(height: 40),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: _cta(context,
                  label: _t.authOfflineRetry, onTap: _send, busy: _busy),
            ),
            const SizedBox(height: 16),
            _backLink(gc),
          ]),
        ),
      );
    });
  }

  Widget _backLink(GymColors gc) {
    return Pressable(
      onTap: _backToEmail,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(PhosphorIconsRegular.arrowLeft,
                size: 14, color: gc.textSecondary),
            const SizedBox(width: 8),
            Text(_t.otpChangeEmail,
                style: AppTheme.f(13,
                    weight: FontWeight.w600, color: gc.textSecondary)),
          ],
        ),
      ),
    );
  }
}


/// Zero-height placeholder for a hero slot kept mounted across the
/// compact flip (slot-stability note in _emailStep). Deliberately NOT a
/// bare SizedBox: riseAll passes bare SizedBoxes through unwrapped, and
/// the slot's outer runtimeType must stay Rise in both states for
/// Flutter's child-list sync to update the slot in place.
class _HeroSlot extends StatelessWidget {
  const _HeroSlot();

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}


class _ClampedText extends SingleChildRenderObjectWidget {
  const _ClampedText({required this.maxWidth, required super.child});

  final double maxWidth;

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderClampedText(maxWidth);

  @override
  void updateRenderObject(
      BuildContext context, covariant _RenderClampedText renderObject) {
    renderObject.maxWidth = maxWidth;
  }
}

class _RenderClampedText extends RenderProxyBox {
  _RenderClampedText(this._maxWidth);

  double _maxWidth;
  set maxWidth(double value) {
    if (_maxWidth == value) return;
    _maxWidth = value;
    markNeedsLayout();
  }

  @override
  double computeMinIntrinsicWidth(double height) =>
      math.min(super.computeMinIntrinsicWidth(height), _maxWidth);

  @override
  double computeMaxIntrinsicWidth(double height) =>
      math.min(super.computeMaxIntrinsicWidth(height), _maxWidth);

  @override
  double computeMinIntrinsicHeight(double width) =>
      super.computeMinIntrinsicHeight(math.min(width, _maxWidth));

  @override
  double computeMaxIntrinsicHeight(double width) =>
      super.computeMaxIntrinsicHeight(math.min(width, _maxWidth));

  @override
  void performLayout() {
    final RenderBox? child = this.child;
    if (child == null) {
      size = constraints.smallest;
      return;
    }
    final double maxW = math.min(constraints.maxWidth, _maxWidth);
    final double minW = math.min(constraints.minWidth, maxW);
    child.layout(
      constraints.copyWith(minWidth: minW, maxWidth: maxW),
      parentUsesSize: true,
    );
    size = constraints.constrain(child.size);
  }
}