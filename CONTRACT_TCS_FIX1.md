# CONTRACT_TCS_FIX1 — fidelity repairs from capture review (same session, wt/t_c52ff168)

Supervisor reviewed your 20 captures against the approved mockups. Six defects. Fix all, re-verify,
commit ONE checkpoint. Same rules as CONTRACT_TCS.md (additive-only shared files, no new deps,
l10n via t.*, never push).

## F1 — Tab strip truncation (all screens)
Captures show the Trainer segment label truncated ("Tr…" on Exercises free, "Train…" on trainer
screens) at 411dp. Mockups show full labels on one line. Fix `lib/screens/trainer/source_tabs.dart`:
equal-flex segments (Expanded per segment, centered content), tightened metrics so all three labels
+ padlocks + the ADVANCED badge fit without ellipsis at BOTH 360 and 411 logical width — e.g.
fontSize ≤ 11.5, hPad ≤ 10, badge font ≤ 8.5 with ≤ 5px hPad, padlock glyph ≤ 12. Keep the
SegToggle look (bgRaised2 track, radius 100, 3px padding, ember active). Add a widget test
assertion: pump at 360x800 AND 411x914, expect `find.text(t.sourceTrainer)` finds the exact full
string with no TextOverflow.ellipsis (you can assert `Text.style.overflow` is null or that the
RenderBox width >= text width; pick a robust check).

## F2 — Trainer video screen fits the fold
The video surface is near full-width → 9:16 makes it ~72% of screen height and pushes SETS/REPS +
'Add to workout' below the fold at 411x914. Mockup: video card ≈ 56-66% of screen width, centered,
with title/coach/cues/steppers/CTA ALL visible. Fix `trainer_video_screen.dart`: constrain the video
surface to ~0.62 of available width (AspectRatio 9:16, centered, rounded ~20) so the full mockup
stack fits at 411x914 AND 360x800. Update/add test: at 411x914 all of [title, first cue,
setsLabel '3', repsLabel '10', addSessionToWorkout button] are visible on screen (no offstage).

## F3 — Lock overlay legibility
In `exercises-locked` captures the lock circle + message are nearly invisible (dimmed under the
scrim). Mockup: content behind is blurred/dimmed, but the soft circle + padlock + message
'Trainer-recorded exercises are part of Advanced' sit ABOVE the scrim, clearly legible. Fix
`lib/screens/trainer/lock_overlay.dart` z-order/opacity: scrim dims only the list behind; the lock
circle (mutedFill) + lock icon + message render above it at full opacity, centered in the space
above the sheet. The AnimatedOpacity hide is fine to keep — but the SHOWN state must be fully
opaque. Test: assert the lock message Text has opacity 1.0 visible while the sheet is up.

## F4 — Assignment durations per mockup
Assignment rows show the library session durations (2:10 / 0:45 / 2:10 / 1:50). Mockup
custom-assigned.png: 0:50 / 1:15 / 1:45 / 1:20. Fix `lib/catalog/trainer_catalog.dart`: each
TrainerAssignment carries its own duration (durationSec + label), independent of the referenced
session; render that on the row thumb. Update seeds to the four mockup values. Update the test that
asserts durations.

## F5 — Assigned date includes weekday
Rows show 'Assigned Oct 12'; mockup: 'Assigned Mon, Oct 12'. Fix the date rendering to a
locale-aware weekday format (intl `DateFormat('EEE, MMM d', intlLocale)` or reuse an existing t.*
helper if one matches). Keep it right in AR/ES etc. (locale-aware — do NOT hand-concatenate English
weekday names; the i18n scanner must stay clean).

## F6 — Capture harness: load Phosphor fonts
Captures render Phosphor glyphs (play, padlock, bookmark, minus/plus) as tofu squares. Fix
`test/trainer_captures_test.dart` setUpAll: after Nunito + MaterialIcons, also FontLoader the
Phosphor families from the pub cache:
`C:/Users/thebe/AppData/Local/Pub/Cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts/`
(POSIX fallback `$HOME/.pub-cache/hosted/pub.dev/phosphoricons_flutter-1.0.0/lib/fonts/`).
Family names are PER WEIGHT FILE (verified in the package source): Phosphor.ttf → 'Phosphor',
Phosphor-Bold.ttf → 'PhosphorBold', Phosphor-Fill.ttf → 'PhosphorFill', Phosphor-Light.ttf →
'PhosphorLight', Phosphor-Thin.ttf → 'PhosphorThin', Phosphor-Duotone.ttf → the Duotone family
name (grep lib/src for the exact string). Load all six files each under its own family; glob the
dir, fail loudly if the dir is missing. Do not reference these paths from lib/ code — test-only.

## Re-verify before committing (run yourself)
1. `flutter analyze` — no new findings.
2. `flutter test test/trainer_source_test.dart test/i18n_test.dart` — all pass.
3. `BB_CAPTURES=1 flutter test test/trainer_captures_test.dart` — 20/20 PNGs regenerated.
4. `git checkout -- pubspec.lock` if the test run churned it; commit everything else as
   'TCS FIX1: capture-review fidelity repairs (tabs fit, player fold, lock legibility, assignment data, phosphor captures)'.
5. Append a short 'FIX1' section to DIVERGENCES_TCS.md noting what changed.

## RETURN
Files changed, check results, any F-item you could not fully satisfy and why.
