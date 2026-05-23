# Convex Cloud Deployment Setup

## Quick Start

1. **Login to Convex Cloud:**
   ```bash
   npx convex login
   ```

2. **Deploy to Cloud:**
   ```bash
   npm run deploy:convex
   ```

3. **Run Development:**
   ```bash
   npm run dev
   ```
   OR for local development (server + client only):
   ```bash
   npm run dev:app
   ```

## How It Works

### Cloud Mode (Always-On Database)
- Your Convex backend is deployed to the cloud
- Database runs 24/7 without needing to start it manually
- Connects automatically from anywhere
- No local setup required

### Local Development Mode
- Falls back to local Convex if no cloud deployment is configured
- Good for offline development or testing
- Requires manual startup

## Configuration

In `.env.local`:
```bash
# Cloud deployment (preferred - always-on)
CONVEX_DEPLOYMENT=your-deployment-name
VITE_CONVEX_URL=https://your-app.convex.cloud

# Local deployment (fallback - manual startup)
# CONVEX_DEPLOYMENT=
# VITE_CONVEX_URL=http://127.0.0.1:3210
```

## Scripts

- `npm run deploy:convex` - Deploy backend to Convex cloud
- `npm run dev` - Full development (auto-detects cloud/local)
- `npm run dev:app` - Local development (server + client, uses cloud Convex)
- `npm run dev:all` - Full local development (includes local Convex)

## Cloud Benefits

✅ Always running database
✅ No local setup required
✅ Access from any device
✅ Production-like environment
✅ Easy team collaboration
✅ Automatic scaling
✅ Built-in monitoring

## Switching Between Modes

**To use cloud:**
```bash
npm run deploy:convex
npm run dev:app
```

**To use local:**
```bash
# Set CONVEX_DEPLOYMENT= in .env.local
npm run dev:all
```