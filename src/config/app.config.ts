/**
 * Centralized App Configuration
 * This file provides a single source of truth for all app naming across platforms
 */

export const APP_CONFIG = {
  // Display name (shown in UI)
  displayName: 'Body Bridge Fitness',

  // Short name (for code references, file names, etc.)
  shortName: 'BodyBridge',

  // Package/identifier names
  packageId: 'com.bodybridge.fitness',
  packageName: 'body-bridge-fitness',

  // URL scheme
  urlScheme: 'bodybridge',

  // Variations
  appName: 'Body Bridge Fitness',
  appTitle: 'Body Bridge Fitness',
} as const;

export default APP_CONFIG;