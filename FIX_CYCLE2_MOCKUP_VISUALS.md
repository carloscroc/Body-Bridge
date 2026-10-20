# FIX CYCLE 2 — mockup-visual corrections to the OTP wall (t_7cfcf9e8)

The implementation is functionally complete and green (analyze clean, 585 pass).
Three visual states deviate from the APPROVED mockups (auth-code-step.html /
auth-error-states.html — the spec). Correct exactly these; change nothing else.

## FIX 1 — Rate-limit lock: full-screen centered calm state (mockup auth-error-states)
Current: an inline left-aligned sage panel inside the form.
Required (replace the whole code-step form area when locked, keep the wall scaffold):
- Centered column: 72px breath ring (1.5px sage ring, transparent-ish fill with a
  28px sageSoft inner dot), then 'Too many attempts' headline (18 w800 text, centered),
  body 'Take a breath — try again in a few minutes. Your account is safe.'
  (13.5 textSecondary centered, max-width ~280), then the disabled countdown pill
  'Try again in 07:41' (MM:SS minutes-padded — keep authRateLimitCta and the current
  _fmt for it) ONLY when _lockCountdown, pill style: bgRaised2 fill + 1px gc.border,
  textSecondary, radius 100, not tappable; then the rule line '10 wrong codes lock
  requests for an hour.' (12 textTertiary centered).
- SAGE ONLY on this state — zero danger/red anywhere. The ring's slow 3s scale
  'breath' runs ONLY when animations are enabled (MediaQuery.maybeDisableAnimations
  false and RiseScope.animates true); under reduce-motion it is a still.
- Keep the same l10n keys (tests assert on authRateLimitTitle/Cta/Rule text).
- No overflow at 320x640.

## FIX 2 — Resend affordance: prompt link, not a pill (mockup code step)
Current: an accent-soft pill with 'Resend'.
Required:
- Cooldown (wait > 0): centered text 'Resend in 0:30' (authResendIn, 12.5 w500,
  textSecondary, tabular digits), NOT tappable.
- Live: Text.rich centered — 'Didn't get it? ' (authResendPrompt, 12.5 w500
  textSecondary) + 'Resend' (authResendAction, 12.5 w700 accent, Pressable, taps to
  _resend). No pill background.

## FIX 3 — Code-step meta layout: stacked + centered (mockup code step)
Current: expiry and resend share one Row (timer left, resend right).
Required (mockup): expiry line centered (14px timer icon + 'Code expires in M:SS'
text, 12.5 w500 textSecondary; at <=60s dim to textTertiary; expired verdict line
stays danger per the mockup's .count.danger), and the resend line centered BELOW it
(FIX 2). Back link ('Use a different email') stays at the bottom, left-aligned,
quiet — but HIDDEN while _verifying (mockup handoff: 'resend and back omitted while
in flight'; the verifying spinner + 'Checking your code…' centered row you already
have stays).

## Constraints
- Do not touch: otp_auth_service.dart, onboarding_gate.dart, app shell/entry wiring,
  l10n ARB files, the email step, the handoff screen, tests' semantics.
- Tests may need selector updates ONLY if a finder matched the old pill shape;
  assertions on text/attempts/countdown must not weaken. Update test/auth_form_test.dart
  and any affected ported test minimally if finders reference removed widgets.
- Verify: flutter analyze (0 issues) then flutter test (all green). Report both outputs.

## RETURN
Files changed + final analyze/test lines.
