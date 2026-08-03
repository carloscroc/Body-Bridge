# Mission 1 — Repair and Complete the Harness Locally

## REPOSITORY
C:\Users\thebe\Downloads\Body-Bridge

## MODEL
zai-coding-plan/glm-4.7

## SCOPE
Modify ONLY: `convex/test_internal_harness.ts`
Do NOT modify any other source file.
Do NOT push functions during this mission.
Do NOT touch database or deployment.

---

## A. Review the Current 310-Line Patch

Before editing, inspect the diff added by the failed mission.

### Required Report:
1. Exact functions added (names and line counts)
2. Duplicate logic (if any)
3. Whether shared helpers already exist
4. Whether the patch can be simplified
5. Whether it tests the real authorization implementation or duplicates it

### Instructions:
- Do NOT preserve unnecessary code merely because it already exists
- Remove duplicates if shared helpers exist
- Simplify if possible
- Ensure the harness calls the REAL shared authorization implementation

---

## B. Complete the Required Authorization Matrix

The assignment authorization harness must test:

1. **Missing admin secret** (when argument validation permits)
2. **Empty admin secret**
3. **Incorrect admin secret**
4. **Correct admin secret**
5. **Repeated correct assignment** (idempotency)

### Expected Behavior:

| Condition | Expected Result | Assignment Created |
|-----------|-----------------|---------------------|
| Missing secret | Rejected (error) | No |
| Empty secret | Rejected (error) | No |
| Incorrect secret | Rejected (error) | No |
| Correct secret (first) | `created` | Yes |
| Correct secret (second) | `updated` | No (idempotent) |

**Idempotency Verification:**
- First correct assignment returns `created`
- Second correct assignment returns `updated`
- Both correct calls use the SAME assignment ID
- Exactly ONE assignment exists before cleanup

### CRITICAL REQUIREMENT:

The harness MUST call the SAME shared implementation used by:
`trainerExercises.assignExerciseToTrainer`

**Do NOT** copy the authorization comparison into the harness.

**If** the public mutation does not expose a reusable helper, extract the smallest shared helper into the appropriate active Convex module and REPORT that broader source change BEFORE making it.

---

## C. Cleanup Safety

`cleanupTestTrainerByMarker` MUST:

1. Require a **precise marker** (string argument)
2. Identify **exactly one trainer**
3. Refuse zero or multiple matches (unless returning no-op result for zero is documented)
4. Verify the trainer is **unmistakably a test record**
5. Remove dependent test assignments FIRST
6. Refuse to delete unrelated dependencies
7. Delete using **exact record IDs**
8. Return structured before-and-after evidence

### Safety Boundary Requirements:

- A substring like `email.includes("test_")` ALONE is NOT sufficient
- Prefer **exact expected email construction** and **exact equality**
- Use strict pattern matching for test markers
- Throw safety violation error for non-test records

### Exact Email Patterns (recommended):
- `test_auth_${testMarker}@test.local` (authorization tests)
- `test${testMarker}@verification.local` (harness tests)

Do NOT accept broader patterns like `email.startsWith("test_")` without additional verification.

---

## D. Resolve the Typecheck Blocker

Investigate the four missing nodemailer transport module diagnostics.

### Required Investigation:

1. Run and report:
   ```powershell
   npm ls @auth/core nodemailer @types/nodemailer
   ```

2. Inspect:
   - `package.json`
   - `package-lock.json`
   - Installed `@auth/core` package metadata
   - Whether nodemailer is a peer or optional dependency
   - Whether the errors existed BEFORE the harness patch
   - Whether they are caused by the recent React type dependency installation
   - Whether they arise ONLY in `convex/tsconfig.json`

### Resolution Requirements:

- Do NOT install a package merely to silence diagnostics
- Apply the **smallest correct dependency or configuration correction** only if supported by package metadata
- Do NOT use:
  - `@ts-ignore`
  - Path shims for modules that should exist
  - Broad module declarations
  - Disabling typechecking
  - Broader exclusions

---

## E. Local Validation

Run separately and report results:

```powershell
npx tsc --noEmit -p convex/tsconfig.json
npx convex typecheck
```

**Both must exit 0.**

Do NOT push or run Convex functions yet.

---

## MISSION 1 REPORT

Return:

1. Files modified (should be only `convex/test_internal_harness.ts`)
2. Before-and-after harness line count
3. Exact authorization cases implemented (all 5 conditions)
4. Proof the shared real authorization logic is exercised (not duplicated)
5. Exact cleanup safety rules (strict pattern matching)
6. Proven cause of the nodemailer diagnostics
7. Exact correction applied (if any)
8. Typecheck command evidence (both commands, exit codes)
9. Git status (should show only `convex/test_internal_harness.ts` modified)
10. Confirmation that no database or deployment was touched

---

## FINAL VERDICT (exactly one):

`HARNESS LOCAL VALIDATION: PASS — READY TO PUSH TO DEVELOPMENT`

`HARNESS LOCAL VALIDATION: FAIL — CORRECTIONS REQUIRED`

---

## NEXT STEP (if PASS)

Proceed to Mission 2 (push to authoritative development) with:
`npx convex dev --once --env-file <temporary-env-file>`