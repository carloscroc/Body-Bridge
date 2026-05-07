#!/usr/bin/env node
/**
 * Seed Script 06: Localization Strings
 * 
 * Seeds the database with UI strings, error messages, and exercise descriptions
 * in multiple languages.
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

const UI_STRINGS = [
  // Navigation
  { key: 'nav.home', language: 'en', value: 'Home', context: 'navigation' },
  { key: 'nav.exercises', language: 'en', value: 'Exercises', context: 'navigation' },
  { key: 'nav.workouts', language: 'en', value: 'Workouts', context: 'navigation' },
  { key: 'nav.progress', language: 'en', value: 'Progress', context: 'navigation' },
  { key: 'nav.settings', language: 'en', value: 'Settings', context: 'navigation' },
  { key: 'nav.home', language: 'es', value: 'Inicio', context: 'navigation' },
  { key: 'nav.exercises', language: 'es', value: 'Ejercicios', context: 'navigation' },
  { key: 'nav.workouts', language: 'es', value: 'Rutinas', context: 'navigation' },
  { key: 'nav.progress', language: 'es', value: 'Progreso', context: 'navigation' },
  { key: 'nav.settings', language: 'es', value: 'Configuración', context: 'navigation' },
  
  // Buttons
  { key: 'button.start', language: 'en', value: 'Start', context: 'buttons' },
  { key: 'button.stop', language: 'en', value: 'Stop', context: 'buttons' },
  { key: 'button.pause', language: 'en', value: 'Pause', context: 'buttons' },
  { key: 'button.resume', language: 'en', value: 'Resume', context: 'buttons' },
  { key: 'button.save', language: 'en', value: 'Save', context: 'buttons' },
  { key: 'button.cancel', language: 'en', value: 'Cancel', context: 'buttons' },
  { key: 'button.start', language: 'es', value: 'Iniciar', context: 'buttons' },
  { key: 'button.stop', language: 'es', value: 'Detener', context: 'buttons' },
  { key: 'button.pause', language: 'es', value: 'Pausar', context: 'buttons' },
  { key: 'button.resume', language: 'es', value: 'Reanudar', context: 'buttons' },
  { key: 'button.save', language: 'es', value: 'Guardar', context: 'buttons' },
  { key: 'button.cancel', language: 'es', value: 'Cancelar', context: 'buttons' },
  
  // Messages
  { key: 'message.welcome', language: 'en', value: 'Welcome to Forge!', context: 'messages' },
  { key: 'message.loading', language: 'en', value: 'Loading...', context: 'messages' },
  { key: 'message.success', language: 'en', value: 'Success!', context: 'messages' },
  { key: 'message.error', language: 'en', value: 'An error occurred', context: 'messages' },
  { key: 'message.welcome', language: 'es', value: '¡Bienvenido a Forge!', context: 'messages' },
  { key: 'message.loading', language: 'es', value: 'Cargando...', context: 'messages' },
  { key: 'message.success', language: 'es', value: '¡Éxito!', context: 'messages' },
  { key: 'message.error', language: 'es', value: 'Ocurrió un error', context: 'messages' },
  
  // Exercise-related
  { key: 'exercise.sets', language: 'en', value: 'Sets', context: 'exercise' },
  { key: 'exercise.reps', language: 'en', value: 'Reps', context: 'exercise' },
  { key: 'exercise.rest', language: 'en', value: 'Rest', context: 'exercise' },
  { key: 'exercise.duration', language: 'en', value: 'Duration', context: 'exercise' },
  { key: 'exercise.sets', language: 'es', value: 'Series', context: 'exercise' },
  { key: 'exercise.reps', language: 'es', value: 'Repeticiones', context: 'exercise' },
  { key: 'exercise.rest', language: 'es', value: 'Descanso', context: 'exercise' },
  { key: 'exercise.duration', language: 'es', value: 'Duración', context: 'exercise' },
];

const ERROR_MESSAGES = [
  { error_code: 'AUTH_FAILED', language: 'en', message: 'Authentication failed', solution: 'Please check your credentials and try again' },
  { error_code: 'AUTH_FAILED', language: 'es', message: 'Autenticación fallida', solution: 'Por favor verifique sus credenciales e inténtelo de nuevo' },
  { error_code: 'NETWORK_ERROR', language: 'en', message: 'Network error', solution: 'Please check your internet connection' },
  { error_code: 'NETWORK_ERROR', language: 'es', message: 'Error de red', solution: 'Por favor verifique su conexión a internet' },
  { error_code: 'SERVER_ERROR', language: 'en', message: 'Server error', solution: 'Please try again later' },
  { error_code: 'SERVER_ERROR', language: 'es', message: 'Error del servidor', solution: 'Por favor inténtelo de nuevo más tarde' },
  { error_code: 'NOT_FOUND', language: 'en', message: 'Resource not found', solution: 'The requested resource does not exist' },
  { error_code: 'NOT_FOUND', language: 'es', message: 'Recurso no encontrado', solution: 'El recurso solicitado no existe' },
  { error_code: 'VALIDATION_ERROR', language: 'en', message: 'Validation error', solution: 'Please check your input and try again' },
  { error_code: 'VALIDATION_ERROR', language: 'es', message: 'Error de validación', solution: 'Por favor verifique su entrada e inténtelo de nuevo' },
];

const EXERCISE_DESCRIPTIONS = [
  { exercise_id: 'exercise-chest-press-001', language: 'en', description: 'A compound chest exercise that targets the pectorals, triceps, and anterior deltoids.', instructions: 'Adjust the seat height so your chest is aligned with the handles. Grip the handles with a neutral grip. Press the handles forward until your arms are fully extended. Slowly return to the starting position.' },
  { exercise_id: 'exercise-chest-press-001', language: 'es', description: 'Un ejercicio compuesto de pecho que apunta a los pectorales, tríceps y deltoides anteriores.', instructions: 'Ajuste la altura del asiento para que su pecho esté alineado con las asas. Agarre las asas con un agarre neutro. Presione las asas hacia adelante hasta que sus brazos estén completamente extendidos. Regrese lentamente a la posición inicial.' },
  { exercise_id: 'exercise-dumbbell-row-001', language: 'en', description: 'A unilateral back exercise that targets the lats, rhomboids, and traps.', instructions: 'Place one knee and hand on a bench for support. Hold a dumbbell in your free hand with a neutral grip. Pull the dumbbell up toward your hip. Lower it back down with control.' },
  { exercise_id: 'exercise-dumbbell-row-001', language: 'es', description: 'Un ejercicio unilateral de espalda que apunta a los dorsales, romboides y trapecios.', instructions: 'Coloque una rodilla y una mano en un banco para apoyo. Sostenga una mancuerna en su mano libre con un agarre neutro. Tire de la mancuerna hacia arriba hacia su cadera. Bájela hacia abajo con control.' },
  { exercise_id: 'exercise-shoulder-press-001', language: 'en', description: 'A compound shoulder exercise that targets the anterior and lateral deltoids.', instructions: 'Adjust the seat height so your shoulders are aligned with the handles. Grip the handles with a neutral grip. Press the handles upward until your arms are fully extended. Slowly return to the starting position.' },
  { exercise_id: 'exercise-shoulder-press-001', language: 'es', description: 'Un ejercicio compuesto de hombro que apunta a los deltoides anteriores y laterales.', instructions: 'Ajuste la altura del asiento para que sus hombros estén alineados con las asas. Agarre las asas con un agarre neutro. Presione las asas hacia arriba hasta que sus brazos estén completamente extendidos. Regrese lentamente a la posición inicial.' },
  { exercise_id: 'exercise-squat-001', language: 'en', description: 'A compound leg exercise that targets the quads, glutes, and core.', instructions: 'Hold a dumbbell vertically against your chest. Stand with feet shoulder-width apart. Squat down until your thighs are parallel to the ground. Push through your heels to stand back up.' },
  { exercise_id: 'exercise-squat-001', language: 'es', description: 'Un ejercicio compuesto de piernas que apunta a los cuádriceps, glúteos y núcleo.', instructions: 'Sostenga una mancuerna verticalmente contra su pecho. Párese con los pies separados al ancho de los hombros. Agáchese hasta que sus muslos estén paralelos al suelo. Empuje a través de sus talones para pararse de nuevo.' },
  { exercise_id: 'exercise-bicep-curl-001', language: 'en', description: 'An isolation arm exercise that targets the biceps.', instructions: 'Stand with feet shoulder-width apart. Hold dumbbells at your sides with palms facing forward. Curl the dumbbells up toward your shoulders. Lower them back down with control.' },
  { exercise_id: 'exercise-bicep-curl-001', language: 'es', description: 'Un ejercicio de aislamiento de brazo que apunta a los bíceps.', instructions: 'Párese con los pies separados al ancho de los hombros. Sostenga mancuernas a sus lados con las palmas hacia adelante. Riza las mancuernas hacia sus hombros. Bájalas hacia abajo con control.' },
  { exercise_id: 'exercise-tricep-pushdown-001', language: 'en', description: 'An isolation arm exercise that targets the triceps.', instructions: 'Attach a rope to a high cable pulley. Grip the rope with a neutral grip. Push the rope down until your arms are fully extended. Slowly return to the starting position.' },
  { exercise_id: 'exercise-tricep-pushdown-001', language: 'es', description: 'Un ejercicio de aislamiento de brazo que apunta a los tríceps.', instructions: 'Ajuste una cuerda a una polea de cable alta. Agarre la cuerda con un agarre neutro. Empuje la cuerda hacia abajo hasta que sus brazos estén completamente extendidos. Regrese lentamente a la posición inicial.' },
  { exercise_id: 'exercise-plank-001', language: 'en', description: 'A core exercise that targets the abs, obliques, and shoulders.', instructions: 'Start in a high plank position. Tap your left shoulder with your right hand. Tap your right shoulder with your left hand. Keep your hips stable throughout.' },
  { exercise_id: 'exercise-plank-001', language: 'es', description: 'Un ejercicio de núcleo que apunta a los abdominales, oblicuos y hombros.', instructions: 'Comience en una posición de plancha alta. Toque su hombro izquierdo con su mano derecha. Toque su hombro derecho con su mano izquierda. Mantenga sus caderas estables durante todo el ejercicio.' },
  { exercise_id: 'exercise-lunge-001', language: 'en', description: 'A compound leg exercise that targets the quads, glutes, and hamstrings.', instructions: 'Hold dumbbells at your sides. Step forward into a lunge position. Push through your front heel to stand. Step forward with the other leg.' },
  { exercise_id: 'exercise-lunge-001', language: 'es', description: 'Un ejercicio compuesto de piernas que apunta a los cuádriceps, glúteos e isquiotibiales.', instructions: 'Sostenga mancuernas a sus lados. Dé un paso adelante hacia una posición de zancada. Empuje a través de su talón delantero para pararse. Dé un paso adelante con la otra pierna.' },
  { exercise_id: 'exercise-deadlift-001', language: 'en', description: 'A compound full-body exercise that targets the posterior chain.', instructions: 'Stand with feet hip-width apart. Grip the bar with an overhand grip. Hinge at the hips and lower the bar. Drive through your heels to stand up.' },
  { exercise_id: 'exercise-deadlift-001', language: 'es', description: 'Un ejercicio compuesto de cuerpo completo que apunta a la cadena posterior.', instructions: 'Párese con los pies separados al ancho de las caderas. Agarre la barra con un agarre supinado. Inclínese en las caderas y baje la barra. Empuje a través de sus talones para pararse.' },
  { exercise_id: 'exercise-pullup-001', language: 'en', description: 'A compound upper-body exercise that targets the lats and biceps.', instructions: 'Hang from a pull-up bar with an overhand grip. Pull yourself up until your chin clears the bar. Lower yourself back down with control.' },
  { exercise_id: 'exercise-pullup-001', language: 'es', description: 'Un ejercicio compuesto de cuerpo superior que apunta a los dorsales y bíceps.', instructions: 'Cuélguese de una barra de dominadas con un agarre supinado. Tire hacia arriba hasta que su barbilla despeje la barra. Bájese hacia abajo con control.' },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedUiStrings(client) {
  console.log('📝 Seeding UI strings...');
  
  for (const str of UI_STRINGS) {
    try {
      // Check if string already exists
      const existing = await client.query('seed:getUIStrings', { language: str.language });
      if (existing && existing[str.key]) {
        console.log(`  ✓ UI string "${str.key}" (${str.language}) already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // String doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertUIString', {
      adminSecret: ADMIN_SECRET,
      uiString: {
        key: str.key,
        language: str.language,
        value: str.value,
      },
    });
    console.log(`  ✓ UI string "${str.key}" (${str.language}) seeded`);
  }
}

async function seedErrorMessages(client) {
  console.log('⚠️  Seeding error messages...');
  
  for (const error of ERROR_MESSAGES) {
    try {
      // Check if error message already exists
      const existing = await client.query('seed:getErrorMessages', { language: error.language });
      if (existing && existing.find(e => e.code === error.error_code)) {
        console.log(`  ✓ Error message "${error.error_code}" (${error.language}) already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Error message doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertErrorMessage', {
      adminSecret: ADMIN_SECRET,
      errorMessage: {
        code: error.error_code,
        language: error.language,
        message: error.message,
        solution: error.solution,
      },
    });
    console.log(`  ✓ Error message "${error.error_code}" (${error.language}) seeded`);
  }
}

async function seedExerciseDescriptions(client) {
  console.log('💪 Seeding exercise descriptions...');
  
  for (const desc of EXERCISE_DESCRIPTIONS) {
    try {
      // Check if description already exists
      const existing = await client.query('seed:getExerciseDescriptions', { language: desc.language });
      if (existing && existing.find(d => d.exerciseId === desc.exercise_id)) {
        console.log(`  ✓ Description for "${desc.exercise_id}" (${desc.language}) already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Description doesn't exist, proceed with seeding
    }

    // Handle instructions as either string or array
    const instructions = Array.isArray(desc.instructions) 
      ? desc.instructions 
      : desc.instructions.split('. ').map(s => s.trim()).filter(s => s);

    await client.mutation('seed:insertExerciseDescription', {
      adminSecret: ADMIN_SECRET,
      exerciseDescription: {
        exerciseId: desc.exercise_id,
        language: desc.language,
        description: desc.description,
        instructions: instructions,
      },
    });
    console.log(`  ✓ Description for "${desc.exercise_id}" (${desc.language}) seeded`);
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
  console.log('SEED SCRIPT 06: Localization Strings');
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
    await seedUiStrings(client);
    await seedErrorMessages(client);
    await seedExerciseDescriptions(client);

    console.log('\n✅ Seed script 06 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 06 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
