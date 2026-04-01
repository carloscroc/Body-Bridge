import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, quiet: true });
}
if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false, quiet: true });
}

const deployment = process.env.CONVEX_DEPLOYMENT?.trim();
const looksConfigured = deployment && !deployment.includes('your-convex-project');

if (!looksConfigured) {
  console.error('[dev:convex] Missing CONVEX_DEPLOYMENT in .env.local.');
  console.error('[dev:convex] Copy .env.local.example to .env.local and set both VITE_CONVEX_URL and CONVEX_DEPLOYMENT before running npm run dev.');
  process.exit(1);
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(command, ['convex', 'dev', '--local'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.warn(`[dev:convex] Convex dev server received signal: ${signal}. Staying alive to allow frontend development.`);
    return;
  }
  if (code !== 0) {
    console.error(`[dev:convex] Convex dev server failed with code ${code}.`);
    console.error(`[dev:convex] This is likely due to your Convex account being disabled or exceeding plan limits.`);
    console.error(`[dev:convex] PROCEEDING WITH FRONTEND DEVELOPMENT ONLY (Offline mode).`);
    
    // Keep this process alive so concurrently doesn't kill the other services
    setInterval(() => {}, 1000 * 60 * 60);
  } else {
    process.exit(0);
  }
});

child.on('error', (error) => {
  console.error('[dev:convex] Failed to start Convex dev server.');
  console.error(error.message);
  process.exit(1);
});
