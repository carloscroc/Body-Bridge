#!/usr/bin/env node
/**
 * Seed Script 08: Test Seed Data
 * 
 * Seeds the database with sample workouts, notifications, and other test data
 * to enable comprehensive testing of the Android app.
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

const WORKOUTS = [
  {
    id: 'workout-upper-body-001',
    name: 'Upper Body Strength',
    description: 'A comprehensive upper body workout targeting chest, back, and shoulders.',
    category: 'strength',
    difficulty: 'intermediate',
    duration: 30,
    exercises: ['exercise-chest-press-001', 'exercise-dumbbell-row-001', 'exercise-shoulder-press-001'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'workout-lower-body-001',
    name: 'Lower Body Power',
    description: 'A powerful lower body workout focusing on quads, glutes, and hamstrings.',
    category: 'strength',
    difficulty: 'intermediate',
    duration: 25,
    exercises: ['exercise-squat-001', 'exercise-lunge-001'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'workout-arms-001',
    name: 'Arm Builder',
    description: 'An arm-focused workout to build biceps and triceps.',
    category: 'strength',
    difficulty: 'beginner',
    duration: 20,
    exercises: ['exercise-bicep-curl-001', 'exercise-tricep-pushdown-001'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'workout-core-001',
    name: 'Core Crusher',
    description: 'An intense core workout for abs and obliques.',
    category: 'core',
    difficulty: 'intermediate',
    duration: 15,
    exercises: ['exercise-plank-001'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'workout-full-body-001',
    name: 'Full Body Blitz',
    description: 'A complete full-body workout for overall fitness.',
    category: 'strength',
    difficulty: 'advanced',
    duration: 45,
    exercises: ['exercise-chest-press-001', 'exercise-dumbbell-row-001', 'exercise-shoulder-press-001', 'exercise-squat-001', 'exercise-bicep-curl-001', 'exercise-tricep-pushdown-001', 'exercise-plank-001'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const NOTIFICATIONS = [
  {
    id: 'notification-001',
    user_id: 'user-regular-001',
    type: 'welcome',
    title: 'Welcome to Forge!',
    message: 'Thank you for joining Forge. Start your fitness journey today!',
    read: false,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'notification-002',
    user_id: 'user-regular-001',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve unlocked the "First Workout" achievement.',
    read: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'notification-003',
    user_id: 'user-regular-001',
    type: 'reminder',
    title: 'Workout Reminder',
    message: 'Don\'t forget to complete your workout today!',
    read: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'notification-004',
    user_id: 'user-regular-002',
    type: 'welcome',
    title: 'Welcome to Forge!',
    message: 'Thank you for joining Forge. Start your fitness journey today!',
    read: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'notification-005',
    user_id: 'user-regular-002',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve unlocked the "Core Master" achievement.',
    read: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'notification-006',
    user_id: 'user-admin-001',
    type: 'system',
    title: 'System Update',
    message: 'The system has been updated to version 1.0.0.',
    read: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const WORKOUT_EXERCISES = [
  { workout_id: 'workout-upper-body-001', exercise_id: 'exercise-chest-press-001', order: 1, sets: 3, reps: '12' },
  { workout_id: 'workout-upper-body-001', exercise_id: 'exercise-dumbbell-row-001', order: 2, sets: 3, reps: '10' },
  { workout_id: 'workout-upper-body-001', exercise_id: 'exercise-shoulder-press-001', order: 3, sets: 3, reps: '12' },
  { workout_id: 'workout-lower-body-001', exercise_id: 'exercise-squat-001', order: 1, sets: 3, reps: '12' },
  { workout_id: 'workout-lower-body-001', exercise_id: 'exercise-lunge-001', order: 2, sets: 3, reps: '10' },
  { workout_id: 'workout-arms-001', exercise_id: 'exercise-bicep-curl-001', order: 1, sets: 3, reps: '12' },
  { workout_id: 'workout-arms-001', exercise_id: 'exercise-tricep-pushdown-001', order: 2, sets: 3, reps: '15' },
  { workout_id: 'workout-core-001', exercise_id: 'exercise-plank-001', order: 1, sets: 3, reps: '20' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-chest-press-001', order: 1, sets: 3, reps: '12' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-dumbbell-row-001', order: 2, sets: 3, reps: '10' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-shoulder-press-001', order: 3, sets: 3, reps: '12' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-squat-001', order: 4, sets: 3, reps: '12' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-bicep-curl-001', order: 5, sets: 3, reps: '12' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-tricep-pushdown-001', order: 6, sets: 3, reps: '15' },
  { workout_id: 'workout-full-body-001', exercise_id: 'exercise-plank-001', order: 7, sets: 3, reps: '20' },
];

const USER_WORKOUT_FAVORITES = [
  { user_id: 'user-regular-001', workout_id: 'workout-upper-body-001', added_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { user_id: 'user-regular-001', workout_id: 'workout-full-body-001', added_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { user_id: 'user-regular-002', workout_id: 'workout-arms-001', added_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { user_id: 'user-regular-002', workout_id: 'workout-core-001', added_at: new Date(Date.now() - 86400000 * 2).toISOString() },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedWorkouts(client) {
  console.log('🏋️  Seeding workouts...');
  
  for (const workout of WORKOUTS) {
    try {
      // Check if workout already exists
      const existing = await client.query('seed:getWorkouts', { id: workout.id });
      if (existing && existing.find(w => w.id === workout.id)) {
        console.log(`  ✓ Workout "${workout.name}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Workout doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertWorkout', {
      adminSecret: ADMIN_SECRET,
      workout: {
        id: workout.id,
        name: workout.name,
        description: workout.description,
        category: workout.category,
        difficulty: workout.difficulty,
        duration: workout.duration,
        exercises: workout.exercises,
        createdAt: workout.created_at,
        updatedAt: workout.updated_at,
      },
    });
    console.log(`  ✓ Workout "${workout.name}" seeded`);
  }
}

async function seedNotifications(client) {
  console.log('🔔 Seeding notifications...');
  
  for (const notification of NOTIFICATIONS) {
    try {
      // Check if notification already exists
      const existing = await client.query('seed:getNotifications', { userId: notification.user_id });
      if (existing && existing.find(n => n.id === notification.id)) {
        console.log(`  ✓ Notification "${notification.id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Notification doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertNotification', {
      adminSecret: ADMIN_SECRET,
      notification: {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.created_at,
      },
    });
    console.log(`  ✓ Notification "${notification.id}" seeded`);
  }
}

async function seedWorkoutExercises(client) {
  console.log('📋 Seeding workout-exercise mappings...');
  
  for (const mapping of WORKOUT_EXERCISES) {
    try {
      // Check if mapping already exists
      const existing = await client.query('seed:getWorkoutExercises', { 
        workoutId: mapping.workout_id, 
        exerciseId: mapping.exercise_id 
      });
      if (existing && existing.find(m => m.workoutId === mapping.workout_id && m.exerciseId === mapping.exercise_id)) {
        console.log(`  ✓ Mapping "${mapping.workout_id}" → "${mapping.exercise_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Mapping doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertWorkoutExercise', {
      adminSecret: ADMIN_SECRET,
      workoutExercise: {
        workoutId: mapping.workout_id,
        exerciseId: mapping.exercise_id,
        order: mapping.order,
        sets: mapping.sets,
        reps: mapping.reps,
      },
    });
    console.log(`  ✓ Mapping "${mapping.workout_id}" → "${mapping.exercise_id}" seeded`);
  }
}

async function seedUserWorkoutFavorites(client) {
  console.log('⭐ Seeding user workout favorites...');
  
  for (const favorite of USER_WORKOUT_FAVORITES) {
    try {
      // Check if favorite already exists
      const existing = await client.query('seed:getUserWorkoutFavorites', { 
        userId: favorite.user_id, 
        workoutId: favorite.workout_id 
      });
      if (existing && existing.find(f => f.userId === favorite.user_id && f.workoutId === favorite.workout_id)) {
        console.log(`  ✓ Favorite "${favorite.user_id}" → "${favorite.workout_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Favorite doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertUserWorkoutFavorite', {
      adminSecret: ADMIN_SECRET,
      userWorkoutFavorite: {
        userId: favorite.user_id,
        workoutId: favorite.workout_id,
        addedAt: favorite.added_at,
      },
    });
    console.log(`  ✓ Favorite "${favorite.user_id}" → "${favorite.workout_id}" seeded`);
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
  console.log('SEED SCRIPT 08: Test Seed Data');
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
    await seedWorkouts(client);
    await seedNotifications(client);
    await seedWorkoutExercises(client);
    await seedUserWorkoutFavorites(client);

    console.log('\n✅ Seed script 08 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 08 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
