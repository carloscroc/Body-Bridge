# Convex Development Workflow

## Overview

This project uses two separate Convex environments:

| Environment | Purpose | Config File | Convex Location |
|------------|---------|--------------|-----------------|
| **Local Development** | `npm run dev` | `.env.local` | Local machine (`http://127.0.0.1:3210`) |
| **Cloud Production** | APK builds, deployed app | `.env.production` | Convex Cloud (`groovy-pig-414`) |

---

## Local Development

**Setup (one-time):**
```bash
# 1. Login to Convex (required for first time)
npx convex login

# 2. Select/create local deployment
npx convex deployment select local
# If local doesn't exist, create it:
npx convex deployment create local --select
```

**Run locally:**
```bash
npm run dev
```

This uses:
- `.env.local` (NO `CONVEX_DEPLOYMENT` set → uses local)
- Local Convex database at `http://127.0.0.1:3210`
- Changes you make to Convex functions/schema go to your local database only

---

## Cloud Production (APK Builds)

**Cloud deployment:** `groovy-pig-414`

**Build APK:**
```bash
# 1. Build the app (uses .env.production)
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK
cd android && ./gradlew assembleDebug
```

The APK uses:
- `.env.production` (`CONVEX_DEPLOYMENT=groovy-pig-414`)
- Cloud Convex database at `https://groovy-pig-414.convex.cloud`
- This is what production users use

---

## Deploy Changes from Local to Cloud

When you make changes locally and want them in production:

### Option 1: Push changes directly to cloud

```bash
# Deploy to the cloud deployment
npx convex deploy --deployment groovy-pig-414
```

### Option 2: Test in cloud dev first (recommended)

```bash
# 1. Deploy to cloud dev deployment (if you have one)
npx convex deploy --deployment groovy-pig-414

# 2. Test in cloud dev environment
# 3. Once verified, it's live in production (same deployment)
```

### Important Notes

- **Schema changes** (convex/schema.ts) require deployment - local schema ≠ cloud schema
- **Functions** (convex/**/*.ts) are automatically deployed when you run `convex deploy`
- **Data migrations** need to be run explicitly (create a migration function and run it)
- Local and cloud databases are **completely separate** - no automatic sync

---

## Quick Reference

```bash
# Local dev
npm run dev                          # Uses .env.local → local Convex
npx convex deployment select local   # Switch to local deployment
npx convex dev --typecheck disable   # Start local Convex server manually

# Cloud operations
npx convex deploy --deployment groovy-pig-414  # Push local code to cloud
npx convex deployment select groovy-pig-414      # Switch to cloud deployment (use cloud CLI)

# APK build
npm run build         # Uses .env.production → cloud Convex
npx cap sync android   # Sync built files to Android
```

---

## Troubleshooting

**Local Convex not starting:**
- Make sure `.env.local` does NOT have `CONVEX_DEPLOYMENT` set
- Run `npx convex deployment select local`
- Make sure you've run `npx convex login` once on this machine

**Cloud deployment fails:**
- Make sure you have permissions on `groovy-pig-414`
- Check that your Convex login is still valid: `npx convex whoami`

**APK uses wrong database:**
- Check `.env.production` has the correct `CONVEX_DEPLOYMENT=groovy-pig-414`
- Make sure you rebuild after changing `.env.production`