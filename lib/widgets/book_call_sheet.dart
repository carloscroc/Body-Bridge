// Book-a-call sheet (card t_9d175854 D3) — the 1:1 call request form the
// trainer chat header calendar button opens. NO phone numbers and NO
// call handoff anywhere: the request is filed through the trainer seam and the
// trainer confirms the time in chat. Two-door grammar mirrors the
// consultation sheet: with a request already on file the sheet opens
// directly on the confirmation state. v0 local stub — no backend yet.

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../l10n/l10n.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import 'glass.dart';
import 'trainer_kit.dart';
import 'ui_kit.dart';

Future<void> showBookCallSheet(BuildContext context) {
  return showAppSheet(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) => const BookCallSheet(),
  );
}

class BookCallSheet extends StatefulWidget {
  const BookCallSheet({super.key});

  @override
  State<BookCallSheet> createState() => _BookCallSheetState();
}

class _BookCallSheetState extends State<BookCallSheet> {
  int? _day;
  String? _timeWindow;
  String? _error;
  bool _sending = false;
  late final TextEditingController _notes;

  @override
  void initState() {
    super.initState();
    // Defensive re-seed; with a request on file the sheet routes straight
    // to the confirmation door, so this rarely shows state.
    _notes = TextEditingController(text: trainer.call?.notes ?? '');
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_day == null || _timeWindow == null) {
      setState(() => _error = t.callPickDayTime);
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    await trainer.requestCall(
      day: _day!,
      timeWindow: _timeWindow!,
      notes: _notes.text.trim(),
    );
    if (mounted) setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: trainer,
      builder: (context, _) {
        final name = trainerFirstName(trainer.profile?.displayName ?? '');
        return Padding(
          padding: sheetPad(context),
          child: trainer.call != null
              ? _confirmation(context, name)
              : _form(context),
        );
      },
    );
  }

  Widget _form(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return SingleChildScrollView(
      child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          t.callKicker,
          textAlign: TextAlign.center,
          style: AppTheme.f(9.5,
              weight: FontWeight.w800, color: gc.brass, letterSpacing: 1.6),
        ),
        const SizedBox(height: 6),
        Text(
          t.callSheetTitle,
          textAlign: TextAlign.center,
          style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
        ),
        const SizedBox(height: 18),
        _chips<int>(
          context,
          [for (var d = 1; d <= 7; d++) (d, t.weekdayShort(d))],
          _day,
          (v) => _day = v,
        ),
        const SizedBox(height: 12),
        _chips<String>(
          context,
          [
            ('morning', t.timeMorning),
            ('afternoon', t.timeAfternoon),
            ('evening', t.timeEvening),
          ],
          _timeWindow,
          (v) => _timeWindow = v,
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _notes,
          minLines: 2,
          maxLines: 4,
          style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.text),
          cursorColor: gc.accent,
          decoration: InputDecoration(
            hintText: t.callNotesHint,
            hintStyle:
                AppTheme.f(13, weight: FontWeight.w500, color: gc.textTertiary),
            filled: true,
            fillColor: gc.bgRaised,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: gc.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: gc.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: gc.accent),
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: AppTheme.f(12, weight: FontWeight.w600, color: gc.danger),
          ),
        ],
        const SizedBox(height: 18),
        PrimaryButton(
          label: t.callSubmit,
          bg: trainerPrimaryBg(gc, dark),
          fg: trainerPrimaryFg(gc, dark),
          onTap: _sending ? () {} : _submit,
        ),
      ],
      ),
    );
  }

  Widget _confirmation(BuildContext context, String name) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return SingleChildScrollView(
      child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: 54,
            height: 54,
            alignment: Alignment.center,
            decoration:
                BoxDecoration(color: gc.bgRaised, shape: BoxShape.circle),
            child: Icon(PhosphorIconsRegular.checkCircle,
                size: 30, color: gc.sage),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          t.callSentTitle,
          textAlign: TextAlign.center,
          style: AppTheme.f(19, weight: FontWeight.w800, color: gc.text),
        ),
        const SizedBox(height: 8),
        Text(
          t.callSentBody(name),
          textAlign: TextAlign.center,
          style: AppTheme.s(
              13, weight: FontWeight.w500, color: gc.textSecondary, height: 1.45),
        ),
        const SizedBox(height: 18),
        PrimaryButton(
          label: t.callDone,
          bg: trainerPrimaryBg(gc, dark),
          fg: trainerPrimaryFg(gc, dark),
          onTap: () => Navigator.of(context).pop(),
        ),
      ],
      ),
    );
  }

  // Chip row, consultation-form-verbatim (t_db30a5d3 R4): pill chips,
  // selected = trainer primary, unselected = raised + border.
  Widget _chips<T>(
    BuildContext context,
    List<(T, String)> options,
    T? selected,
    void Function(T value) pick,
  ) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (id, label) in options)
          Pressable(
            onTap: () => setState(() {
              pick(id);
              _error = null;
            }),
            child: Container(
              height: 38,
              padding: const EdgeInsets.symmetric(horizontal: 15),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected == id ? trainerPrimaryBg(gc, dark) : gc.bgRaised,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(
                  color: selected == id ? Colors.transparent : gc.border,
                ),
              ),
              child: Text(
                label,
                style: AppTheme.f(
                  12.5,
                  weight: FontWeight.w700,
                  color: selected == id ? trainerPrimaryFg(gc, dark) : gc.text,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
