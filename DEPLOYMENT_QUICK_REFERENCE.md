# Quick Deployment Reference

Fast commands and common tasks for deploying Body Bridge Fitness.

## 🚀 Quick Commands

### Build Release Bundle
```bash
npm run build && npx cap sync android && cd android && ./gradlew bundleRelease
```

### Generate Screenshots
```bash
npm run dev  # Terminal 1
node scripts/generate-screenshots.js  # Terminal 2
```

### Run Tests
```bash
npm test  # Web tests
cd android && ./gradlew testDebugUnitTest  # Android unit tests
```

### Sync Capacitor
```bash
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```

## 📋 Current Configuration

- **Package**: com.bodybridge.fitness
- **Version**: 1.0.0 (versionCode: 3)
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 35 (Android 15)
- **Compile SDK**: 35
- **Build Tool**: Gradle 8.13.0

## 📁 Important Files

- `android/app/build.gradle` - App build configuration
- `android/variables.gradle` - SDK versions
- `android/app/proguard-rules.pro` - Code optimization rules
- `android/keystore.properties.template` - Signing template
- `.github/workflows/android-build.yml` - CI/CD build workflow
- `.github/workflows/android-release.yml` - CI/CD release workflow

## 🔑 GitHub Secrets (Required for CI/CD)

1. **ANDROID_KEYSTORE_BASE64** - Base64-encoded keystore file
2. **ANDROID_KEYSTORE_PROPERTIES_BASE64** - Base64-encoded keystore.properties

## 📱 Release Workflow

1. **Testing Phase** (14 days)
   - Upload to Closed Testing track
   - Add 12+ testers
   - Collect feedback
   - Fix bugs

2. **Production Release**
   - Upload to Production track
   - Add release notes
   - Choose rollout percentage
   - Submit for review
   - Wait 1-7 days

3. **Post-Deployment**
   - Monitor crashes
   - Track analytics
   - Respond to reviews
   - Plan updates

## 🎯 Version Increment

```bash
# Update versionCode in android/app/build.gradle
versionCode 4  # Always increment

# Update versionName in android/app/build.gradle
versionName "1.0.1"  # Semantic versioning
```

## ⚡ Fast Fixes

### Keystore not found
```bash
cd android
keytool -genkey -v -keystore app/bodybridge-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias bodybridge-key-alias
cp keystore.properties.template keystore.properties
# Edit keystore.properties with actual values
```

### Build fails
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### Sync issues
```bash
npx cap clean
npx cap sync android
```

### Capacitor not updated
```bash
npx cap update
npx cap sync android
```

## 📊 Performance Targets

- Startup: < 2 seconds
- FPS: 60
- Crash rate: < 0.5%
- Memory: < 150MB
- App size: < 50MB

## 🚨 Emergency Commands

### Rollback Release
1. Go to Google Play Console
2. Find active release
3. Click "Halt rollout"
4. Upload previous version

### Fix Critical Bug
1. Fix in code
2. Update versionCode and versionName
3. Build new AAB
4. Upload to Internal Testing
5. Test thoroughly
6. Promote to Production

### Keystore Lost
- IMMEDIATELY restore from backup
- If no backup exists, you CANNOT update app
- Must create new app with new package name

## 📝 Store Listing Quick Links

- [Google Play Console](https://play.google.com/console)
- [App Store Listing](https://play.google.com/console/u/0/develop)
- [Testing & Releases](https://play.google.com/console/u/0/develop/APP_ID/testing-and-releases)

## 📚 Documentation Links

- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `GITHUB_SECRETS_SETUP.md` - GitHub Actions setup
- `deployment-checklist/ANDROID_PLAY_STORE_DEPLOYMENT_CHECKLIST.md` - Best practices
- `BODY_BRIDGE_PLAY_STORE_DEPLOYMENT_GUIDE.md` - Comprehensive guide

---

**Quick tip:** Keep this file open during deployment for fast reference!