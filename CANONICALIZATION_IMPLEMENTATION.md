# Phase 2 Canonicalization Migration - Implementation Summary

## Task Completed

Implement Phase 2 canonicalization migration replacement with all 15 mandatory corrections.

## Files Created

### 1. Helper Module
- **convex/migrations/migrationHelpers.ts** - Authorization, logging, hashing, lock management, batch sizing

### 2. Canonicalization Scripts
- **scripts/canonicalization/generatePlan.cjs** - Deterministic plan generator from export data
- **scripts/canonicalization/analyzeExport.cjs** - Duplicate detection from production export
- **scripts/canonicalization/validatePlan.cjs** - Plan structure validation
- **scripts/canonicalization/package.json** - Script dependencies

### 3. Plan Module
- **convex/migrations/canonicalizationPlan.ts** - TypeScript plan module (replaces JSON)

## Files Modified

### 1. Schema
- **convex/schema.ts** - Added migrationState table with full field set and indexes

### 2. Gitignore
- **.gitignore** - Added temp_export_dir/ and temp_export.zip

## Files Replaced

### 1. Migration Implementation
- **convex/migrations/canonicalizeExercises.ts** - Complete rewrite with:
  - Internal/public function separation
  - Lock-based concurrency control
  - Bounded batch execution
  - Live-state validation
  - Complete relationship merge logic
  - Type-safe throughout

### 2. Plan Format
- **convex/migrations/canonicalizationMergePlan.json** - Deleted, replaced with TypeScript module

## 15 Mandatory Corrections Implemented

1. ✅ **Authorization**: Uses existing SECRET-ARGUMENT PATTERN (adminSecret optional string, compare against process.env.ADMIN_SCRIPT_SECRET) - See migrationHelpers.ts validateAdminSecret()

2. ✅ **Function types**: Queries for read-only (getCanonicalizationStateInternal, preflightInitInternal, analyzeGroupsPageInternal), internalMutation for state writes (initializeMigrationStateInternal, executeBatchInternal, etc.)

3. ✅ **Lock takeover**: Preserves progress, doesn't delete state row - See acquireLockInternal() with stale lock handling

4. ✅ **Lock token**: Generated once via generateLockToken(), returned to operator, never logged, rotated on takeover

5. ✅ **Batch manifest**: Stores FULL bounded manifest in migrationState table.batchManifest field

6. ✅ **Live-state validation**: Validates each batch's own preconditions before writes in executeBatchInternal()

7. ✅ **Direct reads**: Uses ctx.db.get(exerciseId) for known IDs throughout

8. ✅ **Async hash**: Fixed async/await patterns with explicit loops, no await in non-async callbacks - See hashString(), hashObject()

9. ✅ **Group IDs**: Generated from stable content (canonicalId + sorted duplicateIds + planVersion) via generateGroupId()

10. ✅ **Type-safe IDs**: Kept as strings, validated/cast at controlled boundary (as Id<'exercises'>)

11. ✅ **Canonical patch**: Complete typed structure CanonicalPatch, excludes trainer-specific fields (videoUrl, imageUrl, trainerFirstName/LastName, notionPageId)

12. ✅ **Relationship merge**: Complete field-by-field comparison in mergeTrainerExerciseRelationships() - videoUrl, isActive, notionPageId, sourceType, assignedAt, updatedAt all handled

13. ✅ **State detection**: Query all rows, fail on multiple, uses .collect() not .first() - See getCanonicalizationStateInternal()

14. ✅ **Bounded preflight**: Read-only page analysis (preflightInitInternal + analyzeGroupsPageInternal) + internal mutation to finalize (finalizePreflightInternal)

15. ✅ **Export handling**: Added to .gitignore, moved to C:/Users/thebe/body-bridge-exports-temp, not deleted

## Authorization Model

Public mutations accept adminSecret, delegate to internalMutation:
- validateAdminSecret() compares against process.env.ADMIN_SCRIPT_SECRET
- assertAdminSecret() throws if invalid
- Public wrapper pattern: canonicalizeExercises_initialize, canonicalizeExercises_preflight, etc.

## Convex Limits (Conservative Internal Budgets: 50%)

- 500ms execution time
- 8 MiB data read
- 8 MiB data written
- 16,000 documents scanned
- 2,000 index ranges read
- 8,000 documents written
- 8 MiB return value

Batch sizing via estimateBatchSize() ensures groups per batch respect these limits.

## Hash Separation

- groupsHash: Hash of plan groups (stable, deterministic)
- sourceSnapshotHash: Hash of export data
- livePreflightHash: Hash of live affected data at preflight time
- approvedPreflightHash: Hash of plan + manifest + livePreflightHash
- batchManifestHash: Hash of batch manifest

## Architecture

### Preflight
1. PreflightInit (internalQuery) - Quick checks
2. AnalyzeGroupsPage (internalQuery) - Paged group analysis (10 groups per page)
3. FinalizePreflight (internalMutation) - Store hashes, manifest, status

### Execution
1. Initialize migration state with lock
2. Run preflight to validate live state
3. Execute batches one at a time with live-state validation
4. Complete when all batches done

### Lock Management
- 30-minute timeout
- Automatic renewal on operation
- Stale lock takeover allowed
- Lock token generated once, returned to operator, never logged

## Deterministic Plan Generation

- Sort groups by groupId
- Sort duplicateIds within each group
- Sort object keys in JSON serialization
- Normalize arrays (sort and deduplicate)
- No Date.now() in hashed content
- Two runs against same snapshot = identical hash

## Next Steps (Not Done - Stop Before Deployment)

The implementation is complete but STOPPED before:
- Running npx convex deploy
- Running npx convex codegen
- Any migration execution
- Any Notion access

The code is ready for:
1. Running scripts to analyze production export
2. Generating plan from export
3. Validating plan structure
4. Reviewing and approving preflight
5. Executing batches in production (with proper authorization)

## Export Files Moved

Production export files have been moved to:
- C:/Users/thebe/body-bridge-exports-temp/temp_export_dir/
- C:/Users/thebe/body-bridge-exports-temp/temp_export.zip

These are outside the repository and not deleted.