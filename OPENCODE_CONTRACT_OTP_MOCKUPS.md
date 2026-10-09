# CONTRACT — Auth wall: email-OTP per approved mockups (t_7cfcf9e8)

## TASK
Replace the password-based AuthWallScreen with the approved two-step email-OTP auth
flow. The approved mockups are the spec. Work only inside this worktree.
Repo: C:\Users\thebe\.aa.StudioProjects\Body-Bridge\.worktrees\t_7cfcf9e8 (branch wt/t_7cfcf9e8).

## WORKSPACE
You are already cd'd into the worktree. Do NOT touch files outside it. Do NOT commit,
push, or run release builds. You may run `flutter analyze` / `dart format` for your own
checking, but the parent will re-run all verification.

## CONTEXT (verified facts — trust these, do not re-derive)
- Backend contract is FINAL and LIVE on dev (do not modify any backend):
  * send:     action `auth:signIn` `{provider:'resend-otp', params:{email}}` -> `{started:true}`.
    NOTE: while AUTH_RESEND_KEY is unset on dev, the send throws AFTER the code row is
    committed. So: on any send failure except a local validation error, the UI MUST still
    advance to the code step and show a mapped (localized) banner. A network-flavored
    failure stays on the email step (no row was committed).
  * verify:   action `auth:signIn` `{params:{email, code}}` -> `{tokens:{token,refreshToken}}`
    on success, `{tokens:null}` on wrong code (a VALUE, not an exception).
  * after sign-in: `users:ensureUser` (idempotent), `users:getMe` ->
    doc|null with `onboardedAt` (undefined = not onboarded) and `displayName` (may be null).
  * onboarding completion: mutation `users:completeOnboarding` (idempotent).
  * rate limit: 10 failed verifications/hour (library default). Error message text is not
    machine-stable: when it contains a parseable time, the lock state shows a real
    countdown; when it does not, show the generic rate-limit text. NEVER invent a time.
- A previous sibling attempt (worktree ..\t_5dbcd20b, uncommitted) proves the wiring:
  otp_auth_service.dart (service), otp_auth_form.dart (form), onboarding_gate.dart,
  account_state/account_gate/entitlements changes, gateway.action(), firebase removal.
  You are NOT in that worktree and MUST NOT read or copy from it — implement fresh here,
  but the same seams exist in this tree: ConvexGateway (convex_gateway.dart),
  EntitlementsService, AccountState/AccountGate, Store (local_store.dart), RiseScope
  (widgets/entrance.dart). This contract is self-contained; follow it, not memory of that tree.
- Design tokens (lib/theme/app_colors.dart): dark accent #D9A184 = mockup peach; light
  ember #3B4835 = mockup olive; sage/sageSoft exist in both themes; danger exists in both.
  CTA color rule: dark theme -> bg gc.accent, fg gc.onEmber; light theme -> bg gc.ember,
  fg gc.onEmber. (Mockup: peach CTA on dark, olive CTA on light.) Get darkness via
  Theme.of(context).brightness.
- Motion: RiseScope/Rise (lib/widgets/entrance.dart) IS the motion spec — 560ms
  easeOutCubic, translateY 22px->0, scale 0.97->1.0, delays 40ms + 70ms*i (cap 8),
  once/day via RiseScope(id:...), reduce-motion off. Reuse as-is; never invent values.
  The approved email-step timeline (B mark, kicker, wordmark, headline, subline, field,
  CTA, micro+trust) is exactly indices 0..7 of riseAll — order the column children that way.
- App background dot texture: widgets/app_background.dart (AppBackground(pattern:'dots'))
  — use it behind the auth content like OnboardingScreen does.
- Brand lockup exists in current auth_wall_screen.dart _brand(): 44px gradient B — the
  mockup elevates it to 96px with an ember glow. Glow is a STILL (final alpha from frame
  one), never animated.
- The 5 onboarding steps for teaser chips, in order: Name, Units, Body, Goal, Places
  (OnboardingScreen pages: welcome, name, units, body, goal, places). First chip lit
  terracotta (gc.accent), rest dim (textTertiary).
- l10n: lib/l10n/app_*.arb — EVERY app_*.arb file in the directory (16 locales) must carry
  every new key, then run `flutter gen-l10n`. Parity is enforced by test/i18n_test.dart.
  Keep alphabetical-ish placement next to the existing auth* keys.

## SCOPE — build exactly this

### 1. OtpAuthService (new lib/services/otp_auth_service.dart)
- `OtpAuthException(key)` with keys: invalidEmail, codeFormat, codeInvalid (verify returned
  tokens:null), codeExpired, rateLimit (message carries optional remaining seconds — expose
  it, e.g. `OtpAuthException(key, {this.retryAfterSeconds})`), network, unknown.
- `OtpSession{token, refreshToken, email}`; snapshot stream + `current`; persisted session
  in Store note `otp_session` (base64 JSON) restored on init (offline-first cold start).
- `requestEmailCode(email)`: validate -> gateway.action('auth:signIn', {provider:'resend-otp',
  params:{email}}) -> require started:true. Error mapping: message contains network-ish
  markers -> 'network'; 'too many'/'rate limit' -> 'rateLimit'; else 'unknown'.
- `verifyEmailCode(email, code)`: 6-digit format check -> 'codeFormat'; action auth:signIn
  {params:{email,code}} -> tokens null => RETURN false (no throw, key codeInvalid available
  to caller as a return contract); tokens present => persist + emit signed-in, return true.
  Transport errors mapped like request leg.
- `signOut()` (server auth:signOut best-effort + clear local + emit), `deleteAccount()`
  (users:deleteAccount best-effort then signOut), `fetchToken()`, `refreshSession()` via
  action `auth:refreshTokens` {refreshToken} (rotates pair; null/malformed => local signOut).
- Gateway seam: `static ConvexGateway gateway = RustConvexGateway();` (test seam), plus a
  `bool get _live` guard so plain `flutter test` (no CONVEX_URL, default gateway) maps auth
  attempts to 'unknown' without touching the Rust client — same idea as EntitlementsService.
- Add `Future<String> action(...)` to ConvexGateway + RustConvexGateway (delegates to
  ConvexClient.instance.action). Convex flutter client supports action — verify the method
  exists on ConvexClient; if its name differs, adapt the delegate, do not modify the package.

### 2. OnboardingGate (new lib/state/onboarding_gate.dart)
- enum OnboardingResolution { checking, needsOnboarding, onboarded }; ChangeNotifier singleton.
- `resolve()`: if fit.onboarded (local flag) => onboarded immediately (offline-first,
  never downgrade local true). Else query users:getMe once (memoize in-flight);
  doc != null && doc['onboardedAt'] != null => set fit.onboarded = true + persistNow()
  (fit_state has persistNow) + onboarded; else needsOnboarding. Query failure =>
  needsOnboarding (never throws).
- Store `displayName` from the doc when present (getter for handoff naming; fallback:
  email local-part capitalized; empty => omit the name segment).
- `completeOnboarding()`: set local flag + persist + notify onboarded + unawaited
  EntitlementsService.completeCloudOnboarding() (new best-effort mutation users:completeOnboarding).
- `@visibleForTesting static Future<Map<String,dynamic>?> Function()? meQueryOverride;`
  and `debugSetResolution(...)` for tests.

### 3. Account state rewiring
- account_gate.dart abstract: replace signIn/signUp/sendPasswordReset with
  `requestEmailCode(String email)` + `verifyEmailCode(String email, String code)` (returns
  Future<bool>). Keep signOut/deleteAccount. SignedOutGate stubs updated to match.
- account_gate_impl.dart (RealAccountGate): back it with OtpAuthService instead of
  AuthService. Snapshot email from otpAuthService.
- account_state.dart (AccountState/global `account`): subscribe otpAuthService.stateChanges;
  warmUp() = otpAuthService.ensureInitialized() + EntitlementsService.init() +
  EntitlementsService.bindToOtp() (new, see below) + local listener sync. Phase mapping
  unchanged (signedOut / free/basic/advanced/enterprise from Entitlements).
  ADD: `bool get freshSignIn` — set true ONLY on a runtime signedOut->signedIn transition
  (not on warm-up restore); `consumeFreshSignIn()` clears it. The auth handoff uses this.
- entitlements_service.dart: replace the Firebase token-stream binding with
  `bindToOtp()` (idempotent): listen otpAuthService.stateChanges -> signed-in snapshot:
  setAuthWithRefresh(fetchToken: ...) where fetchToken first tries otpAuthService.refreshSession()
  (best-effort) then otpAuthService.fetchToken(); then ensureUser once + entitlements:get +
  subscribe (keep the existing degrade-to-free behavior and test knobs). Signed-out snapshot:
  onSignedOut(). Add `Future<bool> completeCloudOnboarding()` (best-effort users:completeOnboarding,
  returns whether it landed; never throws). DELETE the old onSignedIn(Stream<String?>) API.
- DELETE lib/services/auth_service.dart and lib/widgets/auth_form.dart entirely; drop
  firebase_core + firebase_auth from pubspec.yaml (run flutter pub get; pubspec.lock will
  move). Fix every import that referenced them (auth_wall_screen, account_screen,
  account_gate_impl, account_state, tests). The ONLY files allowed to know Firebase are gone.

### 4. The wall UI (lib/screens/auth_wall_screen.dart + new widgets)
Rebuild AuthWallScreen as a stateful two-step flow on the app background (dots) inside
SafeArea > SingleChildScrollView with RiseScope(id:'authwall') wrapping an 8-child column
in riseAll([...]) using EXACTLY this order and content:

Email step (children in order — this IS the mockup timeline):
 0. B mark: 96px rounded-square (radius ~28), gradient accent->brass (topLeft->bottomRight),
    white 'B' (w800, ~44), centered inside a radial ember glow behind it (RadialGradient
    accent at low alpha -> transparent, ~176px diameter) — still, not animated.
 1. Kicker 'TRAIN WITH INTENT' (t.brandKicker) — existing Kicker widget, brass, 11.5, spacing 3.
 2. Wordmark 'BODY BRIDGE' — uppercase, letterspaced (~6), small (~13, w700, textSecondary).
 3. Headline 'Welcome to Body Bridge' (new key authWelcomeTitle), ~28 w800 text, center.
 4. Subline 'One email. No password. You're in.' (authWelcomeSubline), 13.5 w500 textSecondary.
 5. Email field: label EMAIL (t.emailLabel) small caps style like the old _AuthField;
    filled bgRaised, radius 14, focus ring accent 1.4, prefix envelope icon
    (PhosphorIconsRegular.envelopeSimple), hint t.emailHint, email keyboard, autofillHints
    [AutofillHints.email], autofocus true. Local validation: t.emailInvalid.
 6. CTA 'Continue with email' (authCtaContinueEmail): full-width 56 pill, theme rule from
    CONTEXT. Inline loading (zero layout change): button dims to 0.55 + centered 22px
    spinner; taps ignored (this matches the mockup's no-swap loading).
 7. Micro + trust: line A (w600, accent-toned or textSecondary): t.authTrustMicrocopy
    'We'll send a 6-digit code. No password needed.'; line B 12 textTertiary:
    t.authPrivacyLine1 'Your data stays on your device.' + t.authPrivacyLine2
    'Offline-first, always.' on the next line.
- KEYBOARD-OPEN COMPACT (mockup): when MediaQuery.viewInsetsOf(context).bottom > 0, the
  hero collapses — children 0-4 hide (AnimatedSize/AnimatedSwitcher), field + CTA stay at
  top, micro/trust hidden too. Nothing overflows at 320dp with keyboard up.

Code step (its own RiseScope id 'authcode', 8 children: B mark (smaller 56px, same glow),
kicker 'Check your email' (authCodeKicker), headline 'Enter your code' (authCodeTitle),
sent-to line t.otpSentTo(email) with the email bolded (Text.rich), the 6-digit well,
expiry + resend row, back link):
- Six-digit well widget (new lib/widgets/otp_code_well.dart): six 56x56 boxes, radius 12,
  8px gap, digits 28 w800 tabular figures (FontFeature.tabularFigures), fill bgRaised,
  border: gc.border normally, accent 1.4 on the focused box, danger 1.4 on all boxes when
  error state. Hidden TextField per box OR one invisible controller field with 6 focus
  nodes — implement whichever is cleanest, but: digitsOnly, length 6, AutofillGroup with
  autofillHints [AutofillHints.oneTimeCode], autofocus first box, paste works, backspace
  moves focus back. AUTO-SUBMIT when the 6th digit lands (debounced ~80ms); there is NO
  submit button.
- Expiry countdown: starts at 5:00 on arriving at the code step (and restarts on resend).
  Text: t.authCodeExpires(time) 'Code expires in {time}', M:SS (minutes unpadded,
  seconds padded), tabular numerals, ticking every second. While >60s remaining:
  textSecondary; at <=60s dim to textTertiary (never red). At zero => EXPIRED state:
  digits render dim (textTertiary), verdict line t.authCodeExpiredVerdict 'Code expired'
  (sage), inline hint t.authCodeExpired 'This code expired. Send yourself a new one.',
  resend is live.
- Resend: cooldown 0:30 from request/resend. Cooling: t.authResendIn(time) 'Resend in 0:30'
  (textSecondary, not tappable). Live: Text.rich t.authResendPrompt 'Didn't get it? ' +
  'Resend' (authResendAction) with Resend in accent w700, tappable. Resend re-runs the
  send leg (same banner rules), restarts expiry 5:00 + cooldown 0:30, clears the well,
  refocuses box 1.
- Back: t.otpChangeEmail 'Use a different email' — quiet bottom-left link (arrow-left icon
  or ← glyph), returns to email step, clears code + errors (keeps email).
- States:
  * verifying (in flight, from auto-submit or resend-verify): replace the expiry/resend
    block with a soft spinner + t.authVerifying 'Checking your code…'; well + back
    disabled; no layout jump.
  * invalid: danger borders on the well, inline t.authCodeInvalid(attemptsLeft)
    'That code didn't match. {n} attempts left.' (danger, 12, w600); KEEP the entered
    digits visible and the countdown ticking; decrement attemptsLeft per failed verify
    (start 3, floor 1). Focus moves to box 6->select all or box 1 — your call, document it.
  * expired: per above.
  * rate limit (verify or send throws key rateLimit): replace the form area with the calm
    lock state, centered: sage breath ring (a ~72px circle: sageSoft fill, 2px sage ring,
    small sage dot center; a very slow 3s scale 'breath' ONLY when animations are enabled —
    skip entirely under reduce-motion), headline t.authRateLimitTitle 'Too many attempts',
    body t.authRateLimitBody 'Take a breath — try again in a few minutes. Your account is
    safe.', a disabled pill t.authRateLimitCta(time) 'Try again in {time}' counting down
    MM:SS (minutes padded: 07:41) ONLY when retryAfterSeconds was parseable, and the rule
    line t.authRateLimitRule '10 wrong codes lock requests for an hour.' (12, textTertiary).
    Sage styling throughout — NO red on this state. When retryAfterSeconds is null, show
    the same screen with the pill replaced by t.authRateLimitBanner 'Too many attempts.
    Try again in MM:SS.' rendered as static text WITHOUT numbers? NO — then just omit the
    pill and keep headline/body/rule (honest time: never fabricate a countdown).
  * send-leg failure on the code step (resend): mapped banner under the well (bg
    danger 10% alpha, radius 12, danger text 12 w600) using the localized key map
    (network -> t.authErrorNetwork, unknown -> t.authErrorUnknown, rateLimit -> rate-limit
    state above). Send failures that are NOT network STILL advance/keep the code step
    (the dev backend commits the code row before its mail guard throws) — banner + code
    step is the correct render.

### 5. Handoff interstitial (new lib/screens/auth_handoff.dart)
- Rendered by AppShell when account.freshSignIn is true (see below). Full-screen, bg
  colored gc.bg, centered column: 56px check ring (sageSoft fill, sage ring, sage check
  icon — PhosphorIconsRegular.check), kicker (accent-toned), headline, one body line.
- Two variants, chosen AFTER onboardingGate.resolve() settles:
  * onboarded => kicker t.authWelcomeBackKicker 'Welcome back', title
    t.authWelcomeBackTitle(name) 'Welcome back, {name}', body t.authWelcomeBackBody
    'Picking up where you left off.'
  * needsOnboarding => kicker t.authSetupKicker 'Let's set you up', title
    t.authSetupTitle(name) 'Let's set you up, {name}', body t.authSetupBody
    'Five quick steps and the app is yours.', plus a 2-row chip strip:
    NAME -> UNITS -> BODY / GOAL -> PLACES (t.authChipName/authChipUnits/authChipBody/
    authChipGoal/authChipPlaces), first chip lit (accent border+text), rest dim
    (textTertiary), 11px w700 letterspaced, pill radius, 1px borders.
- While resolve() is in flight show the ring + spinner only (no text yet) — no flash of
  wrong variant. Minimum display 1200ms once a variant shows, then auto-advance:
  onboardingGate.resolution == needsOnboarding => OnboardingScreen (AppShell's normal
  build handles it — you may simply consume the flag and let AppShell rebuild), else the
  app (same). Implementation shape is yours but: EntryGate/AppShell must remain the
  routing owners; the handoff is a screen STATE, not a Navigator push loop.
- RiseScope 'authhandoff' around the content (once/day), reduce-motion respected.

### 6. App shell integration
- app_shell.dart: build already merges fit + onboardingGate (if you add it — this tree does
  NOT have onboarding_gate yet; add the merge). Startup: unawaited(onboardingGate.resolve()).
  While !fit.onboarded && resolution == checking => keep a minimal splash (bg + wordmark +
  spinner — fine to reuse the existing pattern). When resolution == needsOnboarding (or
  !fit.onboarded after resolution) => OnboardingScreen; else app.
- FRESH SIGN-IN HANDOFF: when account.freshSignIn => render AuthHandoff instead of the
  normal content; on completion call account.consumeFreshSignIn(). OnboardingScreen keeps
  calling onboardingGate.completeOnboarding() at _finish (add the call).
- OnboardingScreen: in _finish add unawaited(onboardingGate.completeOnboarding()) after
  fit.completeOnboarding().
- OnboardingScreen keeps calling onboardingGate.completeOnboarding() at _finish (add the call).
- account_screen.dart (signed-out view): swap AuthForm -> the new OtpAuthForm with
  showBrandHeader: false compact usage — reuse the SAME form widget class for both hosts
  (wall uses showBrandHeader: true? — the wall builds its own hero, so the FORM itself
  should expose the two steps without any brand chrome; AccountScreen embeds the same
  form. Do NOT duplicate form logic in two widgets.)
- delete-account flow in account_screen: keep gate.deleteAccount() and the existing
  success/failure snackbars; drop the AuthException/requiresRecentLogin special-case
  (t.deleteAccountReauth key is REMOVED — failure falls back to t.deleteAccountFailed).

### 7. L10n — new keys (EN masters; translate the TONE, keep placeholders EXACT)
authWelcomeTitle 'Welcome to Body Bridge'
authWelcomeSubline 'One email. No password. You're in.'
authCtaContinueEmail 'Continue with email'
authTrustMicrocopy 'We'll send a 6-digit code. No password needed.'
authPrivacyLine1 'Your data stays on your device.'
authPrivacyLine2 'Offline-first, always.'
authCodeKicker 'Check your email'
authCodeTitle 'Enter your code'
otpSentTo 'We sent a 6-digit code to {email}' (@otpSentTo placeholders email String)
authCodeExpires 'Code expires in {time}' (placeholders time String)
authCodeExpiredVerdict 'Code expired'
authCodeExpired 'This code expired. Send yourself a new one.'
authResendPrompt 'Didn't get it? '
authResendAction 'Resend'
authResendIn 'Resend in {time}' (placeholders time String)
authVerifying 'Checking your code…' (U+2026)
authCodeInvalid 'That code didn't match. {n} attempts left.' (placeholders n int)
otpChangeEmail 'Use a different email'
authRateLimitTitle 'Too many attempts'
authRateLimitBody 'Take a breath — try again in a few minutes. Your account is safe.'
authRateLimitCta 'Try again in {time}' (placeholders time String)
authRateLimitRule '10 wrong codes lock requests for an hour.'
authRateLimitBanner 'Too many attempts. Try again in {time}.' (placeholders time String)
authWelcomeBackKicker 'Welcome back'
authWelcomeBackTitle 'Welcome back, {name}' (placeholders name String)
authWelcomeBackBody 'Picking up where you left off.'
authSetupKicker 'Let's set you up'
authSetupTitle 'Let's set you up, {name}' (placeholders name String)
authSetupBody 'Five quick steps and the app is yours.'
authChipName 'Name' / authChipUnits 'Units' / authChipBody 'Body' / authChipGoal 'Goal' /
authChipPlaces 'Places'
REMOVE (password-era, no longer referenced anywhere): authErrorWrongPassword,
authErrorUserNotFound, authErrorEmailAlreadyInUse, authErrorWeakPassword, passwordHint,
passwordLabel, passwordTooShort, forgotPassword, resetSend, resetSentTitle, resetSentBody
(+ its @ metadata), backToSignIn, createAccount, startFree, deleteAccountReauth.
KEEP: authErrorInvalidEmail, authErrorTooManyRequests, authErrorNetwork, authErrorUnknown,
brandKicker, emailHint, emailLabel, emailInvalid, authFailedGeneric, signIn, signOut,
account*/deleteAccount*/paywall*/authWallOffline* strings.
gen-l10n MUST pass; i18n parity test MUST pass with every new key present in ALL 16
app_*.arb files. Respect each locale's existing tone (you are fluent in all 16; keep
apostrophes typographically consistent with each file's existing style).

### 8. Tests (test/... — MUST all pass with `flutter test`)
- REWRITE test/auth_form_test.dart -> OTP wall tests (or a new test/auth_wall_otp_test.dart;
  delete the old one if fully superseded). Cover AT MINIMUM:
  1) email validation: invalid email => t.emailInvalid, no gateway call (fake gateway
     counts); valid => requestEmailCode called, advances to code step.
  2) send-leg guard: fake gateway throws non-network error => banner shown AND code step
     rendered (row committed server-side); network error => stays on email step + banner.
  3) wrong code: verify returns false => inline t.authCodeInvalid with attempts left,
     digits still visible, well danger-bordered, attempts decrement on a second failure.
  4) expired: drive the expiry clock to zero (inject a clock/`now` function into the
     countdown for tests) => 'Code expired' verdict + resend live.
  5) rate limit: fake gateway throws OtpAuthException('rateLimit', retryAfterSeconds: 461)
     => lock state renders 'Too many attempts', 'Try again in 07:41', rule line; sage tone
     (assert via Keys you add); with retryAfterSeconds null => no fabricated countdown.
  6) success routing: fake verify true + meQueryOverride {onboardedAt: null} => handoff
     shows 'Let's set you up' + chips (order NAME UNITS BODY GOAL PLACES, first lit) then
     OnboardingScreen; {onboardedAt: '2026-10-01T00:00:00Z', displayName:'Carlos'} =>
     'Welcome back, Carlos' then app (pump past the 1200ms minimum with tester.pump durations).
  7) 320dp: surface 320x640@3 both steps + keyboard-open (viewInsets bottom 260) => zero
     RenderFlex overflow exceptions.
  8) reduce-motion: MediaQuery(disableAnimations: true) => wall content fully opaque on
     first frame (RiseScope honors it — assert no transform).
  9) resend cooldown: after request, resend shows 'Resend in 0:30', not tappable; after
     pump 31s => 'Didn't get it? Resend' live.
- PORT/ADAPT the surviving suites so the whole repo is green:
  mandatory_auth_test, convex_auth_race_test, delete_account_flow_test,
  paywall_gating_test, real_gate_integration_test, account_state_test,
  entitlements_service_test, i18n_test (parity), onboarding additions, flow_test,
  offline_regression_test, and every other existing test file. Tests touching
  Store.init need SharedPreferences.setMockInitialValues({}) in setUp (house rule).
  NEVER weaken an assertion to get green — port the INTENT to the OTP world; if an old
  password-flow assertion has no OTP equivalent, delete the test file's dead cases and
  say so in the return.

## DO NOT
- No social sign-in, no name field on the wall, no backend edits, no website code,
  no pushes/commits/releases, no new package dependencies beyond what's already in
  pubspec.yaml, no new color tokens (use GymColors as-is), no inventing motion values
  (RiseScope only), no raw exception text in the UI, no fabricated countdown times,
  no editing files outside this worktree, no reading the t_5dbcd20b worktree.

## ACCEPTANCE CRITERIA (all verifiable)
1. flutter analyze: 0 errors, 0 warnings (info-level dead-code in integration_test/ is
   tolerable ONLY if pre-existing style).
2. flutter test: full suite green (baseline 585 + new tests).
3. i18n parity green: every new key in all 16 app_*.arb.
4. Wall shows email step per mockup (hero order, copy verbatim, peach/olive CTA rule,
   keyboard-open compact) and code step per mockup (well geometry 56/12/8, 28px w800
   tabular digits, 5:00 expiry, 0:30 cooldown, back link).
5. All four states render per mockup: invalid (danger + attempts left), expired (dim +
   resend promoted), rate limit (sage calm + real countdown), verifying (spinner +
   status, resend/back hidden).
6. Success routes by onboardedAt through the handoff interstitial variants.
7. Password UI fully gone from lib/ (no auth_form/auth_service/firebase imports).

## REQUIRED CHECKS (parent will re-run; you should too)
- flutter pub get (after pubspec edit)
- flutter gen-l10n
- flutter analyze
- flutter test

## RETURN
Post a concise summary: files created/modified/deleted, the key architectural decisions
you made where this contract left you latitude (focus movement on error, handoff wiring
shape), any contract ambiguities you resolved and how, and the final output lines of
flutter analyze + flutter test.
