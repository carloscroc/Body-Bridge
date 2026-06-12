/**
 * Generate App Configuration from centralized config
 * This script reads the centralized config and generates platform-specific files
 */

const { writeFileSync, readFileSync } = require('fs');
const { resolve } = require('path');

// Read the centralized config
const configPath = resolve(__dirname, '../src/config/app.config.ts');
const configContent = readFileSync(configPath, 'utf8');

// Extract APP_CONFIG using simple regex (TypeScript export)
const match = configContent.match(/export const APP_CONFIG = \{[\s\S]+?\}/);
if (!match) {
  console.error('❌ Could not find APP_CONFIG in app.config.ts');
  process.exit(1);
}

// Parse the configuration object (simple evaluation)
const appConfig = eval('(' + match[0].replace('export const APP_CONFIG = ', '') + ')');

console.log('🚀 Generating app configuration from centralized settings...');
console.log('App Name: ' + appConfig.displayName);
console.log('Package ID: ' + appConfig.packageId);

// Update package.json name if needed
try {
  const packageJson = require('../package.json');
  if (packageJson.name !== appConfig.packageName) {
    packageJson.name = appConfig.packageName;
    writeFileSync(
      resolve(__dirname, '../package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('Updated package.json name');
  }
} catch (error) {
  console.error('Could not update package.json:', error.message);
}

// Update capacitor.config.json if needed
try {
  const capacitorPath = resolve(__dirname, '../capacitor.config.json');
  const capacitorConfig = JSON.parse(readFileSync(capacitorPath, 'utf8'));
  let updated = false;
  if (capacitorConfig.appId !== appConfig.packageId) {
    capacitorConfig.appId = appConfig.packageId;
    updated = true;
  }
  if (capacitorConfig.appName !== appConfig.displayName) {
    capacitorConfig.appName = appConfig.displayName;
    updated = true;
  }
  if (updated) {
    writeFileSync(capacitorPath, JSON.stringify(capacitorConfig, null, 2) + '\n');
    console.log('Updated capacitor.config.json');
  }
} catch (error) {
  console.error('Could not update capacitor.config.json:', error.message);
}

// Update android/app/build.gradle applicationId if needed
try {
  const gradlePath = resolve(__dirname, '../android/app/build.gradle');
  if (require('fs').existsSync(gradlePath)) {
    let gradleContent = readFileSync(gradlePath, 'utf8');
    const updatedGradle = gradleContent.replace(
      /applicationId\s+"com\.forge\.fitness"/,
      `applicationId "${appConfig.packageId}"`
    );
    if (updatedGradle !== gradleContent) {
      writeFileSync(gradlePath, updatedGradle);
      console.log('Updated android/app/build.gradle applicationId');
    }
  }
} catch (error) {
  console.error('Could not update build.gradle:', error.message);
}

console.log('Configuration generation complete!');