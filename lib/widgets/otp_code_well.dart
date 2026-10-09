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
      child: SizedBox(
        height: 56,
        child: Stack(
          children: [
            Row(
              children: [
                for (var i = 0; i < 6; i++) ...[
                  if (i > 0) const SizedBox(width: 8),
                  Expanded(child: _box(gc, i < text.length ? text[i] : null, i == caret)),
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
        ),
      ),
    );
  }

  Widget _box(GymColors gc, String? digit, bool isCaret) {
    final highlight = !widget.hasError && isCaret && _focus.hasFocus;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: gc.bgRaised,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: widget.hasError ? gc.danger : highlight ? gc.accent : gc.border,
          width: widget.hasError || highlight ? 1.4 : 1,
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
