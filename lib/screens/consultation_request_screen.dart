// Consultation request form (card t_aaa15e0d, repair t_db30a5d3 R4) —
// consultation-request.html mockup-verbatim: name and email arrive prefilled
// from the account (AccountGate snapshot + profile), the goal chip set is the
// ONLY required input, message and best-time chips stay optional. Submit is
// duplicate-safe (consultations:request first-wins), so a double tap or
// re-entry can never create a second record.

import 'package:flutter/material.dart';

import '../l10n/l10n.dart';
import '../state/account_gate.dart';
import '../state/fit_state.dart';
import '../state/trainer_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../widgets/entrance.dart';
import '../widgets/svg_icon.dart';
import '../widgets/trainer_kit.dart';
import '../widgets/ui_kit.dart';

class ConsultationRequestScreen extends StatefulWidget {
  const ConsultationRequestScreen({super.key});

  @override
  State<ConsultationRequestScreen> createState() =>
      _ConsultationRequestScreenState();
}

class _ConsultationRequestScreenState extends State<ConsultationRequestScreen> {
  String? _goal;
  String? _timeWindow;
  String? _error;
  bool _sending = false;
  late final TextEditingController _notes;

  @override
  void initState() {
    super.initState();
    final r = trainer.consultation;
    _notes = TextEditingController(text: r?.notes ?? '');
    // Defensive re-seed for the new chip ids; with a request on file the
    // sheet routes to the confirmation door, so this rarely shows state.
    const knownGoals = {'recover', 'strength', 'mobility', 'unsure'};
    if (r != null && knownGoals.contains(r.goal)) _goal = r.goal;
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_goal == null) {
      setState(() => _error = t.requestPickBoth);
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    await trainer.requestConsultation(
      goal: _goal!,
      experience: trainer.consultation?.experience ?? '',
      timeWindow: _timeWindow ?? '',
      notes: _notes.text.trim(),
    );
    if (mounted) fit.pushRoute('consultation-confirmation');
  }

  @override
  Widget build(BuildContext context) {
    final gc = context.gc;
    final dark = trainerIsDark(context);
    final email = AccountGate.instance.snapshot.email;
    final name = fit.profile.name.trim();
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: riseAll([
            ScreenHeader(
              title: t.requestTitle,
              subtitle: t.requestSub,
              onBack: () => fit.popRoute(),
            ),
            const SizedBox(height: 24),
            _sectionLabel(context, t.requestNameKicker),
            const SizedBox(height: 8),
            _readonlyField(context, name.isEmpty ? '—' : name),
            const SizedBox(height: 18),
            _sectionLabel(context, t.requestEmailKicker),
            const SizedBox(height: 8),
            _readonlyField(context, (email == null || email.isEmpty) ? '—' : email),
            const SizedBox(height: 6),
            Row(
              children: [
                SvgPathIcon(Ic.checkBold, size: 10, color: gc.sage),
                const SizedBox(width: 5),
                Text(
                  t.requestVerified,
                  style:
                      AppTheme.f(10, weight: FontWeight.w700, color: gc.textTertiary),
                ),
              ],
            ),
            const SizedBox(height: 22),
            _sectionLabel(context, t.requestGoalKicker),
            const SizedBox(height: 10),
            _chips(context, [
              ('recover', t.goalRecover),
              ('strength', t.goalStrength),
              ('mobility', t.goalMobility),
              ('unsure', t.goalUnsure),
            ], _goal, (v) => _goal = v),
            const SizedBox(height: 22),
            _sectionLabel(context, t.requestNotesKicker),
            const SizedBox(height: 10),
            TextField(
              controller: _notes,
              minLines: 2,
              maxLines: 4,
              style: AppTheme.f(13.5, weight: FontWeight.w500, color: gc.text),
              cursorColor: gc.accent,
              decoration: InputDecoration(
                hintText: t.requestNotesHint,
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
            const SizedBox(height: 22),
            _sectionLabel(context, t.requestTimeKicker),
            const SizedBox(height: 10),
            _chips(context, [
              ('wk_morning', t.timeWeekdayMornings),
              ('wk_evening', t.timeWeekdayEvenings),
              ('weekend', t.timeWeekends),
            ], _timeWindow, (v) => _timeWindow = v),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: AppTheme.f(12, weight: FontWeight.w600, color: gc.danger),
              ),
            ],
            const SizedBox(height: 20),
            PrimaryButton(
              label: t.requestSubmit,
              bg: trainerPrimaryBg(gc, dark),
              fg: trainerPrimaryFg(gc, dark),
              onTap: _sending ? () {} : _submit,
            ),
          ]),
        ),
      ),
    );
  }

  Widget _readonlyField(BuildContext context, String value) {
    final gc = context.gc;
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      alignment: Alignment.centerLeft,
      decoration: BoxDecoration(
        color: gc.bgRaised,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: gc.border),
      ),
      child: Text(
        value,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppTheme.f(14, weight: FontWeight.w600, color: gc.text),
      ),
    );
  }

  Widget _sectionLabel(BuildContext context, String label) => Text(
        label,
        style: AppTheme.f(9.5,
            weight: FontWeight.w800,
            color: context.gc.textTertiary,
            letterSpacing: 1.6),
      );

  Widget _chips(
    BuildContext context,
    List<(String, String)> options,
    String? selected,
    void Function(String value) pick,
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
