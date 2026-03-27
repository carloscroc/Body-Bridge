/**
 * Backfill script: populate `exerciseUsage` from `workoutLogs`.
 *
 * Reads all workoutLogs (per-user via existing queries), aggregates counts per
 * (userId, exerciseId), and upserts into exerciseUsage.
 *
 * Idempotent: sets counts to computed totals (does not blindly increment).
 *
 * Usage:
 *   node scripts/backfillExerciseUsage.js --dry-run [--limit N]
 *   node scripts/backfillExerciseUsage.js [--limit N]
 *
 * Env vars (required):
 *   ADMIN_SCRIPT_SECRET  – passed to fetchExercises for admin bypass
 *   VITE_CONVEX_URL / CONVEX_URL – Convex deployment URL
 *
 * Env vars (optional, needed for write mode):
 *   CONVEX_DEPLOY_KEY – deploy key for admin auth (required for profile
 *                       discovery and writes)
 */

import dotenv from "dotenv";
import path from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getConvexUrl() {
  const url = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) throw new Error("Missing Convex URL. Set VITE_CONVEX_URL or CONVEX_URL.");
  return url;
}

function getAdminSecret() {
  const secret = process.env.ADMIN_SCRIPT_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SCRIPT_SECRET env var.");
  return secret;
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { dryRun: false, limit: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") {
      args.dryRun = true;
    } else if (a === "--limit") {
      const v = argv[i + 1];
      i += 1;
      args.limit = v ? Number(v) : null;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Convex HTTP helpers
// ---------------------------------------------------------------------------

/** Create an admin-auth ConvexHttpClient (deploy key required). */
function getAdminClient(convexUrl) {
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) return null;
  const client = new ConvexHttpClient(convexUrl);
  client.setAdminAuth(deployKey);
  return client;
}

#NB|/** Fetch all exercises using the admin secret bypass. */
#ZY|async function fetchAllExercises(convexUrl) {
#KP|  const client = new ConvexHttpClient(convexUrl);
#PW|  return await client.query(api.exercises.list, {
#MV|    adminSecret: getAdminSecret(),
#PN|  });
#KV|}

async function fetchAllExercises(convexUrl) {
  const client = new ConvexHttpClient(convexUrl);
  return await client.query(api.exercises.fetchExercises, {
    adminSecret: getAdminSecret(),
  });
}

/**
 * Call a Convex query via the REST API (no auth — works for public functions
 * that don't check identity, like getClientWorkoutLogs).
 */
async function restQuery(convexUrl, fnPath, fnArgs = {}) {
  const res = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args: fnArgs, format: "json" }),
  });
  const data = await res.json();
  if (data.status === "error") {
    throw new Error(`Query ${fnPath} failed: ${data.errorMessage}`);
  }
  return data.value;
}

// ---------------------------------------------------------------------------
// Exercise resolution: build identifier maps
// ---------------------------------------------------------------------------

function buildExerciseMaps(exercises) {
  /** @type {Map<string, true>} docId -> true (validates direct IDs) */
  const byDocId = new Map();
  /** @type {Map<string, string>} libraryId -> docId */
  const byLibraryId = new Map();

  for (const ex of exercises) {
    byDocId.set(ex._id, true);
    if (ex.libraryId) {
      byLibraryId.set(ex.libraryId, ex._id);
    }
  }
  return { byDocId, byLibraryId };
}

/**
 * Resolve exerciseId from a raw exercise object in a workoutLog.
 * Mirrors the precedence logic in `createWorkoutLog` (convex/progress.ts):
 *   1. Direct doc IDs: exerciseId, _id, id (if a valid exercises doc ID)
 *   2. Library ID fallback: libraryId, or id treated as libraryId
 *
 * @returns {string|null} The exercises doc _id, or null if unresolvable.
 */
function resolveExerciseId(rawExercise, exerciseMaps) {
  if (!rawExercise || typeof rawExercise !== "object") return null;

  const { byDocId, byLibraryId } = exerciseMaps;

  // 1. Try direct document IDs
  const directCandidates = [
    rawExercise.exerciseId,
    rawExercise._id,
    rawExercise.id,
  ].filter((v) => typeof v === "string");

  for (const cand of directCandidates) {
    if (byDocId.has(cand)) return cand;
  }

  // 2. Fallback to libraryId lookup
  const libraryId =
    rawExercise.libraryId ??
    (typeof rawExercise.id === "string" ? rawExercise.id : undefined);

  if (typeof libraryId === "string" && byLibraryId.has(libraryId)) {
    return byLibraryId.get(libraryId);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Profile discovery
// ---------------------------------------------------------------------------

/**
 * Discover profile IDs.
 * - With admin client (deploy key): call listPublicProfiles with auth bypass.
 * - Without: extract coachIds from exercises as seed (best-effort).
 */
async function discoverProfileIds(convexUrl, adminClient, exercises) {
  if (adminClient) {
    console.log("[backfill] Using deploy key to list profiles...");
    const profiles = await adminClient.query(api.profiles.listPublicProfiles, {
      limit: 200,
    });
    return profiles.map((p) => p._id);
  }

  // Fallback: collect coachIds from exercises as seed profile IDs
  console.log("[backfill] No CONVEX_DEPLOY_KEY — discovering profiles from exercise coachIds...");
  const seedIds = new Set();
  for (const ex of exercises) {
    if (ex.coachId) seedIds.add(ex.coachId);
  }
  return [...seedIds];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const convexUrl = getConvexUrl();
  const adminClient = getAdminClient(convexUrl);

  console.log(`[backfill] dryRun=${args.dryRun} limit=${args.limit}`);

  // Step 1: Fetch all exercises → build resolution maps.
  console.log("[backfill] Fetching exercises...");
  const exercises = await fetchAllExercises(convexUrl);
  const exerciseMaps = buildExerciseMaps(exercises);
  console.log(
    `[backfill] ${exercises.length} exercises loaded ` +
    `(${exerciseMaps.byLibraryId.size} with libraryId)`,
  );

  // Step 2: Discover profile IDs.
  const allProfileIds = await discoverProfileIds(convexUrl, adminClient, exercises);
  if (allProfileIds.length === 0) {
    console.warn("[backfill] No profile IDs found. Nothing to backfill.");
    return;
  }
  console.log(`[backfill] ${allProfileIds.length} profiles discovered`);

  // Step 3: Fetch workoutLogs per user and aggregate (userId, exerciseId) → count.
  const usageCounts = new Map(); // key: "userId|exerciseId" → count
  let totalLogs = 0;
  let totalExercisesResolved = 0;
  let skippedExercises = 0;

  const profilesToProcess = args.limit
    ? allProfileIds.slice(0, args.limit)
    : allProfileIds;

  console.log(`[backfill] Processing ${profilesToProcess.length} profiles...`);

  for (let i = 0; i < profilesToProcess.length; i++) {
    const profileId = profilesToProcess[i];
    let logs;

    try {
      // getClientWorkoutLogs has no auth check — works with plain REST call
      // or via admin client.
      if (adminClient) {
        logs = await adminClient.query(api.progress.getClientWorkoutLogs, {
          clientId: profileId,
        });
      } else {
        logs = await restQuery(convexUrl, "progress:getClientWorkoutLogs", {
          clientId: profileId,
        });
      }
    } catch (err) {
      console.warn(`[backfill] Failed to fetch logs for ${profileId}: ${err.message}`);
      continue;
    }

    if (!Array.isArray(logs) || logs.length === 0) continue;
    totalLogs += logs.length;

    for (const log of logs) {
      if (!Array.isArray(log.exercises)) continue;
      for (const rawExercise of log.exercises) {
        const exerciseId = resolveExerciseId(rawExercise, exerciseMaps);
        if (!exerciseId) {
          skippedExercises++;
          continue;
        }
        const key = `${profileId}|${exerciseId}`;
        usageCounts.set(key, (usageCounts.get(key) || 0) + 1);
        totalExercisesResolved++;
      }
    }

    if ((i + 1) % 10 === 0 || i === profilesToProcess.length - 1) {
      console.log(`[backfill]   ${i + 1}/${profilesToProcess.length} profiles`);
    }
  }

  console.log("[backfill] Aggregation complete:");
  console.log(`  workoutLogs scanned:  ${totalLogs}`);
  console.log(`  exercises resolved:   ${totalExercisesResolved}`);
  console.log(`  exercises skipped:    ${skippedExercises}`);
  console.log(`  unique (user,ex) pairs: ${usageCounts.size}`);

  // Step 4: Dry-run or write.
  if (args.dryRun) {
    console.log("[backfill] DRY RUN — no mutations applied.");
    const entries = [...usageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [key, count] of entries) {
      const [userId, exerciseId] = key.split("|");
      console.log(`  userId=${userId} exerciseId=${exerciseId} count=${count}`);
    }
    if (usageCounts.size > 20) {
      console.log(`  ... and ${usageCounts.size - 20} more`);
    }
    return;
  }

  // Write mode: export computed data as JSONL and use `npx convex import`
  // to replace the exerciseUsage table. This is idempotent — re-running
  // produces the same result since we compute absolute counts.
  if (usageCounts.size === 0) {
    console.log("[backfill] No usage data to write.");
    return;
  }

  const tmpFile = path.resolve(process.cwd(), ".backfill-exerciseUsage.jsonl");
  try {
    // Build JSONL rows
    const lines = [];
    for (const [key, count] of usageCounts) {
      const [userId, exerciseId] = key.split("|");
      lines.push(JSON.stringify({ userId, exerciseId, count }));
    }
    writeFileSync(tmpFile, lines.join("\n") + "\n", "utf-8");
    console.log(`[backfill] Wrote ${lines.length} rows to ${tmpFile}`);

    // Run convex import to replace the table contents.
    // --replace: clear and re-populate (idempotent).
    // --table: target table name.
    console.log("[backfill] Running: npx convex import --table exerciseUsage --replace ...");
    execSync(
      `npx convex import --table exerciseUsage --replace --yes "${tmpFile}"`,
      { stdio: "inherit", cwd: process.cwd() },
    );
    console.log("[backfill] Import complete.");
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tmpFile);
    } catch {
      // ignore
    }
  }
}

await main();
