# Auth and entitlements (C2)

The app boots and stays fully usable with **no Firebase config, no Convex URL
and no network**: everything below is lazy, memoized and catch-and-degrade.
Cloud calls never run on the startup critical path; signed-out/guest is the
default state.

## Firebase setup

`lib/services/auth_service.dart` builds its `FirebaseOptions` from
`--dart-define` strings with **empty-string defaults**. No
`google-services.json` and no Gradle plugin are needed — the app compiles and
builds green with zero secrets present (CI builds this way).

If you want real sign-in, place your downloaded Firebase config at:

```
android/app/google-services.json   (never commit this file)
```

and pass the values as dart-defines. Any value missing (specifically an empty
`FB_PROJECT_ID`) keeps the app in guest mode: `Firebase.initializeApp` is never
called and `AuthService.ensureInitialized()` returns false.

### dart-define table

| dart-define | Purpose | Empty default means |
|---|---|---|
| `CONVEX_URL` | Convex deployment URL, e.g. `https://your-deployment.convex.cloud` | Entitlements service stays dormant; everything is free |
| `FB_PROJECT_ID` | Firebase project id | Guest mode; Firebase is never initialized |
| `FB_API_KEY` | Firebase Web API key | No Firebase calls can succeed |
| `FB_APP_ID` | Firebase Android app id | No Firebase calls can succeed |
| `FB_SENDER_ID` | Firebase messaging sender id | No Firebase calls can succeed |
| `FB_AUTH_DOMAIN` | Firebase auth domain (`PROJECT.firebaseapp.com`) | Optional |
| `FB_STORAGE_BUCKET` | Firebase storage bucket | Optional |

Example release build:

```bash
flutter build apk --release \
  --dart-define=CONVEX_URL=https://your-deployment.convex.cloud \
  --dart-define=FB_PROJECT_ID=your-project \
  --dart-define=FB_API_KEY=AIza... \
  --dart-define=FB_APP_ID=1:1234567890:android:abcdef \
  --dart-define=FB_SENDER_ID=1234567890 \
  --dart-define=FB_AUTH_DOMAIN=your-project.firebaseapp.com \
  --dart-define=FB_STORAGE_BUCKET=your-project.appspot.com
```

## Guest-mode behavior

- No `Firebase.initializeApp`, no `ConvexClient.initialize`, no network call
  happens at startup, in `main()`, or in any widget build.
- `AuthService` reports signed-out and never throws; sign-in attempts without
  config fail with the `unknown` message key.
- `EntitlementsService` holds a cached `Entitlements` value defaulting to the
  free tier (`canTrain`/`canTrackStats` true, premium flags false); every
  Convex timeout or error degrades back to free instead of surfacing.
- Sign-in flow (wired lazily by `AccountState.warmUp()`): Firebase sign-in →
  ID-token stream → Convex `setAuthWithRefresh` → `users:ensureUser` once per
  sign-in → `entitlements:get` (immediate read + live subscription).
- Tier values mirror the backend exactly: `free` | `normal` | `premium`.
- Auth errors surface as stable message keys (`authErrorWrongPassword`,
  `authErrorNetwork`, …) mapped through `AppLocalizations` in all 16 locales.
