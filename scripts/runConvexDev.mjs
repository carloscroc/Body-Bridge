import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
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

const {
  CONVEX_DEPLOYMENT,
  CONVEX_URL,
  CONVEX_AGENT_MODE,
  VITE_CONVEX_URL,
  VITE_CONVEX_SITE_URL,
  VITE_SUPABASE_URL,
  CONVEX_SELF_HOSTED_URL,
  CONVEX_SITE_URL,
  CONVEX_SELF_HOSTED_ADMIN_KEY,
  ...cleanEnv
} = process.env;

function generateLocalAuthKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'jwk' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return {
    JWT_PRIVATE_KEY: privateKey.trim().replace(/\n/g, ' '),
    JWKS: JSON.stringify({ keys: [{ use: 'sig', ...publicKey }] }),
  };
}

if (!CONVEX_DEPLOYMENT) {
  cleanEnv.CONVEX_SELF_HOSTED_URL = CONVEX_SELF_HOSTED_URL || 'http://localhost:8443';
}
cleanEnv.CONVEX_AGENT_MODE = CONVEX_AGENT_MODE || 'anonymous';
cleanEnv.CONVEX_SITE_URL = CONVEX_SITE_URL || 'http://127.0.0.1:3211';

if (!cleanEnv.JWT_PRIVATE_KEY || !cleanEnv.JWKS) {
  const localAuthKeys = generateLocalAuthKeys();
  cleanEnv.JWT_PRIVATE_KEY ??= localAuthKeys.JWT_PRIVATE_KEY;
  cleanEnv.JWKS ??= localAuthKeys.JWKS;
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(command, [
  'convex', 'dev',
  '--local',
  '--typecheck', 'disable',
], {
  cwd: rootDir,
  stdio: 'inherit',
  env: cleanEnv,
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.warn(`[dev:convex] Convex dev server received signal: ${signal}.`);
    return;
  }
  if (code !== 0) {
    console.error(`[dev:convex] Convex dev server failed with code ${code}.`);
    console.error(`[dev:convex] PROCEEDING WITH FRONTEND DEVELOPMENT ONLY (Offline mode).`);
    
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
