#!/usr/bin/env node

/**
 * Post-test memory capture for Forge
 * Automatically captures test results and metrics
 */

const { MemoryHooks } = require('./memory-hooks');
const fs = require('fs');
const path = require('path');

async function captureTestMemory() {
  const hooks = new MemoryHooks();
  
  // Gather test information
  const testResults = {
    total: process.env.TEST_TOTAL || 0,
    passed: process.env.TEST_PASSED || 0,
    failed: process.env.TEST_FAILED || 0,
    skipped: process.env.TEST_SKIPPED || 0,
    coverage: process.env.TEST_COVERAGE || 0,
    duration: process.env.TEST_DURATION || 'unknown',
    testFiles: getTestFiles(),
    failures: getTestFailures(),
    timestamp: new Date().toISOString()
  };

  try {
    await hooks.onTestComplete(testResults);
    console.log('✅ Test memory captured successfully');
  } catch (error) {
    console.error('❌ Failed to capture test memory:', error.message);
    process.exit(1);
  }
}

function getTestFiles() {
  try {
    const testDir = path.join(process.cwd(), 'tests');
    if (fs.existsSync(testDir)) {
      return fs.readdirSync(testDir)
        .filter(file => file.endsWith('.test.js') || file.endsWith('.test.ts') || file.endsWith('.spec.js') || file.endsWith('.spec.ts'))
        .map(file => path.join('tests', file));
    }
  } catch (error) {
    // Ignore errors
  }
  return [];
}

function getTestFailures() {
  try {
    const resultsPath = path.join(process.cwd(), 'test-results');
    if (fs.existsSync(resultsPath)) {
      const resultsFile = path.join(resultsPath, 'results.json');
      if (fs.existsSync(resultsFile)) {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        return results.suites
          .flatMap(suite => suite.specs)
          .filter(spec => !spec.ok)
          .map(spec => spec.title);
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return [];
}

// Run if called directly
if (require.main === module) {
  captureTestMemory();
}

module.exports = { captureTestMemory };