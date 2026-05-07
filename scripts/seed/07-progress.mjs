#!/usr/bin/env node
/**
 * Seed Script 07: Progress Records
 * 
 * Seeds the database with exercise progress, workout sessions, achievements,
 * and streaks for test users.
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

const EXERCISE_PROGRESS = [
  {
    user_id: 'user-regular-001',
    exercise_id: 'exercise-chest-press-001',
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    score: 95,
    attempts: 3,
    last_attempt_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    user_id: 'user-regular-001',
    exercise_id: 'exercise-dumbbell-row-001',
    completed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    score: 88,
    attempts: 2,
    last_attempt_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    user_id: 'user-regular-001',
    exercise_id: 'exercise-shoulder-press-001',
    completed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    score: 92,
    attempts: 4,
    last_attempt_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    user_id: 'user-regular-001',
    exercise_id: 'exercise-squat-001',
    completed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    score: 90,
    attempts: 3,
    last_attempt_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    user_id: 'user-regular-002',
    exercise_id: 'exercise-bicep-curl-001',
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    score: 85,
    attempts: 2,
    last_attempt_at: new Date(Date.now() - 864000 * 2).toISOString(),
  },
  {
    user_id: 'user-regular-002',
    exercise_id: 'exercise-tricep-pushdown-001',
    completed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    score: 78,
    attempts: 3,
    last_attempt_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    user_id: 'user-regular-002',
    exercise_id: 'exercise-plank-001',
    completed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    score: 82,
    attempts: 4,
    last_attempt_at: new Date(Date.now() - 864000 * 3).toISOString(),
  },
];

const WORKOUT_SESSIONS = [
  {
    id: 'session-001',
    user_id: 'user-regular-001',
    workout_id: 'workout-upper-body-001',
    started_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    total_duration: 1800,
    exercises_completed: 3,
    exercises: ['exercise-chest-press-001', 'exercise-dumbbell-row-001', 'exercise-shoulder-press-001'],
  },
  {
    id: 'session-002',
    user_id: 'user-regular-001',
    workout_id: 'workout-lower-body-001',
    started_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    total_duration: 1500,
    exercises_completed: 2,
    exercises: ['exercise-squat-001', 'exercise-lunge-001'],
  },
  {
    id: 'session-003',
    user_id: 'user-regular-002',
    workout_id: 'workout-arms-001',
    started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    total_duration: 1200,
    exercises_completed: 2,
    exercises: ['exercise-bicep-curl-001', 'exercise-tricep-pushdown-001'],
  },
  {
    id: 'session-004',
    user_id: 'user-regular-002',
    workout_id: 'workout-core-001',
    started_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    total_duration: 900,
    exercises_completed: 1,
    exercises: ['exercise-plank-001'],
  },
];

const ACHIEVEMENTS = [
  {
    id: 'achievement-001',
    user_id: 'user-regular-001',
    achievement_id: 'first-workout',
    unlocked_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'achievement-002',
    user_id: 'user-regular-001',
    achievement_id: 'week-streak-7',
    unlocked_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'achievement-003',
    user_id: 'user-regular-002',
    achievement_id: 'first-workout',
    unlocked_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'achievement-004',
    user_id: 'user-regular-002',
    achievement_id: 'core-master',
    unlocked_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const STREAKS = [
  {
    user_id: 'user-regular-001',
    current_streak: 7,
    longest_streak: 14,
    last_activity_date: new Date().toISOString(),
  },
  {
    user_id: 'user-regular-002',
    current_streak: 5,
    longest_streak: 10,
    last_activity_date: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    user_id: 'user-admin-001',
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
  },
  {
    user_id: 'user-guest-001',
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
  },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedExerciseProgress(client) {
  console.log('📊 Seeding exercise progress...');
  
  for (const progress of EXERCISE_PROGRESS) {
    try {
      // Check if progress already exists
      const existing = await client.query('seed:getExerciseProgress', { 
        userId: progress.user_id, 
        exerciseId: progress.exercise_id 
      });
      if (existing && existing.find(p => p.userId === progress.user_id && p.exerciseId === progress.exercise_id)) {
        console.log(`  ✓ Progress for "${progress.user_id}" → "${progress.exercise_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Progress doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertExerciseProgress', {
      adminSecret: ADMIN_SECRET,
      progress: {
        userId: progress.user_id,
        exerciseId: progress.exercise_id,
        completedAt: new Date(progress.completed_at).getTime(),
        score: progress.score,
        attempts: progress.attempts,
      },
    });
    console.log(`  ✓ Progress for "${progress.user_id}" → "${progress.exercise_id}" seeded`);
  }
}

async function seedWorkoutSessions(client) {
  console.log('🏋️  Seeding workout sessions...');
  
  for (const session of WORKOUT_SESSIONS) {
    try {
      // Check if session already exists
      const existing = await client.query('seed:getWorkoutSessions', { userId: session.user_id });
      if (existing && existing.find(s => s.id === session.id)) {
        console.log(`  ✓ Session "${session.id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Session doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertWorkoutSession', {
      adminSecret: ADMIN_SECRET,
      session: {
        userId: session.user_id,
        workoutId: session.workout_id,
        startedAt: new Date(session.started_at).getTime(),
        completedAt: new Date(session.completed_at).getTime(),
        duration: session.total_duration,
        exercisesCompleted: session.exercises_completed,
      },
    });
    console.log(`  ✓ Session "${session.id}" seeded`);
  }
}

async function seedAchievements(client) {
  console.log('🏆 Seeding achievements...');
  
  for (const achievement of ACHIEVEMENTS) {
    try {
      // Check if achievement already exists
      const existing = await client.query('seed:getAchievements', { userId: achievement.user_id });
      if (existing && existing.find(a => a.id === achievement.id)) {
        console.log(`  ✓ Achievement "${achievement.id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Achievement doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertAchievement', {
      adminSecret: ADMIN_SECRET,
      achievement: {
        userId: achievement.user_id,
        achievementId: achievement.achievement_id,
        unlockedAt: new Date(achievement.unlocked_at).getTime(),
      },
    });
    console.log(`  ✓ Achievement "${achievement.id}" seeded`);
  }
}

async function seedStreaks(client) {
  console.log('🔥 Seeding streaks...');
  
  for (const streak of STREAKS) {
    try {
      // Check if streak already exists
      const existing = await client.query('seed:getStreaks', { userId: streak.user_id });
      if (existing && existing.find(s => s.userId === streak.user_id)) {
        console.log(`  ✓ Streak for "${streak.user_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Streak doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertStreak', {
      adminSecret: ADMIN_SECRET,
      streak: {
        userId: streak.user_id,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        lastActivityDate: streak.last_activity_date ? new Date(streak.last_activity_date).getTime() : 0,
      },
    });
    console.log(`  ✓ Streak for "${streak.user_id}" seeded`);
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
    await new Promise(r => setTimeout(r => setTimeout(r, 1000)));
    if (await checkPort(CONVEX_PORT)) {
      console.log('✓ Convex dev server is ready');
      return proc;
    }
  }
  
  throw new Error('Failed to start Convex dev server');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SEED SCRIPT 07: Progress Records');
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
    await seedExerciseProgress(client);
    await seedWorkoutSessions(client);
    await seedAchievements(client);
    await seedStreaks(client);

    console.log('\n✅ Seed script 07 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 07 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
