# TypeScript Validation Commands - Body Bridge

## Validation Summary

This document explains exactly how TypeScript validation works for Body Bridge and provides the exact commands to run.

## Architecture Overview

Body Bridge has **two separate TypeScript environments**:

1. **Frontend (src/)** - Uses `tsconfig.json` (excludes convex/)
2. **Convex (convex/)** - Uses `convex/.eslintrc.js` (managed by Convex CLI)

## Key Finding: Convex Directory is EXCLUDED from tsconfig.json

```json
// tsconfig.json
{
  "exclude": [
    "convex/**/*.ts",
    "convex/**/*.tsx"
  ]
}
```

**This means:**
- `npx tsc --noEmit` does **NOT** validate convex/ files
- Convex files are validated by `npx convex codegen`
- Claims of "Convex passed npx tsc" are **false**

---

## Exact Validation Commands

### 1. Frontend/Source TypeScript (src/)

**Command:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx tsc --noEmit --skipLibCheck
```

**What it validates:**
- `src/` directory (React components, hooks, utilities)
- `server/` directory (Express.js backend)
- `scripts/` directory (build and deployment scripts)
- `tools/` directory (if present)

**Uses:** `tsconfig.json`

**Expected output:**
```
(Empty or "Found 0 errors" if successful)
```

---

### 2. Convex Source and Generated Types

**Command:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx convex codegen
```

**What it validates:**
- `convex/` directory (schema, queries, mutations, actions)
- Generates `_generated/` types
- Runs TypeScript check on Convex files
- Validates function signatures against schema

**Uses:** Convex's internal TypeScript config (not visible in repo)

**Expected output:**
```
Finding component definitions...
Generating server code...
Bundling component definitions...
Bundling component schemas and implementations...
Downloading current deployment state...
Uploading functions to Convex...
Generating TypeScript bindings...
Running TypeScript...
✓ Typecheck passed: `tsc --noEmit` completed with exit code 0.
```

---

### 3. Application Build

**Command:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npm run build
```

**What it validates:**
- Full production bundle compilation
- Frontend TypeScript (via Vite)
- Imports from generated Convex types
- React component tree
- No runtime type errors

**Expected output:**
```
✓ built in X.XXs
```

---

### 4. Utility Scripts and Tools

**Scripts validation:**
```bash
cd C:/Users/thebe/Downloads/Body-Bridge
npx tsc --noEmit --skipLibCheck scripts/**/*.js tools/**/*.js
```

**What it validates:**
- `scripts/` directory (build scripts, deployment scripts)
- `tools/` directory (if present)

**Uses:** `tsconfig.json`

**Note:** Most scripts are `.js` files with JSDoc comments, not TypeScript.

---

## Verification Workflow (Complete)

### Before Deployment

1. **Convex validation:**
   ```bash
   npx convex codegen
   ```
   Must pass with exit code 0.

2. **Frontend validation:**
   ```bash
   npx tsc --noEmit --skipLibCheck
   ```
   Must pass with exit code 0.

3. **Build validation:**
   ```bash
   npm run build
   ```
   Must complete successfully.

4. **Deployment:**
   ```bash
   npx convex dev --once
   ```
   Must complete successfully targeting `dev/thebest-croc`.

---

## Common Error Patterns

### Convex TypeScript Errors

**Symptom:** `npx convex codegen` reports TypeScript errors

**Cause:**
- Schema field reference doesn't exist
- Invalid argument validators
- Missing imports
- Type mismatches

**Fix:** Update schema, remove invalid field references, fix imports

### Frontend TypeScript Errors

**Symptom:** `npx tsc --noEmit` reports errors in `src/`

**Cause:**
- Missing Convex type references
- Invalid component props
- Type mismatches

**Fix:** Run `npx convex codegen` first, then fix component types

### Build Errors

**Symptom:** `npm run build` fails

**Cause:**
- TypeScript errors not caught by earlier checks
- Vite configuration issues
- Import path problems

**Fix:** Run both validation commands first, then fix build issues

---

## TypeScript Classification

When schema changes cause TypeScript errors, classify and prioritize:

1. **Active application source (src/)** - FIX immediately
   - Blocks frontend builds and runtime
   - Example: Missing imports, type mismatches in components

2. **Active Convex source (convex/)** - FIX immediately
   - Blocks Convex codegen and deployment
   - Example: Invalid argument validators, field references to deleted schema

3. **Deployment/build tooling** - FIX if blocking deployment
   - Scripts or tools referenced by package.json

4. **Archived or one-off scripts** - DOCUMENT or EXCLUDE
   - Create separate tsconfig or exclude from main build

---

## Defect 6 Resolution

**Problem Statement:** "Do NOT claim Convex directory passed npx tsc --noEmit if tsconfig.json excludes it."

**Resolution:**
- Documented that `tsconfig.json` explicitly excludes `convex/**/*.ts`
- Identified exact commands for each validation environment
- Clarified that Convex validation is done by `npx convex codegen`, not `npx tsc`

**Exact Commands:**
1. Frontend: `npx tsc --noEmit --skipLibCheck` (excludes convex/)
2. Convex: `npx convex codegen` (validates convex/ only)
3. Build: `npm run build` (validates entire production bundle)

**Conclusion:**
- `npx tsc --noEmit` will NEVER validate convex/ files due to exclusion
- Convex files are validated by `npx convex codegen` only
- Claims of "Convex passed tsc" are false and misleading