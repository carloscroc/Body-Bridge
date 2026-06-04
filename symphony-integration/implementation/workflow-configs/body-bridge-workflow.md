---
tracker:
  kind: plane
  endpoint: http://10.0.0.112:3300/api/v1/
  workspace_slug: body-bridge
  project_id: 13cecebf-f9ff-41bd-b5bb-b88774ef6440
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Done
    - Cancelled
agent:
  model: codex
  timeout: 600
workspace:
  root: .
  branch_prefix: symphony/
---

# Body-Bridge Symphony Workflow

You are an AI development agent working on the Body-Bridge fitness application. This document is your operating context. Read it carefully before starting any work.

## Project Overview

Body-Bridge is a fitness application built as a single-package app (not a monorepo):

- **Frontend**: React 19 + Vite in `src/`, using Tailwind CSS, Framer Motion, and Lucide React icons
- **API Server**: Express 5 on port 3001 in `server/` (Vite proxies `/api` to `http://localhost:3001`)
- **Backend**: Convex in `convex/` with Convex Auth for authentication
- **Mobile**: Capacitor 6 for Android/iOS builds
- **Package name**: `body-bridge-fitness` (v0.0.2), ESM module type

### Key Entrypoints

- Frontend: `src/index.tsx` — mounts `App` behind Convex/Auth bootstrap, shows startup error screen if Convex is missing
- Express: `server/server.js` — default port 3001 (not 3000 despite README)
- Convex: `convex/` — functions and auth config

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install with CI parity (repo is lockfile-locked) |
| `npm run dev` | Runs `config:generate` then starts Convex + Express + Vite together |
| `npm run dev:app` | Starts only Express + Vite (no Convex) |
| `npm run dev:convex` | Starts Convex dev via `scripts/runConvexDev.mjs` |
| `npm run build` | `vite build` + CSP postbuild + memory postbuild |
| `npm test` | Runs Playwright + memory posttest (no unit test runner) |
| `npx playwright test tests/<file>.spec.ts` | Run a focused Playwright spec |

## Dev Server Quirks

- **`npm run dev` mutates `package.json`**: `scripts/generateAppConfig.cjs` rewrites the package name from `src/config/app.config.ts`. Expect a dirty package.json after running dev.
- **Express port is 3001**, not 3000. The Vite proxy is already wired to 3001.
- **Convex needs `CONVEX_SITE_URL`** or `convex/auth.config.ts` hard-fails. `.env.local.example` does not document this.
- If `CONVEX_DEPLOYMENT` is unset, `dev:convex` runs `convex dev --local --typecheck disable` and auto-generates local JWT/JWKS.
- If `CONVEX_DEPLOYMENT` is set (cloud mode), `dev:convex` keeps the process alive without starting a local Convex server.

## Testing

- **Only Playwright** is wired into `npm test`. There is no unit test runner configured.
- Playwright `baseURL` is `http://127.0.0.1:7770`.
- Playwright runs in **headed mode** with screenshots and video on, HTML reporter.
- **No `webServer` config** in `playwright.config.ts` — you must start the app yourself before running tests.
- `tests/imageResolver.spec.ts` is broken (imports missing `utils/imageResolver`). Full-suite `--list` and enumeration will fail until fixed. Always run focused specs.
- `npm run lint` and `npm run type-check` **do not exist** as npm scripts despite CI referencing them.
- `npx tsc -p tsconfig.json --noEmit` is not clean — `allowJs` is on and several scripts have type errors. Do not rely on tsc passing.
- `knip.json` exists for dead-code detection. Run `npx knip` directly if needed.

## Native Builds

- Android CI order: `npm ci` → `npm run build` → `npx cap sync android` → `cd android && ./gradlew ...`
- Release signing requires `android/keystore.properties` and a keystore from GitHub secrets.

## Naming Inconsistency

- `src/config/app.config.ts` says `Body Bridge Fitness` / `com.bodybridge.fitness`
- `capacitor.config.json` and `android/app/build.gradle` still use `Forge Fitness` / `com.forge.fitness`
- `config:generate` only updates `package.json` — it does not reconcile Capacitor or native identifiers. If you touch naming or package IDs, update all files together.

## Code Style

- TypeScript throughout. React 19 with hooks.
- Do not add comments unless explicitly asked.
- Follow existing patterns in neighboring files for imports, component structure, and naming.
- Check `package.json` for available libraries before importing new ones.

## Git Workflow

- **Branch naming**: `symphony/{issue-identifier}` (e.g. `symphony/BB-42`)
- **Commit messages**: concise, match repo style
- **PR naming**: `[Symphony] {issue-identifier}: {title}` (e.g. `[Symphony] BB-42: Fix workout session timer`)
- **Never force-push**.
- **Never commit secrets**, API keys, tokens, or credentials.
- Only commit when the ticket explicitly requests it or when marking work as Done.

## Plane.so Interaction

When working on a ticket, you are expected to:

1. **Move ticket to "In Progress"** when you start work
2. **Add comments** with progress updates — describe what you found, what you changed, and any blockers
3. **Upload evidence** (screenshots, test results) as attachments when available
4. **Request human review** by moving to "Review" state when code changes are ready
5. **Move to "Done"** only after verification passes (see below)
6. **Report blockers** clearly — if you cannot proceed, add a comment explaining why and what is needed

## Definition of Done

Before moving a ticket to "Done":

1. All code changes compile and the dev server starts (`npm run dev`)
2. Relevant Playwright specs pass: `npx playwright test tests/<relevant-file>.spec.ts`
3. No secrets or credentials are committed
4. Branch follows `symphony/{issue-identifier}` naming
5. A comment on the ticket summarizes what was done and how to verify it

If a ticket cannot be verified (e.g. no existing spec covers the change), add a comment noting what manual verification was performed and move to "Review" for human approval instead of "Done".

## Escalation

- **Build failures** you cannot resolve after 2 attempts: add a comment with full error output and move to "Todo" with a note
- **Missing dependencies or env vars**: add a comment listing what is needed and move to "Todo"
- **Test failures unrelated to your change**: document the failure, note it as pre-existing, and proceed if your change does not introduce new failures
- **Ambiguous requirements**: add a comment asking for clarification and pause work (leave in "In Progress" with a question comment)
