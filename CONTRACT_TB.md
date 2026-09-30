# CONTRACT T-B (t_c4e04ef9) — Flutter capability entitlements + delete account + FREE limits

You are editing the Flutter app in THIS directory (the worktree, branch `wt/tier-migration-flutter`).
Work only here. Do not touch other worktrees.

## TASK
Migrate the app from the old 3-tier flag model (free/normal/premium, `EntitlementFeature` boolean
flags) to the 4-tier CAPABILITY model that the backend (motionletics-backend @ af31ea5) now serves.
Additionally: build the delete-account UI flow, client-side FREE limits, a plan-config paywall
structure, and change the Android applicationId. All copy via ARB strings.

## WORKSPACE
C:\Users\thebe\projects\Motionletics\.worktrees\t_c4e04ef9  (branch wt/tier-migration-flutter)
Pubspec package name stays `gymmane` (imports `package:gymmane/...` keep working). Do NOT rename it.

## CONTEXT — server contract (mirror exactly)
From motionletics-backend `convex/lib.ts`:
- TIERS: free | basic | advanced | enterprise
- CAPABILITIES (16): workout_tracking, recent_history, full_history, cloud_backup, cloud_sync,
  unlimited_routines, progress_charts, advanced_analytics, personalized_programs, premium_programs,
  premium_videos, trainer_features, community_browse, community_post, community_media_upload,
  organization_management
- PLAN_CAPABILITIES (monotonic supersets):
  - free: [workout_tracking, recent_history]
  - basic: free + [full_history, cloud_backup, cloud_sync, unlimited_routines, progress_charts,
    community_browse, community_post, community_media_upload]
  - advanced: basic + [advanced_analytics, personalized_programs, premium_programs, premium_videos,
    trainer_features]
  - enterprise: advanced + [organization_management]
- `entitlements:get` returns `{tier, capabilities: string[], cloud_retention_until: number|null}`
  (note the snake_case `cloud_retention_until`).
- `users:deleteAccount` mutation, no args, idempotent, returns "ok".

Current code to migrate (all read by the supervisor; verified):
- `lib/services/entitlements_service.dart` — enum Tier {free,normal,premium},
  enum EntitlementFeature {canTrain,canTrackStats,canUsePremiumWorkouts,canUseAiCoach},
  Entitlements.fromJson reads `{tier, entitlements:{canTrain,...}}` (OLD shape), canAccess().
- `lib/state/account_state.dart` — enum AccountPhase {signedOut, signedInFree, signedInNormal,
  signedInPremium}.
- `lib/state/account_gate.dart` — enum AccountTier {signedOut, free, normal, premium};
  `canAccess(String feature)`; GuestAccountGate.
- `lib/state/account_gate_impl.dart` — RealAccountGate: phase->tier switch + hardcoded
  canAccess matrix (`premium => true; normal => feature == kFeatureAiPlan`).
- `lib/constants/billing.dart` — kPremiumPriceLabel '\$4.99', kFeatureAiPlan.
- `lib/widgets/premium_gate.dart` — FeatureGate + context.canAccess (string-based, KEEP the
  string-based canAccess signature).
- `lib/widgets/tier_badge.dart` — switch over AccountTier (premium/normal/free/signedOut).
- `lib/screens/paywall_screen.dart` — single-price stub, uses kPremiumPriceLabel +
  _t.paywallPrice + billingComingSoon snackbar.
- `lib/screens/account_screen.dart` — signed-in card: email, TierBadge, Sign out GhostButton.
- FREE-limit integration points: `lib/screens/routines_screen.dart` (PrimaryButton "New routine"
  calls `fit.openRoutine(fit.createRoutine())`; also `fit.duplicateRoutine`, `fit.applyTemplate`
  in the same file create routines indirectly), `lib/screens/exercises_screen.dart`
  (RoundAction + showCreateExerciseSheet for custom exercise creation), and history surfaces
  driven by `fit.sessions` (progress_screen.dart, home_screen.dart).
- Existing tests that MUST be updated with the code: test/entitlements_service_test.dart,
  test/account_state_test.dart + test/fakes/account_state_fake.dart (mirror enum), 
  test/paywall_gating_test.dart (FakeGate + paywall widget tests), test/real_gate_integration_test.dart.
- l10n: 16 ARB files lib/l10n/app_*.arb; template app_en.arb; generated getters live in
  lib/l10n/app_localizations*.dart. `flutter gen-l10n` regenerates. test/i18n_test.dart enforces
  exact key parity across ALL 16 files (missing or extra key in any locale fails).
- `askConfirm(context, title:, body:, confirmLabel:, danger:)` in lib/widgets/dialogs.dart is the
  app's standard confirm dialog — use it for destructive confirms.

## SCOPE
1. **lib/services/entitlements_service.dart** — new capability model:
   - `const List<String> kTiers = ['free','basic','advanced','enterprise'];`
   - `const List<String> kCapabilities = <16 names in the exact order above>;`
   - `const Map<String, List<String>> kPlanCapabilities = {...}` with EXACTLY the supersets above.
     Both constants carry `// KEEP IN SYNC with motionletics-backend convex/lib.ts` comments.
   - Replace enum Tier with `enum Tier { free, basic, advanced, enterprise }` +
     `static Tier fromName(String?)` tolerant (unknown/null -> free).
   - DELETE enum EntitlementFeature. `Entitlements` = { tier, List<String> capabilities } with
     fromJson parsing the NEW server shape (`capabilities` array; tolerate missing/old fields;
     derive capabilities via kPlanCapabilities when the doc carries only a tier).
   - `bool can(String capability) => capabilities.contains(capability)` on Entitlements and
     `bool can(String capability)` on EntitlementsService (delegates to current). Keep the
     offline-first lifecycle (init/onSignedIn/onSignedOut/refresh/subscribe) untouched.
   - Free capability for guests/dormant = kPlanCapabilities['free'].
2. **Capability constants in lib/constants/billing.dart** (or a new lib/constants/capabilities.dart
   if you prefer — pick ONE home and note it in the receipt): app-level feature->capability keys:
   - kCapAiPlan = 'personalized_programs' (AI plan feature keeps working for advanced; basic/free
     now hit the paywall — this is the intended behavior change)
   - kCapUnlimitedRoutines = 'unlimited_routines'
   - kCapFullHistory = 'full_history'
   - kCapCustomExercises = 'trainer_features'
   - const int kFreeRoutineCap = 3;
   - const int kFreeHistoryDays = 7;
   Remove kFeatureAiPlan and kPremiumPriceLabel; migrate every use.
3. **lib/state/account_gate.dart** — `enum AccountTier { signedOut, free, basic, advanced,
   enterprise }`. Keep `canAccess(String feature)` string-based (feature == capability name).
   GuestAccountGate.canAccess stays false.
4. **lib/state/account_state.dart** — AccountPhase {signedOut, signedInFree, signedInBasic,
   signedInAdvanced, signedInEnterprise}; map from Tier.
5. **lib/state/account_gate_impl.dart** — RealAccountGate: new phase switch; canAccess becomes
   capability lookup (treat signedOut as no capabilities; signed-in tiers use kPlanCapabilities
   mirror OR the live EntitlementsService capabilities — either is fine, be consistent and never
   throw offline).
6. **lib/widgets/tier_badge.dart** — style all 5 enum values. basic/advanced/enterprise get
   distinct visuals (gradient/accents at your discretion, existing design language: gc.accent,
   gc.brass, gc.info, gc.sage). enterprise must be visually distinct from advanced.
7. **Delete account UI (REQUIRED)**:
   - lib/services/auth_service.dart: add `Future<void> deleteAccount()`: calls Convex
     `users:deleteAccount` mutation FIRST (via ConvexClient.instance, wrapped in try/catch that
     logs but continues — local cleanup must proceed even if Convex is unreachable), then
     `FirebaseAuth.instance.currentUser?.delete()`. Map FirebaseException code
     'requires-recent-login' to a rethrowable typed error (e.g. `AuthException('requiresRecentLogin')`)
     so the UI can show the re-auth message. After deletion attempt, run the normal sign-out path
     (FirebaseAuth.signOut + EntitlementsService.onSignedOut) in a finally block. Never leave the
     method throwing for network reasons.
   - Expose it through AccountGate (abstract method `Future<void> deleteAccount();`;
     GuestAccountGate returns the guest StateError like signIn/signUp; RealAccountGate delegates
     to AuthService).
   - lib/screens/account_screen.dart signed-in card: below Sign out, a destructive-styled
     "Delete account" button (gc.danger text, GhostButton-style is fine). Flow: askConfirm
     (danger) with EXACTLY this body text (ARB key deleteAccountConfirmBody):
     "This deletes your account and cloud profile. Local workouts stay on this phone."
     -> on confirm call gate.deleteAccount() with a busy state -> success: snackbar
     deleteAccountDone + the signed-out state renders automatically.
     -> AuthException('requiresRecentLogin'): snackbar with ARB deleteAccountReauth =
     "Sign in again to delete your account." (user stays signed in on the account screen).
     -> other errors: snackbar deleteAccountFailed generic.
   - Local workout data is NEVER wiped by this flow (it lives in SharedPreferences under fit/
     Store.instance; we simply do not touch it).
8. **FREE client-side limits** (visible-history entitlement, NOT deletion):
   - Routines: gate new-routine creation. In routines_screen.dart the New Routine button, when
     `!can(kCapUnlimitedRoutines)` AND `fit.routines.length >= kFreeRoutineCap`, shows the paywall
     instead of creating. Same guard for duplicateRoutine and applyTemplate paths in that screen
     (snack the upgrade message or route to paywall — pick paywall route for consistency with
     FeatureGate). Paywall reason text (ARB key paywallRoutinesUpsell):
     "Unlimited routines is a BASIC feature".
   - History/analytics: add to lib/state (routines_state.dart or a small helper in timeline/stats
     state) something like `Iterable<LoggedSession> visibleSessions` that filters `sessions` to
     the last kFreeHistoryDays when the user lacks kCapFullHistory; otherwise all. Wire it into
     progress_screen.dart's history surfaces that iterate `fit.sessions` directly (lines ~70, 187,
     306 use fit.sessions / fit.timelineAsc) and home_screen if trivial. Data stays local — this
     is display filtering ONLY. Do not touch workout_state.dart internal logic (records, volume
     computations for live session), keep the filter to screen-level history lists.
   - Custom exercises: hide the creation entry points for users lacking kCapCustomExercises:
     exercises_screen.dart RoundAction (the "+" button) hidden (replace with SizedBox.shrink()
     or remove conditionally), and in train_screen.dart/exercise_detail_screen.dart the
     "create-it-instead" affordances hidden behind the same check. Use FeatureGate-style pattern
     or a direct `context.can(kCapCustomExercises)` check.
   - ALL gating via capability strings, never tier literals.
   - Note: signed-out users see NOTHING hidden that would confuse — guests keep full local
     behavior (guest == not signed in). Capability gating applies ONLY when the user is signed in
     AND their tier lacks the capability. Implement this as: guest (AccountTier.signedOut) =>
     canAccess returns true for the free-limit trio (routines/history/custom) so local-only usage
     is unaffected; signed-in free tier sees the limits. AI plan gating stays: signedOut => false
     (keeps existing paywall test green).
9. **Paywall plan-config structure** (replace single $4.99 stub):
   - lib/constants/billing.dart (or your chosen capabilities home): `class PlanOption { final String
     id; final String tier; final String period; final String priceLabel; }` + a const list
     kPaywallPlans covering basic and advanced, each with monthly and yearly placeholder entries
     (4 total), priceLabels like '\$2.99', '\$24.99', '\$5.99', '\$49.99' (clearly placeholders).
     Provider-agnostic: NO Play Billing / google_pay / stripe references anywhere.
   - lib/screens/paywall_screen.dart: render a card per plan tier (BASIC, ADVANCED) with its two
     period options, all CTAs showing the coming-soon snackbar (billingComingSoon exists). Title
     copy: keep paywallTitle. Upgrade copy can stay paywallCtaUpgrade per option.
10. **ARB strings** (app_en.arb template + ALL 15 other locales, real translations where you can,
    English fallback acceptable for non-Latin locales but key parity MUST hold — test/i18n_test.dart):
    - tierBasic, tierAdvanced, tierEnterprise (add; tierFree stays; REMOVE tierNormal/tierPremium
      keys and every generated getter use)
    - deleteAccount, deleteAccountConfirmTitle ("Delete account?"),
      deleteAccountConfirmBody (exact text above), deleteAccountDelete ("Delete"),
      deleteAccountDone ("Account deleted."), deleteAccountReauth (exact text above),
      deleteAccountFailed ("Couldn't delete the account. Try again.")
    - paywallRoutinesUpsell ("Unlimited routines is a BASIC feature"),
      paywallHistoryUpsell (free-history upsell for the paywall context, e.g.
      "Full history is a BASIC feature"), paywallPlanBasic ("BASIC"), paywallPlanAdvanced
      ("ADVANCED"), paywallMonthly ("month"), paywallYearly ("year"), paywallComingSoonBadge
      ("Coming soon")
    - freeHistoryNotice ("Showing the last 7 days. Upgrade for your full history.") for the
      history banner, and routinesFreeCount ("{count} of {max} free routines") with 2 placeholders.
    - You may drop the now-unused paywallPrice key if nothing references it after item 9 —
      but then remove it from ALL locales (parity) and stop using kPremiumPriceLabel.
    Run `flutter gen-l10n` at the end and commit the regenerated app_localizations*.dart files.
11. **Android applicationId change** (Carlos scope addition 2026-09-29):
    - android/app/build.gradle.kts: namespace AND applicationId -> `com.aabide.motionletics`.
    - Copy google-services.json FROM C:\Users\thebe\projects\Motionletics\android\app\google-services.json
      (untracked file in the primary checkout, two client entries incl. com.aabide.motionletics)
      INTO this worktree at android/app/google-services.json and `git add -f` it (test/fixtures/
      is ignored; this file is NOT — verify with `git check-ignore` before forcing; if not ignored
      a normal add works).
    - MainActivity.kt and the other 7 .kt files stay at package com.gymmane.app? NO — they must
      MOVE to android/app/src/main/kotlin/com/aabide/motionletics/ with `package com.aabide.motionletics`.
      Update AndroidManifest android:name=".MainActivity" stays valid (namespace-relative).
    - lib/services/home_widget_bridge.dart: _pkg -> 'com.aabide.motionletics', appGroup ->
      'group.com.aabide.motionletics'.
    - lib/screens/settings_screen.dart _addWidget: qualifiedAndroidName ->
      'com.aabide.motionletics.$provider'.
    - grep com.gymmane.app across android/ and lib/ afterwards: ONLY acceptable remaining hits are
      historical docs (docs/, README, CONTRACT receipts). No code references.
    - Do NOT touch pubspec.yaml name.
12. Update the affected existing tests (entitlements_service_test.dart, account_state fake+test,
    paywall_gating_test.dart, real_gate_integration_test.dart) to the new model — assertions get
    PORTED to capabilities, never deleted/weakened.

## DO NOT
- No real billing, Stripe, Play Billing, website, or cloud sync implementation.
- No edits outside the listed scope (no catalog changes, no theme system changes).
- No deletion of user data anywhere in code; the history filter is view-level only.
- No new dependencies in pubspec.yaml.
- No tier literals ('normal'/'premium') anywhere in lib/ (the word premium may only appear inside
  the capability names premium_videos/premium_programs and marketing strings like paywallBenefit2
  / accountGuestBlurb copy).
- Keep machine-readable strings out of ARB — user-facing copy only.

## ACCEPTANCE CRITERIA
1. flutter analyze: ONLY the 2 known pre-existing infos (routine_edit_screen.dart:262,
   session_screen.dart:1569 deprecated onReorder). Zero new issues.
2. flutter test: ALL green, including the 4 updated suites.
3. NEW tests required:
   - Capability mirror test: kPlanCapabilities matches a fixture copied from convex/lib.ts
     (test/data/capabilities_fixture.dart, comment "copied from motionletics-backend convex/lib.ts
     @ af31ea5 — keep in sync"), tier-by-tier: set equality, superset monotonicity, unknown
     capability absent from every plan, 16 total, free does NOT contain community_post,
     organization_management only in enterprise.
   - Free 3-routine cap: can() false for unlimited_routines on free tier; the routine-creation
     guard function routes to paywall on the 4th routine (extract the guard into a testable pure
     function or test via widget test on RoutinesScreen with a fake gate).
   - 7-day window filter: visibleSessions drops sessions older than 7 days without full_history;
     keeps them with it; signed-out (guest) sees everything.
   - Delete-account flow (mocked): a fake AccountGate whose deleteAccount() completes ->
     confirm dialog shows the exact body string, delete path invoked, busy state, signed-out end
     state; a fake that throws AuthException('requiresRecentLogin') -> reauth snackbar, stays
     signed in.
4. grep clean: `grep -rnE "'(normal|premium)'" lib/` returns nothing (tier literals); grep
   "com.gymmane.app" in android/ + lib/ only historical docs.
5. Delete flow: destructive confirm; local workouts preserved (no Store/prefs wipe calls in the
   delete path); ends in signed-out guest state.
6. Committed to wt/tier-migration-flutter as a single logical commit (or a few coherent ones).

## REQUIRED CHECKS (run all from the worktree root)
- flutter gen-l10n   (must exit 0)
- flutter analyze    (expect exactly the 2 known infos, nothing else)
- flutter test       (all suites green)
- grep -rnE "'(normal|premium)'" lib --include="*.dart"   (expect no hits)
- grep -rn "com.gymmane" android/app/src lib --include="*.kt" --include="*.dart" --include="*.xml" --include="*.kts"   (expect no hits)
- git status         (clean tree after commit)

## IMPLEMENTATION RULES
- Match existing style: single quotes, trailing commas, AppTheme.f typography helpers, gc.* colors,
  ARB keys camelCase, 2-space indent, formatter page width 110 (`dart format` the files you touch).
- Offline-first invariant: every new code path must degrade gracefully when Firebase/Convex are
  unavailable (guest mode, never throw during build).
- Keep the string-based canAccess(feature) signature on AccountGate/BuildContext ext.
- Never swallow errors silently: debugPrint + degrade, like the existing services.

## RETURN
A summary receipt listing: files changed (paths + what), the constants home you chose (item 2),
ARB keys added/removed, verification command outputs (paste the tails), and any deviations from
this contract with one-line justifications.
