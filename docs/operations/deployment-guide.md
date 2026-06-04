# Body Bridge Fitness - Deployment Guide

Complete guide for deploying Body Bridge Fitness to Google Play Store.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Google Play Developer account ($25 one-time fee)
- [ ] 12+ testers ready for 14-day testing period
- [ ] Generated keystore and properties file
- [ ] Privacy policy hosted on a website
- [ ] All store assets (icons, screenshots, descriptions)
- [ ] App tested on multiple Android devices

## 🚀 Deployment Steps

### Step 1: Generate Keystore

```bash
cd android
keytool -genkey -v -keystore app/bodybridge-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias bodybridge-key-alias
```

**IMPORTANT:** Store keystore securely! Never commit to git.

### Step 2: Create keystore.properties

```bash
cp keystore.properties.template keystore.properties
```

Edit `keystore.properties` with your actual values:
```properties
storeFile=app/bodybridge-keystore.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=bodybridge-key-alias
keyPassword=YOUR_KEY_PASSWORD
```

### Step 3: Build Release Bundle

```bash
# From project root
npm run build

# Sync Capacitor
npx cap sync android

# Build release AAB
cd android
./gradlew clean
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Generate Store Assets

```bash
# Generate app icons
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#ffffff'

# Generate screenshots
npm run dev
# In another terminal:
node scripts/generate-screenshots.js
```

### Step 5: Setup GitHub Secrets (Optional but Recommended)

For automated builds, add these secrets to GitHub:

1. **ANDROID_KEYSTORE_BASE64**: Base64-encoded keystore file
2. **ANDROID_KEYSTORE_PROPERTIES_BASE64**: Base64-encoded keystore.properties

See `GITHUB_SECRETS_SETUP.md` for detailed instructions.

### Step 6: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click "All apps" > "Create app"
3. Fill in:
   - **App name**: Body Bridge Fitness
   - **Default language**: English
   - **Free or paid**: Free
   - **App or game**: App

### Step 7: Complete Store Listing

#### App Icon
- 512x512 PNG
- Transparent background
- No text
- Upload to "Graphics" > "App icon"

#### Feature Graphic
- 1024x500 PNG
- Shows app branding
- Upload to "Graphics" > "Feature graphic"

#### Screenshots (2-8 required)
- Phone: 1080x1920 to 1080x2400
- Upload from `play-store-screenshots/` directory
- Order: Most important first

#### Short Description (80 characters max)
```
Your personalized fitness companion for workouts and health tracking.
```

#### Full Description (4000 characters max)
```
Body Bridge Fitness is your comprehensive fitness companion designed to help you achieve your health and wellness goals. Track workouts, monitor progress, and stay motivated with personalized fitness plans.

KEY FEATURES:
• Personalized Workout Plans
• Progress Tracking & Analytics
• Calendar Scheduling
• Custom Exercise Library
• Goal Setting & Achievement Tracking
• Secure Account Management

WHY BODY BRIDGE FITNESS?
Whether you're a beginner or a fitness enthusiast, Body Bridge Fitness adapts to your fitness level and helps you stay on track with your health journey.

Download now and start your fitness transformation today!
```

### Step 8: Content Rating

1. Go to "Policy" > "Content rating"
2. Complete the IARC questionnaire
3. Review ratings
4. For fitness apps, typically rated "Everyone" or "Teen"

### Step 9: Data Safety Section

Complete all required fields:

**Data Collection:**
- [x] Email address (for account management)
- [x] App interactions (usage analytics)
- [x] Crash logs (for debugging)

**Data Sharing:**
- [ ] None (if you don't share)

**Security Practices:**
- [x] Data is encrypted in transit
- [x] Data is encrypted at rest
- [x] Secure authentication
- [x] You can request data deletion

### Step 10: Target Audience

- **Target age group**: 18+ (or appropriate)
- **Ads declaration**: No

### Step 11: App Content

- **Ads**: No
- **App category**: Health & Fitness
- **Contact details**: Fill in your support email

### Step 12: Privacy Policy

**REQUIRED:** You must have a privacy policy accessible from:
1. Play Store listing
2. Within the app

Create a privacy policy page on your website with:
- Data collection details
- Data usage information
- User rights
- Contact information
- Link from app settings

### Step 13: Upload to Testing Track

**CRITICAL:** New personal accounts require 14 days of testing with 12+ testers.

1. Go to "Testing & releases" > "Closed testing"
2. Click "Create new release"
3. Upload your AAB file
4. Add release notes:
   ```
   Initial testing release
   
   Features:
   • Personalized workout plans
   • Progress tracking
   • Calendar scheduling
   • Custom exercise library
   
   Please report any bugs or feedback!
   ```
5. Click "Save"
6. Click "Create release"
7. Add 12+ testers:
   - Copy the opt-in URL
   - Share with testers
   - Wait for them to opt-in

### Step 14: Monitor Testing

For the next 14 days:

- [ ] Track install rates
- [ ] Monitor crash reports
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Update AAB as needed
- [ ] Keep testers informed

### Step 15: Production Release

After 14+ days of testing:

1. Go to "Testing & releases" > "Production"
2. Click "Create new release"
3. Upload final AAB
4. Add release notes:
   ```
   Version 1.0.0 - Initial Release
   
   New Features:
   • Personalized workout plans
   • Progress tracking and analytics
   • Calendar scheduling
   • Custom exercise library
   • Goal setting and achievement tracking
   
   Improvements:
   • Optimized performance
   • Improved UI/UX
   • Enhanced security
   
   Thank you for using Body Bridge Fitness!
   ```
5. Choose rollout strategy:
   - **Staged rollout** (recommended): Start at 1%, increase gradually
   - **Full rollout**: All users get update immediately
6. Click "Save"
7. Click "Start rollout to production"
8. Wait for review (1-7 days)

### Step 16: Post-Deployment

After approval:

1. **Monitor:**
   - Crash reports in Google Play Console
   - User reviews and ratings
   - Analytics data
   - Performance metrics

2. **Respond:**
   - Answer user reviews
   - Fix bugs quickly
   - Plan updates

3. **Improve:**
   - Analyze user feedback
   - Plan feature updates
   - Optimize performance
   - Update app regularly

## 📱 Testing Checklist

Before production release, ensure:

- [ ] App launches successfully on all test devices
- [ ] All core features work correctly
- [ ] Network errors handled gracefully
- [ ] Permissions requested appropriately
- [ ] Performance meets requirements (< 2s startup)
- [ ] No critical bugs
- [ ] Privacy policy accessible in app
- [ ] Deep linking works (if implemented)
- [ ] Notifications work (if implemented)
- [ ] Authentication flow works
- [ ] Data sync works correctly

## 🔐 Security Checklist

- [ ] Keystore stored securely
- [ ] HTTPS for all network requests
- [ ] No hardcoded secrets
- [ ] Input validation on all forms
- [ ] Proper authentication
- [ ] No sensitive data in logs
- [ ] Permissions are minimal
- [ ] Network security config set
- [ ] ProGuard/R8 enabled

## 📊 Performance Requirements

- **Startup time**: < 2 seconds
- **Frame rate**: 60 FPS
- **Crash rate**: < 0.5%
- **ANR rate**: < 0.05%
- **Memory usage**: < 150MB
- **App size**: < 50MB (compressed)

## 🚨 Common Issues & Solutions

### Issue: "Target SDK too low"
**Solution:** Update to API 35+ (already done in build.gradle)

### Issue: "Keystore was tampered with"
**Solution:** 
1. Verify keystore.properties has correct passwords
2. Ensure keystore file hasn't been modified
3. Try rebuilding from scratch

### Issue: "Insufficient testing period"
**Solution:** Wait for full 14 days with 12+ testers

### Issue: "Privacy policy missing"
**Solution:** Create and host privacy policy, link from app and store

### Issue: "App crashes on specific devices"
**Solution:**
1. Check crash reports in Play Console
2. Test on similar devices
3. Fix and update AAB

### Issue: "Review rejected"
**Solution:**
1. Read rejection reason carefully
2. Fix the issue
3. Resubmit with explanation

## 📚 Useful Commands

```bash
# Build commands
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease

# Testing commands
npm run test
npm run test:playwright
cd android && ./gradlew testDebugUnitTest

# Clean build
cd android && ./gradlew clean

# Sync Capacitor
npx cap copy android
npx cap update android

# Open Android Studio
npx cap open android
```

## 🔄 Version Updates

For future releases:

1. **Update version in multiple places:**
   ```gradle
   // android/variables.gradle
   targetSdkVersion = 35
   
   // android/app/build.gradle
   versionCode 4  // Increment
   versionName "1.0.1"  // Update
   ```

2. **Build new release:**
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew bundleRelease
   ```

3. **Upload to Play Console:**
   - Create new release
   - Upload new AAB
   - Add release notes
   - Submit

## 📞 Support Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android Developers](https://developer.android.com/)
- [Capacitor Docs](https://capacitorjs.com/)
- [Play Store Policies](https://play.google.com/about/developer-content-policy)

## ✅ Final Pre-Deployment Checklist

- [ ] All 7 phases completed
- [ ] 14+ days of testing with 12+ testers
- [ ] Zero critical bugs
- [ ] Privacy policy published
- [ ] Store listing complete
- [ ] Content rating obtained
- [ ] Data safety section complete
- [ ] Release AAB built successfully
- [ ] Keystore backed up securely
- [ ] Team review complete

---

**Ready to deploy! 🎉**

For questions or issues, refer to:
- `ANDROID_PLAY_STORE_DEPLOYMENT_CHECKLIST.md` - Complete deployment requirements
- `GITHUB_SECRETS_SETUP.md` - GitHub Actions setup
- `deployment-checklist/ANDROID_PLAY_STORE_DEPLOYMENT_CHECKLIST.md` - Best practices

Good luck with your release!