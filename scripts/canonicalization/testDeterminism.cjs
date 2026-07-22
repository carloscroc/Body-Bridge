#!/usr/bin/env node
/**
 * Test deterministic plan generation
 *
 * This script verifies that running generatePlan.cjs multiple times
 * produces byte-for-byte identical output, proving determinism.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const WORKSPACE = path.join(__dirname, '../..');
const PLAN_FILE = path.join(WORKSPACE, 'convex/migrations/canonicalizationPlan.ts');
const BACKUP_FILE = path.join(WORKSPACE, 'convex/migrations/canonicalizationPlan.ts.backup');

console.log('=== Deterministic Plan Generation Test ===\n');

// Step 1: Backup current plan
if (fs.existsSync(PLAN_FILE)) {
  fs.copyFileSync(PLAN_FILE, BACKUP_FILE);
  console.log('✓ Backed up current plan');
}

// Step 2: Generate first time
console.log('\n[1/3] Generating plan (first run)...');
execSync('node scripts/canonicalization/generatePlan.cjs', { cwd: WORKSPACE });
const firstHash = crypto.createHash('sha256').update(fs.readFileSync(PLAN_FILE)).digest('hex');
const firstSize = fs.statSync(PLAN_FILE).size;
console.log(`  Hash: ${firstHash}`);
console.log(`  Size: ${firstSize} bytes`);

// Step 3: Generate second time
console.log('\n[2/3] Generating plan (second run)...');
execSync('node scripts/canonicalization/generatePlan.cjs', { cwd: WORKSPACE });
const secondHash = crypto.createHash('sha256').update(fs.readFileSync(PLAN_FILE)).digest('hex');
const secondSize = fs.statSync(PLAN_FILE).size;
console.log(`  Hash: ${secondHash}`);
console.log(`  Size: ${secondSize} bytes`);

// Step 4: Compare
console.log('\n[3/3] Comparing results...');
if (firstHash === secondHash && firstSize === secondSize) {
  console.log('✅ PASS: Plans are byte-for-byte identical');
  console.log('✅ Determinism verified');
  process.exit(0);
} else {
  console.log('❌ FAIL: Plans differ between runs');
  console.log(`  First hash:  ${firstHash}`);
  console.log(`  Second hash: ${secondHash}`);
  console.log(`  First size:  ${firstSize} bytes`);
  console.log(`  Second size: ${secondSize} bytes`);
  process.exit(1);
}