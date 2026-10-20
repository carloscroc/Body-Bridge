# Device QA — Email-OTP auth wall (branch wt/t_7cfcf9e8)

Carlos: run the app in DEBUG mode on your Samsung, complete one real sign-in, and
check the list below. Nothing here needs a release build.

## Why you need a helper script right now

`AUTH_RESEND_KEY` is not set on dev (benevolent-caiman-719), so no real email is
sent. The code row IS committed on dev anyway (verified 2026-10-08), so you can
still complete the full flow on-device: request the code in the app, then read the
code out of the dev DB with a test-only script.

When you set the key (`npx convex env set AUTH_RESEND_KEY re_...` on dev), real
emails start arriving and step 3 becomes optional.

## Steps (debug mode)

1. From the backend repo (`body-bridge-backend-main`, dev `.env.local` wired):
   nothing to configure. The helper is `scripts/otp-get-code.mjs`
   (test-only, dev-deployment-guarded, uncommitted).

2. On the phone: `flutter run -d RFCN201Q6BZ` from THIS worktree
   (`...\.worktrees\t_7cfcf9e8`). The auth wall appears (cold start, signed out).

3. Type any email you control, e.g. `carlos-qa@example.com`, tap
   CONTINUE WITH EMAIL. Two things can happen:
   - The wall advances to "Enter your code" and (until AUTH_RESEND_KEY is set) also
     shows a small banner that sign-in could not send the email. That banner is
     EXPECTED on dev today. The code still exists server-side.
   - If instead you never get past the first screen with a network-ish error,
     stop and ping the card — that would be a real bug.

4. On your machine, in `body-bridge-backend-main`:
       node scripts/otp-get-code.mjs carlos-qa@example.com
   It prints e.g. `Code: 164155 (expires in 289s)`. Add `--send` if you skipped
   step 3's button tap for that email. Codes expire in 5 minutes; re-request if
   the wall's countdown says expired.

5. Type the code on the phone. The well auto-submits on the 6th digit.

6. First sign-in for that email -> you should see "Let's set you up" with the
   NAME/UNITS/BODY/GOAL/PLACES chips, then the normal 5-step onboarding.

7. Sign out (Account screen), sign in again with the SAME email:
   - after onboarding completes you should get "Welcome back" instead.

## Checklist

- [ ] Email step: B mark + TRAIN WITH INTENT + BODY BRIDGE + "Welcome to Body Bridge"
      + "One email. No password. You're in." + EMAIL field + CONTINUE WITH EMAIL +
      "We'll send a 6-digit code. No password needed." + privacy lines.
- [ ] Keyboard open: hero collapses, field + CTA stay visible, no overflow.
- [ ] Send with AUTH_RESEND_KEY unset: still lands on the code step with the
      banner "We couldn't complete that request." (expected on dev).
- [ ] Code step: "CHECK YOUR EMAIL" / "Enter your code" / "We sent a 6-digit code to
      <email>" + six 56px boxes + "Code expires in 4:59" ticking + "Resend in 0:30"
      turning into "Didn't get it? Resend" + "Use a different email" at the bottom.
- [ ] Wrong code: red-bordered boxes + "That code didn't match. 2 attempts left."
      (then 1), digits stay, countdown keeps ticking.
- [ ] Expired (wait ~5 min or read the verdict): boxes dim + "Code expired" + resend live.
- [ ] Auto-submit on 6th digit; brief "Checking your code…" while verifying.
- [ ] Success -> handoff screen (chips for new user / "Welcome back, <name>" for
      returning) -> onboarding or app.
- [ ] "Use a different email" returns to step 1 with email kept.
- [ ] Both themes (system dark + light) render per mockup; no layout jump between them.
- [ ] 320dp-width split-screen: no overflow on either step.
