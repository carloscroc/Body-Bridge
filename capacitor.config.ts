import type { CapacitorConfig } from '@capacitor/cli';

// Load app configuration from environment variables
const appName = import.meta.env.VITE_APP_NAME || 'Body Bridge Fitness';
const appId = import.meta.env.VITE_APP_ID || 'com.bodybridge.fitness';

const config: CapacitorConfig = {
  appId: appId,
  appName: appName,
  webDir: 'dist'
};

export default config;
