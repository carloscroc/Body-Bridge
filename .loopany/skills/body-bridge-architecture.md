# Body-Bridge Project Architecture

```yaml
slug: body-bridge-architecture
label: FACT
confidence: 0.9
times_observed: 4
first_seen: 2026-06-04
last_seen: 2026-06-04
evidence_source: project_documentation
status: active
related_issues: []
```

## Key Facts

- **Frontend**: React 19 + Vite, entrypoint `src/index.tsx`
- **API Server**: Express on port 3001 (NOT 3000), Vite proxies `/api` to it
- **Backend**: Convex, runs on port 3211 locally when `CONVEX_DEPLOYMENT` is unset
- **Dev command**: `npm run dev` runs config:generate → Convex + Express + Vite concurrently
- **Build**: `vite build` → `postbuild-csp.mjs` → `postbuild-memory.js`
- **Test**: `npm run test` runs Playwright (no unit test runner)
- **Required env vars**: `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `JWT_SECRET`
- **Naming mismatch**: `app.config.ts` says "Body Bridge Fitness" but `capacitor.config.json` still says "Forge Fitness"
- **Lint/typecheck**: `npm run lint` and `npm run type-check` are NOT defined despite CI referencing them
- **Playwright baseURL**: http://127.0.0.1:7770, no webServer config — must start app manually before tests
