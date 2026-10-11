import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmane/theme/app_colors.dart';
import 'package:gymmane/theme/app_theme.dart';
import 'package:gymmane/widgets/otp_code_well.dart';

/// OtpCodeWell outline states. Defect under test (t_2ffc0956): the expired
/// state does not suppress the focus ring, so in expired+focused the caret
/// cell paints a full-opacity accent inner border (+ 0.40 outer ring) while
/// the other five cells keep faint base borders — uneven ring composition
/// across the six boxes. The uniformity tests (expired / invalid) expect ONE
/// shared border color per danger state; the neutral-focus test pins the
/// approved affordance (caret cell accent, idle cells faint) so the fix
/// cannot eat the mockup's per-cell focus highlight.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  void noop(String _) {}

  /// Pumps a focused OtpCodeWell and returns the six box border colors in
  /// cell order (the caret is cell 0 for empty text).
  Future<List<Color>> pumpWellBorders(
    WidgetTester tester, {
    required ThemeData theme,
    bool expired = false,
    bool hasError = false,
  }) async {
    await tester.pumpWidget(MaterialApp(
      theme: theme,
      home: Scaffold(
        body: Center(
          child: OtpCodeWell(
            onCompleted: noop,
            expired: expired,
            hasError: hasError,
          ),
        ),
      ),
    ));
    // The well autofocuses: settle focus, then pass the 180ms
    // AnimatedContainer transition so borders read their final color.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));

    final boxes = tester.widgetList<AnimatedContainer>(find.descendant(
      of: find.byType(OtpCodeWell),
      matching: find.byType(AnimatedContainer),
    )).toList();
    expect(boxes, hasLength(6),
        reason: 'six code cells, one AnimatedContainer each');
    return [
      for (final box in boxes)
        (box.decoration as BoxDecoration).border!.top.color,
    ];
  }

  Future<void> unmount(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
  }

  testWidgets(
      'dark: expired+focused keeps uniform outlines across all six cells',
      (tester) async {
    final borders = await pumpWellBorders(tester,
        theme: AppTheme.dark, expired: true);
    final gc = tester.element(find.byType(OtpCodeWell)).gc;

    final colors = borders.toSet();
    expect(colors.length, 1,
        reason: 'in the expired+focused state every cell must share one '
            'border color — today the caret cell leaks the full-opacity '
            'accent focus border while the five idle cells keep faint base '
            'borders (uneven ring composition across the six boxes)');
    expect(colors.single, gc.danger.withValues(alpha: 0.55),
        reason: 'the shared outline is the danger border at 0.55 alpha');
    await unmount(tester);
  });

  testWidgets(
      'light: expired+focused keeps uniform outlines across all six cells',
      (tester) async {
    final borders = await pumpWellBorders(tester,
        theme: AppTheme.light, expired: true);
    final gc = tester.element(find.byType(OtpCodeWell)).gc;

    final colors = borders.toSet();
    expect(colors.length, 1,
        reason: 'same defect in light theme — the caret cell must not '
            'compose an accent focus ring on top of the expired state while '
            'the other cells sit on their base borders');
    expect(colors.single, gc.danger.withValues(alpha: 0.55),
        reason: 'the shared outline is the danger border at 0.55 alpha');
    await unmount(tester);
  });

  testWidgets('dark: invalid state keeps uniform outlines', (tester) async {
    final borders =
        await pumpWellBorders(tester, theme: AppTheme.dark, hasError: true);
    final gc = tester.element(find.byType(OtpCodeWell)).gc;

    final colors = borders.toSet();
    expect(colors.length, 1,
        reason: 'the invalid state must read as one uniform danger outline '
            'across all six cells — no cell may mix a focus affordance into '
            'the danger composition');
    expect(colors.single, gc.danger.withValues(alpha: 0.55),
        reason: 'the shared outline is the danger border at 0.55 alpha');
    await unmount(tester);
  });

  testWidgets('dark: neutral focus keeps the approved affordance',
      (tester) async {
    final borders = await pumpWellBorders(tester, theme: AppTheme.dark);
    final gc = tester.element(find.byType(OtpCodeWell)).gc;

    // Empty text: cell 0 is the caret cell (Row order).
    expect(borders.first, gc.accent,
        reason: 'the focused caret cell keeps its full-accent inner border '
            '— the mockup-approved per-cell focus affordance');
    expect(borders.skip(1).toSet(), {gc.accent.withValues(alpha: 0.14)},
        reason: 'the five idle cells keep the faint dark base border');
    await unmount(tester);
  });
}
