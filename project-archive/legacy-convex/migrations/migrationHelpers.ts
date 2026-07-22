import { v } from 'convex/values';

/**
 * Authorization helpers for migration scripts.
 * Uses the existing secret-argument pattern from migrateJasmineLegacy.ts.
 */

/**
 * Validate admin secret against environment variable.
 * Mirrors the pattern in migrateJasmineLegacy.ts.
 */
export function validateAdminSecret(secret?: string): boolean {
  return typeof secret === 'string' && secret === process.env.ADMIN_SCRIPT_SECRET;
}

/**
 * Convex argument validator for admin secret (optional string).
 */
export const requireAdminSecret = v.object({
  adminSecret: v.optional(v.string()),
});

/**
 * Assert admin secret is valid, throwing if not.
 * Use in public mutation handlers to enforce authorization.
 */
export function assertAdminSecret(secret?: string): void {
  if (!validateAdminSecret(secret)) {
    throw new Error('Unauthorized: admin secret required.');
  }
}

/**
 * Migration logging helper.
 * Formats log messages consistently across migrations.
 */
export function logMigration(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [MIGRATION]`;
  const fullMessage = `${prefix} ${level.toUpperCase()}: ${message}`;
  
  // In Convex console.log/warn/error are available
  switch (level) {
    case 'warn':
      console.warn(fullMessage);
      break;
    case 'error':
      console.error(fullMessage);
      break;
    default:
      console.log(fullMessage);
  }
}

/**
 * Hashing utilities for migration state validation.
 * All hashes use SHA-256 for consistency.
 */

/**
 * Hash a string using SHA-256.
 * Returns hex-encoded hash string.
 */
export async function hashString(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash an object deterministically.
 * Sorts keys and normalizes arrays to ensure consistent hashing.
 */
export async function hashObject(obj: unknown): Promise<string> {
  const normalized = normalizeObject(obj);
  return hashString(JSON.stringify(normalized));
}

/**
 * Normalize an object for deterministic hashing.
 * - Sorts object keys alphabetically
 * - Sorts and deduplicates arrays
 * - Handles nested objects recursively
 */
function normalizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Sort and deduplicate array elements
    const seen = new Set();
    const sorted: unknown[] = [];
    for (const item of obj) {
      const normalized = normalizeObject(item);
      const key = JSON.stringify(normalized);
      if (!seen.has(key)) {
        seen.add(key);
        sorted.push(normalized);
      }
    }
    // Sort primitives, keep objects in order
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

  // Sort object keys
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = normalizeObject(obj[key as keyof typeof obj]);
  }
  return sorted;
}

/**
 * Generate a stable group ID from canonical exercise, duplicates, and plan version.
 * This ID is order-independent and deterministic.
 */
export async function generateGroupId(
  canonicalExerciseId: string,
  duplicateIds: string[],
  planVersion: string
): Promise<string> {
  const sortedDuplicateIds = [...duplicateIds].sort();
  const content = `${canonicalExerciseId}|${sortedDuplicateIds.join(',')}|${planVersion}`;
  return hashString(content);
}

/**
 * Generate a secure random lock token.
 * Used for migration lock management.
 */
export async function generateLockToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate that a lock token is secure (non-empty, reasonable length).
 */
export function isValidLockToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 32 && /^[a-f0-9]+$/.test(token);
}

/**
 * Calculate batch size estimates based on document counts.
 * Conservative estimates within Convex limits.
 */
export function estimateBatchSize(groupCount: number, avgDuplicatesPerGroup: number = 1): {
  readsPerBatch: number;
  writesPerBatch: number;
  recommendedBatchSize: number;
} {
  // Each group: 1 canonical read + avg duplicate reads + relationship reads
  const readsPerGroup = 1 + avgDuplicatesPerGroup + (avgDuplicatesPerGroup * 2);
  const writesPerGroup = avgDuplicatesPerGroup + (avgDuplicatesPerGroup * 2); // deletes + patches
  
  // Conservative: stay well under 50% of limits
  const maxReadsPerBatch = 4000;  // 50% of 8000
  const maxWritesPerBatch = 2000; // 50% of 4000
  
  const recommendedBatchSize = Math.min(
    Math.floor(maxReadsPerBatch / readsPerGroup),
    Math.floor(maxWritesPerBatch / writesPerGroup),
    20 // Cap at 20 groups per batch for safety
  );
  
  return {
    readsPerBatch: readsPerGroup * recommendedBatchSize,
    writesPerBatch: writesPerGroup * recommendedBatchSize,
    recommendedBatchSize,
  };
}