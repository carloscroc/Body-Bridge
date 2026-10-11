import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

/// Six-box one-time-code well. A single invisible [TextField] owns the real
/// caret so paste, backspace and SMS autofill all work natively; the boxes
/// are pure paint driven by the controller text.
class OtpCodeWell extends StatefulWidget {
  const OtpCodeWell({
    super.key,
    required this.onCompleted,
    this.enabled = true,
    this.expired = false,
    this.hasError = false,
  });

  /// Fired ~80ms after the sixth digit lands.
  final ValueChanged<String> onCompleted;
  final bool enabled;
  final bool expired;
  final bool hasError;

  @override
  State<OtpCodeWell> createState() => OtpCodeWellState();
}

class OtpCodeWellState extends State<OtpCodeWell> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  Timer? _submitDebounce;

  @override
  void initState() {
    super.initState();
    _focus.addListener(_repaint);
  }

  @override
  void dispose() {
    _submitDebounce?.cancel();
    _focus.removeListener(_repaint);
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _repaint() {
    if (mounted) setState(() {});
  }

  /// Focus the field and select everything so the next keystroke overwrites.
  void focus() {
    _focus.requestFocus();
    _controller.selection = TextSelection(
      baseOffset: 0,
      extentOffset: _controller.text.length,
    );
  }

  /// Wipe the digits and keep the caret ready for the next attempt.
  void clear() {
    _submitDebounce?.cancel();
    _controller.clear();
    _repaint();
    _focus.requestFocus();
  }

  void _onChanged(String value) {
    _repaint();
    _submitDebounce?.cancel();
    if (value.length == 6) {
      _submitDebounce = Timer(const Duration(milliseconds: 80), () {
        if (mounted) widget.onCompleted(value);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final text = _controller.text;
    final caret = text.length.clamp(0, 5);
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: widget.enabled ? 1 : 0.6,
      child: Center(
        child: SizedBox(
          height: 64,
          child: LayoutBuilder(builder: (context, constraints) {
            const gaps = 5 * 8.0;
            const chrome = 6 * 8.0;
            final inner = ((constraints.maxWidth - gaps - chrome) / 6)
                .clamp(0.0, 56.0)
                .toDouble();
            return Stack(
              alignment: Alignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < 6; i++) ...[
                      if (i > 0) const SizedBox(width: 8),
                      _cell(gc, i < text.length ? text[i] : null, i == caret,
                          inner),
                    ],
                  ],
                ),
                Positioned.fill(
                  child: Opacity(
                    opacity: 0,
                    child: TextField(
                      controller: _controller,
                      focusNode: _focus,
                      autofocus: true,
                      enabled: widget.enabled,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      autocorrect: false,
                      enableSuggestions: false,
                      maxLength: 6,
                      maxLines: 1,
                      cursorColor: Colors.transparent,
                  style: const TextStyle(fontSize: 1, color: Colors.transparent, height: 1),
                      textAlign: TextAlign.center,
                      textAlignVertical: TextAlignVertical.center,
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        isDense: true,
                        counterText: '',
                        contentPadding: EdgeInsets.zero,
                      ),
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      autofillHints: const [AutofillHints.oneTimeCode],
                      onChanged: _onChanged,
                    ),
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Widget _cell(GymColors gc, String? digit, bool isCaret, double inner) {
    final dangerState = widget.hasError || widget.expired;
    final ringed = isCaret && _focus.hasFocus && !dangerState;
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          width: 2,
          color:
              ringed ? gc.accent.withValues(alpha: 0.40) : Colors.transparent,
        ),
      ),
      child: SizedBox(
        width: inner,
        height: inner,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(child: _box(gc, digit, isCaret)),
            if (digit == null && isCaret && _focus.hasFocus)
              _WellCaret(color: dangerState ? gc.danger : gc.accent),
          ],
        ),
      ),
    );
  }

  Widget _box(GymColors gc, String? digit, bool isCaret) {
    final dark = Theme.brightnessOf(context) == Brightness.dark;
    final dangerState = widget.hasError || widget.expired;
    final ringed = isCaret && _focus.hasFocus && !dangerState;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: gc.bgRaised,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          width: 1,
          color: dangerState
              ? gc.danger.withValues(alpha: 0.55)
              : ringed
                  ? gc.accent
                  : dark
                      ? gc.accent.withValues(alpha: 0.14)
                      : gc.border,
        ),
      ),
      child: Text(
        digit ?? '',
        style: AppTheme.d(28, weight: FontWeight.w800,
                color: widget.expired ? gc.textTertiary : gc.text)
            .copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
      ),
    );
  }
}

class _WellCaret extends StatefulWidget {
  const _WellCaret({required this.color});

  final Color color;

  @override
  State<_WellCaret> createState() => _WellCaretState();
}

class _WellCaretState extends State<_WellCaret>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.maybeDisableAnimationsOf(context) == true) {
      _ctrl.stop();
    } else if (!_ctrl.isAnimating) {
      _ctrl.repeat();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final blink = MediaQuery.maybeDisableAnimationsOf(context) == true;
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, _) {
        final on = !blink || _ctrl.value < 0.55;
        return on
            ? Container(
                width: 2,
                height: 26,
                decoration: BoxDecoration(
                  color: widget.color,
                  borderRadius: BorderRadius.circular(1),
                ),
              )
            : const SizedBox(width: 2, height: 26);
      },
    );
  }
}
