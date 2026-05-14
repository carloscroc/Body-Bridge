# App Name Centralization System

This system provides a single source of truth for all app naming across the entire project, making future name changes simple and consistent.

## 🎯 How It Works

### 1. Central Configuration
All app naming is defined in one place: `src/config/app.config.ts`

```typescript
export const APP_CONFIG = {
  displayName: 'Body Bridge Fitness',  // UI display name
  shortName: 'BodyBridge',          // Code references, file names
  packageId: 'com.bodybridge.fitness',     // Android/iOS package identifier
  packageName: 'body-bridge-fitness',      // npm package name
  urlScheme: 'bodybridge',                // Deep links
  appName: 'Body Bridge Fitness',          // Full app title
}
```

### 2. Environment Variables (Optional)
For environment-specific configurations, use `.env.app`:

```bash
VITE_APP_NAME=Body Bridge Fitness
VITE_APP_ID=com.bodybridge.fitness
VITE_APP_SHORT_NAME=BodyBridge
```

### 3. Automatic Generation
Run `npm run config:generate` to automatically update all platform-specific files:

- ✅ `package.json` - npm package name
- ✅ `capacitor.config.ts` - Capacitor app configuration
- ✅ `index.html` - HTML page title
- ✅ `android/app/src/main/res/values/strings.xml` - Android display name
- ✅ `ios/App/App/Info.plist` - iOS bundle display name

## 🔄 How to Change App Name in Future

### Option 1: Quick Change (Recommended)
1. Edit `src/config/app.config.ts`
2. Run `npm run config:generate`
3. Done! All platforms updated automatically

### Option 2: Environment Override
1. Create `.env.app` file with new values
2. Run `npm run config:generate`
3. Environment variables take precedence

## 📁 Platform-Specific Updates

### Web/PWA
- `index.html` title tag
- `package.json` name field

### Capacitor/Hybrid Apps
- `capacitor.config.ts` - appName and appId
- HTML uses `%VITE_APP_NAME%` placeholder

### Android
- `strings.xml` - app_name, title_activity_main
- `AndroidManifest.xml` - package name
- Custom schemes and deep links

### iOS
- `Info.plist` - CFBundleDisplayName
- Bundle identifier and schemes

## 🚀 Build Process

When you run `npm run build`, the configuration is automatically applied:

```bash
npm run config:generate  # Generate all configs
npm run build          # Build with correct names
```

## 🎨 Benefits

- ✅ **Single Source of Truth**: Change name in one place
- ✅ **Consistency**: All platforms stay in sync
- ✅ **Environment Support**: Different names for dev/staging/prod
- ✅ **Type Safety**: TypeScript configuration
- ✅ **Automation**: Scripts handle updates automatically
- ✅ **Easy Rollback**: Revert config changes in one file

## 📋 Current Configuration

**Display Name**: Body Bridge Fitness
**Short Name**: BodyBridge
**Package ID**: com.bodybridge.fitness
**NPM Package**: body-bridge-fitness

## 🔧 Manual Overrides (If Needed)

If you need different names per platform, edit these files directly:
- Web: `src/config/app.config.ts`
- Android: `android/app/src/main/res/values/strings.xml`
- iOS: `ios/App/App/Info.plist`

But remember to update `src/config/app.config.ts` as the source of truth!