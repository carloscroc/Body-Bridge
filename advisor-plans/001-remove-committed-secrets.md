# Plan 001: Remove committed secrets and rotate credentials

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1043760..HEAD -- .env.prod.jwt .env.symphony .env.local.dev .env.app tmp_pkcs8.pem .gitignore`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a1043760`, 2026-06-18

## Why this matters

Five files containing real secrets are committed to the repository's git history:

1. `.env.prod.jwt` — a full RSA-2048 private key (for production JWT signing)
2. `tmp_pkcs8.pem` — another RSA-2048 private key
3. `.env.symphony` — a Plane.so API key (`plane_api_...`)
4. `.env.local.dev` — contains a Gemini API key, a weak dev JWT secret, and `ADMIN_SCRIPT_SECRET`
5. `.env.app` — non-secret config but follows the pattern

Anyone with repo access (including any public fork or CI runner) has these values. The RSA keys allow forging production auth tokens. The Plane API key grants full project access. Merely deleting the files is not enough — the values persist in git history and must be scrubbed, and all exposed credentials must be rotated.

## Current state

- `.env.prod.jwt` — committed, contains `-----BEGIN PRIVATE KEY-----` (RSA-2048). File is at repo root.
- `tmp_pkcs8.pem` — committed, contains `-----BEGIN PRIVATE KEY-----` (RSA-2048). File is at repo root.
- `.env.symphony` — committed, contains `PLANE_API_KEY=plane_api_996fecef7f91430dac6964b212cf4274` and internal network URLs. File is at repo root.
- `.env.local.dev` — committed, contains `GEMINI_API_KEY=AIzaSyDummyKeyForTesting123456789`, `JWT_SECRET=dev_jwt_secret_change_in_production_abc123xyz789`, `ADMIN_SCRIPT_SECRET=testsecret123`. File is at repo root.
- `.env.app` — committed, contains app name/ID config (non-secret, but follows the `.env.*` pattern). File is at repo root.
- `.gitignore` — currently ignores `.env.local` and `.env.production` but does NOT ignore `.env.prod.jwt`, `.env.symphony`, `.env.local.dev`, `.env.app`, or `*.pem`.

Relevant `.gitignore` excerpt (current):
```
*.local
# Env files with secrets (don't commit these)
.env.local
.env.local.bak.orig

# Production env files (keep them local for security)
.env.production
.env.production.local
```

Repo convention: env files follow `.env[.<suffix>]` naming. The `.gitignore` pattern `*.local` catches `.env.local` but no other `.env.*` variants.

## Commands you will need

| Purpose      | Command                                          | Expected on success           |
|--------------|--------------------------------------------------|-------------------------------|
| Install      | `npm ci`                                         | exit 0                        |
| Build        | `npm run build`                                  | exit 0                        |
| Verify no secrets | `git ls-files --cached -- ".env.prod.jwt" ".env.symphony" ".env.local.dev" "tmp_pkcs8.pem"` | empty output (files not tracked) |
| Verify .gitignore | `git check-ignore .env.prod.jwt .env.symphony .env.local.dev tmp_pkcs8.pem`  | each filename printed (ignored) |

## Scope

**In scope** (the only files you should modify):
- `.env.prod.jwt` — delete from git tracking
- `tmp_pkcs8.pem` — delete from git tracking
- `.env.symphony` — delete from git tracking
- `.env.local.dev` — delete from git tracking
- `.env.app` — delete from git tracking (belongs in `.gitignore` template, not committed)
- `.gitignore` — add patterns for all secret file types

**Out of scope** (do NOT touch):
- `.env.local.example` — this is the template file; it should stay committed (contains placeholder values only)
- Any changes to Convex, Express, or React source code
- Git history rewriting via `git filter-branch` or `BFG` — flag this as a follow-up in the plan but do NOT execute it (requires coordination and force-push)
- Production deployment or key rotation on external services (that is a manual step for the repo owner)

## Git workflow

- Branch: `advisor/001-remove-committed-secrets`
- Commit per step; message style: `fix(security): <description>` — matching repo convention from recent commits like `fix: add placeholder text...` and `security: triage deepsec findings`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add comprehensive .gitignore patterns

Add these lines to `.gitignore` after the existing `# Production env files` block:

```gitignore
# All environment files except the example template
.env.prod.jwt
.env.symphony
.env.local.dev
.env.app

# PEM / key files — NEVER commit
*.pem
*.key
*.cert
*.p12
*.pfx
```

**Verify**: `git check-ignore .env.prod.jwt .env.symphony .env.local.dev tmp_pkcs8.pem` → each filename printed on a separate line

### Step 2: Remove committed files from git tracking (keep on disk)

```bash
git rm --cached .env.prod.jwt .env.symphony .env.local.dev .env.app tmp_pkcs8.pem
```

This removes them from the index while preserving the local files. The owner needs the values locally to regenerate configurations.

Commit: `fix(security): remove committed secrets from git tracking`

**Verify**: `git ls-files --cached -- ".env.prod.jwt" ".env.symphony" ".env.local.dev" ".env.app" "tmp_pkcs8.pem"` → empty output

### Step 3: Create a .env.symphony.example template

Create `.env.symphony.example` with placeholder values so future developers know the required shape:

```
# Plane.so Integration
PLANE_API_KEY=your_plane_api_key_here
PLANE_BASE_URL=http://your-plane-instance:3300/api/v1/
PLANE_WORKSPACE_SLUG=your-workspace-slug
PLANE_PROJECT_ID=your-project-uuid
PLANE_PROJECT_IDENTIFIER=YOURPROJECT

PLANE_ACTIVE_STATE_GROUPS=unstarted,started
PLANE_TERMINAL_STATE_GROUPS=completed,cancelled

HEALTH_ENDPOINT=http://localhost:3001/api/health
APP_DEV_PORT=7770
API_PORT=3001
```

Commit: `docs: add .env.symphony.example template`

### Step 4: Update .env.local.example with all required variables

The current `.env.local.example` is incomplete. Add the missing variables documented in AGENTS.md:

```
# AI Features (optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Unsplash Image Search (optional)
UNSPLASH_ACCESS_KEY=your_unsplash_key_here

# Express server auth
JWT_SECRET=generate_a_secure_random_string_here

# Import scripts
IMPORT_TRAINER_EMAIL=
IMPORT_TRAINER_PASSWORD=
```

Commit: `docs: update .env.local.example with all required variables`

### Step 5: Verify build still works

```bash
npm ci
npm run build
```

**Verify**: build exits 0, no errors.

## Test plan

This is a security/config change, not a code change. Testing:

1. Verify the files are no longer tracked: `git ls-files --cached -- ".env.prod.jwt" ".env.symphony" ".env.local.dev" ".env.app" "tmp_pkcs8.pem"` → empty
2. Verify gitignore works: `git check-ignore .env.prod.jwt .env.symphony .env.local.dev tmp_pkcs8.pem` → all listed
3. Verify build: `npm run build` → exit 0
4. Verify existing `.env.local` (not committed) still works: `npm run dev` should start if env is configured

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git ls-files --cached -- ".env.prod.jwt" ".env.symphony" ".env.local.dev" ".env.app" "tmp_pkcs8.pem"` returns empty
- [ ] `git check-ignore .env.prod.jwt .env.symphony .env.local.dev tmp_pkcs8.pem` prints all four filenames
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `.env.*` files are not tracked by git (already removed).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- `npm ci` fails (dependency issue unrelated to this plan).

## Maintenance notes

- **CRITICAL FOLLOW-UP (manual, out of scope)**: The secrets remain in git history even after this plan. The repo owner MUST:
  1. **Rotate the production JWT signing key** — generate a new RSA key pair, update the production deployment, and invalidate the old key.
  2. **Rotate the Plane.so API key** — revoke `plane_api_996fecef7f91430dac6964b212cf4274` in the Plane admin panel and generate a new one.
  3. **Rotate the Gemini API key** if it is a real key (the one in `.env.local.dev` appears to be a dummy string `AIzaSyDummyKeyForTesting123456789`, but verify).
  4. **Change the JWT_SECRET** — the dev value `dev_jwt_secret_change_in_production_abc123xyz789` is no longer secret.
  5. **Consider git history rewriting** using `git filter-repo` or BFG Repo Cleaner to remove the blobs from history entirely. This requires a force-push and coordination with all contributors.
- What a reviewer should scrutinize: verify no NEW secret files were added between when this plan was written and when it's executed.
