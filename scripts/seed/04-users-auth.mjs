#!/usr/bin/env node
/**
 * Seed Script 04: Users & Authentication
 * 
 * Seeds the database with user profiles, preferences, and authentication tokens.
 * Creates test users with different permission levels.
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

const USERS = [
  {
    id: 'user-admin-001',
    email: 'admin@forge.test',
    name: 'Admin User',
    avatar_url: 'https://example.com/avatars/admin.jpg',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-regular-001',
    email: 'user@forge.test',
    name: 'Regular User',
    avatar_url: 'https://example.com/avatars/user.jpg',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-regular-002',
    email: 'jane@forge.test',
    name: 'Jane Doe',
    avatar_url: 'https://example.com/avatars/jane.jpg',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-guest-001',
    email: 'guest@forge.test',
    name: 'Guest User',
    avatar_url: null,
    role: 'guest',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const USER_PREFERENCES = [
  {
    user_id: 'user-admin-001',
    theme: 'dark',
    language: 'en',
    notification_enabled: true,
    workout_reminders: true,
    units: 'metric',
  },
  {
    user_id: 'user-regular-001',
    theme: 'light',
    language: 'en',
    notification_enabled: true,
    workout_reminders: true,
    units: 'imperial',
  },
  {
    user_id: 'user-regular-002',
    theme: 'dark',
    language: 'es',
    notification_enabled: true,
    workout_reminders: false,
    units: 'metric',
  },
  {
    user_id: 'user-guest-001',
    theme: 'light',
    language: 'en',
    notification_enabled: false,
    workout_reminders: false,
    units: 'metric',
  },
];

const AUTH_TOKENS = [
  {
    user_id: 'user-admin-001',
    access_token: 'admin_access_token_123456789',
    refresh_token: 'admin_refresh_token_987654321',
    token_expiry: new Date(Date.now() + 3600000 * 24 * 7).toISOString(), // 7 days
    auth_provider: 'email',
  },
  {
    user_id: 'user-regular-001',
    access_token: 'user_access_token_123456789',
    refresh_token: 'user_refresh_token_987654321',
    token_expiry: new Date(Date.now() + 3600000 * 24 * 7).toISOString(), // 7 days
    auth_provider: 'email',
  },
  {
    user_id: 'user-regular-002',
    access_token: 'jane_access_token_123456789',
    refresh_token: 'jane_refresh_token_987654321',
    token_expiry: new Date(Date.now() + 3600000 * 24 * 7).toISOString(), // 7 days
    auth_provider: 'email',
  },
  {
    user_id: 'user-guest-001',
    access_token: 'guest_access_token_123456789',
    refresh_token: 'guest_refresh_token_987654321',
    token_expiry: new Date(Date.now() + 3600000 * 24 * 1).toISOString(), // 1 day
    auth_provider: 'guest',
  },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedUsers(client) {
  console.log('👤 Seeding users...');
  
  for (const user of USERS) {
    try {
      // Check if user already exists
      const existing = await client.query('seed:getUsers', {});
      if (existing && existing.find(u => u.email === user.email)) {
        console.log(`  ✓ User "${user.email}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // User doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertUser', {
      adminSecret: ADMIN_SECRET,
      user: {
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url || undefined,
        role: user.role,
      },
    });
    console.log(`  ✓ User "${user.email}" seeded`);
  }
}

async function seedUserPreferences(client) {
  console.log('⚙️  Seeding user preferences...');
  
  for (const prefs of USER_PREFERENCES) {
    try {
      // Check if preferences already exist
      const existing = await client.query('seed:getUsers', {});
      if (existing && existing.find(u => u.email === prefs.user_id)) {
        console.log(`  ✓ Preferences for user "${prefs.user_id}" already exist, skipping...`);
        continue;
      }
    } catch (e) {
      // Preferences don't exist, proceed with seeding
    }

    // Get the user ID from the email
    const users = await client.query('seed:getUsers', {});
    const user = users.find(u => u.email === prefs.user_id);
    if (!user) {
      console.log(`  ⚠ User "${prefs.user_id}" not found, skipping preferences...`);
      continue;
    }

    await client.mutation('seed:insertUserPreferences', {
      adminSecret: ADMIN_SECRET,
      userId: user.id,
      preferences: {
        theme: prefs.theme,
        language: prefs.language,
        notifications: prefs.notifications,
        units: prefs.units,
      },
    });
    console.log(`  ✓ Preferences for user "${prefs.user_id}" seeded`);
  }
}

async function seedAuthTokens(client) {
  console.log('🔑 Seeding authentication tokens...');
  
  for (const token of AUTH_TOKENS) {
    try {
      // Check if token already exists
      const existing = await client.query('seed:getUsers', {});
      if (existing && existing.find(u => u.email === token.user_id)) {
        console.log(`  ✓ Auth token for user "${token.user_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Token doesn't exist, proceed with seeding
    }

    // Get the user ID from the email
    const users = await client.query('seed:getUsers', {});
    const user = users.find(u => u.email === token.user_id);
    if (!user) {
      console.log(`  ⚠ User "${token.user_id}" not found, skipping auth token...`);
      continue;
    }

    await client.mutation('seed:insertAuthToken', {
      adminSecret: ADMIN_SECRET,
      userId: user.id,
      token: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
      },
    });
    console.log(`  ✓ Auth token for user "${token.user_id}" seeded`);
  }
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
  console.log('SEED SCRIPT 04: Users & Authentication');
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
    await seedUsers(client);
    await seedUserPreferences(client);
    await seedAuthTokens(client);

    console.log('\n✅ Seed script 04 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 04 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
