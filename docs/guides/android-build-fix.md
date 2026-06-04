# Android Build Issue: Java Version Compatibility

**Status**: ❌ BLOCKER - Not Resolved

**Date**: 2026-05-13
**Description**: Capacitor Android build is failing due to Java version mismatch between auto-generated Capacitor files and installed JDK

---

## Issue Summary

When running `npx cap build` to assemble a debug APK, the build fails with:
```
Execution failed for task ':capacitor-android:compileDebugJavaWithJavac'.
Java compilation initialization error
error: invalid source release: 21
```

### Root Cause Analysis

The Capacitor auto-generated `android/app/capacitor.build.gradle` has hardcoded:
```gradle
compileOptions {
  sourceCompatibility JavaVersion.VERSION_21
  targetCompatibility JavaVersion.VERSION_17
}
```

**Problem**: 
- Capacitor expects `JavaVersion.VERSION_21` (Java 11) for release builds
- The project uses Java 17 (`javac 17.0.15`)
- Gradle wrapper `gradle/wrapper/gradle-wrapper.properties` defines Java 17.16.1 (build 17.0.15)

### Conflicting Information

**Installed JDK**: Java 17.0.15
**Expected by Capacitor**: Java 21 (Java 11.0.0)

### What's Happening

The Capacitor CLI attempts to invoke Gradle through the task `:capacitor-android:compileDebugJavaWithJavac`. When Gradle evaluates the project, it tries to read build configuration:

1. Loads `capacitor-cordova-android-plugins/build.gradle`
2. Applies project configuration
3. Reads project settings from `gradle.properties`
4. Creates plugin project with task `:capacitor-android` (which includes the problematic file)
5. During project configuration, tries to evaluate properties like:
   ```gradle
androidxActivityVersion = project.hasProperty('androidxActivityVersion') ? rootProject.ext.androidxActivityVersion : '1.11.0'
   ```

**Failure Point**: These properties (`rootProject.ext.androidx*Version`) **don't exist** in your project configuration

The properties that Capacitor's build.gradle template expects are defined in:
- `variables.gradle` (exists in our project) - defines `minSdkVersion = 24`, `compileSdkVersion = 36`, etc.
- BUT: The AndroidX properties (`rootProject.ext.androidx*Version`) are **only in Capacitor's template**, not in your project's Gradle setup

## Why This is a Problem

### Capacitor vs Your Project

| Aspect | Capacitor | Your Project |
|-------|---------|
| File Location | `node_modules/@capacitor/android/capacitor/capacitor-android-plugins/build.gradle` | `android/app/build.gradle` |
| Source | Capacitor template | Your project |
| Gradle Setup | Capacitor creates project with predefined configuration | Your project |
| **Java Version** | Hardcoded: `JavaVersion.VERSION_21` (Java 11) | Config: `variables.gradle` defines minSdkVersion=24, compileSdkVersion=36 (Java 8) |

### The Critical Mismatch

Your `variables.gradle` has:
- `minSdkVersion = 24` → **Java 8** installed ✅
- `compileSdkVersion = 36` → **Java 8** installed ✅

But `android/app/capacitor.build.gradle` (Capacitor-generated) expects:
- `sourceCompatibility JavaVersion.VERSION_21` → **Java 11** (not Java 17!)

This is a **version requirement conflict** that cannot be resolved by simple property changes.

---

## Potential Workarounds

### Option 1: Accept the Limitation ⚠️
- **Impact**: No Android builds until issue is resolved
- **Benefit**: Focus on Phase 5 & 6 instead
- **Status**: Partial - Can still use existing APK for development/testing

### Option 2: Update Capacitor ⚠️
- **Risk**: Major upgrade, may break other things
- **Feasibility**: Unknown if Capacitor 8.3.2 supports our project structure
- **Recommendation**: Skip until Capacitor is tested on current setup

### Option 3: Manual Build ⚠️
- **Approach**: Build debug APK using Android Studio directly
- **Steps**:
  1. Open project in Android Studio
  2. Select Build > Build > Build APK(s)
  3. Build and test locally
  4. Generate release APK/AAB when ready
- **Advantage**: Full Android Studio debugging capabilities

### Option 4: Documentation 📝
- **Tasks**:
  - Document the Java version conflict
  - Create a build workaround guide
  - Note Capacitor 8.3.2 incompatibility not guaranteed
  - List known limitations and testing approach

---

**Current Recommendation**: Move to Phase 6 (Release Preparation) and document the blocker. The web layer is production-ready.