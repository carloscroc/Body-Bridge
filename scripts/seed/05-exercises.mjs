#!/usr/bin/env node
/**
 * Seed Script 05: Exercises with Mappings
 * 
 * Seeds the database with exercises and their mappings to categories, tags, and media.
 * This script depends on scripts 01-04 being run first.
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

const EXERCISES = [
  {
    id: 'exercise-chest-press-001',
    title: 'Machine Chest Press',
    description: 'A compound chest exercise that targets the pectorals, triceps, and anterior deltoids.',
    category_id: 'chest',
    difficulty: 'beginner',
    equipment: ['machine'],
    primary_muscles: ['pectorals', 'triceps', 'anterior-deltoids'],
    secondary_muscles: ['core'],
    type: 'strength',
    sets: 3,
    reps: '12',
    rest_time: 60,
    instructions: [
      'Adjust the seat height so your chest is aligned with the handles',
      'Grip the handles with a neutral grip',
      'Press the handles forward until your arms are fully extended',
      'Slowly return to the starting position',
    ],
    tips: [
      'Keep your back flat against the pad',
      'Don\'t lock your elbows at the top',
      'Focus on squeezing your chest at the top',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-dumbbell-row-001',
    title: 'Single-Arm Dumbbell Row',
    description: 'A unilateral back exercise that targets the lats, rhomboids, and traps.',
    category_id: 'back',
    difficulty: 'beginner',
    equipment: ['dumbbell', 'bench'],
    primary_muscles: ['lats', 'rhomboids', 'traps'],
    secondary_muscles: ['biceps', 'rear-deltoids', 'core'],
    type: 'strength',
    sets: 3,
    reps: '10',
    rest_time: 60,
    instructions: [
      'Place one knee and hand on a bench for support',
      'Hold a dumbbell in your free hand with a neutral grip',
      'Pull the dumbbell up toward your hip',
      'Lower it back down with control',
    ],
    tips: [
      'Keep your back straight throughout',
      'Don\'t rotate your torso',
      'Focus on squeezing your back at the top',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-shoulder-press-001',
    title: 'Machine Shoulder Press',
    description: 'A compound shoulder exercise that targets the anterior and lateral deltoids.',
    category_id: 'shoulders',
    difficulty: 'beginner',
    equipment: ['machine'],
    primary_muscles: ['anterior-deltoids', 'lateral-deltoids', 'triceps'],
    secondary_muscles: ['traps', 'core'],
    type: 'strength',
    sets: 3,
    reps: '12',
    rest_time: 60,
    instructions: [
      'Adjust the seat height so your shoulders are aligned with the handles',
      'Grip the handles with a neutral grip',
      'Press the handles upward until your arms are fully extended',
      'Slowly return to the starting position',
    ],
    tips: [
      'Keep your back flat against the pad',
      'Don\'t lock your elbows at the top',
      'Control the weight on the way down',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-squat-001',
    title: 'Dumbbell Goblet Squat',
    description: 'A compound leg exercise that targets the quads, glutes, and core.',
    category_id: 'legs',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    primary_muscles: ['quadriceps', 'glutes', 'core'],
    secondary_muscles: ['hamstrings', 'calves', 'upper-back'],
    type: 'strength',
    sets: 3,
    reps: '12',
    rest_time: 90,
    instructions: [
      'Hold a dumbbell vertically against your chest',
      'Stand with feet shoulder-width apart',
      'Squat down until your thighs are parallel to the ground',
      'Push through your heels to stand back up',
    ],
    tips: [
      'Keep your chest up throughout',
      'Don\'t let your knees cave inward',
      'Keep your weight in your heels',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-bicep-curl-001',
    title: 'Dumbbell Bicep Curl',
    description: 'An isolation arm exercise that targets the biceps.',
    category_id: 'arms',
    difficulty: 'beginner',
    equipment: ['dumbbell'],
    primary_muscles: ['biceps', 'brachialis'],
    secondary_muscles: ['forearms', 'wrist-flexors'],
    type: 'strength',
    sets: 3,
    reps: '12',
    rest_time: 45,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold dumbbells at your sides with palms facing forward',
      'Curl the dumbbells up toward your shoulders',
      'Lower them back down with control',
    ],
    tips: [
      'Keep your elbows tucked to your sides',
      'Don\'t swing your body',
      'Focus on squeezing your biceps at the top',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-tricep-pushdown-001',
    title: 'Rope Tricep Pushdown',
    description: 'An isolation arm exercise that targets the triceps.',
    category_id: 'arms',
    difficulty: 'beginner',
    equipment: ['cable'],
    primary_muscles: ['triceps', 'lateral-head'],
    secondary_muscles: ['forearms', 'anconeus'],
    type: 'strength',
    sets: 3,
    reps: '15',
    rest_time: 45,
    instructions: [
      'Attach a rope to a high cable pulley',
      'Grip the rope with a neutral grip',
      'Push the rope down until your arms are fully extended',
      'Slowly return to the starting position',
    ],
    tips: [
      'Keep your elbows tucked to your sides',
      'Don\'t lean forward',
      'Focus on squeezing your triceps at the bottom',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-plank-001',
    title: 'Plank with Shoulder Taps',
    description: 'A core exercise that targets the abs, obliques, and shoulders.',
    category_id: 'core',
    difficulty: 'intermediate',
    equipment: ['bodyweight'],
    primary_muscles: ['rectus-abdominis', 'obliques', 'transverse-abdominis', 'shoulders'],
    secondary_muscles: ['glutes', 'lower-back', 'hip-flexors'],
    type: 'core',
    sets: 3,
    reps: '20',
    rest_time: 30,
    instructions: [
      'Start in a high plank position',
      'Tap your left shoulder with your right hand',
      'Tap your right shoulder with your left hand',
      'Keep your hips stable throughout',
    ],
    tips: [
      'Keep your body in a straight line',
      'Don\'t let your hips sag or rise',
      'Move slowly and with control',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-lunge-001',
    title: 'Walking Dumbbell Lunge',
    description: 'A compound leg exercise that targets the quads, glutes, and hamstrings.',
    category_id: 'legs',
    difficulty: 'intermediate',
    equipment: ['dumbbell'],
    primary_muscles: ['quadriceps', 'glutes', 'hamstrings'],
    secondary_muscles: ['core', 'calves', 'stabilizers'],
    type: 'strength',
    sets: 3,
    reps: '10',
    rest_time: 60,
    instructions: [
      'Hold dumbbells at your sides',
      'Step forward into a lunge position',
      'Push through your front heel to stand',
      'Step forward with the other leg',
    ],
    tips: [
      'Keep your torso upright',
      'Don\'t let your front knee go past your toes',
      'Take controlled steps',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-deadlift-001',
    title: 'Barbell Deadlift',
    description: 'A compound full-body exercise that targets the posterior chain.',
    category_id: 'legs',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    primary_muscles: ['hamstrings', 'glutes', 'erector-spinae', 'quadriceps'],
    secondary_muscles: ['core', 'traps', 'forearms'],
    type: 'strength',
    sets: 3,
    reps: '8',
    rest_time: 120,
    instructions: [
      'Stand with feet hip-width apart',
      'Grip the bar with an overhand grip',
      'Hinge at the hips and lower the bar',
      'Drive through your heels to stand up',
    ],
    tips: [
      'Keep your back straight',
      'Don\'t round your spine',
      'Keep the bar close to your body',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exercise-pullup-001',
    title: 'Pull-Up',
    description: 'A compound upper-body exercise that targets the lats and biceps.',
    category_id: 'back',
    difficulty: 'intermediate',
    equipment: ['pull-up-bar'],
    primary_muscles: ['lats', 'biceps', 'forearms', 'grip', 'core'],
    secondary_muscles: ['upper-back', 'shoulders', 'abdominals'],
    type: 'calisthenics',
    sets: 3,
    reps: '8',
    rest_time: 90,
    instructions: [
      'Hang from a pull-up bar with an overhand grip',
      'Pull yourself up until your chin clears the bar',
      'Lower yourself back down with control',
    ],
    tips: [
      'Keep your core engaged',
      'Don\'t swing your body',
      'Focus on pulling with your back',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const EXERCISE_CATEGORIES = [
  { exercise_id: 'exercise-chest-press-001', category_id: 'chest' },
  { exercise_id: 'exercise-dumbbell-row-001', category_id: 'back' },
  { exercise_id: 'exercise-shoulder-press-001', category_id: 'shoulders' },
  { exercise_id: 'exercise-squat-001', category_id: 'legs' },
  { exercise_id: 'exercise-bicep-curl-001', category_id: 'arms' },
  { exercise_id: 'exercise-tricep-pushdown-001', category_id: 'arms' },
  { exercise_id: 'exercise-plank-001', category_id: 'core' },
  { exercise_id: 'exercise-lunge-001', category_id: 'legs' },
  { exercise_id: 'exercise-deadlift-001', category_id: 'legs' },
  { exercise_id: 'exercise-pullup-001', category_id: 'back' },
];

const EXERCISE_TAGS = [
  { exercise_id: 'exercise-chest-press-001', tag_id: 'machine' },
  { exercise_id: 'exercise-chest-press-001', tag_id: 'beginner' },
  { exercise_id: 'exercise-chest-press-001', tag_id: 'compound' },
  { exercise_id: 'exercise-chest-press-001', tag_id: 'push' },
  { exercise_id: 'exercise-chest-press-001', tag_id: 'pectorals' },
  { exercise_id: 'exercise-chest-press-001', tag_id: 'triceps' },
  { exercise_id: 'exercise-chest-press-001', tag_id: 'deltoids' },
  
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'dumbbell' },
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'bench' },
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'beginner' },
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'unilateral' },
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'pull' },
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'lats' },
  { exercise_id: 'exercise-dumbbell-row-001', tag_id: 'biceps' },
  
  { exercise_id: 'exercise-shoulder-press-001', tag_id: 'machine' },
  { exercise_id: 'exercise-shoulder-press-001', tag_id: 'beginner' },
  { exercise_id: 'exercise-shoulder-press-001', tag_id: 'compound' },
  { exercise_id: 'exercise-shoulder-press-001', tag_id: 'push' },
  { exercise_id: 'exercise-shoulder-press-001', tag_id: 'deltoids' },
  { exercise_id: 'exercise-shoulder-press-001', tag_id: 'triceps' },
  
  { exercise_id: 'exercise-squat-001', tag_id: 'dumbbell' },
  { exercise_id: 'exercise-squat-001', tag_id: 'beginner' },
  { exercise_id: 'exercise-squat-001', tag_id: 'compound' },
  { exercise_id: 'exercise-squat-001', tag_id: 'squat' },
  { exercise_id: 'exercise-squat-001', tag_id: 'quadriceps' },
  { exercise_id: 'exercise-squat-001', tag_id: 'glutes' },
  { exercise_id: 'exercise-squat-001', tag_id: 'core' },
  
  { exercise_id: 'exercise-bicep-curl-001', tag_id: 'dumbbell' },
  { exercise_id: 'exercise-bicep-curl-001', tag_id: 'beginner' },
  { exercise_id: 'exercise-bicep-curl-001', tag_id: 'isolation' },
  { exercise_id: 'exercise-bicep-curl-001', tag_id: 'bilateral' },
  { exercise_id: 'exercise-bicep-curl-001', tag_id: 'biceps' },
  
  { exercise_id: 'exercise-tricep-pushdown-001', tag_id: 'cable' },
  { exercise_id: 'exercise-tricep-pushdown-001', tag_id: 'beginner' },
  { exercise_id: 'exercise-tricep-pushdown-001', tag_id: 'isolation' },
  { exercise_id: 'exercise-tricep-pushdown-001', tag_id: 'triceps' },
  
  { exercise_id: 'exercise-plank-001', tag_id: 'bodyweight' },
  { exercise_id: 'exercise-plank-001', tag_id: 'intermediate' },
  { exercise_id: 'exercise-plank-001', tag_id: 'core' },
  { exercise_id: 'exercise-plank-001', tag_id: 'rectus-abdominis' },
  { exercise_id: 'exercise-plank-001', tag_id: 'obliques' },
  
  { exercise_id: 'exercise-lunge-001', tag_id: 'dumbbell' },
  { exercise_id: 'exercise-lunge-001', tag_id: 'intermediate' },
  { exercise_id: 'exercise-lunge-001', tag_id: 'compound' },
  { exercise_id: 'exercise-lunge-001', tag_id: 'unilateral' },
  { exercise_id: 'exercise-lunge-001', tag_id: 'lunge' },
  { exercise_id: 'exercise-lunge-001', tag_id: 'quadriceps' },
  { exercise_id: 'exercise-lunge-001', tag_id: 'glutes' },
  
  { exercise_id: 'exercise-deadlift-001', tag_id: 'barbell' },
  { exercise_id: 'exercise-deadlift-001', tag_id: 'intermediate' },
  { exercise_id: 'exercise-deadlift-001', tag_id: 'compound' },
  { exercise_id: 'exercise-deadlift-001', tag_id: 'hinge' },
  { exercise_id: 'exercise-deadlift-001', tag_id: 'hamstrings' },
  { exercise_id: 'exercise-deadlift-001', tag_id: 'glutes' },
  { exercise_id: 'exercise-deadlift-001', tag_id: 'core' },
  
  { exercise_id: 'exercise-pullup-001', tag_id: 'pull-up-bar' },
  { exercise_id: 'exercise-pullup-001', tag_id: 'intermediate' },
  { exercise_id: 'exercise-pullup-001', tag_id: 'bodyweight' },
  { exercise_id: 'exercise-pullup-001', tag_id: 'compound' },
  { exercise_id: 'exercise-pullup-001', tag_id: 'pull' },
  { exercise_id: 'exercise-pullup-001', tag_id: 'lats' },
  { exercise_id: 'exercise-pullup-001', tag_id: 'biceps' },
];

const EXERCISE_MEDIA = [
  { exercise_id: 'exercise-chest-press-001', media_id: 'video-chest-press-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-chest-press-001', media_id: 'image-chest-press-001', media_type: 'image', display_order: 2 },
  { exercise_id: 'exercise-chest-press-001', media_id: 'image-chest-press-002', media_type: 'image', display_order: 3 },
  { exercise_id: 'exercise-dumbbell-row-001', media_id: 'video-dumbbell-row-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-dumbbell-row-001', media_id: 'image-dumbbell-row-001', media_type: 'image', display_order: 2 },
  { exercise_id: 'exercise-dumbbell-row-001', media_id: 'image-dumbbell-row-002', media_type: 'image', display_order: 3 },
  { exercise_id: 'exercise-shoulder-press-001', media_id: 'video-shoulder-press-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-shoulder-press-001', media_id: 'image-shoulder-press-001', media_type: 'image', display_order: 2 },
  { exercise_id: 'exercise-shoulder-press-001', media_id: 'image-shoulder-press-002', media_type: 'image', display_order: 3 },
  { exercise_id: 'exercise-squat-001', media_id: 'video-squat-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-squat-001', media_id: 'image-squat-001', media_type: 'image', display_order: 2 },
  { exercise_id: 'exercise-squat-001', media_id: 'image-squat-002', media_type: 'image', display_order: 3 },
  { exercise_id: 'exercise-bicep-curl-001', media_id: 'video-bicep-curl-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-bicep-curl-001', media_id: 'image-bicep-curl-001', media_type: 'image', display_order: 2 },
  { exercise_id: 'exercise-bicep-curl-001', media_id: 'image-bicep-curl-002', media_type: 'image', display_order: 3 },
  { exercise_id: 'exercise-tricep-pushdown-001', media_id: 'video-tricep-pushdown-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-plank-001', media_id: 'video-plank-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-lunge-001', media_id: 'video-lunge-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-deadlift-001', media_id: 'video-deadlift-001', media_type: 'video', display_order: 1 },
  { exercise_id: 'exercise-pullup-001', media_id: 'video-pullup-001', media_type: 'video', display_order: 1 },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedExercises(client) {
  console.log('💪 Seeding exercises...');
  
  for (const exercise of EXERCISES) {
    try {
      // Check if exercise already exists
      const existing = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
      if (existing && existing.find(e => e.name === exercise.title)) {
        console.log(`  ✓ Exercise "${exercise.title}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Exercise doesn't exist, proceed with seeding
    }

    // Capitalize the first letter of difficulty
    const difficulty = exercise.difficulty 
      ? exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1).toLowerCase()
      : 'Beginner';

    await client.mutation('seed:insertExercise', {
      adminSecret: ADMIN_SECRET,
      exercise: {
        name: exercise.title,
        category: exercise.category || 'Strength',
        muscleGroup: exercise.muscle_group || 'Full Body',
        primaryMuscles: exercise.primary_muscles || [],
        secondaryMuscles: exercise.secondary_muscles || [],
        equipment: exercise.equipment || [],
        overview: exercise.overview || `${exercise.title} exercise`,
        instructions: exercise.instructions || [],
        benefits: exercise.benefits || ["Improved strength", "Better muscle tone"],
        difficulty: difficulty,
        sets: String(exercise.sets || '3'),
        reps: String(exercise.reps || '10'),
        tags: exercise.tags || [],
        videoUrl: exercise.video_url,
        imageUrl: exercise.image_url,
      },
    });
    console.log(`  ✓ Exercise "${exercise.title}" seeded`);
  }
}

async function seedExerciseCategories(client) {
  console.log('📁 Seeding exercise-category mappings...');
  
  for (const mapping of EXERCISE_CATEGORIES) {
    try {
      // Check if mapping already exists
      const existing = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
      if (existing && existing.find(e => e.name === mapping.exercise_id && e.category === mapping.category_id)) {
        console.log(`  ✓ Mapping "${mapping.exercise_id}" → "${mapping.category_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Mapping doesn't exist, proceed with seeding
    }

    // Get the exercise ID from the name
    const exercises = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
    const exercise = exercises.find(e => e.name === mapping.exercise_id);
    if (!exercise) {
      console.log(`  ⚠ Exercise "${mapping.exercise_id}" not found, skipping category mapping...`);
      continue;
    }

    await client.mutation('seed:mapExerciseToCategory', {
      adminSecret: ADMIN_SECRET,
      exerciseId: exercise._id,
      categoryId: mapping.category_id,
    });
    console.log(`  ✓ Mapping "${mapping.exercise_id}" → "${mapping.category_id}" seeded`);
  }
}

async function seedExerciseTags(client) {
  console.log('🏷️  Seeding exercise-tag mappings...');
  
  for (const mapping of EXERCISE_TAGS) {
    try {
      // Check if mapping already exists
      const existing = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
      if (existing && existing.find(e => e.name === mapping.exercise_id && e.tags && e.tags.includes(mapping.tag_id))) {
        console.log(`  ✓ Mapping "${mapping.exercise_id}" → "${mapping.tag_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Mapping doesn't exist, proceed with seeding
    }

    // Get the exercise ID from the name
    const exercises = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
    const exercise = exercises.find(e => e.name === mapping.exercise_id);
    if (!exercise) {
      console.log(`  ⚠ Exercise "${mapping.exercise_id}" not found, skipping tag mapping...`);
      continue;
    }

    await client.mutation('seed:mapExerciseToTag', {
      adminSecret: ADMIN_SECRET,
      exerciseId: exercise._id,
      tagId: mapping.tag_id,
    });
    console.log(`  ✓ Mapping "${mapping.exercise_id}" → "${mapping.tag_id}" seeded`);
  }
}

async function seedExerciseMedia(client) {
  console.log('🎥 Seeding exercise-media mappings...');
  
  for (const mapping of EXERCISE_MEDIA) {
    try {
      // Check if mapping already exists
      const existing = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
      if (existing && existing.find(e => e.name === mapping.exercise_id && 
          ((mapping.media_type === 'video' && e.videoUrl === mapping.media_id) ||
           (mapping.media_type === 'image' && e.imageUrl === mapping.media_id)))) {
        console.log(`  ✓ Mapping "${mapping.exercise_id}" → "${mapping.media_id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Mapping doesn't exist, proceed with seeding
    }

    // Get the exercise ID from the name
    const exercises = await client.query('exercises:list', { adminSecret: ADMIN_SECRET });
    const exercise = exercises.find(e => e.name === mapping.exercise_id);
    if (!exercise) {
      console.log(`  ⚠ Exercise "${mapping.exercise_id}" not found, skipping media mapping...`);
      continue;
    }

    await client.mutation('seed:mapExerciseToMedia', {
      adminSecret: ADMIN_SECRET,
      exerciseId: exercise._id,
      mediaId: mapping.media_id,
      mediaType: mapping.media_type,
    });
    console.log(`  ✓ Mapping "${mapping.exercise_id}" → "${mapping.media_id}" seeded`);
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
  console.log('SEED SCRIPT 05: Exercises with Mappings');
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
    await seedExercises(client);
    await seedExerciseCategories(client);
    await seedExerciseTags(client);
    await seedExerciseMedia(client);

    console.log('\n✅ Seed script 05 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 05 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
