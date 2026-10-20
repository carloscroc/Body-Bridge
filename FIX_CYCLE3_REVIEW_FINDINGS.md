# FIX CYCLE 3 — Review round 1 findings F0–F3 (task t_7cfcf9e8)

## TASK
Apply the 4 review findings exactly as specified below. Nothing else.

## WORKSPACE
You are already in the assigned worktree. Do not touch files outside it.

## CONTEXT
Review round 1 (artifact lens) returned 4 findings; F0 is a P1 production bug.
Mockup ground truth (auth-handoff.png, already approved): welcome-back = plain
sage check ring + kicker + title + body, NO chips, NO B mark anywhere.
Set-you-up = B mark WITHOUT a ring, chips row NAME(lit, terracotta) → UNITS →
BODY / GOAL → PLACES with terracotta arrow separators. Code-step expiry reads
"Code expires in 4:32" — M:SS, minutes UNPADDED. Resend cooldown "0:30".

## F0 (P1) — wrong code must show the inline error (lib/widgets/otp_auth_form.dart)
`_verify()` currently ignores the bool returned by `gate.verifyEmailCode`:
`await gate.verifyEmailCode(_email, code);` then `if (e == null) return; //
success`. The REAL gate/service returns FALSE for a wrong code (backend contract
`tokens:null`; the doc comments on `AccountGate.verifyEmailCode` in
lib/state/account_gate.dart and `OtpAuthService.verifyEmailCode` say exactly
this — "a value, not an exception"). Only the throw path is handled today, so a
production wrong code silently bounces the user back to the email step and the
mockup's "That code didn't match. N attempts left." can never appear.
Fix: capture the result. When there is NO exception AND result != true, run the
SAME branch as `case 'codeInvalid'` (decrement attempts with the existing
clamp, `_verdict = _CodeVerdict.invalid`, clear the well). Keep the existing
throw handling unchanged (`codeInvalid` throws can still arrive via
`_classify`). Success remains: no exception AND result == true.
Also fix the stale comment on `ScriptedGate.verifyFailure` in
test/auth_form_test.dart (~lines 26-28): a wrong code surfaces as
verifyEmailCode RETURNING FALSE on the real gate; OtpAuthException('codeInvalid')
throws remain possible too — the form must handle both.

## F1 — handoff variants per mockup (lib/screens/auth_handoff.dart)
(a) Chips render ONLY on the needsOnboarding (set-you-up) variant.
    Welcome-back: ring + kicker + title + body, NO chips.
(b) Hero per variant:
    - onboarded (welcome-back): PLAIN sage check ring — keep the 112px
      sageSoft/sage circle, put a sage check icon centered INSIDE it (~30px).
      No B mark, no corner badge.
    - needsOnboarding (set-you-up): the B mark ONLY (existing `_mark`), NO
      ring, NO badge.
    - checking stage: UNCHANGED (spinner-only frame).
(c) Set-you-up chips: first chip (NAME) lit in the ACCENT family — mirror the
    sage lit-chip pattern but with accentSoft bg / accent border / accent text;
    remaining chips unlit (bgRaised / border / textTertiary). Separate chips
    with small accent arrows between chips in each row (row 1: NAME → UNITS →
    BODY, row 2: GOAL → PLACES). Use PhosphorIconsRegular.arrowRight size 12
    color accent IF that symbol exists in phosphoricons_flutter (verify the
    exact name in the package); otherwise a Text('→') accent w700 fallback.
    Keep the two-row Wrap layout (320dp-safe).

## F2 — countdown formats (lib/widgets/otp_auth_form.dart)
Card copy is verbatim: expiry "Code expires in M:SS" → 4:59; resend cooldown
0:30. ONLY the rate-limit pill stays MM:SS ("Try again in 07:41").
Fix: `_fmt` → UNPADDED minutes
(`${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}`); add `_fmtPadded`
(current behavior) and use it ONLY in the lock pill inside `_lockCalm`. Expiry
(`_codeMeta`) and resend (`_resendControl`) use `_fmt`. Keep tabularFigures on
the resend countdown. Tests: update the two '00:30' expectations to '0:30' and
sweep for any other padded-countdown expectations.

## F3 — send-failure banner + resend rate-limit (lib/widgets/otp_auth_form.dart, DEVICE_QA_AUTH_OTP.md)
(a) `_send`: today only network/rateLimit stayPut; every OTHER failure silently
    advances. Fix: when a non-network, non-rateLimit OtpAuthException occurs,
    STILL advance to the code step (dev commits the code row before the
    AUTH_RESEND_KEY guard throws — live-verified) but set
    `_sendNotice = _t.authFailedGeneric`. Render it on the code step with the
    SAME container treatment as the network verdict banner (danger 0.1 alpha
    bg, r12, 12.5 w600 danger text). Sequence matters: `_enterCodeStep` resets
    per-step state, so set the notice AFTER advancing; a fresh successful send
    clears it. Also clear it in `_backToEmail`.
(b) `_send` rateLimit (stays on the email step): when retryAfterSeconds != null
    show `_t.authRateLimitBanner(_fmtPadded(secs))` as the email error (card
    verbatim "Too many attempts. Try again in MM:SS."); else keep
    `_t.authErrorTooManyRequests`.
(c) `_resend`: rateLimit must NOT be swallowed (today `networkFail =
    e.key == 'network'` lets rateLimit fall into the SUCCESS branch, resetting
    attempts/expiry and re-arming the cooldown). On rateLimit: set
    `_sendNotice = retryAfterSeconds != null ? authRateLimitBanner(_fmtPadded)
    : authFailedGeneric`; do NOT reset attempts/expiry/cooldown; leave the
    current verdict as-is; do not re-arm the cooldown. Network failure keeps
    the current behavior; generic catch keeps the network verdict.
(d) DEVICE_QA_AUTH_OTP.md step 3: make the promised banner exact — it reads
    "We couldn't complete that request." on the code step. Update the checklist
    line that references the banner to match.

## NEW/UPDATED TESTS (test/auth_form_test.dart)
1. F0: give ScriptedGate a return-false verify path (e.g. `verifySuccess`
   field, default true) → wrong code shows the inline invalid verdict
   (localized "didn't match" text) with attempts decremented and the well
   cleared. This test drives the gate seam via RETURN FALSE, not throw.
2. F3a: requestFailure = OtpAuthException('unknown') → advances to the code
   step AND the authFailedGeneric banner is visible.
3. F3c: resend with requestFailure = OtpAuthException('rateLimit',
   retryAfterSeconds: 455) → banner "Try again in 07:35", NO lock screen
   (authRateLimitTitle absent), expiry countdown NOT reset.
4. F1/F2 assertion updates:
   - welcome-back test: chips findNothing (all five), find.text('B')
     findNothing, kicker/title/body assertions stay.
   - set-you-up test: chips stay findOneWidget; add find.text('B')
     findOneWidget and find.byIcon(arrowRight) findNWidgets(3) (adjust to the
     arrow widget you actually render).

## SCOPE — files you may touch
- lib/widgets/otp_auth_form.dart
- lib/screens/auth_handoff.dart
- test/auth_form_test.dart
- DEVICE_QA_AUTH_OTP.md
NO l10n changes: `authFailedGeneric` and `authRateLimitBanner` already exist in
all arbs (verify with grep). NO gate/service changes. NO other files.

## DO NOT
- Do not touch the lock calm screen, well geometry, email step layout,
  RiseScope/motion, or the gate/service seams.
- Do not add dependencies.
- Do not run flutter (not on your PATH) — the operator runs analyze/test.

## ACCEPTANCE
- `_verify` treats result-false exactly like codeInvalid (inline verdict).
- Welcome-back handoff: no chips, no B mark; plain sage check ring.
- Set-you-up: B mark only; chips with accent-lit first chip + arrow separators.
- Expiry/resend unpadded M:SS (4:59 / 0:30); lock pill MM:SS.
- Send non-network failure → code step + banner; rate-limited resend → banner,
  no state resets.
- All listed tests updated/added; existing tests adjusted only where F1/F2
  require.

## RETURN
Summarize per file what changed and any deviation from this spec.
