# Motionletics — Session Handoff (2026-09-30)

**Purpose:** Handoff for a NEW chat session to **create the plan** for the next phase. This file is context only — do NOT treat it as the plan. The new session reads this, asks Carlos anything missing, then builds its own plan/ticket graph.

**Next phase to plan (Carlos's words):**
1. **Website + Stripe** — sets up BASIC/ADVANCED purchases that flow into the entitlements system already built
2. **Feature builds gated by the capabilities now in place** — cloud backup, sync, community, AI planning, etc.

---

## 1. What Motionletics is

- Flutter app (fork of InlitX/GymMane, GPLv3), gym log: body-map muscle selection, set logging, progress, awards, routines, Wear OS companion.
- **Local-first is a product invariant**: no account required, app fully usable offline as guest. Accounts/cloud only ADD capability.
- Owner: Carlos (`carloscroc` on GitHub), business: Strength & Serenity / AABIDE brand.
- Repos:
  - **App:** `C:\Users\thebe\projects\Motionletics` → github.com/carloscroc/Motionletics (`origin`; upstream = InlitX/GymMane, check divergence before touching shared files)
  - **Backend:** `C:\Users\thebe\projects\motionletics-backend` (Convex functions; NOT yet pushed to GitHub)

## 2. Verified current state (all PASS, do not re-litigate)

**Login + users milestone: COMPLETE and verifier-approved (2026-09-30).**

- **Identity:** Firebase Auth (project `motionletics`, project number 1072465704849), Email/Password enabled, google-services.json committed in app repo.
- **Entitlements:** Convex customJwt auth (Firebase ID tokens → Convex identity). Backend @ `af31ea5`: 4 tiers, 16 capabilities, all in single `convex/lib.ts`.
- **App:** main @ `10b2e4e` (pushed). Capability-based gating in Dart (mirror of lib.ts, proven identical), delete-account UI, FREE limits, plan-config paywall.
- **applicationId:** `com.aabide.motionletics` (PERMANENT, Carlos-confirmed; changed from upstream's com.gymmane.app).
- **E2E proven on device (Samsung SM-G981U1):** create account → Convex free-tier doc → sign out/in (no duplicate) → delete account → Convex table empty → guest mode, local workouts preserved, 0 FATAL exceptions.
- **Tests:** 545+ passing; analyze clean except 2 known pre-existing onReorder deprecation infos.
- **CI:** `.github/workflows/build-apk.yml` green on push to main; APK builds work without secrets (guest-mode fallback) and with `CONVEX_URL` secret when present.

## 3. The architecture that MUST be respected (Carlos's fixed decisions)

### Tiers (individual consumer SKUs)
- **FREE = Track:** local workouts, exercise library, ~7-day visible-history window (**a UI window, NOT data deletion** — local data is never deleted), max 3 routines, no custom exercises, no community, cloud used for account/profile only.
- **BASIC = Save:** + cloud backup, full history, unlimited routines, device sync, progress charts, community.
- **ADVANCED = Optimize:** + advanced analytics, personalized programming/AI, premium programs, premium videos, trainer features.
- **ENTERPRISE** = business tier (trainers/gyms/orgs), backend-only, **Contact Sales** — never an in-app subscription SKU.

### Capabilities model (16, monotonic supersets per tier)
Single source of truth: `motionletics-backend/convex/lib.ts` → `PLAN_CAPABILITIES`. Dart mirror in app (`can(capability)` checks only — **NO scattered `tier ==` checks anywhere**). Capability names include: workout_tracking, recent_history, full_history, cloud_backup, cloud_sync, unlimited_routines, progress_charts, advanced_analytics, personalized_programs, premium_programs, premium_videos, community_browse, community_post, community_media_upload, trainer_features, organization_management. (List is extensible.)

### Payments — CRITICAL constraint
- **Provider-independent.** NO Google Play Billing as required architecture, no Play subscription IDs in entitlement logic.
- Flow: **Website → Stripe (or open-source alt) → backend subscription → entitlements → app.** Website/Stripe is the primary path and is the NEXT BUILD.
- Subscription record schema: `{ provider: 'stripe'|'apple'|'google'|'enterprise'|'none', status, plan, renews_at? }`. Currently `provider: 'none'`, status inactive.
- Prices: placeholder config (monthly/yearly concepts), no final prices yet.
- **Lapse policy:** downgrade to FREE, stop new cloud sync, local workouts keep working, cloud data NOT immediately deleted — `cloud_retention_until` field holds grace timestamp (retention period TBD, ~90 days suggested).
- **Cancellation happens on the WEBSITE, not in the app.** Account deletion IS in the app (done).

### Account lifecycle (already built)
- Install → in-app sign-up → auto FREE provisioning (`ensureUser`), no website step required to start.
- In-app delete account: deletes Convex user doc + Firebase user, preserves local data, handles Firebase requires-recent-login.
- Tier changes: `entitlements:setActiveTier` admin-gated (via `ADMIN_TOKEN_IDENTIFIERS` env) — **the website/Stripe build will need a server-side path to set tiers** (payment webhook → trusted server identity), replacing/augmenting the admin gate.

## 4. Environment facts (Windows 11 host)

- **Convex:** team `thebest-croc`, project `motionletics-backend`.
  - **Cloud dev deployment:** `https://giant-pika-563.convex.cloud` (functions deployed, auth enabled). Used for CI secret `CONVEX_URL`.
  - **Local dev:** `npx convex dev` in backend repo → `http://127.0.0.1:3210` (device access via `adb reverse tcp:3210 tcp:3210`; Android emulator alias `10.0.2.2:3210`). Local dev preserves free-tier quota — keep as default for dev/testing.
- **Firebase console:** console.firebase.google.com/project/motionletics (Email/Password on).
- **Flutter** 3.47.5 at `C:\flutter`. `flutter test`/`analyze` work. **No Android Studio; local APK builds DO work** via recipe `C:\Users\thebe\AppData\Local\hermes\profiles\motionletics\cache\scratch\build_apk8.cmd` (NDK 28.2, AGP 8.11.1, Kotlin 2.2.20, Rust GNU toolchain with `stable` junction). CI also builds APKs on push.
- **Signing:** keystore alias `motionletics`, backed up at `C:\Users\thebe\Documents\Motionletics-Keystore-Backup\` + OneDrive zip; same key in GitHub Secrets. Releases = manual dispatch with tag. Production releases require Carlos's explicit approval.
- **Devices:** Samsung SM-G981U1 (`RFCN201Q6BZ`) via adb; iPhone `00008101-000C31662188001E` available for mobile-qa.

## 5. Known debt / gotchas (do not re-discover)

- **convex_flutter 3.0.1 has 3 upstream defects** (flutter_rust_bridge version skew, corrupt cargokit source inside the pub artifact, missing `default-features=false` forcing vendored OpenSSL builds). Current workarounds: frb pinned to 2.11.1 in the app, pub-cache patches, watchdog+retry wrapper for a flutter_tools↔device handshake flake. **If pub cache is ever rebuilt, patches must be re-applied** (cargokit `android_environment.dart` forward-slash paths, etc.).
- Local OpenSSL vendored build requires the cygwin perl with shim modules (Locale::Maketext, Pod::Usage, ExtUtils::MakeMaker stubs) + NDK make — all already in place on this host.
- Hermes fleet ops: gateway must be running for kanban workers (`hermes -p default gateway run`, session-scoped only). Verifier (`code-verifier`) is the only PASS authority; mobile-qa for on-device evidence. Fleet SOP skills: `kanban-fleet-orchestration`, `kanban-fleet-operations`. Board slug: `motionletics`.
- Upstream (InlitX/GymMane) may advance; check `git fetch upstream` divergence before feature work on shared files. Ask Carlos before any upstream PR.
- GPLv3: respect upstream licensing in everything shipped.

## 6. Kanban / work log pointers

- Board `motionletics` holds the full verified history. Key completed cards: T-A `t_9a82da17` (Convex capabilities), T-B `t_c4e04ef9` (Flutter side), T-C `t_5d4df3db` (device E2E), V-T `t_4ecd4895` (wave verification), plus the earlier auth graph (master card `t_839752fb` holds the MASTER acceptance criteria; V1/V2 verify cards).
- Read card bodies/comments for contract details before re-planning similar work.

## 7. What the NEW session should do

1. Read this file fully.
2. Ask Carlos any clarifying questions about the two workstreams (especially: website hosting preference — he uses Cloudflare Pages for massage-site; Stripe account status; whether website auth should mirror Firebase or be its own flow; which feature to build FIRST among backup/sync/community/AI).
3. Build the plan + ticket graph for:
   - **Website + Stripe:** marketing/pricing site → Stripe checkout → webhook/backend → subscription records in Convex → capabilities granted → app reflects tier. Cancellation on website. Remember: provider-independent, prices as config, cloud_retention_until on lapse.
   - **Feature builds** gated by capabilities, likely in priority order once Carlos picks.
4. Follow the same rigor: Kanban tickets on the `motionletics` board, specialists or OpenCode for implementation, `code-verifier` gates everything, on-device QA via `mobile-qa`, merges by the orchestrator.

**Do NOT re-plan or modify the completed login/users/tier work — it's verified. Build on top of it.**
