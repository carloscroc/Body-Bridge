#!/usr/bin/env node

/**
 * Post-build memory capture for Forge
 * Automatically captures build results and metrics
 */

import { MemoryHooks } from './memory-hooks.js';
import fs from 'fs';
import path from 'path';

async function captureBuildMemory() {
  const hooks = new MemoryHooks();
  
  // Gather build information
  const buildResults = {
    success: true,
    duration: process.env.BUILD_DURATION || 'unknown',
    warnings: process.env.BUILD_WARNINGS || 0,
    errors: process.env.BUILD_ERRORS || 0,
    bundleSize: getBundleSize(),
    timestamp: new Date().toISOString()
  };

  try {
    await hooks.onBuildComplete(buildResults);
    console.log('✅ Build memory captured successfully');
  } catch (error) {
    console.error('❌ Failed to capture build memory:', error.message);
    process.exit(1);
  }
}

function getBundleSize() {
  try {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      const stats = fs.statSync(distPath);
      return (stats.size / 1024 / 1024).toFixed(2) + ' MB';
    }
  } catch (error) {
    // Ignore errors
  }
  return 'unknown';
}

// Run if called directly
import { pathToFileURL } from 'url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  captureBuildMemory();
}

export { captureBuildMemory };