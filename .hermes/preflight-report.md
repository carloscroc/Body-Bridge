# Convex Preflight Report

**Generated:** 2026-07-23
**Environment:** Body-Bridge project

## 1. Convex CLI Version

```
npx convex --version
```

**Result:** `1.42.1`

## 2. Convex Run --deployment Flag

```
npx convex run --help
```

The `--deployment` flag accepts:
- **Deployment name**: `joyful-capybara-123`
- **Deployment reference**: `dev/james`, `staging`
- **Special identifiers**:
  - `dev` - personal dev deployment
  - `prod` - project's default production deployment
  - `local` - local dev deployment
- **Cross-project access**:
  - `project-slug:reference`
  - `team-slug:project-slug:reference`

**Usage example:**
```bash
npx convex run myFunction --deployment dev
npx convex run myFunction --deployment staging
npx convex run myFunction --deployment prod
```

## 3. Functions in test_internal_harness.ts

### Exported Functions:

1. **`testCanonicalDuplicateWithSharedHelper`** (internalMutation)
   - Tests canonical duplicate prevention using shared helper
   - Validates production duplicate prevention logic
   - Args: `testNameMarker: v.string()`
   - Returns comprehensive test results with verdict

2. **`testTrainerAssignmentIdempotency`** (internalMutation)
   - Tests trainer-assignment idempotency using shared helper
   - Validates production assignment logic's idempotent behavior
   - Args: none
   - Returns assignment verification results with cleanup verification

3. **`testVideoUrlValidation`** (internalMutation)
   - Video URL validation matrix test
   - Tests various URL formats against validation logic
   - Args: none
   - Returns validation test results for valid and invalid cases

4. **`getDatabaseCounts`** (query)
   - Get current database counts for verification
   - Args: none
   - Returns counts for exercises, trainers, and trainerExercises tables

## 4. Authorization Analysis

### 4.1 createTrainer (convex/trainers.ts)

**Location:** Lines 21-49

**Authorization Model:**
```typescript
function isAdminSecret(secret?: string): boolean {
  return typeof secret === "string" && secret === process.env.ADMIN_SCRIPT_SECRET;
}

// In handler:
if (!isAdminSecret(args.adminSecret)) {
  throw new Error("Unauthorized: createTrainer requires admin secret");
}
```

**Requirements:**
- **Admin secret** (via `args.adminSecret`)
- Must match `process.env.ADMIN_SCRIPT_SECRET`
- No trainer authentication required

**Access Level:** **ADMIN ONLY** (script-based admin gate)

### 4.2 createDraftExercise (convex/exercises.ts)

**Location:** Lines 172-187

**Authorization Model:**
```typescript
export const createDraftExercise = mutation({
  args: {
    name: v.string(),
    libraryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireTrainer(ctx);
    // ... rest of implementation
  },
});
```

**Requirements:**
- **Trainer authentication** (via `requireTrainer(ctx)`)
- No admin secret bypass
- Uses shared helper `createCanonicalExercise`

**Access Level:** **TRAINER ONLY** (authenticated users only)

### 4.3 publishExercise (convex/exercises.ts)

**Location:** Lines 193-231

**Authorization Model:**
```typescript
export const publishExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    publicationData: v.object({ ... }),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    // ... rest of implementation
  },
});
```

**Requirements:**
- **Trainer authentication** (via `requireTrainer(ctx)`)
- No admin secret bypass
- Validates exercise exists and is in draft state
- Updates exercise with publication data

**Access Level:** **TRAINER ONLY** (authenticated users only)

### 4.4 assignExerciseToTrainer (convex/trainerExercises.ts)

**Location:** Lines 310-358

**Authorization Model:**
```typescript
function isAdminSecret(secret?: string): boolean {
  return typeof secret === "string" && secret === process.env.ADMIN_SCRIPT_SECRET;
}

// In handler:
if (!isAdminSecret(args.adminSecret)) {
  throw new Error("Unauthorized: assignExerciseToTrainer requires admin secret.");
}
```

**Requirements:**
- **Admin secret** (via `args.adminSecret`)
- Must match `process.env.ADMIN_SCRIPT_SECRET`
- Validates video URL with comprehensive security checks
- Validates source field rules (notion requires sourceId)
- Uses shared helper `assignExerciseToTrainerHelper`

**Access Level:** **ADMIN ONLY** (script-based admin gate)

## 5. Authorization Pattern Summary

| Function | Auth Method | Access Level | Admin Bypass | Trainer Auth |
|----------|-------------|--------------|--------------|--------------|
| `createTrainer` | Admin Secret | ADMIN ONLY | ✅ | ❌ |
| `createDraftExercise` | `requireTrainer` | TRAINER ONLY | ❌ | ✅ |
| `publishExercise` | `requireTrainer` | TRAINER ONLY | ❌ | ✅ |
| `assignExerciseToTrainer` | Admin Secret | ADMIN ONLY | ✅ | ❌ |

## 6. Key Findings

### Security Model
1. **Dual Authorization Pattern**: The codebase uses two distinct authorization mechanisms:
   - **Admin Secret**: For administrative operations (`createTrainer`, `assignExerciseToTrainer`)
   - **Trainer Auth**: For trainer-facing operations (`createDraftExercise`, `publishExercise`)

2. **No Mixed Authorization**: Functions either require admin secret OR trainer auth, not both. This creates clear separation of concerns.

3. **Admin Operations**: Administrative functions are gated by `process.env.ADMIN_SCRIPT_SECRET`, intended for script-based operations (migrations, data seeding).

4. **Trainer Operations**: Trainer-facing functions use `requireTrainer(ctx)` which validates authenticated user sessions.

### Access Control Notes
- Admin secret functions are designed for **script-based** operations (migrations, seeding)
- Trainer auth functions are designed for **user-facing** operations (app UI)
- No function allows both authentication methods simultaneously
- Environment variable `ADMIN_SCRIPT_SECRET` is the single source of truth for admin access

### Testing Infrastructure
- Comprehensive test harness exists in `test_internal_harness.ts`
- Tests use shared production helpers (`createCanonicalExercise`, `assignExerciseToTrainerHelper`)
- Tests verify duplicate prevention, idempotency, and validation logic
- All test functions are `internalMutation` (not exposed to clients)

## 7. Final Verdict

**Status:** ✅ **PREFLIGHT PASSED**

**Summary:**
- Convex CLI is operational (version 1.42.1)
- Deployment targeting is flexible and well-documented
- Test infrastructure is comprehensive and production-verified
- Authorization patterns are clear and consistently implemented
- Security model properly separates admin vs trainer access

**No mutations or state changes were executed during this inspection.**
