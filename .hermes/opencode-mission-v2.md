# OpenCode Mission v3 — Seed All 51 Notion Exercises into Convex

## PHASE 1 — COMPLETE (VERIFIED BY HERMES)

- `.hermes/notion-with-videos.json` verified — 51 exercises, all with real YouTube URLs
- Schema sample confirmed: all 51 have `notionPageId`, `title`, `videoUrl`, `bodyRegion[]`, `equipment[]`, `musclesUsed[]`, `instructions`, `videoDescription`, `coverPhoto[]`
- Duplicate video URL flagged: `Shoulder External Rotation` and `Shoulder Internal Rotation` share same URL — user acknowledged
- User decision: **seed ALL 51 exercises now**, keep adding as more videos are created

## PHASE 2 — CONVEX SEEDING (NOW AUTHORIZED)

### 2.1 Extend `createCanonicalExercise` helper

The current helper (`convex/lib/sharedHelpers.ts`, lines 39-76) only accepts `name`, `libraryId`, `lifecycle`. It needs to accept ALL fields from Notion:

**New signature (extend `createCanonicalExercise`):**

```typescript
export async function createCanonicalExercise(
  ctx: MutationCtx,
  args: {
    name: string;
    libraryId?: string;
    lifecycle?: "draft" | "ready" | "archived";

    // NEW: Notion fields
    sourceSystem: "notion" | "manual";
    sourceId?: string;
    category?: string;           // e.g., "Mobility", "Strength", "SMR"
    bodyRegion?: string[];       // e.g., ["Shoulder", "Scapula"]
    primaryMuscles?: string[];   // mapped from musclesUsed
    secondaryMuscles?: string[];
    equipment?: string[];        // e.g., ["Bodyweight", "Foam Roller"]
    difficulty?: "Beginner" | "Intermediate" | "Advanced";
    overview?: string;           // videoDescription
    instructions?: string;
    coverPhoto?: string[];       // from coverPhoto[]
  }
): Promise<Id<"exercises">>
```

**Idempotency change:**

Line 64-66 currently throws:
```typescript
if (existing) {
  throw new Error(`Exercise with libraryId "${libraryId}" already exists`);
}
```

Change to return existing row instead (for re-sync idempotency):
```typescript
if (existing) {
  // Optional: patch missing fields if they were added later
  return existing._id;
}
```

**Also check by sourceSystem+sourceId** (double dedup):
```typescript
const existingBySource = await ctx.db
  .query("exercises")
  .withIndex("by_sourceSystem_sourceId", (q) =>
    q.eq("sourceSystem", args.sourceSystem).eq("sourceId", args.sourceId)
  )
  .first();

if (existingBySource) {
  return existingBySource._id;
}
```

(Note: if `by_sourceSystem_sourceId` index doesn't exist, you'll need to add it to schema — query-only, no user data risk.)

### 2.2 Map Notion data to Convex

For each entry in `.hermes/notion-with-videos.json`:

| Notion field | Convex field | Mapping logic |
|---|---|---|
| `title` | `name` | verbatim |
| (none) | `libraryId` | `normalizeToLibraryId(title)` |
| (none) | `sourceSystem` | `"notion"` |
| `notionPageId` | `sourceId` | `"notion:" + notionPageId` |
| `movementGoal` | `category` | `"Mobility"` if `movementGoal === "Mobility"`, else `"Strength"` default |
| `bodyRegion[]` | `bodyRegion[]` | keep raw array values (anatomical: Shoulder, Scapula, etc.) |
| `musclesUsed[]` | `primaryMuscles[]` | first 3 muscles, rest go to `secondaryMuscles[]` |
| `equipment[]` | `equipment[]` | keep raw; if null, default `["Bodyweight"]` |
| `level[0]` | `difficulty` | map `"Beginner" | "Intermediate" | "Advanced"`; if null, default `"Beginner"` |
| `videoDescription` | `overview` | first 200 chars, keep full in `instructions` |
| `instructions` | `instructions` | verbatim (full text) |
| `coverPhoto[]` | `coverPhoto[]` | keep first URL only |
| (none) | `lifecycle` | `"ready"` (has video URL) |

### 2.3 Pre-flight check

Capture current DB counts:
```bash
npx convex run test_internal_harness:getDatabaseCounts '{}' \
  --deployment upbeat-chickadee-781
```

Save to `.hermes/phase2-pre-counts.json`.

If `trainers === 0`, create one trainer via internal mutation:
```typescript
firstName: "Jasmine",
lastName: "Trainer",
fullName: "Jasmine Trainer",
email: "jasmine@bodybridge.fitness",
isActive: true
```

### 2.4 Sync loop

Create a new internal mutation `convex/notion.ts` (add file) with:

```typescript
import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { createCanonicalExercise, assignExerciseToTrainerHelper } from "./lib/sharedHelpers";

export const syncNotionExerciseLibrary = internalMutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    // Verify admin secret
    if (args.adminSecret !== process.env.ADMIN_SCRIPT_SECRET) {
      throw new Error("Invalid admin secret");
    }

    // Load the prepared Notion data (read from filesystem — this runs server-side)
    const fs = await import("fs");
    const path = await import("path");
    const notionData = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), ".hermes/notion-with-videos.json"),
        "utf8"
      )
    );

    // Get active trainer (assuming single for now)
    const trainers = await ctx.db.query("trainers").collect();
    const activeTrainer = trainers.find((t) => t.isActive);
    if (!activeTrainer) {
      throw new Error("No active trainer found");
    }

    const results = { created: 0, updated: 0, errors: [] };

    for (const entry of notionData) {
      try {
        // Create canonical exercise (idempotent)
        const exerciseId = await createCanonicalExercise(ctx, {
          name: entry.title,
          sourceSystem: "notion",
          sourceId: `notion:${entry.notionPageId}`,
          category: entry.movementGoal || "Mobility",
          bodyRegion: entry.bodyRegion,
          primaryMuscles: entry.musclesUsed?.slice(0, 3),
          secondaryMuscles: entry.musclesUsed?.slice(3),
          equipment: entry.equipment || ["Bodyweight"],
          difficulty: entry.level?.[0] || "Beginner",
          overview: entry.videoDescription?.slice(0, 200),
          instructions: entry.instructions,
          coverPhoto: entry.coverPhoto?.slice(0, 1),
          lifecycle: "ready",
        });

        // Assign to trainer (idempotent via helper)
        const assignment = await assignExerciseToTrainerHelper(ctx, {
          trainerId: activeTrainer._id,
          exerciseId,
          videoUrl: entry.videoUrl,
          sourceSystem: "notion",
          sourceId: entry.notionPageId,
        });

        if (assignment.status === "created") results.created++;
        else results.updated++;
      } catch (e) {
        results.errors.push({ exercise: entry.title, error: String(e) });
      }
    }

    return results;
  },
});
```

Run it:
```bash
npx convex run notion:syncNotionExerciseLibrary '{"adminSecret":"<ADMIN_SCRIPT_SECRET>"}' \
  --deployment upbeat-chickadee-781
```

### 2.5 Post-sync verification

```bash
# Counts after sync
npx convex run test_internal_harness:getDatabaseCounts '{}' \
  --deployment upbeat-chickadee-781 > .hermes/phase2-post-counts.json

# Query the same frontend uses
npx convex run trainerExercises:listExercisesForTrainer '{}' \
  --deployment upbeat-chickadee-781 > .hermes/phase2-query-result.json
```

Verify:
- `exercises === 51`
- `trainerExercises === 51`
- `trainers === 1`
- `queryResult` has 51 items, all with non-null `videoUrl` and `isActive: true`
- No duplicate `libraryId` values in `queryResult`
- No duplicate `sourceId` values in `queryResult`

### 2.6 IDEMPOTENCY RE-RUN TEST

Run the sync a SECOND TIME:
```bash
npx convex run notion:syncNotionExerciseLibrary '{"adminSecret":"<ADMIN_SCRIPT_SECRET>"}' \
  --deployment upbeat-chickadee-781 > .hermes/phase2-rerun-result.json
```

Expected result: `{ created: 0, updated: 0, errors: [] }` — everything already exists, zero new rows.

Verify counts are identical to `phase2-post-counts.json`.

### 2.7 Frontend visual verification

Start dev stack:
```bash
cd C:\Users\thebe\Downloads\Body-Bridge
npm run dev:app
```

Wait for Vite reachable:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```
Expect `200`.

**Try auth-less path first:**

If `listExercisesForTrainer` is public-readable (check schema for `.withIndex("by_trainer_exercise", ...)` — if no auth check, it's public), navigate directly to library:

```bash
# Use Playwright or browser automation to navigate to library route
# Expected route: /exercises or /library (check App.tsx routing)
```

Capture screenshots to `.hermes/screenshots/library-v2/`:
- `library-list.png` — list of exercise cards (expect 51 cards)
- `exercise-detail-modal.png` — click one card, show detail modal with video player
- `video-playing.png` — video actually playing (if reachable)

**If query requires auth and auth is broken:**

Report BLOCKER. Do NOT bypass auth or create fake users. The seeding work is done; only visual verification is blocked.

### 2.8 Final report template

Save to `.hermes/phase2-v3-report.md`:

```markdown
## PHASE 2 — IMPLEMENTATION REPORT

### 0. EXECUTION SUMMARY
- Total exercises synced: 51 / 51
- Canonical rows created: N
- trainerExercises rows created: N
- Idempotency re-run: created: 0, updated: 0, errors: [] (PASS)

### 1. PRE-FLIGHT COUNTS
- exercises: N
- trainers: N
- trainerExercises: N

### 2. HELPER EXTENSIONS
- `createCanonicalExercise` extended to accept sourceSystem, sourceId, category, bodyRegion, primaryMuscles, secondaryMuscles, equipment, difficulty, overview, instructions, coverPhoto
- Idempotency changed: returns existing instead of throwing
- Double dedup: checks (libraryId) AND (sourceSystem, sourceId)
- Index added: by_sourceSystem_sourceId (if needed)

### 3. SYNC RESULTS
- Created canonical rows: N
- Updated canonical rows: N (from existing)
- Created trainerExercises rows: N
- Updated trainerExercises rows: N
- Errors: 0

### 4. POST-FLIGHT COUNTS
- exercises: 51
- trainers: 1
- trainerExercises: 51

### 5. QUERY VERIFICATION
- listExercisesForTrainer returned: 51 items
- All have non-null videoUrl: YES
- All have isActive: true: YES
- No duplicate libraryId: YES
- No duplicate sourceId: YES

### 6. IDEMPOTENCY RE-RUN
- Second sync result: { created: 0, updated: 0, errors: [] }
- Counts unchanged: YES

### 7. FRONTEND VERIFICATION
- Vite on :5173: PASS/FAIL
- Library page reachable: PASS/FAIL
- Auth required: YES/NO
- Cards visible: N (expected 51)
- Detail modal opens: PASS/FAIL
- Video player visible: PASS/FAIL
- Video actually plays: PASS/FAIL/BLOCKED
- Screenshots: [paths]

### 8. FILES MODIFIED
[git status --short + git diff --stat]

### 9. BLOCKERS / OPEN ITEMS
- None / [exact issue]

### 10. FINAL VERDICT
ONE OF:
- READY FOR HUMAN REVIEW — 51 exercises seeded, visible in app, idempotent sync working
- PARTIAL — DB seeded and verified; frontend visual blocked by [exact reason]
- BLOCKED — [exact reason]
```

## ABSOLUTE RULES (SAME AS v2)

- Every Convex command MUST target `--deployment upbeat-chickadee-781`.
- DO NOT touch `.env.local`, `.env.production`, `JWT_PRIVATE_KEY`, `NOTION_API_KEY`, `ADMIN_SCRIPT_SECRET`.
- DO NOT touch the obsolete local Convex deployment.
- DO NOT hardcode any URL anywhere.
- DO NOT commit, push, or open PRs.
- DO NOT expose `NOTION_API_KEY`, `ADMIN_SCRIPT_SECRET`, or `JWT_PRIVATE_KEY` values.
- DO NOT create a public cleanup mutation; internal only.
- DO NOT touch `project-archive/legacy-convex/jasmine.ts`.
- DO NOT modify `package.json`, `package-lock.json`, `convex.config.ts`, `tsconfig.json`, or `vite.config.ts` unless required and approved.
- For Playwright use `npm run dev:app` (NOT `npm run dev`).
- Save screenshots to `.hermes/screenshots/library-v2/`.
- End with the verdict and the path to `.hermes/phase2-v3-report.md`.