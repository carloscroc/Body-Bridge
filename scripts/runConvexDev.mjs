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

// Treat anonymous/local deployments as local dev so the local Convex server still starts.
const hasCloudDeployment = Boolean(
  CONVEX_DEPLOYMENT &&
  !CONVEX_DEPLOYMENT.startsWith('anonymous:') &&
  !CONVEX_DEPLOYMENT.startsWith('local:')
);

if (hasCloudDeployment) {
  console.log(`[dev:convex] Using cloud deployment: ${CONVEX_DEPLOYMENT}`);
  console.log(`[dev:convex] Cloud URL: ${VITE_CONVEX_URL}`);
  console.log('[dev:convex] Development server not needed for cloud deployment.');
  console.log('[dev:convex] Your backend functions are deployed and running on Convex Cloud.');
  
  // Keep the process alive to prevent concurrently from killing other processes
  setInterval(() => {}, 1000 * 60 * 60);
}

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
cleanEnv.CONVEX_SITE_URL = CONVEX_SITE_URL || 'http://127.0.0.1:3211';
cleanEnv.CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS =
  cleanEnv.CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS || '120';

if (!cleanEnv.JWT_PRIVATE_KEY || !cleanEnv.JWKS) {
  const localAuthKeys = generateLocalAuthKeys();
  cleanEnv.JWT_PRIVATE_KEY ??= localAuthKeys.JWT_PRIVATE_KEY;
  cleanEnv.JWKS ??= localAuthKeys.JWKS;
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runConvex(args) {
  return spawn(command, ['convex', ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    env: cleanEnv,
    shell: process.platform === 'win32',
  });
}

function startLocalDevServer() {
  console.log('[dev:convex] Starting local Convex development server...');
  console.log(
    `[dev:convex] Local backend startup timeout: ${cleanEnv.CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS}s`
  );
  const child = runConvex([
    'dev',
    '--typecheck', 'disable',
  ]);

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
}

function holdOfflineMode(message) {
  console.error(message);
  console.error('[dev:convex] PROCEEDING WITH FRONTEND DEVELOPMENT ONLY (Offline mode).');
  setInterval(() => {}, 1000 * 60 * 60);
}

function createLocalDeployment() {
  console.log('[dev:convex] No local deployment found. Creating one now...');
  const createLocal = runConvex(['deployment', 'create', 'local', '--select']);

  createLocal.on('exit', (createCode, createSignal) => {
    if (createSignal) {
      console.warn(`[dev:convex] Local deployment creation received signal: ${createSignal}.`);
      return;
    }

    if (createCode !== 0) {
      holdOfflineMode(`[dev:convex] Failed to create local deployment (code ${createCode}).`);
      return;
    }

    startLocalDevServer();
  });

  createLocal.on('error', (error) => {
    console.error('[dev:convex] Failed to create local deployment.');
    console.error(error.message);
    process.exit(1);
  });
}

console.log('[dev:convex] Selecting local Convex deployment...');
const selectLocal = runConvex(['deployment', 'select', 'local']);

selectLocal.on('exit', (selectCode, selectSignal) => {
  if (selectSignal) {
    console.warn(`[dev:convex] Local deployment selection received signal: ${selectSignal}.`);
    return;
  }

  if (selectCode !== 0) {
    createLocalDeployment();
    return;
  }

  startLocalDevServer();
});

selectLocal.on('error', (error) => {
  console.error('[dev:convex] Failed to select local deployment.');
  console.error(error.message);
  process.exit(1);
});
