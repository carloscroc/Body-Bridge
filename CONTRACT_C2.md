# Coding Contract — C2 (t_eb27f730): Flutter AuthService + EntitlementsService + Convex client

TASK
Add Firebase Auth + Convex entitlements services to this Flutter app (package
`gymmane`), fully failure-tolerant and offline-first. The app MUST boot to a
fully usable signed-out/guest state with no network and no Firebase config;
all cloud calls are lazy and catch-and-degrade. Do not touch UI screens.

WORKSPACE
C:\Users\thebe\projects\Motionletics\.worktrees\t_eb27f730
Branch: wt/auth-flutter-services (already checked out). Work only here.

CONTEXT (verified facts — rely on these, re-read files if unsure)
- Deps ALREADY added to pubspec.yaml by the supervisor: convex_flutter ^3.0.1,
  firebase_core ^4.15.0, firebase_auth ^6.7.0. `flutter pub get` already run.
  Do not add other cloud packages.
- convex_flutter 3.0.1 API (from its sources, exact):
  - `await ConvexClient.initialize(ConvexConfig(deploymentUrl: <url>, clientId: <string?>, operationTimeout: Duration, healthCheckQuery: <string?>));`
  - singleton afterwards via `ConvexClient.instance`.
  - `Future<String> query(String name, Map<String, dynamic> args)` and
    `Future<String> mutation({required String name, required Map<String, dynamic> args})`
    — RETURN VALUES ARE JSON-ENCODED STRINGS; `jsonDecode` them yourself.
  - `Future<AuthHandleWrapper> setAuthWithRefresh({required Future<String?> Function() fetchToken, required void Function(bool isAuthenticated) onAuthChange})`
    (auto-refreshes ~60s before expiry; dispose the handle on sign-out),
    `Future<void> setAuth({required String? token})`, `Future<void> clearAuth()`,
    `Stream<bool> get authState`, `bool get isAuthenticated`.
- Convex backend contract is FIXED (sibling repo motionletics-backend, card C1):
  - `users:ensureUser` mutation, args {} — upserts caller, returns user doc
    {tier: 'free'|'normal'|'premium', entitlements: {canTrain, canTrackStats,
    canUsePremiumWorkouts, canUseAiCoach} (bools), email?, ...}. Idempotent.
  - `users:getMe` query, args {} — user doc or null.
  - `entitlements:get` query, args {} — {tier, entitlements{...}} (never null:
    free defaults when provisioned-but-missing). This is THE read to subscribe to.
  - `entitlements:setActiveTier` mutation args {userId: id, tier} — admin-only;
    the Flutter client NEVER calls it (no admin UI in C2 scope).
  - Tier enum exactly: 'free' | 'normal' | 'premium'.
- Repo architecture/conventions (MUST match):
  - Services are plain classes in lib/services/ (see alarm_store.dart,
    local_store.dart for style). State files live in lib/state/.
  - lib/state/fit_state.dart is a CLOSED `part`-chain: single global
    `final fit = FitState()` (fit_state.dart:939) with many mixins.
    DO NOT modify fit_state.dart (see DO NOT). Instead create a NEW standalone
    `ChangeNotifier` for account state. Screens can watch it with
    `AnimatedBuilder(animation: account, ...)` exactly like they watch `fit`.
  - main.dart currently has zero network calls; keep it that way except the
    single optional unguarded hook described below.
  - Lints: flutter_lints with prefer_single_quotes, page_width 110. No prints —
    use debugPrint. No empty catches (log then degrade).
  - Dart SDK ^3.11.5, Flutter 3.47.5 stable.
- Firebase init requirements:
  - firebase_options.dart must compile with ZERO external files present and
    must NOT contain real-looking API keys: use a placeholder-based options
    object built from String.fromEnvironment with empty-string defaults.
    Guarded init pattern:
    ```dart
    Future<bool> initFirebase() async {
      try {
        final opts = _buildOptions(); // from dart-define strings
        if (opts.projectId.isEmpty) return false; // no config -> guest mode
        await Firebase.initializeApp(options: opts);
        return true;
      } catch (e) {
        debugPrint('Firebase init unavailable: $e'); // never rethrow
        return false;
      }
    }
    ```
  - With empty default dart-defines, `flutter analyze`, `flutter test`, and a
    no-config `flutter build apk` MUST all stay green (CI builds without secrets).
- Convex URL: read via `const String.fromEnvironment('CONVEX_URL')`.
  Empty/absent => entitlements service stays dormant (guest/free), no connect.

SCOPE (create/edit ONLY these)
1. pubspec.yaml — done by supervisor; only touch if a genuine compile issue
   requires it (explain in RETURN if so).
2. android/app/src/main/AndroidManifest.xml — add exactly ONE line:
   `<uses-permission android:name="android.permission.INTERNET"/>`
   placed directly ABOVE the existing line
   `<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" tools:node="remove"/>`.
   Do not remove or alter ANY existing permission (the ACCESS_NETWORK_STATE
   removal is deliberate).
3. lib/services/auth_service.dart — NEW. Class AuthService (+ minimal AppAuthState
   value type). Lazy Firebase init per pattern above. API:
   - `Future<bool> ensureInitialized()` — memoized; safe to call repeatedly;
     never throws (returns false on failure).
   - `Stream<AuthStateValue> get stateChanges` — broadcast stream emitting
     signed-out and signed-in(user) states; NEVER errors.
   - `Future<void> signUp({required String email, required String password})`
     and `Future<void> signIn({required String email, required String password})`
     wrapping FirebaseAuth createUserWithEmailAndPassword/signInWithEmailAndPassword;
     rethrow as a typed `AuthException` with a MESSAGE KEY
     ('invalidEmail','wrongPassword','userNotFound','emailAlreadyInUse',
     'weakPassword','tooManyRequests','networkRequested','unknown') — NOT English
     prose — so UI/localization maps keys to strings.
   - `Future<void> signOut()` — signs out of Firebase; also clears Convex auth.
   - `Future<String?> idToken()` — current Firebase ID token or null.
   - Expose an ID-token stream for the Convex client: broadcast stream that
     emits a fresh `getIdToken()` result on every auth change (null signed-out).
   IMPORTANT: constructing FirebaseAuth.instance getters is safe, but no call
   in this class may run unless `ensureInitialized` returned true.
4. lib/services/entitlements_service.dart — NEW.
   - `const String.fromEnvironment('CONVEX_URL')` for the deployment URL.
   - Singleton-style `EntitlementsService.instance` (match package conventions).
   - `Future<void> init()` — memoized, never throws: if CONVEX_URL empty =>
     dormant free mode, return. Else `ConvexClient.initialize(ConvexConfig(
     deploymentUrl: url, clientId: 'gymmane-flutter', operationTimeout:
     Duration(seconds: 30)))` inside try/catch (log + stay free on failure).
     No connection attempt at init time beyond what initialize does locally.
   - `Future<void> onSignedIn(Stream<String?> tokens)` — wires
     `setAuthWithRefresh(fetchToken: ...)` to the AuthService token stream;
     on sign-out calls `clearAuth()`. All inside try/catch + debugPrint.
   - After auth becomes ready: call Convex `users:ensureUser` ONCE per sign-in
     (first sign-in auto-provisions free), then `entitlements:get`. Subscribe
     with `client.subscribe(name: 'entitlements:get', args: {}, onUpdate: ...,
     onError: ...)` if the handle API cooperates; otherwise poll
     `entitlements:get` after ensureUser and on manual refresh. Either way:
     jsonDecode the returned String.
   - Exposes `Stream<Entitlements> get entitlements` and
     `bool canAccess(EntitlementFeature feature)`; holds a cached
     `Entitlements` value, defaulting to FREE when dormant/offline.
   - `Entitlements` model: tier (enum Tier { free, normal, premium } with
     `Tier.fromName` tolerant fallback to free) + the four bool flags
     canTrain, canTrackStats, canUsePremiumWorkouts, canUseAiCoach — camelCase
     matching the server contract exactly; map JSON keys 1:1, no renames.
   - Every Convex call: try/catch/TimeoutException => log + degrade to free,
     NEVER surface exceptions to callers of init()/refresh().
5. lib/state/account_state.dart — NEW.
   - `class AccountState extends ChangeNotifier` + at the bottom of the file
     `final account = AccountState();` (global, mirrors fit_state.dart:939 style).
   - `enum AccountPhase { signedOut, signedInFree, signedInNormal, signedInPremium }`
     + `AccountPhase get phase`; derive signedIn tier phases from the cached
     Entitlements tier; signedOut when no user OR signed-in-but-Convex-dormant
     => signedInFree (degrade to free, never block).
   - Glues AuthService.stateChanges + EntitlementsService: lazy listeners set
     up by an explicit `Future<void> warmUp()` that only C3 calls from
     sign-in/gating UI (NOT from main.dart). Every internal callback wrapped in
     try/catch -> on any failure set signedOut/signedInFree + notifyListeners.
6. lib/main.dart — allowed MINIMAL edit: one optional line after
   `WidgetsFlutterBinding.ensureInitialized();`, matching existing style:
   `unawaited(AccountBootstrap.warmUpInBackground());` (or equivalent) where the
   bootstrap runs initFirebase + service wiring in a fire-and-forget try/catch
   that can NEVER delay or break startup. Import + add `dart:async` for
   unawaited if needed. If you can satisfy the invariant with zero main.dart
   edits, prefer that.
7. lib/l10n/*.arb — add service-layer auth error strings to app_en.arb AND all
   other shipped ARB files (test/i18n_test.dart enforces exact key parity
   across all app_*.arb — missing keys in ANY language break flutter test).
   Suggested keys (do not reuse existing names; run gen-l10n):
   authErrorInvalidEmail, authErrorWrongPassword, authErrorUserNotFound,
   authErrorEmailAlreadyInUse, authErrorWeakPassword, authErrorTooManyRequests,
   authErrorNetwork, authErrorUnknown. Provide real translations for all 16
   locales (app_en, app_es, app_de, app_fr, app_it, app_pt, app_ar, app_ru,
   app_tr, app_uk, app_ja, app_ko, app_zh, app_zh_Hant, app_nl, app_pl).
   Then RUN `flutter gen-l10n` and commit the regenerated
   lib/l10n/app_localizations*.dart (they are tracked).
   Keep the messages short and neutral (e.g. en: "Email address looks wrong.",
   "Wrong email or password.", "No account found for that email.",
   "That email already has an account.", "Password is too weak.",
   "Too many attempts. Try again later.", "You are offline — sign in needs
   internet.", "Sign in failed. Try again.").
8. docs/ — README section: google-services.json placement
   (android/app/google-services.json, git-ignored, NOT required for builds),
   dart-define table (--dart-define=CONVEX_URL=... plus FB_* defines your
   options builder reads), guest-mode behavior note. If the repo README has a
   natural section, extend it; otherwise docs/auth-and-entitlements.md.
9. OPENCODE_CONTRACT.md — REWRITE this file (it currently holds the previous
   card's delegation receipt) with this C2 receipt after work completes.

DO NOT
- Do NOT modify lib/state/fit_state.dart or any `part of 'fit_state.dart'`
  files (they are a closed part chain: AwardsState...WorkoutState +
  fit_core.dart). Creating NEW files in lib/state/ is expected; editing the
  part chain is FORBIDDEN. (Deliberate deviation from "match conventions":
  screens watch `account` via AnimatedBuilder exactly as they watch `fit`.)
- Do NOT touch UI screens/routes (C3), tests (C4), CI workflows (C5),
  android/app/build.gradle.kts or settings.gradle.kts (no google-services
  Gradle plugin — dart-define init path is used instead), iOS/web dirs,
  pubspec.lock (already resolved), or any file outside SCOPE.
- Do NOT add google-services.json (even placeholder) or any real API key,
  token, or secret. Placeholder strings ('<FB_PROJECT_ID>' style or empty
  dart-define defaults) only.
- Do NOT call Firebase.initializeApp, ConvexClient.initialize, any Convex
  query/mutation, or any network call from: main()'s awaited path, app startup
  widget build, or test runtime. Everything lazy/memoized/guarded.
- Do NOT remove any existing Android permission.
- Do NOT invent package names or APIs — the ones in CONTEXT are verified.

ACCEPTANCE CRITERIA (master, from card C2)
1. `flutter analyze` — zero NEW issues (baseline: exactly 2 pre-existing
   info-level onReorder deprecations in routine_edit_screen.dart:262 and
   session_screen.dart:1569; those must remain the ONLY issues).
2. `flutter test` — all green; suite currently ~490 passed / 3 skipped.
3. No auth or Convex call on the startup critical path; app boots guest/offline.
4. INTERNET permission added; ACCESS_NETWORK_STATE tools:node="remove" intact.
5. Tier enum mirrors backend exactly: free/normal/premium; entitlement flag
   names camelCase identical to server (canTrain, canTrackStats,
   canUsePremiumWorkouts, canUseAiCoach).
6. No secrets committed; no real Firebase config.
7. ARB key parity holds across ALL languages (i18n_test passes).

REQUIRED CHECKS (supervisor runs these after your session; run them yourself
first and fix failures before finishing)
- flutter analyze
- flutter test
- flutter gen-l10n (before analyze/test, after ARB edits)
- grep evidence: `git grep -n "ACCESS_NETWORK_STATE" android/app/src/main/AndroidManifest.xml`
  still shows tools:node="remove"; `git grep -n "INTERNET"` shows the new line.
- `git grep -nE "AIza|api_key|apiKey" lib android/app/src/main` must show no
  real-looking key literals (String.fromEnvironment reads are fine).

IMPLEMENTATION RULES
- Prefer simple, boring Dart. No codegen beyond gen-l10n. No new deps.
- Names/structures above are the contract; keep them so C3 (UI) and C4 (tests)
  can code against this card without reading your implementation.
- All new files need the standard file-top doc comment style used in lib/
  (see services/alarm_store.dart for tone) — one short comment, no banners.
- Error handling: catch (e, st) -> debugPrint once (truncated), then degrade.
  Never rethrow from init/lifecycle paths; DO rethrow typed AuthException from
  signUp/signIn (UI needs the failure reason key).

RETURN
Finish with: list of created/modified files, the exact analyze/test output
tails, any deviation from this contract with a one-line reason, and known
risks. Do not commit; leave the working tree dirty for supervisor review.
