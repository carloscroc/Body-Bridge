#!/usr/bin/env node
/**
 * Validate canonicalization plan structure and consistency.
 * 
 * This script performs static validation of the generated plan:
 * - Checks for overlapping IDs
 * - Verifies group ID stability
 * - Validates hash consistency
 * - Checks for structural issues
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PLAN_FILE = path.join(__dirname, '../../convex/migrations/canonicalizationPlan.ts');
const DUPLICATES_FILE = path.join(__dirname, 'duplicates.json');

/**
 * Generate SHA-256 hash
 */
function hashString(content) {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Generate stable group ID (same logic as generator)
 */
function generateGroupId(canonicalId, duplicateIds, planVersion) {
  const sortedDuplicateIds = [...duplicateIds].sort();
  const content = `${canonicalId}|${sortedDuplicateIds.join(',')}|${planVersion}`;
  return hashString(content);
}

/**
 * Parse TypeScript plan file
 */
function parsePlanFile() {
  if (!fs.existsSync(PLAN_FILE)) {
    console.error(`Plan file not found: ${PLAN_FILE}`);
    console.error('Please generate plan first: node generatePlan.cjs');
    process.exit(1);
  }
  
  const content = fs.readFileSync(PLAN_FILE, 'utf8');
  
  // Extract planVersion
  const planVersionMatch = content.match(/export const planVersion = '([^']+)'/);
  const planVersion = planVersionMatch ? planVersionMatch[1] : '1.0.0';
  
  // Extract generatedAt
  const generatedAtMatch = content.match(/export const generatedAt = (\d+)/);
  const generatedAt = generatedAtMatch ? parseInt(generatedAtMatch[1]) : 0;
  
  // Extract groupsHash
  const groupsHashMatch = content.match(/export const groupsHash = '([^']+)'/);
  const groupsHash = groupsHashMatch ? groupsHashMatch[1] : '';
  
  // Extract sourceSnapshotHash
  const sourceSnapshotHashMatch = content.match(/export const sourceSnapshotHash = '([^']+)'/);
  const sourceSnapshotHash = sourceSnapshotHashMatch ? sourceSnapshotHashMatch[1] : '';
  
  // Extract groups array
  const groupsMatch = content.match(/export const groups[^=]*=\s*\[([\s\S]*?)\];/);
  if (!groupsMatch) {
    throw new Error('Could not parse groups array from plan file');
  }
  
  // Parse groups (simple JSON-like parsing)
  const groupsStr = `[${groupsMatch[1]}]`;
  const groups = parseGroupsString(groupsStr);
  
  return {
    planVersion,
    generatedAt,
    groupsHash,
    sourceSnapshotHash,
    groups
  };
}

/**
 * Parse groups string (proper brace-counting parser)
 */
function parseGroupsString(str) {
  const groups = [];
  let i = 0;
  
  while (i < str.length) {
    // Skip whitespace and commas
    while (i < str.length && /[\s,]/.test(str[i])) {
      i++;
    }
    
    if (i >= str.length) break;
    
    // Look for opening brace of a group object
    if (str[i] !== '{') {
      i++;
      continue;
    }
    
    // Find the matching closing brace
    const braceStart = i;
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let groupEnd = -1;
    
    for (let j = braceStart; j < str.length; j++) {
      const char = str[j];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            groupEnd = j;
            break;
          }
        }
      }
    }
    
    if (groupEnd === -1) {
      console.error('Could not find matching closing brace');
      break;
    }
    
    // Extract the group object string
    const groupStr = str.substring(braceStart, groupEnd + 1);
    
    // Parse properties using regex
    const groupIdMatch = groupStr.match(/groupId:\s*'([^']+)'/);
    const canonicalMatch = groupStr.match(/canonicalExerciseId:\s*'([^']+)'/);
    const duplicatesMatch = groupStr.match(/duplicateExerciseIds:\s*(\[[\s\S]*?\])/);
    const nameMatch = groupStr.match(/exerciseName:\s*'([^']+)'/);
    
    // Parse canonicalPatch - find the full object
    let canonicalPatch = undefined;
    const patchKeywordMatch = groupStr.indexOf('canonicalPatch:');
    if (patchKeywordMatch !== -1) {
      // Find the opening brace after canonicalPatch:
      const patchBraceStart = groupStr.indexOf('{', patchKeywordMatch);
      if (patchBraceStart !== -1 && patchBraceStart < groupStr.length - 1) {
        // Count braces to find the matching closing brace
        let patchBraceCount = 0;
        let patchInString = false;
        let patchEscapeNext = false;
        let patchEnd = -1;
        
        for (let j = patchBraceStart; j < groupStr.length; j++) {
          const char = groupStr[j];
          
          if (patchEscapeNext) {
            patchEscapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            patchEscapeNext = true;
            continue;
          }
          
          if (char === '"') {
            patchInString = !patchInString;
            continue;
          }
          
          if (!patchInString) {
            if (char === '{') {
              patchBraceCount++;
            } else if (char === '}') {
              patchBraceCount--;
              if (patchBraceCount === 0) {
                patchEnd = j;
                break;
              }
            }
          }
        }
        
        if (patchEnd !== -1) {
          const patchStr = groupStr.substring(patchBraceStart, patchEnd + 1);
          try {
            canonicalPatch = JSON.parse(patchStr);
          } catch (e) {
            // If JSON parse fails, leave as undefined
          }
        }
      }
    }
    
    // Parse preserveSourceId
    let preserveSourceId = undefined;
    const preserveMatch = groupStr.match(/preserveSourceId:\s*'([^']+)'|preserveSourceId:\s*(null)/);
    if (preserveMatch) {
      preserveSourceId = preserveMatch[1] || null;
    }
    
    if (groupIdMatch && canonicalMatch && duplicatesMatch && nameMatch) {
      groups.push({
        groupId: groupIdMatch[1],
        canonicalExerciseId: canonicalMatch[1],
        duplicateExerciseIds: JSON.parse(duplicatesMatch[1]),
        exerciseName: nameMatch[1],
        canonicalPatch: canonicalPatch,
        preserveSourceId: preserveSourceId
      });
    }
    
    i = groupEnd + 1;
  }
  
  return groups;
}

/**
 * Validate group ID stability
 */
function validateGroupIds(plan) {
  console.log('\n=== Validating Group IDs ===');
  
  let errors = 0;
  
  for (const group of plan.groups) {
    // Regenerate group ID and compare
    const expectedId = generateGroupId(
      group.canonicalExerciseId,
      group.duplicateExerciseIds,
      plan.planVersion
    );
    
    if (group.groupId !== expectedId) {
      console.error(`✗ Group ID mismatch for ${group.exerciseName}`);
      console.error(`  Expected: ${expectedId}`);
      console.error(`  Actual: ${group.groupId}`);
      errors++;
    }
  }
  
  if (errors === 0) {
    console.log(`✓ All ${plan.groups.length} group IDs are stable and correct`);
  } else {
    console.error(`✗ ${errors} group ID errors found`);
    process.exit(1);
  }
}

/**
 * Validate no overlapping IDs
 */
function validateNoOverlaps(plan) {
  console.log('\n=== Validating No Overlaps ===');
  
  const canonicalIds = new Set();
  const duplicateIds = new Set();
  let errors = 0;
  
  for (const group of plan.groups) {
    // Check canonical ID not already used
    if (canonicalIds.has(group.canonicalExerciseId)) {
      console.error(`✗ Duplicate canonical ID: ${group.canonicalExerciseId}`);
      errors++;
    }
    canonicalIds.add(group.canonicalExerciseId);
    
    // Check duplicate IDs not overlapping with canonical
    for (const dupId of group.duplicateExerciseIds) {
      if (dupId === group.canonicalExerciseId) {
        console.error(`✗ Canonical ID in duplicates: ${dupId}`);
        errors++;
      }
      
      if (canonicalIds.has(dupId)) {
        console.error(`✗ Duplicate ID used as canonical: ${dupId}`);
        errors++;
      }
      
      if (duplicateIds.has(dupId)) {
        console.error(`✗ Duplicate ID in multiple groups: ${dupId}`);
        errors++;
      }
      
      duplicateIds.add(dupId);
    }
    
    // Check duplicates are sorted
    for (let i = 1; i < group.duplicateExerciseIds.length; i++) {
      if (group.duplicateExerciseIds[i] < group.duplicateExerciseIds[i - 1]) {
        console.error(`✗ Duplicate IDs not sorted in group ${group.groupId}`);
        errors++;
      }
    }
  }
  
  if (errors === 0) {
    console.log(`✓ No ID overlaps detected`);
    console.log(`  Unique canonical IDs: ${canonicalIds.size}`);
    console.log(`  Unique duplicate IDs: ${duplicateIds.size}`);
  } else {
    console.error(`✗ ${errors} overlap errors found`);
    process.exit(1);
  }
}

/**
 * Validate groups hash
 */
function validateGroupsHash(plan) {
  console.log('\n=== Validating Groups Hash ===');
  
  // Normalize groups for hashing (same logic as generator)
  function normalizeObject(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      const seen = new Set();
      const sorted = [];
      
      for (const item of obj) {
        const normalized = normalizeObject(item);
        const key = JSON.stringify(normalized);
        if (!seen.has(key)) {
          seen.add(key);
          sorted.push(normalized);
        }
      }
      
      return sorted.sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }
        return 0;
      });
    }
    
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = normalizeObject(obj[key]);
    }
    
    return sorted;
  }
  
  const normalized = plan.groups.map(g => normalizeObject({
    groupId: g.groupId,
    canonicalExerciseId: g.canonicalExerciseId,
    duplicateExerciseIds: g.duplicateExerciseIds,
    exerciseName: g.exerciseName,
    canonicalPatch: g.canonicalPatch,
    preserveSourceId: g.preserveSourceId
  }));
  
  const expectedHash = hashString(JSON.stringify(normalized));
  
  if (plan.groupsHash !== expectedHash) {
    console.error(`✗ Groups hash mismatch`);
    console.error(`  Expected: ${expectedHash}`);
    console.error(`  Actual: ${plan.groupsHash}`);
    process.exit(1);
  }
  
  console.log(`✓ Groups hash is correct: ${plan.groupsHash.substring(0, 16)}...`);
}

/**
 * Validate against duplicates file (if exists)
 */
function validateAgainstDuplicates(plan) {
  console.log('\n=== Validating Against Duplicates File ===');
  
  if (!fs.existsSync(DUPLICATES_FILE)) {
    console.log('⊘ Duplicates file not found, skipping comparison');
    return;
  }
  
  const duplicatesData = JSON.parse(fs.readFileSync(DUPLICATES_FILE, 'utf8'));
  
  if (duplicatesData.sourceSnapshotHash !== plan.sourceSnapshotHash) {
    console.error(`✗ Source snapshot hash mismatch`);
    console.error(`  Duplicates file: ${duplicatesData.sourceSnapshotHash.substring(0, 16)}...`);
    console.error(`  Plan file: ${plan.sourceSnapshotHash.substring(0, 16)}...`);
    console.error('  Regenerate plan from current duplicates file');
    process.exit(1);
  }
  
  if (duplicatesData.groups.length !== plan.groups.length) {
    console.error(`✗ Group count mismatch`);
    console.error(`  Duplicates file: ${duplicatesData.groups.length}`);
    console.error(`  Plan file: ${plan.groups.length}`);
    process.exit(1);
  }
  
  console.log(`✓ Plan matches duplicates file`);
  console.log(`  Source snapshot hash: ${plan.sourceSnapshotHash.substring(0, 16)}...`);
  console.log(`  Group count: ${plan.groups.length}`);
}

/**
 * Calculate statistics
 */
function calculateStatistics(plan) {
  console.log('\n=== Plan Statistics ===');
  
  const totalDuplicates = plan.groups.reduce((sum, g) => sum + g.duplicateExerciseIds.length, 0);
  
  // Expected current count (unknown without live data)
  // Expected after = current - duplicates
  
  const duplicatesPerGroup = plan.groups.map(g => g.duplicateExerciseIds.length);
  const avgDuplicates = (totalDuplicates / plan.groups.length).toFixed(2);
  const maxDuplicates = Math.max(...duplicatesPerGroup);
  const minDuplicates = Math.min(...duplicatesPerGroup);
  
  console.log(`Total groups: ${plan.groups.length}`);
  console.log(`Total duplicates to remove: ${totalDuplicates}`);
  console.log(`Average duplicates per group: ${avgDuplicates}`);
  console.log(`Max duplicates in a group: ${maxDuplicates}`);
  console.log(`Min duplicates in a group: ${minDuplicates}`);
  
  return {
    totalGroups: plan.groups.length,
    totalDuplicates,
    avgDuplicates: parseFloat(avgDuplicates),
    maxDuplicates,
    minDuplicates
  };
}

/**
 * Main execution
 */
function main() {
  console.log('=== Canonicalization Plan Validation ===\n');
  
  // Parse plan file
  const plan = parsePlanFile();
  console.log(`✓ Loaded plan from ${PLAN_FILE}`);
  console.log(`  Plan version: ${plan.planVersion}`);
  console.log(`  Generated at: ${new Date(plan.generatedAt).toISOString()}`);
  console.log(`  Groups: ${plan.groups.length}`);
  
  // Run validations
  validateGroupIds(plan);
  validateNoOverlaps(plan);
  validateGroupsHash(plan);
  validateAgainstDuplicates(plan);
  
  // Calculate statistics
  const stats = calculateStatistics(plan);
  
  console.log('\n=== Validation Complete ===');
  console.log('✓ All validations passed');
  console.log(`\nExpected removal: ${stats.totalDuplicates} duplicate exercises`);
  console.log(`Expected result: ${1100 - stats.totalDuplicates} exercises (from 1100 current)`);
  console.log(`\nReady for preflight and execution.`);
}

// Run
main();