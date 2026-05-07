#!/usr/bin/env node
/**
 * Seed Script 02: Categories & Tags
 * 
 * Seeds the database with exercise categories and tags.
 * These are referenced by exercises and should be seeded before exercises.
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

const CATEGORIES = [
  // Primary categories
  { id: 'strength', name: 'Strength', parent_id: null, description: 'Resistance training exercises', icon: '💪', color: '#3B82F6' },
  { id: 'cardio', name: 'Cardio', parent_id: null, description: 'Cardiovascular exercises', icon: '❤️', color: '#EF4444' },
  { id: 'flexibility', name: 'Flexibility', parent_id: null, description: 'Stretching and mobility exercises', icon: '🧘', color: '#10B981' },
  { id: 'hiit', name: 'HIIT', parent_id: null, description: 'High-intensity interval training', icon: '⚡', color: '#F59E0B' },
  { id: 'calisthenics', name: 'Calisthenics', parent_id: null, description: 'Bodyweight exercises', icon: '🏃', color: '#8B5CF6' },
  { id: 'plyometric', name: 'Plyometric', parent_id: null, description: 'Explosive power exercises', icon: '🚀', color: '#EC4899' },
  { id: 'core', name: 'Core', parent_id: null, description: 'Abdominal and core exercises', icon: '🎯', color: '#06B6D4' },
  { id: 'functional', name: 'Functional', parent_id: null, description: 'Functional movement patterns', icon: '🏋️', color: '#84CC16' },
  { id: 'rehabilitation', name: 'Rehabilitation', parent_id: null, description: 'Recovery and rehab exercises', icon: '🩺', color: '#6366F1' },
  { id: 'olympic', name: 'Olympic', parent_id: null, description: 'Olympic lifting exercises', icon: '🏅', color: '#F97316' },
  
  // Strength subcategories
  { id: 'chest', name: 'Chest', parent_id: 'strength', description: 'Chest exercises', icon: '🫁', color: '#60A5FA' },
  { id: 'back', name: 'Back', parent_id: 'strength', description: 'Back exercises', icon: '🔙', color: '#60A5FA' },
  { id: 'shoulders', name: 'Shoulders', parent_id: 'strength', description: 'Shoulder exercises', icon: '🤷', color: '#60A5FA' },
  { id: 'legs', name: 'Legs', parent_id: 'strength', description: 'Leg exercises', icon: '🦵', color: '#60A5FA' },
  { id: 'arms', name: 'Arms', parent_id: 'strength', description: 'Arm exercises', icon: '💪', color: '#60A5FA' },
  
  // Cardio subcategories
  { id: 'running', name: 'Running', parent_id: 'cardio', description: 'Running exercises', icon: '🏃', color: '#F87171' },
  { id: 'cycling', name: 'Cycling', parent_id: 'cardio', description: 'Cycling exercises', icon: '🚴', color: '#F87171' },
  { id: 'swimming', name: 'Swimming', parent_id: 'cardio', description: 'Swimming exercises', icon: '🏊', color: '#F87171' },
];

const TAGS = [
  // Equipment tags
  { id: 'dumbbell', name: 'Dumbbell', slug: 'dumbbell', color: '#3B82F6' },
  { id: 'barbell', name: 'Barbell', slug: 'barbell', color: '#3B82F6' },
  { id: 'machine', name: 'Machine', slug: 'machine', color: '#3B82F6' },
  { id: 'bodyweight', name: 'Bodyweight', slug: 'bodyweight', color: '#10B981' },
  { id: 'resistance-band', name: 'Resistance Band', slug: 'resistance-band', color: '#F59E0B' },
  { id: 'kettlebell', name: 'Kettlebell', slug: 'kettlebell', color: '#8B5CF6' },
  { id: 'cable', name: 'Cable', slug: 'cable', color: '#EC4899' },
  { id: 'medicine-ball', name: 'Medicine Ball', slug: 'medicine-ball', color: '#06B6D4' },
  { id: 'foam-roller', name: 'Foam Roller', slug: 'foam-roller', color: '#84CC16' },
  { id: 'yoga-mat', name: 'Yoga Mat', slug: 'yoga-mat', color: '#6366F1' },
  { id: 'pull-up-bar', name: 'Pull-Up Bar', slug: 'pull-up-bar', color: '#F97316' },
  { id: 'bench', name: 'Bench', slug: 'bench', color: '#14B8A6' },
  { id: 'smith-machine', name: 'Smith Machine', slug: 'smith-machine', color: '#A855F7' },
  { id: 'treadmill', name: 'Treadmill', slug: 'treadmill', color: '#EF4444' },
  { id: 'elliptical', name: 'Elliptical', slug: 'elliptical', color: '#EF4444' },
  { id: 'rower', name: 'Rower', slug: 'rower', color: '#EF4444' },
  { id: 'bike', name: 'Bike', slug: 'bike', color: '#EF4444' },
  { id: 'stair-climber', name: 'Stair Climber', slug: 'stair-climber', color: '#EF4444' },
  
  // Muscle group tags
  { id: 'pectorals', name: 'Pectorals', slug: 'pectorals', color: '#F472B6' },
  { id: 'lats', name: 'Lats', slug: 'lats', color: '#60A5FA' },
  { id: 'triceps', name: 'Triceps', slug: 'triceps', color: '#FBBF24' },
  { id: 'biceps', name: 'Biceps', slug: 'biceps', color: '#34D399' },
  { id: 'deltoids', name: 'Deltoids', slug: 'deltoids', color: '#A78BFA' },
  { id: 'traps', name: 'Traps', slug: 'traps', color: '#F87171' },
  { id: 'quadriceps', name: 'Quadriceps', slug: 'quadriceps', color: '#FB923C' },
  { id: 'hamstrings', name: 'Hamstrings', slug: 'hamstrings', color: '#A3E635' },
  { id: 'glutes', name: 'Glutes', slug: 'glutes', color: '#F472B6' },
  { id: 'calves', name: 'Calves', slug: 'calves', color: '#38BDF8' },
  { id: 'core', name: 'Core', slug: 'core', color: '#4ADE80' },
  { id: 'forearms', name: 'Forearms', slug: 'forearms', color: '#FBBF24' },
  { id: 'obliques', name: 'Obliques', slug: 'obliques', color: '#A78BFA' },
  { id: 'hip-flexors', name: 'Hip Flexors', slug: 'hip-flexors', color: '#F87171' },
  { id: 'adductors', name: 'Adductors', slug: 'adductors', color: '#F472B6' },
  { id: 'abductors', name: 'Abductors', slug: 'abductors', color: '#60A5FA' },
  
  // Difficulty tags
  { id: 'beginner', name: 'Beginner', slug: 'beginner', color: '#10B981' },
  { id: 'intermediate', name: 'Intermediate', slug: 'intermediate', color: '#F59E0B' },
  { id: 'advanced', name: 'Advanced', slug: 'advanced', color: '#EF4444' },
  
  // Other tags
  { id: 'compound', name: 'Compound', slug: 'compound', color: '#8B5CF6' },
  { id: 'isolation', name: 'Isolation', slug: 'isolation', color: '#EC4899' },
  { id: 'unilateral', name: 'Unilateral', slug: 'unilateral', color: '#06B6D4' },
  { id: 'bilateral', name: 'Bilateral', slug: 'bilateral', color: '#84CC16' },
  { id: 'push', name: 'Push', slug: 'push', color: '#F97316' },
  { id: 'pull', name: 'Pull', slug: 'pull', color: '#14B8A6' },
  { id: 'squat', name: 'Squat', slug: 'squat', color: '#A855F7' },
  { id: 'hinge', name: 'Hinge', slug: 'hinge', color: '#EF4444' },
  { id: 'lunge', name: 'Lunge', slug: 'lunge', color: '#FBBF24' },
  { id: 'rotation', name: 'Rotation', slug: 'rotation', color: '#34D399' },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedCategories(client) {
  console.log('📁 Seeding categories...');
  
  for (const category of CATEGORIES) {
    try {
      // Check if category already exists
      const existing = await client.query('seed:getCategories', {});
      if (existing && existing.find(c => c.name === category.name)) {
        console.log(`  ✓ Category "${category.name}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Category doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertCategory', {
      adminSecret: ADMIN_SECRET,
      category: {
        name: category.name,
        description: category.description,
        icon: category.icon,
      },
    });
    console.log(`  ✓ Category "${category.name}" seeded`);
  }
}

async function seedTags(client) {
  console.log('🏷️  Seeding tags...');
  
  for (const tag of TAGS) {
    try {
      // Check if tag already exists
      const existing = await client.query('seed:getTags', {});
      if (existing && existing.find(t => t.name === tag.name)) {
        console.log(`  ✓ Tag "${tag.name}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Tag doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertTag', {
      adminSecret: ADMIN_SECRET,
      tag: {
        name: tag.name,
        type: tag.type || 'general',
        color: tag.color,
      },
    });
    console.log(`  ✓ Tag "${tag.name}" seeded`);
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
  console.log('SEED SCRIPT 02: Categories & Tags');
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
    await seedCategories(client);
    await seedTags(client);

    console.log('\n✅ Seed script 02 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 02 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
