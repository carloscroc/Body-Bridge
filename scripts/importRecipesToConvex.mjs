#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { ConvexClient } from './scrapers/convex-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const CONVEX_PORT = parseInt(new URL(CONVEX_URL).port) || 3210;
const ADMIN_SECRET = process.env.ADMIN_SCRIPT_SECRET;

function isConvexUp() {
  return new Promise((resolve) => {
    const sock = net.createConnection({ port: CONVEX_PORT, host: '127.0.0.1' });
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
  });
}

async function ensureConvex() {
  if (await isConvexUp()) return;
  console.log('[convex] starting local backend...');
  spawn('npx', ['convex', 'dev', '--local', '--typecheck', 'disable'], {
    stdio: 'ignore',
    detached: false,
    shell: true,
  });
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    if (await isConvexUp()) return;
  }
  throw new Error('Convex failed to start');
}

async function importFile(filePath) {
  await ensureConvex();
  const client = new ConvexClient(CONVEX_URL, ADMIN_SECRET);
  const stream = fs.createReadStream(filePath, 'utf8');
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let imported = 0;
  let duplicates = 0;
  let failures = 0;
  let lineNo = 0;

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;

    let recipe;
    try {
      recipe = JSON.parse(line);
    } catch {
      failures++;
      continue;
    }

    let done = false;
    while (!done) {
      try {
        const dup = await client.checkDuplicate(recipe.source_url, recipe.recipe_title);
        if (dup) duplicates++;
        else {
          await client.createRecipe(recipe);
          imported++;
        }

        if (lineNo % 50 === 0) {
          console.log(`[import] ${path.basename(filePath)} line ${lineNo}: imported=${imported} dupes=${duplicates} failures=${failures}`);
        }
        done = true;
      } catch (err) {
        const msg = err?.message || String(err);
        if (msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET')) {
          console.log('[convex] connection lost, restarting and retrying...');
          await ensureConvex();
          continue;
        }
        failures++;
        console.log(`[import] failed ${path.basename(filePath)} line ${lineNo}: ${msg}`);
        done = true;
      }
    }
  }

  console.log(`\n${path.basename(filePath)} => imported=${imported} dupes=${duplicates} failures=${failures}`);
  return { imported, duplicates, failures };
}

async function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf('--dir');
  const fileIdx = args.indexOf('--file');
  const files = [];

  if (fileIdx >= 0) files.push(path.resolve(args[fileIdx + 1]));
  if (dirIdx >= 0) {
    const dir = path.resolve(args[dirIdx + 1]);
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.ndjson')) files.push(path.join(dir, name));
    }
  }

  if (!files.length) {
    console.log('Usage: node scripts/importRecipesToConvex.mjs --dir <dir> | --file <file>');
    process.exit(1);
  }

  let totals = { imported: 0, duplicates: 0, failures: 0 };
  for (const file of files) {
    const r = await importFile(file);
    totals.imported += r.imported;
    totals.duplicates += r.duplicates;
    totals.failures += r.failures;
  }

  console.log(`\nTOTAL imported=${totals.imported} dupes=${totals.duplicates} failures=${totals.failures}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
