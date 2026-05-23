# Forge agent notes

## Stack and entrypoints

- Single-package app, not a monorepo: React 19 + Vite frontend in `src/`, Express API in `server/`, Convex backend in `convex/`.
- Frontend entrypoint is `src/index.tsx`; it mounts `App` behind Convex/Auth bootstrap checks and shows a startup error screen instead of crashing when Convex is missing.
- Express entrypoint is `server/server.js`; Vite proxies `/api` to `http://localhost:3001`.
- README says the backend runs on port `3000`, but the actual server default is `3001` and the Vite proxy is already wired to `3001`.

## Commands that matter

- Install with `npm ci` if you want CI parity; the repo is locked by `package-lock.json` and CI uses `npm ci`.
- `npm run dev` runs `config:generate` first, then starts Convex + Express + Vite together.
- `npm run dev:app` starts only Express + Vite.
- `npm run dev:convex` runs `scripts/runConvexDev.mjs`.
- `npm run build` is `vite build` plus `scripts/postbuild-csp.mjs` and `scripts/postbuild-memory.js`.
- `npm test` only runs Playwright plus `scripts/posttest-memory.js`; there is no unit-test runner wired into `npm test`.

## Dev server quirks

- `npm run dev` mutates `package.json`: `scripts/generateAppConfig.cjs` rewrites the package name from `src/config/app.config.ts`.
- `scripts/runConvexDev.mjs` treats a real `CONVEX_DEPLOYMENT` as cloud mode and keeps the process alive without starting a local Convex server.
- If `CONVEX_DEPLOYMENT` is unset, `dev:convex` starts `convex dev --local --typecheck disable` and auto-generates local JWT/JWKS values if missing.
- `convex/auth.config.ts` hard-fails when `CONVEX_SITE_URL` is missing.
- `.env.local.example` is incomplete versus runtime needs: it documents `JWT_SECRET`, `VITE_CONVEX_URL`, and `CONVEX_DEPLOYMENT`, but local Convex auth also depends on `CONVEX_SITE_URL`.

## Verification reality

- Do not assume `npm run lint` or `npm run type-check` exist. CI references them in `.github/workflows/dependency-security.yml`, but `package.json` does not define either script.
- `npx tsc -p tsconfig.json --noEmit` is not clean today; TypeScript checks `scripts/**/*.js` because `allowJs` is on, and several script files currently have syntax/type errors.
- `knip.json` is the only dead-code config in repo. Use `npx knip` directly if you need it.

## Playwright quirks

- Playwright is configured in `playwright.config.ts` with `baseURL` `http://127.0.0.1:7770`, headed mode, screenshots on, video on, HTML reporter.
- There is no `webServer` config. Start the app yourself before running tests.
- Run a focused spec with `npx playwright test tests/<file>.spec.ts`.
- Full test discovery is currently broken by `tests/imageResolver.spec.ts` importing a missing `utils/imageResolver` module; expect `npx playwright test --list` and full-suite enumeration to fail until that file is fixed.

## Native build flow

- Android CI order is `npm ci` -> `npm run build` -> `npx cap sync android` -> `cd android && ./gradlew ...`.
- Release signing expects `android/keystore.properties` and a keystore injected from GitHub secrets in `.github/workflows/android-release.yml`.

## Naming and package ID mismatch

- Branding/config is split and inconsistent. `src/config/app.config.ts` says `Body Bridge Fitness` / `com.bodybridge.fitness`, but `capacitor.config.json` and `android/app/build.gradle` still use `Forge Fitness` / `com.forge.fitness` for app ID/applicationId.
- `config:generate` only updates `package.json`; it does not reconcile Capacitor or native Android/iOS identifiers. If you touch app naming or package IDs, update all of those files together.
