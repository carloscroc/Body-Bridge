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
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[dev:convex] Failed to start Convex dev server.');
  console.error(error.message);
  process.exit(1);
});
