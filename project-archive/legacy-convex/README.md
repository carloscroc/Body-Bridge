# Legacy Convex Archive

This directory contains archived Convex functions and modules that were removed from the active backend during the fresh cloud deployment to dev/thebest-croc (upbeat-chickadee-781).

## Archived Files

### jasmine.ts
- **Purpose:** Jasmine Hensley-specific exercise queries and seeding mutation
- **Removed Reason:** Hardcoded trainer identity conflicts with fresh-start requirement
- **Dependencies:** None (standalone)
- **Active Frontend References:** None after cleanup

### migrations/
- **canonicalizeExercises.ts:** Exercise deduplication and canonicalization logic
- **canonicalizationPlan.ts:** Migration plan configuration
- **migrateJasmineLegacy.ts:** Jasmine Hensley legacy migration
- **migrationHelpers.ts:** Migration utility functions
- **migrations.ts.bak:** Backup file
- **Removed Reason:** One-time migration tools, not runtime functions
- **Dependencies:** exercises schema, trainers table
- **Active Frontend References:** None

### setExerciseDefaults.ts
- **Purpose:** Bulk mutation to backfill exercise default values (isActive, sourceSystem)
- **Removed Reason:** Assumes exercises already exist; conflicts with empty library goal
- **Dependencies:** exercises table
- **Active Frontend References:** None

### updateExercisesDefaults.ts
- **Purpose:** Update exercise default values in batch
- **Removed Reason:** Same as setExerciseDefaults.ts
- **Dependencies:** exercises table
- **Active Frontend References:** None

### seedCommunity.ts
- **Purpose:** Bulk seed sample social posts, comments, likes, follows
- **Removed Reason:** Auto-seeding conflicts with fresh-start requirement
- **Dependencies:** profiles, socialPosts, socialComments, socialLikes, socialFollows, groupMembers
- **Active Frontend References:** None after cleanup

### seedNotifications.ts
- **Purpose:** Auto-seed notification records for testing
- **Removed Reason:** Auto-seeding conflicts with fresh-start requirement
- **Dependencies:** profiles, notifications, socialPosts
- **Active Frontend References:** None after cleanup

## Exercise Schema After Cleanup

The new deployment starts with:
- Zero exercise records in `exercises` table
- Zero trainer exercise assignments in `trainerExercises` table
- No trainer records until manually created via authenticated mutations

## Authentication

- Provider: Convex Auth with Password provider
- No additional secrets required
- `CONVEX_SITE_URL` is provided automatically by Convex Cloud
- No `ADMIN_SCRIPT_SECRET` by default (can be added later if needed)

## Deployment Target

- Project: Body Bridge Fitness
- Development deployment: dev/thebest-croc
- URL: https://upbeat-chickadee-781.convex.cloud
- Old local deployment (local:local-thebest_croc-fitness_03cc8-2) remains untouched

## Migration Reference

If needed, these archived files can be inspected to understand how data was structured and migrated. Do NOT re-deploy these files without careful review and explicit approval.
