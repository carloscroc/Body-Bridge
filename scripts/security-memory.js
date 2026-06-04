#!/usr/bin/env node

/**
 * Security memory capture for Forge
 * Automatically captures security scan results
 */

import { MemoryHooks } from './memory-hooks.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function captureSecurityMemory() {
  const hooks = new MemoryHooks();
  
  // Run security scan and capture results
  const scanResults = await runSecurityScan();
  
  try {
    await hooks.onSecurityScan(scanResults);
    console.log('✅ Security memory captured successfully');
  } catch (error) {
    console.error('❌ Failed to capture security memory:', error.message);
    process.exit(1);
  }
}

async function runSecurityScan() {
  const startTime = Date.now();
  
  try {
    // Run semgrep scan
    const output = execSync('semgrep --config p/security-audit --json src convex', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const results = JSON.parse(output);
    const duration = (Date.now() - startTime) / 1000;
    
    // Count vulnerabilities by severity
    const vulnerabilities = {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0
    };
    
    results.results?.forEach(result => {
      const severity = result.extra?.metadata?.severity || 'unknown';
      if (vulnerabilities[severity] !== undefined) {
        vulnerabilities[severity]++;
      }
    });
    
    return {
      tool: 'semgrep',
      duration: duration.toFixed(2),
      total: results.results?.length || 0,
      ...vulnerabilities,
      details: formatSecurityDetails(results)
    };
  } catch (error) {
    // If scan fails, return error results
    return {
      tool: 'semgrep',
      duration: ((Date.now() - startTime) / 1000).toFixed(2),
      total: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      error: error.message,
      details: 'Security scan failed'
    };
  }
}

function formatSecurityDetails(results) {
  if (!results.results || results.results.length === 0) {
    return 'No vulnerabilities found';
  }
  
  const details = results.results.map(result => {
    const checkId = result.check_id || 'unknown';
    const path = result.path || 'unknown';
    const message = result.extra?.message || 'No message';
    const severity = result.extra?.metadata?.severity || 'unknown';
    
    return `[${severity.toUpperCase()}] ${checkId}\n  File: ${path}\n  Message: ${message}`;
  });
  
  return details.join('\n\n');
}

// Run if called directly
import { pathToFileURL } from 'url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  captureSecurityMemory();
}

export { captureSecurityMemory };