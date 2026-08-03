# OpenCode Mission — Make Jasmine's 6 Notion Exercises Visible in the App

## GOAL

End-to-end: get the 6 Jasmine Hensley seed exercises into the **cloud** Convex database
(deployment `upbeat-chickadee-781`), with **real video URLs from Notion** (not Unsplash
placeholders), and **prove visually** that the user can navigate to the exercise library
and see them.

User has been explicit:
- Video URLs MUST live in the Convex database, NEVER hardcoded in code.
- Only exercises with a valid video URL are visible in the app.
- OpenCode has access to Notion via `NOTION_API_KEY` (in `.env.local` or environment).
- User will keep adding more exercises this way as they create videos — so the flow we build
  must work for the next 100 as easily as for these 6.

## REPOSITORY

`C:\Users\thebe\Downloads\Body-Bridge`

## CURRENT STATE (verified before delegation)

| Component | Status |
|---|---|
| `trainerExercises` table | ✅ Defined in `convex/schema.ts` |
| `trainers` table | ✅ Defined; 1 trainer exists (Jasmine) on cloud |
| `trainers.by_active` index | ✅ Defined |
| `trainerExercises.listExercisesForTrainer` query | ✅ Implemented (returns only `isActive:true` AND non-empty `videoUrl`) |
| `trainerExercises.assignExerciseToTrainer` mutation | ✅ Idempotent (via `by_trainer_exercise` index) |
| Frontend `ExercisesView.tsx` | ✅ Calls `listExercisesForTrainer` (no hardcoded trainer name) |
| Frontend `ExercisePicker.tsx` | ✅ Calls `listExercisesForTrainer` |
| Cloud DB (`upbeat-chickadee-781`) | Database empty (0/0/0 from last cleanup) |
| Convex Auth | ❌ BROKEN — `JWT_PRIVATE_KEY` is not valid PKCS#8 (last error: `pkcs8 must be PKCS#8 formatted string`). User CANNOT sign up/sign in. |
| Local Convex deployment | ❌ Obsolete (`local:local-thebest_croc-body_bridge_fitness-2`) — do not touch |
| Notion access | ✅ `NOTION_API_KEY` is configured |

## PHASE 1 — READ-ONLY INVESTIGATION (DO NOT MODIFY ANYTHING)

OpenCode must inspect the current repo and database state, then produce a complete
diagnosis report before writing a single line of code or running any mutation.

### 1.1 Files to inspect

- `convex/schema.ts` — full schema (especially `exercises`, `trainers`, `trainerExercises`).
- `convex/trainers.ts` — `createTrainer`, `getActiveTrainer`, etc.
- `convex/trainerExercises.ts` — `listExercisesForTrainer`, `assignExerciseToTrainer`,
  `unassignExerciseFromTrainer`, helpers `isVisibleAssignment`,
  `mergeExerciseWithAssignment`.
- `convex/jasmine.ts` — the 6 seeded exercises (name, libraryId, defaults).
- `convex/migrations/migrateJasmineLegacy.ts` — full migration code.
- `convex/notion.ts` — Notion integration helpers.
- `convex/auth.ts` — auth configuration.
- `convex.config.ts` and `convex.config.js` — current config.
- `src/screens/ExercisesView.tsx` — frontend wiring of `listExercisesForTrainer`.
- `src/components/ExercisePicker.tsx` — frontend wiring.
- `src/screens/ExerciseDetail.tsx` (or equivalent) — modal that plays video.
- `src/index.css` — `scrim-overlay` and any other relevant styles.
- `.env.local` (NAMES ONLY — never values) for: `CONVEX_DEPLOY_KEY`,
  `VITE_CONVEX_URL`, `ADMIN_SCRIPT_SECRET`, `NOTION_API_KEY`,
  `NOTION_ACCESS_TOKEN`, `JWT_PRIVATE_KEY`.
- `convex/_generated/api.d.ts` — confirm what public/internal functions exist.
- `convex/test_internal_harness.ts` — note what test harnesses exist; we may need a
  small new one but NO public cleanup mutation.

### 1.2 Database state to query (READ-ONLY)

Every Convex command below MUST explicitly target `--deployment upbeat-chickadee-781`.
Report each command and its raw response. Do NOT mutate anything in Phase 1.

```bash
cd C:\Users\thebe\Downloads\Body-Bridge

# Trainer table
npx convex run --inline-query 'return await ctx.db.query("trainers").collect();' \
  --deployment upbeat-chickadee-781

# Canonical exercises
npx convex run --inline-query 'return await ctx.db.query("exercises").collect();' \
  --deployment upbeat-chickadee-781

# Existing trainerExercises
npx convex run --inline-query 'return await ctx.db.query("trainerExercises").collect();' \
  --deployment upbeat-chickadee-781
```

### 1.3 Notion investigation

```bash
# Verify NOTION_API_KEY works (do NOT print the value)
echo "Notion key length: ${#NOTION_API_KEY}"

# List accessible databases
curl -s -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property": "object", "value": "database"}}'
```

Find the Notion database that contains Jasmine's 6 exercises. Likely candidates:
- "Exercise Library" (ID was `dfe11066-43af-4297-9a97-05da2b4b384c` in earlier sessions —
  but access may have changed).
- Any new databases added since.

For each candidate, query the 6 exercise names:
- Goblet Squat
- Plank Hold
- Walking Lunge
- Bent-Over Row
- Overhead Press
- Romanian Deadlift

For each match, report:
- Notion page ID
- Notion page title (verify exact spelling/casing vs the seed `libraryId`)
- `⭐Video` URL (the property the user pointed at)
- Any other useful properties (`Name`, `Description`, `Instructions`, `Difficulty`,
  `Muscle Group`, `Equipment`, etc.)

If a page has NO `⭐Video`, record it as `null` — do NOT fabricate or substitute.

If a Notion page is missing entirely, record it as `NOT_FOUND`.

### 1.4 Phase 1 required report (write to `.hermes/phase1-diagnosis.md`)

```
## 1. CURRENT DATABASE STATE
- trainers: [list]
- exercises: [count + sample names]
- trainerExercises: [count + any non-zero entries]

## 2. NOTION DATABASE IDENTIFIED
- Database ID:
- Database title:
- Search filter used:
- Total pages in database:

## 3. THE 6 EXERCISES — NOTION MATCH TABLE
| Seed libraryId     | Notion title   | Notion page ID | ⭐Video URL | Other useful props |
| ---                | ---            | ---            | ---         | ---                |
| jasmine-squat      |                |                |             |                    |
| jasmine-plank      |                |                |             |                    |
| jasmine-lunge      |                |                |             |                    |
| jasmine-row        |                |                |             |                    |
| jasmine-press      |                |                |             |                    |
| jasmine-deadlift   |                |                |             |                    |

## 4. AUTH STATUS
- JWT_PRIVATE_KEY present in env: YES/NO
- Last auth error observed (if known): ...
- Can we register a test account? (test and report; do NOT keep the account — delete if
  created.)

## 5. EXACT FILES TOUCHED IN THIS PHASE
- (read-only, none expected)

## 6. RECOMMENDATION
- Continue to Phase 2 / Block with reason
```

Stop after Phase 1. Wait for Hermes review before proceeding to Phase 2.

---

## PHASE 2 — IMPLEMENTATION (DO NOT START WITHOUT HERMES APPROVAL OF PHASE 1)

The authorized scope for Phase 2 is small and explicit. Do not touch unrelated files.

### 2.1 Seed the canonical exercises (only ones with a real Notion URL)

For each Notion-matched exercise with a non-empty `⭐Video` URL:

1. Insert into the **canonical `exercises` table** via an `internalMutation` (NOT a public
   mutation). Reuse the existing shared helper that the harness uses — find it in
   `convex/exercises.ts` or `convex/test_internal_harness.ts`. Do NOT duplicate auth
   logic.
2. Use a **stable `libraryId`** that matches the seed exactly (`jasmine-squat`,
   `jasmine-plank`, etc.) so the frontend filter and trainer mapping remain
   consistent.
3. Use a normalized `name` exactly matching the seed.
4. If the canonical seed in `convex/jasmine.ts` already had `imageUrl: <unsplash>`,
   prefer the Notion-provided value if present; otherwise keep the Unsplash URL (it's
   just an image; the user's rule is about **video URLs**).

The seed function MUST be idempotent (delete prior `sourceSystem: "notion"` rows for
Jasmine before re-inserting, or use a `unique()` index lookup).

### 2.2 Insert the trainer assignment rows

For each canonical exercise just created:

1. Look up the active trainer (`trainers.by_active` index, `isActive: true`).
2. Insert a row into `trainerExercises` with:
   - `trainerId`: the active trainer
   - `exerciseId`: the canonical exercise just created
   - `videoUrl`: the **real Notion `⭐Video` URL** (this is the only authoritative source)
   - `sourceType`: `"notion"`
   - `notionPageId`: the Notion page ID
   - `isActive`: `true`
   - `assignedAt`: now
   - `updatedAt`: now
3. The existing `assignExerciseToTrainer` mutation is already idempotent. Use it.
4. Provide the `adminSecret` from the dev deployment environment. DO NOT print the
   secret value anywhere — only verify presence with `npx convex env list --names-only`.

### 2.3 Exercises that have NO Notion URL

For any of the 6 seeds that were NOT found in Notion or had no `⭐Video`:
- Do NOT create the canonical exercise.
- Do NOT create the trainerExercises row.
- Document them as "deferred" in the Phase 2 report. User will add Notion videos later.

### 2.4 Verify database state after seeding

```bash
# Trainers (should still be 1)
npx convex run --inline-query \
  'return await ctx.db.query("trainers").collect();' \
  --deployment upbeat-chickadee-781

# Canonical exercises (should be 0 to 6 depending on Notion matches)
npx convex run --inline-query \
  'return await ctx.db.query("exercises").collect();' \
  --deployment upbeat-chickadee-781

# trainerExercises (should match: 1 per Notion-matched exercise)
npx convex run --inline-query \
  'return await ctx.db.query("trainerExercises").collect();' \
  --deployment upbeat-chickadee-781
```

Also run a sanity check that the visible-assignments list query works:

```bash
npx convex run trainerExercises:listExercisesForTrainer \
  '{}' --deployment upbeat-chickadee-781
```

The response should contain ONLY exercises with `videoUrl` set and
`isActive: true`.

### 2.5 Frontend smoke test (with auth workaround)

Convex Auth is broken (`JWT_PRIVATE_KEY` invalid PKCS#8). Options to make the library
visible to the user:

**Option A — Fix the auth key** (best, but may exceed scope)
- Inspect how `JWT_PRIVATE_KEY` is loaded. If it's stored as the literal string
  `"pkcs8..."` (placeholder), ask the user for a real PKCS#8 PEM key OR generate a
  fresh dev-only key via `@convex-dev/auth` setup and replace the env var.
- Only do this if a clear path is identified. Otherwise stop and report BLOCKER.

**Option B — Bypass auth for this verification only** (acceptable for ONE-OFF test)
- Find a way for the frontend to call `listExercisesForTrainer` without a logged-in user
  (the query may already be public-readable; check `convex/trainerExercises.ts`).
- If it is public, the user can navigate directly to the library screen without
  signing in.
- If it requires auth, the auth fix in Option A is the only path.

**Recommendation:** Try Option B first. If the query is public, we don't need auth at
all for this single-record test — the user said the priority is "see exercises in the
app". Auth fix can come later. If the query requires auth, document the blocker
clearly and STOP (do NOT improvise a workaround that bypasses the schema).

### 2.6 Visual verification (MANDATORY)

Once the database is populated:

1. Start the dev stack:
   ```bash
   cd C:\Users\thebe\Downloads\Body-Bridge
   npm run dev:app
   ```
   (Use the `dev:app` script per our memory, NOT `npm run dev` which corrupts
   `.env.local`.)

2. Confirm Vite is reachable:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
   ```

3. Use Playwright (via `npx playwright test` or a small inline script) to:
   - Open `http://localhost:5173/`
   - Navigate to the exercise library
   - Capture a screenshot of the library page with exercises visible
   - Click on one exercise (any of the 6) to open the detail modal
   - Capture a screenshot showing the video player (or at least the play button)
   - **If the video actually plays**, capture a frame mid-playback

4. Save all screenshots under `C:\Users\thebe\Downloads\Body-Bridge\.hermes\screenshots\exercise-library\`
   with timestamped filenames.

5. Save the Playwright network log to
   `.hermes/screenshots/exercise-library/network.log` and confirm each Convex request
   targeted `upbeat-chickadee-781.convex.cloud`.

6. Pass the screenshots + Playwright script path back to Hermes for auxiliary-vision
   review.

### 2.7 Cleanup of any test artifacts

If any temporary test trainer or exercise was created during auth or visual
verification, clean it up using the safe internal-mutation cleanup helper. Do NOT
leave orphan rows. Final cloud database state should be:
- `trainers`: 1 (Jasmine)
- `exercises`: 0–6 (only Notion-matched ones)
- `trainerExercises`: same count as canonical exercises

DO NOT clean up the 6 exercises themselves — they ARE the deliverable.

---

## ABSOLUTE RULES (re-stated for safety)

- DO NOT modify production code paths outside the 6-exercise seed flow.
- DO NOT delete data from the canonical `exercises` table other than previous
  `sourceSystem: "notion"` rows for Jasmine (cleanup-before-seed).
- DO NOT touch `JWT_PRIVATE_KEY` or other auth env vars unless explicitly fixing
  Option A above.
- DO NOT touch the obsolete local Convex deployment.
- DO NOT modify `package.json`, `package-lock.json`, `convex.config.ts`, or
  `tsconfig.json` unless the implementation requires it AND Hermes has approved the
  change in advance.
- DO NOT commit, push, or open a PR.
- DO NOT expose `NOTION_API_KEY`, `ADMIN_SCRIPT_SECRET`, or `JWT_PRIVATE_KEY` values
  in any file, log, or output.
- DO NOT hardcode any URL in `convex/*.ts`, `src/**/*.tsx`, or `src/**/*.ts`.
- DO NOT add a public cleanup mutation. Internal mutations only.
- DO NOT include `coverImageUrl` if it doesn't exist in `trainerExercises` schema yet
  (separate concern; flag it but don't fix unless Hermes approves).

## REQUIRED FINAL REPORT

Save to `.hermes/phase2-implementation-report.md`:

```
## PHASE 2 — IMPLEMENTATION REPORT

### STEP 1: NOTION URLS COLLECTED
- Goblet Squat: <url or "NOT_FOUND" or "NO_VIDEO">
- Plank Hold: ...
- Walking Lunge: ...
- Bent-Over Row: ...
- Overhead Press: ...
- Romanian Deadlift: ...

### STEP 2: DATABASE SEEDED
- canonical exercises created: [list of libraryIds]
- trainerExercises rows created: [list of trainer+exercise pairs]
- deferred (no Notion URL): [list]

### STEP 3: AUTH STATUS
- ListExercisesForTrainer is public-readable: YES/NO
- If NO, blocker is: ...
- If YES, no auth workaround needed.

### STEP 4: FRONTEND SMOKE
- Vite on :5173: PASS/FAIL
- Library page reachable: PASS/FAIL
- Number of exercise cards visible: N
- Detail modal opens on click: PASS/FAIL
- Video play button visible: PASS/FAIL
- Video actually plays: PASS/FAIL/BLOCKED

### STEP 5: SCREENSHOTS
- Screenshot 1 path:
- Screenshot 2 path:
- Screenshot 3 path:

### STEP 6: CLEANUP
- Temporary test records removed: [list or "none created"]

### FILES MODIFIED
- [list of every file touched]

### GIT STATUS
[output of `git status --short` and `git diff --stat`]

### BLOCKERS / OPEN ITEMS
- [list]

### FINAL VERDICT
ONE OF:
- READY FOR HUMAN REVIEW — exercises visible in app, video URLs from Notion
- BLOCKED — auth query requires login (cannot test without fixing auth)
- BLOCKED — Notion database has no ⭐Video URLs yet for X exercises
```

End mission with the verdict. Do not claim success without all of the above.
