# Release Preparation Execution Plan

**Project**: Forge Fitness Hybrid App
**Goal**: Complete all release preparation tasks before App Store submission
**Estimated Total Time**: 2-3 hours (excluding manual Android testing)

---

## PHASE 1: Asset Preparation & Verification

### Task 1.1: Verify Resource Files
**Objective**: Confirm icon and splash screen images exist in resources folder

**Steps**:
1. Navigate to project root: `cd C:\Users\thebe\Downloads\Forge`
2. Check `resources/` directory exists
3. Verify these files exist:
   - `resources/icon.png` (should be 1024x1024px)
   - `resources/splash.png` (should be 2732x2732px)

**Verification**:
```bash
ls -la resources/
file resources/icon.png
file resources/splash.png
```

**Expected Output**: Both files exist with correct dimensions

**If Missing**: Place your 1024x1024 icon as `resources/icon.png` and 2732x2732 splash as `resources/splash.png`

---

### Task 1.2: Generate Capacitor Assets
**Objective**: Create platform-specific assets from source images

**Steps**:
1. Run asset generation:
```bash
npx capacitor assets
```

2. Verify generated directories:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - `android/app/src/main/res/drawable/splash.png`
   - `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - `ios/App/App/Assets.xcassets/LaunchImage.imageset/`

**Verification**:
```bash
ls android/app/src/main/res/mipmap-*/ic_launcher.png
ls android/app/src/main/res/drawable/splash.png
```

**Expected Output**: All asset files generated successfully

**If Fail**: Run `npx capacitor resources` instead

---

## PHASE 2: Version Number Updates

### Task 2.1: Update package.json
**Objective**: Increment version from current to next release version

**Steps**:
1. Read current `package.json`:
```bash
cat package.json | grep '"version"'
```

2. Update version field (e.g., from `0.0.1` to `0.0.2`)

**Before**:
```json
{
  "name": "forge",
  "version": "0.0.1",
  "private": true,
```

**After**:
```json
{
  "name": "forge",
  "version": "0.0.2",
  "private": true,
```

**Verification**:
```bash
npm pkg get version
```

---

### Task 2.2: Update Android build.gradle
**Objective**: Match Android version numbers with package.json

**Steps**:
1. Open `android/app/build.gradle`
2. Locate `defaultConfig` block
3. Update:
   - `versionCode` (integer, increment by 1)
   - `versionName` (string, match package.json)

**Before**:
```gradle
defaultConfig {
    applicationId "com.forge.fitness"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "0.0.1"
}
```

**After**:
```gradle
defaultConfig {
    applicationId "com.forge.fitness"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 2
    versionName "0.0.2"
}
```

**Verification**:
```bash
grep -E "versionCode|versionName" android/app/build.gradle
```

---

## PHASE 3: Configuration Validation

### Task 3.1: Verify Capacitor Config
**Objective**: Ensure capacitor.config.ts has correct app settings

**Steps**:
1. Open `capacitor.config.ts`
2. Verify these values:
```typescript
const config: CapacitorConfig = {
  appId: 'com.forge.fitness',     // Must match Android/iOS bundle ID
  appName: 'Forge Fitness',       // App store display name
  webDir: 'dist'                  // Must point to built web assets
};
```

**Expected Values**:
- `appId`: `com.forge.fitness`
- `appName`: `Forge Fitness`
- `webDir`: `dist`

**Verification**:
```bash
cat capacitor.config.ts
```

---

### Task 3.2: Verify Android Permissions
**Objective**: Confirm AndroidManifest.xml has only required permissions

**Steps**:
1. Open `android/app/src/main/AndroidManifest.xml`
2. Check for `<uses-permission>` tags

**Expected**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Only INTERNET permission needed for hybrid app -->
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

**Verification**:
```bash
grep -A5 "<uses-permission" android/app/src/main/AndroidManifest.xml
```

---

## PHASE 4: Production Build

### Task 4.1: Create Production Build
**Objective**: Generate optimized production web assets

**Steps**:
1. Clean previous build (optional but recommended):
```bash
rm -rf dist/
```

2. Run production build:
```bash
npm run build
```

**Expected Output**: Build completes without errors, `dist/` folder created

**Verification**:
```bash
ls -la dist/
# Should contain: index.html, assets/, manifest.json
```

---

### Task 4.2: Sync with Capacitor
**Objective**: Copy web assets to native Android and iOS projects

**Steps**:
1. Run cap sync:
```bash
npx cap sync
```

**Expected Output**: Files copied to both platforms

**Verification**:
```bash
# Android assets
ls android/app/src/main/assets/public/

# iOS assets
ls ios/App/App/public/
```

Both should contain `index.html` and `assets/` folder

---

## PHASE 5: Documentation

### Task 5.1: Create Known Limitations Document
**Objective**: Document the Java version Android build blocker

**Steps**:
1. Create or update `docs/known-limitations.md` with:

```markdown
## Known Limitations (as of YYYY-MM-DD)

### Android Build Blockade
- **Issue**: Capacitor-generated build files expect Java 21, system has Java 17
- **Impact**: `gradlew assembleDebug/assembleRelease` fails with "invalid source release: 21"
- **Workaround**:
  1. Use Android Studio IDE to build APKs manually
  2. Document as known limitation for App Store/Play Store submission
  3. Plan to resolve when Capacitor/Java compatibility improves
- **Files Affected**:
  - `android/app/capacitor.build.gradle` (auto-generated)
  - `android/app/build.gradle` (manual overrides applied)
  - `node_modules/@capacitor/android/capacitor/build.gradle` (Capacitor template)

### Current Status
- ✅ Web layer: Production-ready with user validation
- ✅ Testing: Playwright E2E tests passing
- ✅ Configuration: Capacitor synced, permissions minimal
- ⚠️ Block: Automated Android APK generation
- ✅ Workaround: Manual Android Studio builds functional
```

**Verification**: File created and contains above content

---

## PHASE 6: Final Verification Checklist

Before declaring release candidate ready, verify ALL items:

### Pre-Flight Checklist
Run each command and confirm output:

```bash
# 1. Build completes without errors
npm run build
# Expected: No errors, dist/ folder created

# 2. Cap sync copies web assets
npx cap sync
# Expected: Assets copied to android/ and ios/

# 3. Version numbers match
npm pkg get version  # Should match versionName in build.gradle
grep versionName android/app/build.gradle
# Both should return same version (e.g., "0.0.2")

# 4. App icons generated
ls android/app/src/main/res/mipmap-*/ic_launcher.png
# Expected: Files exist for all densities

# 5. Splash screen generated
ls android/app/src/main/res/drawable/splash.png
# Expected: File exists

# 6. Android permissions correct
grep "<uses-permission" android/app/src/main/AndroidManifest.xml
# Expected: Only INTERNET permission

# 7. Android asset sync verified
ls android/app/src/main/assets/public/index.html
# Expected: File exists with web assets

# 8. iOS asset sync verified
ls ios/App/App/public/index.html
# Expected: File exists with web assets
```

### Visual Inspection Checklist
- [ ] `npm run build` completes without errors
- [ ] `npx cap sync` copies web assets to native projects
- [ ] Version numbers updated in `package.json` and `android/app/build.gradle`
- [ ] App icon and splash screen present in generated assets
- [ ] Only INTERNET permission in AndroidManifest.xml
- [ ] Manual APK installs and launches successfully on test device (Phase 7)
- [ ] User validation flow works (login/signup with feedback) (Phase 7)
- [ ] Convex data loading and submissions functional (Phase 7)
- [ ] Navigation between all tabs/screens functional (Phase 7)

---

## PHASE 7: Manual Android Testing

### Task 7.1: Generate Debug APK via Android Studio
**Steps**:
1. Open Android Studio
2. File > Open > `C:\Users\thebe\Downloads\Forge\android\`
3. Wait for Gradle sync to complete
4. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
5. Wait for build notification
6. Note APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Task 7.2: Install on Test Device
**For USB Device**:
1. Enable Developer Options and USB Debugging on Android device
2. Connect device via USB
3. Run:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**For Emulator**:
1. Open emulator in Android Studio
2. Drag APK onto running emulator
3. Or use: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

---

### Task 7.3: Test User Validation Flow
**Test Cases**:

| Test | Action | Expected Result |
|------|--------|----------------|
| Valid signup | Enter valid email/password | Success message, redirect to app |
| Invalid email | Enter bad@email | Error: "Please enter a valid email" |
| Empty password | Leave password blank | Error: "Password is required" |
| Short password | Enter "123" | Error: "Password must be 8+ characters" |
| Login success | Use valid credentials | Logged in, sees main screen |
| Login failure | Wrong password | Error: "Invalid credentials" |

---

### Task 7.4: Test Convex Integration
**Test Cases**:

| Test | Action | Expected Result |
|------|--------|----------------|
| Data load | Open app | Content loads from Convex |
| Data submit | Submit a form | Data saved to Convex |
| Real-time | Check for updates | Updates appear without refresh |

---

### Task 7.5: Test Navigation
**Test Cases**:

| Test | Action | Expected Result |
|------|--------|----------------|
| Tab switch | Tap each navigation tab | Correct screen displays |
| Back nav | Press back button | Previous screen or exit prompt |
| Deep link | Open from notification | Navigates to correct screen |

---

## Execution Summary

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | Asset Preparation | Pending | Verify resources, generate assets |
| 2 | Version Numbers | Pending | Update package.json + build.gradle |
| 3 | Configuration Validation | Pending | Verify capacitor.config + permissions |
| 4 | Production Build | Pending | npm run build + cap sync |
| 5 | Documentation | Pending | Create known limitations doc |
| 6 | Final Verification | Pending | Run all checklist items |
| 7 | Manual Android Testing | Pending | APK build + device testing |

---

## Next Steps After Completion

1. **Test Thoroughly**: Validate on 2-3 Android devices
2. **Document Results**: Note any device-specific issues
3. **Prepare Store Submission**:
   - Generate release APK/AAB when Java issue resolved
   - Prepare store listings, screenshots, privacy policy
4. **Resolve Java Issue**: When ready for automated CI/CD:
   - Upgrade to Java 21
   - Or adjust Capacitor build configuration
5. **Submit**: Begin App Store/Play Store submission process

---

*Plan created: 2026-05-16*
*For project: Forge Fitness Hybrid App*
*Blocker: Android Java 21 vs Java 17 version mismatch*