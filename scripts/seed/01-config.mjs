#!/usr/bin/env node
/**
 * Seed Script 01: API Configuration & Feature Flags
 * 
 * Seeds the database with API configuration settings and feature flags.
 * This is the foundational seed script that other scripts may depend on.
 */

import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const CONVEX_PORT = parseInt(new URL(CONVEX_URL).port) || 3210;
const ADMIN_SECRET = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';

// ═════════════════════════════════════════════════════════════════
// CONVEX CLIENT
// ═════════════════════════════════════════════════════════════════

class ConvexClient {
  constructor(url) {
    const u = new URL(url);
    this.host = u.hostname;
    this.port = parseInt(u.port) || 3210;
  }

  async mutation(path, args) {
    return this._request('POST', path, args);
  }

  async query(path, args) {
    return this._request('GET', path, args);
  }

  async _request(method, path, args, retries = 3) {
    const body = JSON.stringify({ path, args, format: 'json' });
    const base = method === 'GET' ? '/api/query' : '/api/mutation';
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await new Promise((resolve, reject) => {
          const req = http.request(
            { hostname: this.host, port: this.port, path: base, method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
            (res) => {
              let data = '';
              res.on('data', (c) => (data += c));
              res.on('end', () => {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.status === 'error') reject(new Error(parsed.errorMessage || 'Convex error'));
                  else resolve(parsed.value);
                } catch { reject(new Error(`Non-JSON response: ${data.slice(0, 300)}`)); }
              });
            },
          );
          req.on('error', reject);
          req.write(body);
          req.end();
        });
      } catch (err) {
        if ((err.message?.includes('ECONNREFUSED') || err.message?.includes('ECONNRESET')) && attempt < retries) {
          console.warn(`  Connection error, retry ${attempt}/${retries}...`);
          await new Promise((r) => setTimeout(r, 3000 * attempt));
          continue;
        }
        throw err;
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// DATA DEFINITIONS
// ═════════════════════════════════════════════════════════════════

const API_CONFIG = {
  base_url: CONVEX_URL,
  version: '1.0.0',
  timeout: 30000,
  retry_policy: {
    max_retries: 3,
    backoff_ms: 1000,
  },
};

const FEATURE_FLAGS = [
  {
    feature_name: 'offline_mode',
    enabled: true,
    description: 'Allow users to access cached content without internet',
    rollout_percentage: 100,
  },
  {
    feature_name: 'social_sharing',
    enabled: true,
    description: 'Enable sharing workouts and achievements on social media',
    rollout_percentage: 100,
  },
  {
    feature_name: 'advanced_analytics',
    enabled: true,
    description: 'Provide detailed workout analytics and progress tracking',
    rollout_percentage: 100,
  },
  {
    feature_name: 'ai_recommendations',
    enabled: false,
    description: 'AI-powered workout recommendations based on user progress',
    rollout_percentage: 10,
  },
  {
    feature_name: 'community_features',
    enabled: true,
    description: 'Community challenges and leaderboards',
    rollout_percentage: 100,
  },
  {
    feature_name: 'premium_content',
    enabled: true,
    description: 'Premium workout programs and content',
    rollout_percentage: 100,
  },
];

const APP_SETTINGS = {
  app_version: '1.0.0',
  min_supported_version: '1.0.0',
  maintenance_mode: false,
  force_update: false,
  announcement: null,
};

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedApiConfig(client) {
  console.log('📡 Seeding API configuration...');
  
  try {
    // Check if config already exists
    const existing = await client.query('seed:getConfig', {});
    if (existing) {
      console.log('  ✓ API config already exists, skipping...');
      return;
    }
  } catch (e) {
    // Config doesn't exist, proceed with seeding
  }

  await client.mutation('seed:setConfig', {
    adminSecret: ADMIN_SECRET,
    config: {
      baseUrl: API_CONFIG.base_url,
      version: API_CONFIG.version,
      timeout: API_CONFIG.timeout,
      retryPolicy: API_CONFIG.retry_policy,
    },
  });
  console.log('  ✓ API configuration seeded');
}

async function seedFeatureFlags(client) {
  console.log('🚩 Seeding feature flags...');
  
  for (const flag of FEATURE_FLAGS) {
    try {
      // Check if flag already exists
      const existing = await client.query('seed:getFeatureFlags', {});
      if (existing && existing.find(f => f.name === flag.feature_name)) {
        console.log(`  ✓ Feature flag "${flag.feature_name}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Flag doesn't exist, proceed with seeding
    }

    await client.mutation('seed:setFeatureFlag', {
      adminSecret: ADMIN_SECRET,
      featureFlag: {
        name: flag.feature_name,
        enabled: flag.enabled,
        description: flag.description,
        rolloutPercentage: flag.rollout_percentage,
      },
    });
    console.log(`  ✓ Feature flag "${flag.feature_name}" seeded`);
  }
}

async function seedAppSettings(client) {
  console.log('⚙️  Seeding app settings...');
  
  try {
    // Check if settings already exist
    const existing = await client.query('seed:getConfig', {});
    if (existing) {
      console.log('  ✓ App settings already exist, skipping...');
      return;
    }
  } catch (e) {
    // Settings don't exist, proceed with seeding
  }

  await client.mutation('seed:setConfig', {
    adminSecret: ADMIN_SECRET,
    config: {
      baseUrl: CONVEX_URL,
      version: APP_SETTINGS.app_version,
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
      },
    },
  });
  console.log('  ✓ App settings seeded');
}

// ═════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═════════════════════════════════════════════════════════════════

async function checkPort(port) {
  return new Promise((resolve) => {
    const conn = net.createConnection({ port, host: '127.0.0.1' });
    conn.once('connect', () => {
      conn.end();
      resolve(true);
    });
    conn.once('error', () => resolve(false));
  });
}

async function startConvexDev() {
  console.log('🚀 Starting Convex dev server...');
  const proc = spawn('npx', ['convex', 'dev'], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    shell: true,
  });
  
  // Wait for server to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkPort(CONVEX_PORT)) {
      console.log('✓ Convex dev server is ready');
      return proc;
    }
  }
  
  throw new Error('Failed to start Convex dev server');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SEED SCRIPT 01: API Configuration & Feature Flags');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let convexProc = null;
  
  try {
    // Check if Convex is already running
    if (!(await checkPort(CONVEX_PORT))) {
      convexProc = await startConvexDev();
    } else {
      console.log('✓ Convex dev server is already running');
    }

    const client = new ConvexClient(CONVEX_URL);

    // Seed in order
    await seedApiConfig(client);
    await seedFeatureFlags(client);
    await seedAppSettings(client);

    console.log('\n✅ Seed script 01 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 01 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
