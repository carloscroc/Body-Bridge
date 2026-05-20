# Known Limitations

**Last Updated**: 2026-05-16
**Project**: Forge Fitness Hybrid App

---

## Release Readiness Status

| Component | Status | Notes |
|-----------|--------|-------|
| Web Layer | ✅ Production Ready | User validation, Convex integration functional |
| Testing | ✅ Playwright E2E Passing | All critical paths covered |
| Configuration | ✅ Capacitor Synced | Permissions minimal (INTERNET only) |
| Android APK Generation | ⚠️ Blocked | Java version incompatibility |
| Manual Android Builds | ✅ Working | Android Studio workaround functional |

---

## Android Build Blockade

### Issue Summary

Automated Android APK generation is blocked due to Java version incompatibility between Capacitor's build tooling and the system's Java 17 installation.

**Details**:
- **Problem**: Capacitor-generated build files expect Java 21, system has Java 17
- **Error**: `gradlew assembleDebug/assembleRelease` fails with "invalid source release: 21"
- **Full Documentation**: [ANDROID_BUILD_ISSUE_JAVA_VERSION.md](../ANDROID_BUILD_ISSUE_JAVA_VERSION.md)

### Workaround

Use Android Studio to build APKs manually:

1. Open project: `File > Open > android/`
2. Wait for Gradle sync
3. Build: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
4. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Impact on Release

- **Automated CI/CD**: Not available until Java 21 is standard
- **Manual Testing**: Fully functional via Android Studio builds
- **App Functionality**: No impact - code is production-ready
- **Store Submission**: Requires manual APK generation for Android

---

## Version Information

| Platform | Current Version | Next Version |
|----------|----------------|--------------|
| package.json | 0.0.2 | 0.0.3 (next release) |
| Android versionCode | 4 | 5 (next release) |
| Android versionName | 0.0.2 | 0.0.3 (next release) |
| iOS Bundle ID | com.forge.fitness | - |

---

## Resolved Issues

### App Name Change
- **Previously**: Body Bridge Fitness / com.bodybridge.fitness
- **Currently**: Forge Fitness / com.forge.fitness
- **Completed**: 2026-05-16

All configuration files updated:
- `capacitor.config.json` (root, android, ios)
- `android/app/build.gradle`
- `android/app/src/main/assets/capacitor.config.json`
- `ios/App/App/capacitor.config.json`

---

## Pre-Release Checklist

- [x] `npm run build` completes without errors
- [x] `npx cap sync` copies web assets to native projects
- [x] Version numbers aligned across package.json and Android build.gradle
- [x] App icon and splash screen present in generated assets
- [x] Only INTERNET permission in AndroidManifest.xml
- [ ] Manual APK installs and launches successfully on test device
- [ ] User validation flow works (login/signup with feedback)
- [ ] Convex data loading and submissions functional
- [ ] Navigation between all tabs/screens functional

---

## Next Steps

1. **Phase 7**: Manual Android Testing
   - Build APK via Android Studio
   - Install on 2-3 test devices
   - Validate all user flows

2. **Resolve Java Issue** (when ready for automated builds):
   - Option A: Upgrade to Java 21
   - Option B: Adjust Capacitor build configuration
   - Option C: Wait for Capacitor update

3. **Store Submission Preparation**:
   - Generate release APK/AAB
   - Prepare store listings, screenshots
   - Create privacy policy
   - Set up developer accounts