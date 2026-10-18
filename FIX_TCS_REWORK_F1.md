# FIX CONTRACT TCS-REWORK-F1 — one deviation found in cold verification

## CONTEXT
Your CONTRACT_TCS_REWORK.md implementation is committed (7f6ab6ac, 333c9203, 88993127, a2f2b766 on wt/t_c52ff168) and passed operator verification: flutter analyze 0 issues, gen-l10n tree-neutral, full flutter test +596 ~5 -1 (the -1 is the documented pre-existing smoke failure, proven present at the pre-rework commit). No dangling references. Tier matrix behavior verified in your rewritten tests.

## THE DEVIATION (exactly one — fix it, nothing else)
`lib/screens/routine_edit_screen.dart`, in `_pickRow`, the subtitle line still reads:

    Text('${muscleLabel(ex.primary)} · ${t.equipment(ex.equipment)}', ...)

For trainer-sourced exercises (`fit.isTrainerSourced(ex.id)`) `ex.primary` is a trainer CATEGORY id ('strength'|'mobility'|'core'|'corrective'|'warmup'), and `t.muscle()` falls back to the raw English id — a localization bug on the picker rows. The original contract required: subtitle uses `exerciseSectionLabel(ex)` for trainer-sourced exercises.

Fix: when `fit.isTrainerSourced(ex.id)`, render `'${exerciseSectionLabel(ex)} · ${t.equipment(ex.equipment)}'`; otherwise keep the existing expression byte-identical. `exerciseSectionLabel` comes from `../catalog/trainer_exercises.dart`, which routine_edit_screen.dart already imports (verify).

## RULES
- Touch ONLY that one expression (+ import if somehow missing).
- Do NOT run dart format — the project is not format-clean by convention; match the surrounding style.
- Update the rewritten trainer_source_test ONLY if it has an assertion this change affects (check; likely add nothing).
- Validate: `flutter analyze` (expect 0 issues) and `flutter test test/trainer_source_test.dart` (expect all pass).
- Commit EXACTLY: `TCS REWORK: localized category label on routine picker rows for trainer sources`
- Leave pubspec.lock alone if the test run rewrites it; report if it changed.

## RETURN
Report the diff, commands run + results, and the commit hash.
