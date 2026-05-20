# GitHub Secrets Setup Guide

This guide explains how to set up the required GitHub Secrets for automated Android builds.

## Required Secrets

You need to create these secrets in your GitHub repository (Settings > Secrets and variables > Actions > New repository secret):

### 1. ANDROID_KEYSTORE_BASE64

This is the Base64-encoded keystore file.

**How to create:**

1. Generate keystore (run this in the `android` directory):
   ```bash
   keytool -genkey -v -keystore app/bodybridge-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias bodybridge-key-alias
   ```

2. Encode to Base64:
   ```bash
   # On macOS/Linux:
   base64 -i app/bodybridge-keystore.jks | pbcopy
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("app/bodybridge-keystore.jks")) | Set-Clipboard
   ```

3. Paste the Base64 string as the secret value.

### 2. ANDROID_KEYSTORE_PROPERTIES_BASE64

This is the Base64-encoded keystore.properties file.

**How to create:**

1. Copy the template:
   ```bash
   cp keystore.properties.template keystore.properties
   ```

2. Fill in the actual values:
   ```properties
   storeFile=app/bodybridge-keystore.jks
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyAlias=bodybridge-key-alias
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. Encode to Base64:
   ```bash
   # On macOS/Linux:
   base64 -i keystore.properties | pbcopy
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("keystore.properties")) | Set-Clipboard
   ```

4. Paste the Base64 string as the secret value.

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords (at least 16 characters)
- Store keystore and properties file in multiple secure locations
- Use a password manager for passwords
- Keep backups of both files
- Test the secrets work by running the workflow

### ❌ DON'T:
- Commit keystore files to git
- Share passwords via email or chat
- Store passwords in plain text files
- Use the same password for multiple purposes
- Forget to backup your keystore

## Testing Your Setup

After adding secrets, test them:

1. Push a tag to trigger the release workflow:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Monitor the workflow in Actions tab
3. Check if the release AAB is created successfully

## Troubleshooting

### Issue: "Keystore file not found"
- Check that ANDROID_KEYSTORE_BASE64 is set correctly
- Verify the Base64 encoding is complete (no truncation)

### Issue: "Invalid keystore format"
- Re-encode the keystore file to Base64
- Ensure you're encoding the .jks file, not a .txt file

### Issue: "Keystore was tampered with or password was incorrect"
- Verify ANDROID_KEYSTORE_PROPERTIES_BASE64 has correct passwords
- Double-check the keystore and key passwords match

## Recovery

If you lose your keystore, you CANNOT update your app on Google Play Store. Always:

1. **Backup keystore** in multiple locations:
   - Cloud storage (Google Drive, Dropbox, etc.)
   - External hard drive
   - Password manager
   - Physical copy on USB

2. **Document passwords** securely:
   - Use a password manager (1Password, LastPass, Bitwarden)
   - Store in a secure cloud vault
   - Write down and store in a safe

3. **Test recovery process**:
   - Restore keystore from backup
   - Try building a signed release
   - Verify the signature matches

## Alternative: Google Play App Signing

For better security, use Google Play App Signing:

1. When creating your app in Play Console, choose "App signing by Google Play"
2. Upload your initial release AAB
3. Google will manage and protect your signing key
4. You only need the upload key for future updates

**Benefits:**
- Google manages key security
- Automatic key rotation
- Lost key recovery options
- Enhanced security features

For more info: https://support.google.com/googleplay/android-developer/answer/7384423

---

**Remember:** Your keystore is the most important file for your app. Losing it means you cannot update your app. Take security seriously!