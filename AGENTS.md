# Forge agent notes

## Stack and entrypoints

- Single-package app: React 19 + Vite frontend (`src/`), Express API (`server/`), Convex backend (`convex/`).
- Frontend entrypoint: `src/index.tsx` — mounts `App` behind Convex/Auth bootstrap, shows error screen if Convex is missing.
- Express entrypoint: `server/server.js` — port defaults to `3001`, NOT `3000`. Vite proxies `/api` to `http://localhost:3001`.
- Convex backend runs locally on port `3211` when `CONVEX_DEPLOYMENT` is unset.

## Commands that matter

- **Install**: `npm ci` (CI uses `npm ci`; repo is locked)
- **Dev full stack**: `npm run dev` — runs `config:generate` first, then Convex + Express + Vite concurrently
- **Dev app only** (no Convex): `npm run dev:app`
- **Dev Convex only**: `npm run dev:convex`
- **Build**: `vite build` → `postbuild-csp.mjs` → `postbuild-memory.js`
- **Test**: `npm run test` runs Playwright + `posttest-memory.js` (no unit-test runner)
- **Run one Playwright spec**: `npx playwright test tests/<file>.spec.ts`
- **Dead code scan**: `npx knip`

## Dev server quirks

- `npm run dev` runs `scripts/generateAppConfig.cjs` which mutates `package.json` — it overwrites `name` from `src/config/app.config.ts` on every startup.
- `scripts/runConvexDev.mjs` behavior:
  - If `CONVEX_DEPLOYMENT` is set (cloud mode): keeps process alive but does NOT start a local Convex server.
  - If unset: starts `convex dev --local --typecheck disable` and auto-generates local JWT/JWKS keys if missing.
- `convex/auth.config.ts` hard-fails if `CONVEX_SITE_URL` is missing.
- Local auth uses `CONVEX_SITE_URL` (non-VITE prefix), but `.env.local.example` only documents `VITE_CONVEX_SITE_URL` — this gap exists.

## Environment variables

Required for local startup:
- `VITE_CONVEX_URL` — Convex project URL
- `VITE_CONVEX_SITE_URL` — Convex site URL (also set `CONVEX_SITE_URL` for local dev server)
- `JWT_SECRET` — required for Express server startup
- `CONVEX_DEPLOYMENT` — set to `dev:your-project` for cloud mode, unset for local Convex

Optional: `GEMINI_API_KEY`, `UNSPLASH_ACCESS_KEY`, `IMPORT_TRAINER_EMAIL`, `IMPORT_TRAINER_PASSWORD`

## TypeScript and linting

- `npm run lint` and `npm run type-check` are NOT defined in `package.json` (CI references them in `.github/workflows/dependency-security.yml` but they don't exist).
- `npx tsc -p tsconfig.json --noEmit` is not clean: `allowJs: true` causes TypeScript to check `scripts/**/*.js`, and some have syntax/type errors.
- `knip.json` is the dead-code config. Run `npx knip` directly.

## Playwright

- Config: `playwright.config.ts` with `baseURL: http://127.0.0.1:7770`, headed mode, screenshots+video on.
- No `webServer` config — start the app manually before running tests.
- **Test discovery is broken**: `tests/imageResolver.spec.ts` imports `../utils/imageResolver` which resolves to `utils/imageResolver.ts` at repo root, but the actual file is `src/utils/imageResolver.ts`. This causes `npx playwright test --list` and full-suite enumeration to fail.

## Native build flow

- Android: `npm ci` → `npm run build` → `npx cap sync android` → `cd android && ./gradlew ...`
- Release signing expects `android/keystore.properties` and keystore from GitHub secrets (`.github/workflows/android-release.yml`).

## Naming inconsistency

- `src/config/app.config.ts` defines `Body Bridge Fitness` / `com.bodybridge.fitness`
- `capacitor.config.json` still uses `Forge Fitness` / `com.forge.fitness`
- `config:generate` only updates `package.json` — it does NOT sync Capacitor or native Android/iOS identifiers.
- If you touch app naming or package IDs, update all three: `app.config.ts`, `capacitor.config.json`, and `android/app/build.gradle`.

## Plane.so Integration

- **API**: `http://10.0.0.112:3300/api/v1/` with key from `.env.symphony`
- **Workspace**: `body-bridge`, **Project**: `13cecebf-f9ff-41bd-b5bb-b88774ef6440`, **Identifier**: `BODYBRIDGE`
- **States**: Backlog → Todo → In Progress → Review → Done / Cancelled
  - Backlog: `e7ae97a1-17c1-49a4-83e7-97719b6501e8`
  - Todo: `46fd340f-b4cc-4c4e-8911-39b4c3f69af0`
  - In Progress: `b52edaa1-b2cd-43d4-b1a6-8ffb462c4d87`
  - Review: `612f847c-e8f5-41c8-b325-4aceedae7445`
  - Done: `45735805-18ab-486a-afb6-e48914af00f0`
  - Cancelled: `03d63333-b4d5-4472-8fcb-18b12113e187`
- **Priority**: Must be string (`"none"|"low"|"medium"|"high"|"urgent"`) — API rejects integers
- **Create ticket**: `node scripts/create-plane-ticket.cjs --name "Title" --type feature --priority medium`
- **Start work**: `node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-X`
- **Collect evidence**: `node scripts/start-symphony-work.cjs --ticket BODYBRIDGE-X --evidence-only`
- Pagination bug: Plane returns truthy `next_cursor` even on empty pages — always check `results.length`
