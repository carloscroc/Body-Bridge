# Quick App Name Change Guide

## 🎯 Quick Start

To change the app name from "Forge Fitness" to "Body Bridge Fitness":

### Step 1: Update Central Config
Edit `src/config/app.config.ts`:
```typescript
export const APP_CONFIG = {
  displayName: 'Body Bridge Fitness',  // Change this
  shortName: 'BodyBridge',          // Change this
  packageId: 'com.bodybridge.fitness',     // Change this
  packageName: 'body-bridge-fitness',      // Change this
  urlScheme: 'bodybridge',                // Change this
  appName: 'Body Bridge Fitness',          // Change this
}
```

### Step 2: Generate Configuration
```bash
npm run config:generate
```

### Step 3: Build
```bash
npm run build
```

## ✨ Done!

All platforms now use "Body Bridge Fitness":
- ✅ Web app title
- ✅ Android app name
- ✅ iOS app name
- ✅ Package identifiers
- ✅ Capacitor configuration

## 🔄 Future Changes

Whenever you want to change the name again:

1. Edit `src/config/app.config.ts` ✏️
2. Run `npm run config:generate` 🤖
3. Build `npm run build` 🔨

That's it! No more hunting through multiple files!

## 🆘 Common Name Variations

### Full Name (UI)
"Body Bridge Fitness"

### Short Name (Code)
"BodyBridge"

### Package Name (NPM)
"body-bridge-fitness"

### Package ID (Android/iOS)
"com.bodybridge.fitness"

### URL Scheme
"bodybridge"

## 📝 Example: Rebranding to "BB"

If you want to rebrand to "BB" (short version):

```typescript
export const APP_CONFIG = {
  displayName: 'BB',
  shortName: 'BB',
  packageId: 'com.bb.app',
  packageName: 'bb-app',
  urlScheme: 'bb',
  appName: 'BB',
}
```

Then run: `npm run config:generate && npm run build`

## 🔍 Verification

After changing, verify in these places:
- [ ] Package.json name field
- [ ] index.html title tag
- [ ] capacitor.config.ts appName
- [ ] Android strings.xml app_name
- [ ] iOS Info.plist CFBundleDisplayName
- [ ] Built app shows new name

## 🚨 Troubleshooting

### Build still shows old name
1. Clear cache: `rm -rf node_modules/.vite`
2. Rebuild: `npm run build`

### Platform-specific issues
- Android: Clean build folder `android/app/build`
- iOS: Clean derived data `ios/DerivedData`
- Web: Clear browser cache and hard refresh

### Environment variables not working
- Ensure `.env.app` is in project root
- Check Vite is loading env variables
- Restart dev server after env changes