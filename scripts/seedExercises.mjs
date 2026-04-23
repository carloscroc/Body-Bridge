#!/usr/bin/env node
/**
 * Exercise Library Seeder — Generates 1000+ exercises and inserts them via Convex batchCreate.
 *
 * Usage:
 *   node scripts/seedExercises.mjs
 *
 * Requires the local Convex dev server running on port 3210.
 * Will auto-start it if not detected.
 */

import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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
// EXERCISE GENERATION DATA
// ═════════════════════════════════════════════════════════════════

const CATEGORIES = ['Strength', 'Cardio', 'Flexibility', 'HIIT', 'Calisthenics', 'Plyometric', 'Core', 'Functional', 'Rehabilitation', 'Olympic'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

// Exercise templates: [name, muscleGroup, primaryMuscles, secondaryMuscles, equipment, category, difficulty, sets, reps, tags, instructions, overview, benefits]
// Using a template approach with a massive exercise database

function generateExercises() {
  const exercises = [];

  // ─── STRENGTH: CHEST ───
  const chestExercises = [
    { name: "Machine Chest Press", eq: ["Machine"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Incline Machine Fly", eq: ["Machine"], diff: "Intermediate", mus: "Chest", pm: ["Upper Pectorals","Anterior Deltoids"], sm: ["Biceps","Core"] },
    { name: "Cable Crossover", eq: ["Cable Machine"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Anterior Deltoids"], sm: ["Core","Biceps"] },
    { name: "Low Cable Crossover", eq: ["Cable Machine"], diff: "Intermediate", mus: "Chest", pm: ["Lower Pectorals","Pectorals"], sm: ["Anterior Deltoids","Core"] },
    { name: "Pec Deck Machine", eq: ["Machine"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Anterior Deltoids"], sm: ["Biceps"] },
    { name: "Single-Arm Dumbbell Fly", eq: ["Dumbbell","Bench"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Anterior Deltoids"], sm: ["Core","Biceps"] },
    { name: "Dumbbell Floor Press", eq: ["Dumbbells"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Guillotine Press", eq: ["Barbell","Bench"], diff: "Advanced", mus: "Chest", pm: ["Upper Pectorals","Anterior Deltoids","Triceps"], sm: ["Core"] },
    { name: "Weighted Push-Up", eq: ["Weight Plate"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Serratus Anterior"] },
    { name: "Band-Resisted Push-Up", eq: ["Resistance Band"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core","Serratus Anterior"] },
    { name: "Decline Dumbbell Press", eq: ["Dumbbells","Decline Bench"], diff: "Intermediate", mus: "Chest", pm: ["Lower Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Smith Machine Incline Press", eq: ["Smith Machine","Bench"], diff: "Beginner", mus: "Chest", pm: ["Upper Pectorals","Anterior Deltoids","Triceps"], sm: ["Core"] },
    { name: "Chest Dips", eq: ["Dip Bars"], diff: "Intermediate", mus: "Chest", pm: ["Lower Pectorals","Triceps","Anterior Deltoids"], sm: ["Rhomboids","Core"] },
    { name: "Svend Press", eq: ["Weight Plate"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Anterior Deltoids"], sm: ["Core","Triceps"] },
    { name: "Dumbbell Squeeze Press", eq: ["Dumbbells","Bench"], diff: "Intermediate", mus: "Chest", pm: ["Inner Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Close-Grip Barbell Bench Press", eq: ["Barbell","Bench"], diff: "Intermediate", mus: "Chest", pm: ["Inner Pectorals","Triceps","Anterior Deltoids"], sm: ["Front Deltoids"] },
    { name: "Reverse Grip Bench Press", eq: ["Barbell","Bench"], diff: "Intermediate", mus: "Chest", pm: ["Upper Pectorals","Triceps","Anterior Deltoids"], sm: ["Biceps","Forearms"] },
    { name: "Mechanical Drop Set Chest Press", eq: ["Machine"], diff: "Advanced", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Single-Arm Landmine Chest Press", eq: ["Barbell","Landmine"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Anterior Deltoids","Triceps"], sm: ["Core","Obliques"] },
    { name: "Band Chest Fly", eq: ["Resistance Band"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Anterior Deltoids"], sm: ["Biceps","Core"] },
    { name: "Iso-Lateral Chest Press", eq: ["Machine"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core","Serratus Anterior"] },
    { name: "Dumbbell Pullover on Flat Bench", eq: ["Dumbbell","Bench"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Lats","Triceps"], sm: ["Serratus Anterior","Rhomboids"] },
    { name: "Machine Decline Press", eq: ["Machine"], diff: "Beginner", mus: "Chest", pm: ["Lower Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Resistance Band Floor Press", eq: ["Resistance Band"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core"] },
    { name: "Single-Arm Dumbbell Bench Press", eq: ["Dumbbell","Bench"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core","Obliques"] },
    { name: "Cable Crossover from High", eq: ["Cable Machine"], diff: "Intermediate", mus: "Chest", pm: ["Lower Pectorals","Anterior Deltoids"], sm: ["Core","Biceps"] },
  ];

  // ─── STRENGTH: BACK ───
  const backExercises = [
    { name: "T-Bar Row with V-Bar", eq: ["T-Bar Row Machine","Weight Plates"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius"], sm: ["Biceps","Rear Deltoids","Core"] },
    { name: "Single-Arm Dumbbell Row on Bench", eq: ["Dumbbell","Bench"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius"], sm: ["Biceps","Rear Deltoids","Core"] },
    { name: "Cable Seated Row with Rope", eq: ["Cable Machine","Rope Attachment"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius"], sm: ["Biceps","Rear Deltoids"] },
    { name: "Pendlay Row", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Back", pm: ["Latissimus Dorsi","Trapezius","Rhomboids","Posterior Deltoids"], sm: ["Hamstrings","Core","Biceps"] },
    { name: "Meadows Row", eq: ["T-Bar Row Setup","Weight Plates"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Lower Traps"], sm: ["Biceps","Core"] },
    { name: "Straight-Arm Lat Pulldown", eq: ["Cable Machine","Straight Bar"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Teres Major"], sm: ["Rhomboids","Posterior Deltoids"] },
    { name: "Cable Face Pull to External Rotation", eq: ["Cable Machine","Rope Attachment"], diff: "Intermediate", mus: "Back", pm: ["Rear Deltoids","Rotator Cuff","Rhomboids"], sm: ["Mid Traps","Core"] },
    { name: "Inverted Row", eq: ["Smith Machine"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius","Biceps"], sm: ["Core","Rear Deltoids"] },
    { name: "Machine Row Close Grip", eq: ["Machine"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Mid Traps"], sm: ["Biceps","Core"] },
    { name: "Bent-Over Barbell Row Underhand", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Biceps","Trapezius"], sm: ["Rear Deltoids","Core","Forearms"] },
    { name: "Single-Arm Cable Row", eq: ["Cable Machine","Single Handle"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius"], sm: ["Biceps","Core","Obliques"] },
    { name: "Renegade Row", eq: ["Dumbbells"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Core","Triceps"], sm: ["Shoulders","Glutes"] },
    { name: "Single-Arm Landmine Row", eq: ["Barbell","Landmine","Weight Plates"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Rear Deltoids"], sm: ["Core","Biceps"] },
    { name: "V-Grip Cable Pulldown", eq: ["Cable Machine","V-Grip Attachment"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Biceps","Lower Traps"], sm: ["Forearms","Rear Deltoids"] },
    { name: "Wide-Grip Cable Pulldown", eq: ["Cable Machine","Wide Bar"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Posterior Deltoids","Rhomboids"], sm: ["Biceps","Core"] },
    { name: "Neutral-Grip Pulldown", eq: ["Cable Machine","Neutral Grip Bar"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Lower Traps","Rhomboids"], sm: ["Biceps","Forearms"] },
    { name: "Machine Chest-Supported Row", eq: ["Machine"], diff: "Beginner", mus: "Back", pm: ["Rhomboids","Mid Traps","Rear Deltoids"], sm: ["Lats","Biceps"] },
    { name: "Barbell Shrugs", eq: ["Barbell","Weight Plates"], diff: "Beginner", mus: "Back", pm: ["Upper Trapezius","Levator Scapulae"], sm: ["Forearms","Core"] },
    { name: "Dumbbell Shrugs", eq: ["Dumbbells"], diff: "Beginner", mus: "Back", pm: ["Upper Trapezius","Levator Scapulae"], sm: ["Forearms","Core"] },
    { name: "Cable Shrugs", eq: ["Cable Machine","Low Pulley","Rope"], diff: "Beginner", mus: "Back", pm: ["Upper Trapezius","Levator Scapulae"], sm: ["Forearms","Core"] },
    { name: "Barbell Yates Row", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Mid Traps"], sm: ["Biceps","Rear Deltoids","Core"] },
    { name: "Dumbbell Seal Row", eq: ["Dumbbell","Incline Bench"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Mid Traps"], sm: ["Biceps","Rear Deltoids"] },
    { name: "Kroc Row", eq: ["Dumbbell","Bench"], diff: "Advanced", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius"], sm: ["Biceps","Core","Grip"] },
    { name: "Cable Rope Pullover", eq: ["Cable Machine","Rope Attachment"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Pectorals","Triceps"], sm: ["Rhomboids","Serratus Anterior"] },
    { name: "Gorilla Row", eq: ["Dumbbells"], diff: "Intermediate", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Trapezius","Core"], sm: ["Biceps","Glutes","Hamstrings"] },
  ];

  // ─── STRENGTH: SHOULDERS ───
  const shoulderExercises = [
    { name: "Machine Lateral Raise", eq: ["Machine"], diff: "Beginner", mus: "Shoulders", pm: ["Lateral Deltoids"], sm: ["Anterior Deltoids","Traps","Core"] },
    { name: "Behind-the-Neck Press", eq: ["Barbell","Bench","Rack"], diff: "Advanced", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps"], sm: ["Upper Traps","Core"] },
    { name: "Cable Lateral Raise", eq: ["Cable Machine","Single Handle"], diff: "Intermediate", mus: "Shoulders", pm: ["Lateral Deltoids"], sm: ["Anterior Deltoids","Upper Traps","Forearms"] },
    { name: "Single-Arm Landmine Press", eq: ["Barbell","Landmine","Weight Plates"], diff: "Intermediate", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps","Core"], sm: ["Upper Chest","Obliques"] },
    { name: "Machine Shoulder Press", eq: ["Machine"], diff: "Beginner", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps"], sm: ["Upper Traps","Core"] },
    { name: "Upright Row with Cable", eq: ["Cable Machine","Straight Bar"], diff: "Intermediate", mus: "Shoulders", pm: ["Lateral Deltoids","Upper Traps","Rhomboids"], sm: ["Biceps","Forearms"] },
    { name: "Rear Delt Fly Machine", eq: ["Machine"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Rhomboids","Lower Traps"], sm: ["Mid Traps","Rotator Cuff"] },
    { name: "Smith Machine Shrug", eq: ["Smith Machine","Weight Plates"], diff: "Beginner", mus: "Shoulders", pm: ["Upper Trapezius","Levator Scapulae"], sm: ["Forearms","Core"] },
    { name: "Barbell Front Raise", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Shoulders", pm: ["Anterior Deltoids","Upper Pectorals"], sm: ["Serratus Anterior","Core"] },
    { name: "Cable Front Raise", eq: ["Cable Machine","Straight Bar"], diff: "Beginner", mus: "Shoulders", pm: ["Anterior Deltoids","Upper Pectorals"], sm: ["Core","Serratus Anterior"] },
    { name: "Dumbbell Reverse Fly on Bench", eq: ["Dumbbell","Incline Bench"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Rhomboids","Mid Traps"], sm: ["Lats","Traps"] },
    { name: "Dumbbell Clean and Press", eq: ["Dumbbells"], diff: "Intermediate", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Traps","Triceps"], sm: ["Core","Calves","Glutes"] },
    { name: "Bradford Press", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps"], sm: ["Upper Traps","Core"] },
    { name: "Cable Reverse Fly", eq: ["Cable Machine","Single Handles"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Rhomboids","Lower Traps"], sm: ["Mid Traps","Triceps"] },
    { name: "Landmine Lateral Raise", eq: ["Barbell","Landmine","Weight Plates"], diff: "Intermediate", mus: "Shoulders", pm: ["Lateral Deltoids","Anterior Deltoids"], sm: ["Core","Traps"] },
    { name: "Dumbbell W Raise", eq: ["Dumbbells"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Lower Traps","Rhomboids"], sm: ["Rotator Cuff","Mid Traps"] },
    { name: "Barbell Push Press", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps","Legs"], sm: ["Core","Upper Traps"] },
    { name: "Dumbbell Iron Cross", eq: ["Dumbbells"], diff: "Advanced", mus: "Shoulders", pm: ["Lateral Deltoids","Anterior Deltoids","Core"], sm: ["Traps","Forearms","Grip"] },
    { name: "Cable Y Raise", eq: ["Cable Machine","Single Handles"], diff: "Intermediate", mus: "Shoulders", pm: ["Lower Traps","Lateral Deltoids","Rhomboids"], sm: ["Rotator Cuff","Mid Traps"] },
    { name: "Seated Dumbbell Arnold Press", eq: ["Dumbbells","Bench"], diff: "Intermediate", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps"], sm: ["Upper Traps","Core"] },
    { name: "Single-Arm Cable Lateral Raise", eq: ["Cable Machine","Single Handle"], diff: "Intermediate", mus: "Shoulders", pm: ["Lateral Deltoids"], sm: ["Anterior Deltoids","Upper Traps"] },
    { name: "Leaning Dumbbell Lateral Raise", eq: ["Dumbbell","Wall"], diff: "Advanced", mus: "Shoulders", pm: ["Lateral Deltoids","Upper Traps"], sm: ["Core","Obliques","Forearms"] },
    { name: "Pike Push-Up", eq: ["Bodyweight"], diff: "Intermediate", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps"], sm: ["Upper Pectorals","Core","Traps"] },
    { name: "Trap Bar Shrug", eq: ["Trap Bar","Weight Plates"], diff: "Beginner", mus: "Shoulders", pm: ["Upper Trapezius","Levator Scapulae"], sm: ["Forearms","Core","Grip"] },
    { name: "Face Pull with Band", eq: ["Resistance Band"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Rhomboids","Lower Traps"], sm: ["Mid Traps","Rotator Cuff"] },
    { name: "Dumbbell Lateral Raise 21s", eq: ["Dumbbells"], diff: "Intermediate", mus: "Shoulders", pm: ["Lateral Deltoids","Anterior Deltoids"], sm: ["Upper Traps","Forearms"] },
  ];

  // ─── STRENGTH: LEGS ───
  const legExercises = [
    { name: "Walking Dumbbell Lunge", eq: ["Dumbbells"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings"], sm: ["Core","Calves"] },
    { name: "Reverse Dumbbell Lunge", eq: ["Dumbbells"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings"], sm: ["Core","Calves","Stabilizers"] },
    { name: "Lateral Dumbbell Lunge", eq: ["Dumbbells"], diff: "Intermediate", mus: "Legs", pm: ["Adductors","Abductors","Glutes","Quadriceps"], sm: ["Core","Hamstrings","Stabilizers"] },
    { name: "Bulgarian Split Squat with Dumbbells", eq: ["Dumbbells","Bench"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings"], sm: ["Core","Calves","Stabilizers"] },
    { name: "Leg Press Narrow Stance", eq: ["Leg Press Machine"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Vastus Medialis"], sm: ["Glutes","Calves","Core"] },
    { name: "Leg Press Wide Stance", eq: ["Leg Press Machine"], diff: "Beginner", mus: "Legs", pm: ["Glutes","Hamstrings","Adductors"], sm: ["Quadriceps","Core"] },
    { name: "Single-Leg Leg Curl", eq: ["Leg Curl Machine"], diff: "Intermediate", mus: "Legs", pm: ["Hamstrings","Glutes"], sm: ["Calves","Core"] },
    { name: "Standing Leg Curl", eq: ["Standing Leg Curl Machine"], diff: "Beginner", mus: "Legs", pm: ["Hamstrings","Glutes"], sm: ["Calves","Lower Back"] },
    { name: "Dumbbell Step-Up", eq: ["Dumbbells","Box","Bench"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings"], sm: ["Core","Calves","Stabilizers"] },
    { name: "Cable Kickback Glutes", eq: ["Cable Machine","Ankle Strap"], diff: "Intermediate", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings"], sm: ["Core","Lower Back"] },
    { name: "Single-Leg Leg Extension", eq: ["Leg Extension Machine"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Vastus Medialis","Vastus Lateralis"], sm: ["Hip Flexors","Core"] },
    { name: "Calf Raise Standing", eq: ["Calf Raise Machine"], diff: "Beginner", mus: "Legs", pm: ["Gastrocnemius","Soleus"], sm: ["Tibialis Anterior","Peroneals"] },
    { name: "Seated Calf Raise", eq: ["Seated Calf Raise Machine"], diff: "Beginner", mus: "Legs", pm: ["Soleus","Gastrocnemius"], sm: ["Tibialis Anterior","Tibialis Posterior"] },
    { name: "Donkey Calf Raise", eq: ["Calf Block","Partner","Weight Belt"], diff: "Intermediate", mus: "Legs", pm: ["Gastrocnemius","Soleus"], sm: ["Lower Back","Core"] },
    { name: "Leg Press Calf Raise", eq: ["Leg Press Machine"], diff: "Beginner", mus: "Legs", pm: ["Gastrocnemius","Soleus"], sm: ["Quadriceps","Glutes"] },
    { name: "Smith Machine Calf Raise", eq: ["Smith Machine","Weight Plates","Block"], diff: "Beginner", mus: "Legs", pm: ["Gastrocnemius","Soleus"], sm: ["Tibialis Anterior"] },
    { name: "Deficit Reverse Lunge", eq: ["Dumbbells","Deficit Step"], diff: "Advanced", mus: "Legs", pm: ["Quadriceps","Glutes","Hip Flexors"], sm: ["Hamstrings","Core","Calves"] },
    { name: "Cable Pull-Through", eq: ["Cable Machine","Rope Attachment"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings"], sm: ["Core","Lower Back","Adductors"] },
    { name: "Hip Thrust on Bench", eq: ["Barbell","Bench","Weight Plates"], diff: "Intermediate", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings","Quadriceps"], sm: ["Core","Hip Flexors","Adductors"] },
    { name: "Single-Leg Hip Thrust", eq: ["Barbell","Bench"], diff: "Intermediate", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings"], sm: ["Core","Hip Flexors","Stabilizers"] },
    { name: "Cable Lateral Lunge", eq: ["Cable Machine","D-Handle"], diff: "Intermediate", mus: "Legs", pm: ["Adductors","Abductors","Glutes"], sm: ["Quadriceps","Core","Stabilizers"] },
    { name: "Sumo Squat with Dumbbell", eq: ["Heavy Dumbbell"], diff: "Intermediate", mus: "Legs", pm: ["Adductors","Quadriceps","Glutes"], sm: ["Hamstrings","Core","Inner Thigh"] },
    { name: "Curtsy Lunge", eq: ["Dumbbells"], diff: "Intermediate", mus: "Legs", pm: ["Gluteus Medius","Gluteus Maximus","Quadriceps"], sm: ["Adductors","Core","Hamstrings"] },
    { name: "Dumbbell Goblet Squat", eq: ["Dumbbell","Kettlebell"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Glutes","Core"], sm: ["Hamstrings","Calves","Upper Back"] },
    { name: "Barbell Good Morning", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Legs", pm: ["Hamstrings","Glutes","Erector Spinae"], sm: ["Core","Upper Back","Adductors"] },
  ];

  // ─── STRENGTH: ARMS ───
  const armExercises = [
    { name: "Dumbbell Concentration Curl", eq: ["Dumbbell","Bench"], diff: "Beginner", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Wrist Flexors"] },
    { name: "Cable Bicep Curl", eq: ["Cable Machine","Straight Bar"], diff: "Beginner", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Brachioradialis"] },
    { name: "Incline Dumbbell Curl", eq: ["Dumbbells","Incline Bench"], diff: "Intermediate", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Anterior Deltoids"] },
    { name: "Rope Tricep Pushdown", eq: ["Cable Machine","Rope Attachment"], diff: "Beginner", mus: "Arms", pm: ["Triceps Brachii","Lateral Head"], sm: ["Forearms","Anconeus"] },
    { name: "Overhead Cable Tricep Extension", eq: ["Cable Machine","Rope Attachment"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Long Head"], sm: ["Lateral Head","Core","Forearms"] },
    { name: "Cable Lying Tricep Extension", eq: ["Cable Machine","Rope","Bench"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Lateral Head","Long Head"], sm: ["Forearms","Anconeus"] },
    { name: "EZ Bar Bicep Curl", eq: ["EZ Curl Bar","Weight Plates"], diff: "Beginner", mus: "Arms", pm: ["Biceps Brachii","Brachialis","Brachioradialis"], sm: ["Forearms","Wrist Flexors"] },
    { name: "Hammer Curl", eq: ["Dumbbells"], diff: "Beginner", mus: "Arms", pm: ["Brachialis","Brachioradialis","Biceps Brachii"], sm: ["Forearms","Wrist Extensors"] },
    { name: "Preacher Curl Machine", eq: ["Machine"], diff: "Beginner", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Wrist Flexors"] },
    { name: "Tricep Dips on Bench", eq: ["Bench"], diff: "Beginner", mus: "Arms", pm: ["Triceps Brachii","Anterior Deltoids","Pectorals"], sm: ["Core","Rhomboids"] },
    { name: "Overhead Dumbbell Tricep Extension", eq: ["Dumbbell"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Long Head"], sm: ["Lateral Head","Core","Shoulders"] },
    { name: "Reverse Grip Tricep Pushdown", eq: ["Cable Machine","Straight Bar"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Medial Head"], sm: ["Forearms","Wrist Flexors"] },
    { name: "Drag Curl", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Anterior Deltoids"] },
    { name: "Spider Curl", eq: ["Dumbbells","Incline Bench"], diff: "Intermediate", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Wrist Flexors"] },
    { name: "Cable Hammer Curl", eq: ["Cable Machine","Rope Attachment"], diff: "Beginner", mus: "Arms", pm: ["Brachialis","Brachioradialis","Biceps"], sm: ["Forearms"] },
    { name: "Single-Arm Reverse Tricep Pushdown", eq: ["Cable Machine","Single Handle"], diff: "Beginner", mus: "Arms", pm: ["Triceps Brachii","Medial Head"], sm: ["Forearms","Anconeus"] },
    { name: "Zottman Curl", eq: ["Dumbbells"], diff: "Intermediate", mus: "Arms", pm: ["Biceps Brachii","Brachialis","Brachioradialis"], sm: ["Forearms","Wrist Flexors","Extensors"] },
    { name: "Close-Grip Bench Press", eq: ["Barbell","Bench","Weight Plates"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Anterior Deltoids","Pectorals"], sm: ["Core","Forearms"] },
    { name: "Barbell Skull Crusher", eq: ["Barbell","Bench","Weight Plates"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Long Head","Lateral Head"], sm: ["Forearms","Anconeus"] },
    { name: "Cable Kickback", eq: ["Cable Machine","Single Handle"], diff: "Beginner", mus: "Arms", pm: ["Triceps Brachii","Lateral Head"], sm: ["Shoulders","Core"] },
    { name: "21s Bicep Curl with Barbell", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Wrist Flexors"] },
    { name: "Dumbbell Wrist Curl", eq: ["Dumbbells","Bench"], diff: "Beginner", mus: "Arms", pm: ["Wrist Flexors","Forearm Flexors"], sm: ["Fingers","Grip"] },
    { name: "Dumbbell Wrist Extension", eq: ["Dumbbells","Bench"], diff: "Beginner", mus: "Arms", pm: ["Wrist Extensors","Forearm Extensors"], sm: ["Grip","Fingers"] },
    { name: "Tate Press", eq: ["Dumbbells","Bench"], diff: "Intermediate", mus: "Arms", pm: ["Triceps Brachii","Long Head"], sm: ["Chest","Shoulders"] },
    { name: "Barbell Curl 21s", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Arms", pm: ["Biceps Brachii","Brachialis"], sm: ["Forearms","Wrist Flexors"] },
  ];

  // ─── CARDIO ───
  const cardioExercises = [
    { name: "Treadmill Incline Walk", eq: ["Treadmill"], diff: "Beginner", mus: "Cardio", pm: ["Glutes","Hamstrings","Calves","Quadriceps"], sm: ["Core","Hip Flexors"], sets: "1", reps: "30 min" },
    { name: "Rowing Machine", eq: ["Rowing Machine"], diff: "Intermediate", mus: "Cardio", pm: ["Latissimus Dorsi","Quadriceps","Glutes","Core","Biceps"], sm: ["Hamstrings","Calves","Rear Deltoids"], sets: "1", reps: "20 min" },
    { name: "Jump Rope", eq: ["Jump Rope"], diff: "Beginner", mus: "Cardio", pm: ["Calves","Quadriceps","Shoulders","Forearms"], sm: ["Core","Glutes","Hip Flexors"], sets: "1", reps: "15 min" },
    { name: "Stair Climber", eq: ["Stair Climber Machine"], diff: "Beginner", mus: "Cardio", pm: ["Quadriceps","Glutes","Calves","Hamstrings"], sm: ["Core","Hip Flexors"], sets: "1", reps: "20 min" },
    { name: "Elliptical Machine", eq: ["Elliptical Machine"], diff: "Beginner", mus: "Cardio", pm: ["Quadriceps","Glutes","Hamstrings","Calves"], sm: ["Arms","Core","Shoulders"], sets: "1", reps: "30 min" },
    { name: "Assault Bike", eq: ["Assault Bike"], diff: "Intermediate", mus: "Cardio", pm: ["Quadriceps","Hamstrings","Calves","Shoulders","Arms","Core"], sm: ["Glutes","Hip Flexors","Back"], sets: "1", reps: "10 min" },
    { name: "Cycling Stationary", eq: ["Stationary Bike"], diff: "Beginner", mus: "Cardio", pm: ["Quadriceps","Hamstrings","Glutes","Calves"], sm: ["Hip Flexors","Core"], sets: "1", reps: "30 min" },
    { name: "Treadmill Sprint Intervals", eq: ["Treadmill"], diff: "Advanced", mus: "Cardio", pm: ["Quadriceps","Hamstrings","Glutes","Calves","Hip Flexors"], sm: ["Core","Shoulders"], sets: "1", reps: "20 min" },
    { name: "Swimming Freestyle", eq: ["Pool"], diff: "Intermediate", mus: "Cardio", pm: ["Latissimus Dorsi","Shoulders","Core","Glutes","Hamstrings"], sm: ["Triceps","Chest","Quadriceps"], sets: "1", reps: "20 min" },
    { name: "Jumping Jacks", eq: ["None"], diff: "Beginner", mus: "Cardio", pm: ["Full Body","Shoulders","Calves","Hip Flexors"], sm: ["Core","Glutes","Quadriceps"], sets: "3", reps: "50" },
    { name: "High Knees", eq: ["None"], diff: "Beginner", mus: "Cardio", pm: ["Hip Flexors","Quadriceps","Calves","Core"], sm: ["Glutes","Hamstrings","Shoulders"], sets: "3", reps: "30 sec" },
    { name: "Butt Kicks", eq: ["None"], diff: "Beginner", mus: "Cardio", pm: ["Hamstrings","Glutes","Calves","Hip Flexors"], sm: ["Quadriceps","Core"], sets: "3", reps: "30 sec" },
    { name: "Skaters", eq: ["None"], diff: "Intermediate", mus: "Cardio", pm: ["Glutes","Adductors","Abductors","Quadriceps"], sm: ["Calves","Core","Ankle Stabilizers"], sets: "3", reps: "20" },
    { name: "Airdyne Bike Intervals", eq: ["Air Dyne Bike"], diff: "Intermediate", mus: "Cardio", pm: ["Quadriceps","Hamstrings","Shoulders","Arms","Core"], sm: ["Calves","Glutes","Back"], sets: "1", reps: "15 min" },
    { name: "Stairmaster", eq: ["Stairmaster Machine"], diff: "Intermediate", mus: "Cardio", pm: ["Quadriceps","Glutes","Calves","Hamstrings"], sm: ["Core","Hip Flexors","Heart"], sets: "1", reps: "20 min" },
  ];

  // ─── CORE ───
  const coreExercises = [
    { name: "Plank with Shoulder Taps", eq: ["Bodyweight"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Obliques","Transverse Abdominis","Shoulders"], sm: ["Glutes","Lower Back","Hip Flexors"], sets: "3", reps: "20" },
    { name: "Ab Wheel Rollout", eq: ["Ab Wheel"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Transverse Abdominis","Obliques"], sm: ["Lats","Shoulders","Hip Flexors","Chest"], sets: "3", reps: "10" },
    { name: "Cable Woodchop", eq: ["Cable Machine","Single Handle"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Transverse Abdominis","Rectus Abdominis"], sm: ["Shoulders","Back","Hips"], sets: "3", reps: "12" },
    { name: "Dead Bug", eq: ["Bodyweight"], diff: "Beginner", mus: "Core", pm: ["Transverse Abdominis","Rectus Abdominis","Obliques"], sm: ["Hip Flexors","Lower Back"], sets: "3", reps: "10" },
    { name: "Bird Dog", eq: ["Bodyweight"], diff: "Beginner", mus: "Core", pm: ["Erector Spinae","Transverse Abdominis","Glutes"], sm: ["Shoulders","Hip Flexors","Hamstrings"], sets: "3", reps: "10" },
    { name: "Pallof Press", eq: ["Cable Machine","Handle"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Transverse Abdominis"], sm: ["Shoulders","Chest","Glutes"], sets: "3", reps: "10" },
    { name: "Dragon Flag", eq: ["Bench"], diff: "Advanced", mus: "Core", pm: ["Rectus Abdominis","Transverse Abdominis","Hip Flexors","Obliques"], sm: ["Lats","Grip","Lower Back"], sets: "3", reps: "5" },
    { name: "TRX Suspended Plank", eq: ["Suspension Trainer"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Obliques","Shoulders"], sm: ["Chest","Glutes","Hip Flexors"], sets: "3", reps: "30 sec" },
    { name: "Side Plank with Leg Lift", eq: ["Bodyweight"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Transverse Abdominis","Gluteus Medius"], sm: ["Shoulders","Hip Abductors","Quadriceps"], sets: "3", reps: "10" },
    { name: "Hollow Body Hold", eq: ["Bodyweight"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Transverse Abdominis","Hip Flexors"], sm: ["Obliques","Quadriceps","Shoulders"], sets: "3", reps: "30 sec" },
    { name: "Cable Crunch", eq: ["Cable Machine","Rope Attachment"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Obliques"], sm: ["Hip Flexors","Core Stabilizers"], sets: "3", reps: "12" },
    { name: "Stability Ball Plank", eq: ["Stability Ball"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Transverse Abdominis","Obliques"], sm: ["Glutes","Hip Flexors","Chest"], sets: "3", reps: "30 sec" },
    { name: "Lying Windshield Wiper", eq: ["Bodyweight"], diff: "Advanced", mus: "Core", pm: ["Obliques","Rectus Abdominis","Transverse Abdominis","Hip Flexors"], sm: ["Adductors","Shoulders","Forearms"], sets: "3", reps: "8" },
    { name: "Mountain Climber on Sliders", eq: ["Sliders"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors","Obliques","Shoulders"], sm: ["Quadriceps","Glutes","Core"], sets: "3", reps: "15" },
    { name: "Ab Mat Sit-Up", eq: ["Ab Mat"], diff: "Beginner", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors"], sm: ["Obliques","Transverse Abdominis"], sets: "3", reps: "15" },
    { name: "V-Up", eq: ["Bodyweight"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors","Obliques"], sm: ["Quadriceps","Shoulders"], sets: "3", reps: "12" },
    { name: "Toe Touch Crunch", eq: ["Bodyweight"], diff: "Beginner", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors"], sm: ["Obliques","Transverse Abdominis"], sets: "3", reps: "15" },
    { name: "Flutter Kicks", eq: ["Bodyweight"], diff: "Beginner", mus: "Core", pm: ["Lower Rectus Abdominis","Hip Flexors","Transverse Abdominis"], sm: ["Quadriceps","Obliques"], sets: "3", reps: "20" },
    { name: "Plank to Push-Up", eq: ["Bodyweight"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Obliques","Chest","Triceps"], sm: ["Shoulders","Glutes","Hip Flexors"], sets: "3", reps: "10" },
    { name: "Cable Pallof Press with Rotation", eq: ["Cable Machine","Handle"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Transverse Abdominis","Rectus Abdominis"], sm: ["Shoulders","Hips","Glutes"], sets: "3", reps: "10" },
    { name: "Side Bend with Dumbbell", eq: ["Dumbbell"], diff: "Beginner", mus: "Core", pm: ["Obliques","Quadratus Lumborum"], sm: ["Rectus Abdominis","Core Stabilizers"], sets: "3", reps: "12" },
    { name: "Russian Twist with Medicine Ball", eq: ["Medicine Ball"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Rectus Abdominis","Transverse Abdominis"], sm: ["Hip Flexors","Shoulders","Forearms"], sets: "3", reps: "20" },
    { name: "Hanging Leg Raise", eq: ["Pull-Up Bar"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors","Obliques"], sm: ["Grip","Forearms","Latissimus Dorsi"], sets: "3", reps: "12" },
    { name: "Captain's Chair Leg Raise", eq: ["Captain's Chair"], diff: "Beginner", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors","Obliques"], sm: ["Forearms","Shoulders"], sets: "3", reps: "12" },
    { name: "BOSU Ball Plank", eq: ["BOSU Ball"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Obliques","Shoulders"], sm: ["Glutes","Hip Flexors","Core Stabilizers"], sets: "3", reps: "30 sec" },
  ];

  // ─── FLEXIBILITY / MOBILITY ───
  const flexibilityExercises = [
    { name: "Downward-Facing Dog", eq: ["Yoga Mat"], diff: "Beginner", mus: "Full Body", pm: ["Hamstrings","Calves","Shoulders","Core"], sm: ["Spine Erectors","Glutes"] },
    { name: "Seated Forward Fold", eq: ["Yoga Mat"], diff: "Beginner", mus: "Full Body", pm: ["Hamstrings","Lower Back","Calves"], sm: ["Glutes","Hip Flexors"] },
    { name: "Pigeon Pose", eq: ["Yoga Mat"], diff: "Intermediate", mus: "Full Body", pm: ["Glutes","Hip Flexors","Piriformis","Quadriceps"], sm: ["Lower Back","Groin"] },
    { name: "Cat-Cow Stretch", eq: ["Yoga Mat"], diff: "Beginner", mus: "Full Body", pm: ["Spine Erectors","Rectus Abdominis","Neck"], sm: ["Shoulders","Hip Flexors"] },
    { name: "Standing Quad Stretch", eq: ["None"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Hip Flexors"], sm: ["Glutes","Core"] },
    { name: "Lying Figure-Four Stretch", eq: ["Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Glutes","Piriformis","External Hip Rotators"], sm: ["Lower Back","Hamstrings"] },
    { name: "Cobra Pose", eq: ["Yoga Mat"], diff: "Beginner", mus: "Full Body", pm: ["Rectus Abdominis","Hip Flexors","Spine Erectors","Chest"], sm: ["Shoulders","Neck"] },
    { name: "Foam Rolling IT Band", eq: ["Foam Roller"], diff: "Beginner", mus: "Legs", pm: ["Tensor Fasciae Latae","IT Band","Glutes"], sm: ["Quadriceps","Hamstrings"] },
    { name: "Foam Rolling Upper Back", eq: ["Foam Roller"], diff: "Beginner", mus: "Back", pm: ["Rhomboids","Trapezius","Erector Spinae"], sm: ["Rear Deltoids","Rotator Cuff"] },
    { name: "World's Greatest Stretch", eq: ["None"], diff: "Intermediate", mus: "Full Body", pm: ["Hip Flexors","Hamstrings","Thoracic Spine","Shoulders","Glutes"], sm: ["Groin","Calves","Core"] },
    { name: "90/90 Hip Stretch", eq: ["Yoga Mat"], diff: "Intermediate", mus: "Legs", pm: ["Hip External Rotators","Hip Internal Rotators","Glutes"], sm: ["Lower Back","Groin"] },
    { name: "Band-Assisted Hamstring Stretch", eq: ["Resistance Band","Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Hamstrings","Calves","Glutes"], sm: ["Lower Back","Spine Erectors"] },
    { name: "Wrist Flexor Stretch", eq: ["None"], diff: "Beginner", mus: "Arms", pm: ["Wrist Flexors","Forearm Flexors"], sm: ["Fingers","Elbow Flexors"] },
    { name: "Neck Flexion Stretch", eq: ["None"], diff: "Beginner", mus: "Full Body", pm: ["Upper Trapezius","Levator Scapulae","Sternocleidomastoid"], sm: ["Scalenes","Suboccipitals"] },
    { name: "Ankle Circles", eq: ["None"], diff: "Beginner", mus: "Legs", pm: ["Ankle Dorsiflexors","Ankle Plantarflexors","Peroneals"], sm: ["Calves","Shin Muscles"] },
    { name: "Thread the Needle", eq: ["Yoga Mat"], diff: "Beginner", mus: "Full Body", pm: ["Thoracic Spine","Rhomboids","Rotator Cuff"], sm: ["Shoulders","Chest","Obliques"] },
    { name: "Shoulder Cross-Body Stretch", eq: ["None"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Posterior Capsule","Mid Trapezius"], sm: ["Rhomboids","Rotator Cuff"] },
    { name: "Standing Straddle Stretch", eq: ["Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Adductors","Hamstrings","Groin","Calves"], sm: ["Lower Back","Glutes"] },
    { name: "Butterfly Stretch", eq: ["Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Adductors","Groin","Hip Flexors"], sm: ["Lower Back","Glutes"] },
    { name: "Hip Flexor Stretch Kneeling", eq: ["Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Hip Flexors","Quadriceps","Iliopsoas"], sm: ["Glutes","Core","Hamstrings"] },
    { name: "Thoracic Spine Foam Roll", eq: ["Foam Roller"], diff: "Beginner", mus: "Back", pm: ["Thoracic Spine Erectors","Rhomboids","Rear Deltoids"], sm: ["Core","Lats"] },
    { name: "Lat Stretch with Foam Roller", eq: ["Foam Roller"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Terres Major","Triceps"], sm: ["Core","Shoulders"] },
    { name: "Standing Calf Stretch", eq: ["Wall"], diff: "Beginner", mus: "Legs", pm: ["Gastrocnemius","Soleus"], sm: ["Tibialis Anterior","Peroneals"] },
    { name: "Seated Pigeon Stretch", eq: ["Yoga Mat"], diff: "Intermediate", mus: "Legs", pm: ["Glutes","Piriformis","External Hip Rotators"], sm: ["Lower Back","Hamstrings"] },
    { name: "Doorway Chest Stretch", eq: ["Door Frame"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Anterior Deltoids","Biceps"], sm: ["Rhomboids","Core"] },
  ];

  // ─── HIIT ───
  const hiitExercises = [
    { name: "Tabata Bodyweight Squats", eq: ["Timer"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings","Calves"], sm: ["Core","Hip Flexors"], sets: "8", reps: "20 sec on/10 sec off" },
    { name: "Tabata Push-Ups", eq: ["Timer"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Serratus Anterior","Shoulders"], sets: "8", reps: "20 sec on/10 sec off" },
    { name: "Burpee to Pull-Up", eq: ["Pull-Up Bar"], diff: "Advanced", mus: "Full Body", pm: ["Chest","Lats","Triceps","Biceps","Quadriceps","Glutes","Core"], sm: ["Shoulders","Hamstrings","Calves","Forearms"], sets: "3", reps: "8" },
    { name: "Battle Rope Waves", eq: ["Battle Ropes"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Arms","Back"], sm: ["Legs","Calves","Forearms","Grip"], sets: "3", reps: "30 sec" },
    { name: "EMOM Thrusters", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Full Body", pm: ["Quadriceps","Glutes","Shoulders","Triceps","Core"], sm: ["Hamstrings","Calves","Upper Back"], sets: "10", reps: "10 every minute" },
    { name: "Sprint Intervals", eq: ["Running Track"], diff: "Advanced", mus: "Legs", pm: ["Quadriceps","Hamstrings","Glutes","Calves","Hip Flexors"], sm: ["Core","Shoulders","Arms"], sets: "8", reps: "30 sec sprint/60 sec walk" },
    { name: "AMRAP Kettlebell Complex", eq: ["Kettlebell"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Glutes","Quadriceps","Core","Back","Arms"], sm: ["Hamstrings","Calves","Grip","Forearms"], sets: "1", reps: "10 min AMRAP" },
    { name: "Box Jump Overs", eq: ["Plyo Box"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Hip Flexors"], sm: ["Core","Hamstrings","Shoulders"], sets: "3", reps: "10" },
    { name: "Jump Rope Double Unders", eq: ["Jump Rope"], diff: "Advanced", mus: "Full Body", pm: ["Calves","Shoulders","Forearms","Core"], sm: ["Quadriceps","Hip Flexors","Wrist Flexors"], sets: "3", reps: "50" },
    { name: "Medicine Ball Slams", eq: ["Medicine Ball"], diff: "Intermediate", mus: "Full Body", pm: ["Core","Shoulders","Lats","Quadriceps","Glutes"], sm: ["Triceps","Grip","Forearms","Hamstrings"], sets: "3", reps: "15" },
    { name: "Kettlebell Swing", eq: ["Kettlebell"], diff: "Intermediate", mus: "Full Body", pm: ["Glutes","Hamstrings","Core","Shoulders","Grip"], sm: ["Quadriceps","Calves","Forearms"], sets: "3", reps: "20" },
    { name: "Box Jump Burpees", eq: ["Plyo Box"], diff: "Advanced", mus: "Full Body", pm: ["Quadriceps","Glutes","Calves","Chest","Triceps","Core"], sm: ["Shoulders","Hamstrings","Hip Flexors"], sets: "3", reps: "10" },
    { name: "Thrusters with Dumbbells", eq: ["Dumbbells"], diff: "Intermediate", mus: "Full Body", pm: ["Quadriceps","Glutes","Shoulders","Triceps","Core"], sm: ["Hamstrings","Calves"], sets: "3", reps: "12" },
    { name: "Rowing Machine Intervals", eq: ["Rowing Machine"], diff: "Intermediate", mus: "Full Body", pm: ["Lats","Quadriceps","Glutes","Core","Biceps"], sm: ["Hamstrings","Calves","Rear Deltoids"], sets: "6", reps: "500m sprint/90 sec rest" },
    { name: "Ski Erg Sprints", eq: ["Ski Erg Machine"], diff: "Intermediate", mus: "Full Body", pm: ["Lats","Core","Shoulders","Glutes","Hamstrings"], sm: ["Triceps","Hip Flexors","Calves"], sets: "6", reps: "30 sec sprint/30 sec rest" },
  ];

  // ─── PLYOMETRIC ───
  const plyometricExercises = [
    { name: "Depth Jump", eq: ["Plyo Box"], diff: "Advanced", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Ankle Stabilizers"], sm: ["Hamstrings","Core","Hip Flexors"], sets: "3", reps: "6" },
    { name: "Lateral Bounds", eq: ["None"], diff: "Intermediate", mus: "Legs", pm: ["Glutes","Quadriceps","Adductors","Abductors"], sm: ["Calves","Core","Hip Stabilizers"], sets: "3", reps: "8 each" },
    { name: "Clap Push-Up", eq: ["None"], diff: "Advanced", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Serratus Anterior","Shoulders"], sets: "3", reps: "8" },
    { name: "Medicine Ball Chest Pass", eq: ["Medicine Ball","Wall"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Shoulders","Forearms"], sets: "3", reps: "12" },
    { name: "Bounding", eq: ["Open Field"], diff: "Intermediate", mus: "Legs", pm: ["Glutes","Hamstrings","Quadriceps","Calves","Hip Flexors"], sm: ["Core","Shoulders","Ankle Stabilizers"], sets: "3", reps: "30 meters" },
    { name: "Skater Jumps", eq: ["None"], diff: "Intermediate", mus: "Legs", pm: ["Glutes","Adductors","Abductors","Quadriceps"], sm: ["Calves","Core","Ankle Stabilizers"], sets: "3", reps: "12" },
    { name: "Single-Leg Box Jump", eq: ["Plyo Box"], diff: "Advanced", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Ankle Stabilizers"], sm: ["Hamstrings","Core","Hip Stabilizers"], sets: "3", reps: "6 each" },
    { name: "Medicine Ball Rotational Throw", eq: ["Medicine Ball","Wall"], diff: "Intermediate", mus: "Full Body", pm: ["Obliques","Core","Hips","Shoulders"], sm: ["Glutes","Quadriceps","Forearms"], sets: "3", reps: "10 each" },
    { name: "Plyo Push-Up", eq: ["Plyo Push-Up Pads"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Serratus Anterior","Shoulders"], sets: "3", reps: "10" },
    { name: "Vertical Jump", eq: ["None"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Core"], sm: ["Hamstrings","Hip Flexors","Ankle Stabilizers"], sets: "3", reps: "8" },
    { name: "Broad Jump", eq: ["None"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Core"], sm: ["Hamstrings","Hip Flexors","Shoulders"], sets: "3", reps: "5" },
    { name: "Single-Leg Hops", eq: ["None"], diff: "Intermediate", mus: "Legs", pm: ["Calves","Ankle Stabilizers","Quadriceps"], sm: ["Core","Glutes","Hamstrings"], sets: "3", reps: "15 each" },
    { name: "Reactive Squat Jump", eq: ["None"], diff: "Advanced", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Core"], sm: ["Hamstrings","Hip Flexors","Ankle Stabilizers"], sets: "3", reps: "6" },
    { name: "Tuck Jump", eq: ["None"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Hip Flexors","Core"], sm: ["Hamstrings","Shoulders"], sets: "3", reps: "8" },
    { name: "Lateral Box Jump", eq: ["Plyo Box"], diff: "Intermediate", mus: "Legs", pm: ["Glutes","Adductors","Abductors","Quadriceps"], sm: ["Calves","Core","Ankle Stabilizers"], sets: "3", reps: "8 each" },
  ];

  // ─── FUNCTIONAL ───
  const functionalExercises = [
    { name: "Farmer's Walk", eq: ["Dumbbells","Kettlebells"], diff: "Intermediate", mus: "Full Body", pm: ["Traps","Core","Grip","Forearms","Quadriceps","Glutes"], sm: ["Shoulders","Calves","Upper Back","Hamstrings"], sets: "3", reps: "40 meters" },
    { name: "Bear Crawl", eq: ["None"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Quadriceps","Hip Flexors"], sm: ["Triceps","Glutes","Upper Back","Calves"], sets: "3", reps: "20 meters" },
    { name: "Sled Push", eq: ["Sled","Weight Plates"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Calves","Hip Flexors","Core"], sm: ["Shoulders","Chest","Hamstrings","Ankle Stabilizers"], sets: "3", reps: "20 meters" },
    { name: "Turkish Get-Up", eq: ["Kettlebell"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Glutes","Quadriceps","Hips"], sm: ["Triceps","Obliques","Calves","Grip"], sets: "3", reps: "3 each" },
    { name: "Crab Walk", eq: ["None"], diff: "Beginner", mus: "Full Body", pm: ["Triceps","Shoulders","Glutes","Hamstrings","Core"], sm: ["Calves","Chest","Hip Flexors"], sets: "3", reps: "20 meters" },
    { name: "Rope Climb", eq: ["Climbing Rope","Mat"], diff: "Advanced", mus: "Upper Body", pm: ["Lats","Biceps","Forearms","Grip","Core"], sm: ["Upper Back","Shoulders","Abdominals"], sets: "3", reps: "1 climb" },
    { name: "Atlas Stone Load", eq: ["Atlas Stone"], diff: "Advanced", mus: "Full Body", pm: ["Total Body","Grip","Erector Spinae","Quadriceps","Glutes"], sm: ["Shoulders","Biceps","Core","Forearms"], sets: "3", reps: "5" },
    { name: "Tire Flip", eq: ["Tractor Tire"], diff: "Advanced", mus: "Full Body", pm: ["Total Body","Quadriceps","Glutes","Core","Grip","Back"], sm: ["Hamstrings","Calves","Shoulders","Forearms"], sets: "3", reps: "5" },
    { name: "Ruck March", eq: ["Weighted Backpack"], diff: "Beginner", mus: "Full Body", pm: ["Quadriceps","Glutes","Calves","Core","Upper Back","Shoulders"], sm: ["Hamstrings","Trapezius","Grip"], sets: "1", reps: "30 min" },
    { name: "Sled Pull", eq: ["Sled","Harness","Weight Plates"], diff: "Intermediate", mus: "Full Body", pm: ["Hamstrings","Glutes","Core","Quadriceps","Calves"], sm: ["Forearms","Grip","Upper Back","Shoulders"], sets: "3", reps: "20 meters" },
    { name: "Loaded Carry Suitcase", eq: ["Heavy Dumbbell","Kettlebell"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Core","Quadriceps","Grip","Forearms"], sm: ["Glutes","Calves","Shoulders","Upper Back"], sets: "3", reps: "40 meters" },
    { name: "Trap Bar Carry", eq: ["Trap Bar","Weight Plates"], diff: "Intermediate", mus: "Full Body", pm: ["Traps","Quadriceps","Glutes","Core","Grip","Forearms"], sm: ["Hamstrings","Calves","Upper Back","Shoulders"], sets: "3", reps: "40 meters" },
    { name: "Yoke Walk", eq: ["Yoke Frame","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Traps","Core","Quadriceps","Glutes","Grip","Shoulders"], sm: ["Hamstrings","Calves","Upper Back","Forearms"], sets: "3", reps: "20 meters" },
    { name: "Sandbag Carry", eq: ["Sandbag"], diff: "Intermediate", mus: "Full Body", pm: ["Core","Traps","Quadriceps","Glutes","Grip","Biceps"], sm: ["Hamstrings","Calves","Forearms","Shoulders"], sets: "3", reps: "40 meters" },
    { name: "Devil Press", eq: ["Kettlebell"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Triceps","Core","Hip Flexors","Lats"], sm: ["Grip","Forearms","Glutes","Quadriceps"], sets: "3", reps: "8" },
  ];

  // ─── CALISTHENICS ───
  const calisthenicsExercises = [
    { name: "Muscle-Up", eq: ["Pull-Up Bar","Rings"], diff: "Advanced", mus: "Upper Body", pm: ["Lats","Chest","Triceps","Biceps","Core","Shoulders"], sm: ["Forearms","Grip","Serratus Anterior"], sets: "3", reps: "5" },
    { name: "L-Sit Hold", eq: ["Parallettes","Dip Bars"], diff: "Advanced", mus: "Full Body", pm: ["Rectus Abdominis","Hip Flexors","Quadriceps","Triceps","Shoulders"], sm: ["Core","Obliques","Latissimus Dorsi"], sets: "3", reps: "15 sec" },
    { name: "Handstand Hold", eq: ["Wall","Yoga Mat"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Core","Triceps","Traps","Forearms"], sm: ["Lats","Glutes","Hip Flexors","Fingers"], sets: "3", reps: "20 sec" },
    { name: "Pistol Squat", eq: ["None"], diff: "Advanced", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings","Calves","Core"], sm: ["Hip Stabilizers","Ankle Stabilizers","Adductors"], sets: "3", reps: "5 each" },
    { name: "Front Lever Progression", eq: ["Pull-Up Bar"], diff: "Advanced", mus: "Upper Body", pm: ["Lats","Core","Biceps","Chest","Shoulders"], sm: ["Triceps","Forearms","Grip","Back"], sets: "3", reps: "10 sec" },
    { name: "Human Flag Progression", eq: ["Pole","Flag Pole"], diff: "Advanced", mus: "Full Body", pm: ["Obliques","Lats","Shoulders","Core","Glutes","Grip"], sm: ["Biceps","Triceps","Quadriceps","Forearms"], sets: "3", reps: "10 sec" },
    { name: "Planche Lean", eq: ["Parallettes"], diff: "Advanced", mus: "Upper Body", pm: ["Shoulders","Core","Chest","Triceps","Biceps"], sm: ["Lats","Forearms","Grip","Hip Flexors"], sets: "3", reps: "15 sec" },
    { name: "Back Lever", eq: ["Pull-Up Bar","Rings"], diff: "Advanced", mus: "Upper Body", pm: ["Lats","Core","Biceps","Rear Deltoids","Triceps"], sm: ["Forearms","Grip","Shoulders","Glutes"], sets: "3", reps: "10 sec" },
    { name: "Ring Dip", eq: ["Gymnastic Rings"], diff: "Intermediate", mus: "Upper Body", pm: ["Chest","Triceps","Anterior Deltoids","Core"], sm: ["Lats","Serratus Anterior","Shoulders"], sets: "3", reps: "10" },
    { name: "Archer Push-Up", eq: ["None"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Serratus Anterior","Shoulders"], sets: "3", reps: "8 each" },
    { name: "Typewriter Push-Up", eq: ["None"], diff: "Intermediate", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids","Core"], sm: ["Shoulders","Serratus Anterior","Obliques"], sets: "3", reps: "10" },
    { name: "Scapular Pull-Up", eq: ["Pull-Up Bar"], diff: "Beginner", mus: "Back", pm: ["Lower Trapezius","Rhomboids","Serratus Anterior"], sm: ["Core","Shoulders","Lats"], sets: "3", reps: "12" },
    { name: "Inverted Row on Rings", eq: ["Gymnastic Rings"], diff: "Intermediate", mus: "Back", pm: ["Lats","Rhomboids","Trapezius","Biceps","Core"], sm: ["Rear Deltoids","Glutes","Hip Flexors"], sets: "3", reps: "10" },
    { name: "Hanging Leg Raise", eq: ["Pull-Up Bar"], diff: "Intermediate", mus: "Core", pm: ["Rectus Abdominis","Hip Flexors","Obliques"], sm: ["Grip","Forearms","Lats"], sets: "3", reps: "12" },
    { name: "Commando Plank", eq: ["None"], diff: "Intermediate", mus: "Full Body", pm: ["Core","Obliques","Shoulders","Hip Flexors","Quadriceps"], sm: ["Glutes","Hamstrings","Chest"], sets: "3", reps: "12" },
  ];

  // ─── KETTLEBELL ───
  const kettlebellExercises = [
    { name: "Kettlebell Turkish Get-Up", eq: ["Kettlebell"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Glutes","Quadriceps","Hips"], sm: ["Triceps","Obliques","Calves","Grip"], sets: "3", reps: "3 each" },
    { name: "Kettlebell Clean", eq: ["Kettlebell"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Glutes","Hamstrings","Grip"], sm: ["Triceps","Lats","Calves","Forearms"], sets: "3", reps: "8" },
    { name: "Kettlebell Snatch", eq: ["Kettlebell"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Core","Lats","Glutes","Hip Flexors"], sm: ["Grip","Triceps","Hamstrings","Calves"], sets: "3", reps: "6" },
    { name: "Kettlebell Bottoms-Up Press", eq: ["Kettlebell"], diff: "Advanced", mus: "Shoulders", pm: ["Shoulders","Core","Triceps","Forearms","Grip"], sm: ["Lats","Obliques","Biceps"], sets: "3", reps: "6" },
    { name: "Kettlebell Windmill", eq: ["Kettlebell"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Obliques","Glutes","Hamstrings"], sm: ["Grip","Latissimus Dorsi","Hip Flexors"], sets: "3", reps: "8 each" },
    { name: "Kettlebell Halo", eq: ["Kettlebell"], diff: "Beginner", mus: "Shoulders", pm: ["Shoulders","Core","Upper Back","Triceps"], sm: ["Grip","Forearms","Rotator Cuff"], sets: "3", reps: "10 each" },
    { name: "Kettlebell Suitcase Carry", eq: ["Kettlebell"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Core","Quadriceps","Grip","Forearms"], sm: ["Glutes","Calves","Shoulders","Upper Back"], sets: "3", reps: "40 meters" },
    { name: "Kettlebell Goblet Squat", eq: ["Kettlebell"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Glutes","Core","Hip Flexors"], sm: ["Hamstrings","Calves","Upper Back"], sets: "3", reps: "12" },
    { name: "Kettlebell Single-Leg Deadlift", eq: ["Kettlebell"], diff: "Intermediate", mus: "Legs", pm: ["Hamstrings","Glutes","Erector Spinae","Core"], sm: ["Upper Back","Grip","Calves","Ankle Stabilizers"], sets: "3", reps: "8 each" },
    { name: "Kettlebell Figure-8", eq: ["Kettlebell"], diff: "Intermediate", mus: "Core", pm: ["Core","Obliques","Shoulders","Hips"], sm: ["Grip","Forearms","Glutes","Hip Flexors"], sets: "3", reps: "10 each" },
    { name: "Kettlebell Slingshot", eq: ["Kettlebell"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Core","Hips","Hip Flexors"], sm: ["Shoulders","Grip","Glutes","Forearms"], sets: "3", reps: "12" },
    { name: "Kettlebell Racked Squat", eq: ["Kettlebell"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Core","Shoulders","Grip"], sm: ["Hamstrings","Calves","Upper Back","Triceps"], sets: "3", reps: "8" },
    { name: "Kettlebell Press", eq: ["Kettlebell"], diff: "Beginner", mus: "Shoulders", pm: ["Shoulders","Triceps","Core","Upper Back"], sm: ["Grip","Forearms","Lats"], sets: "3", reps: "8" },
    { name: "Kettlebell Lateral Lunge", eq: ["Kettlebell"], diff: "Intermediate", mus: "Legs", pm: ["Adductors","Abductors","Glutes","Quadriceps"], sm: ["Core","Hamstrings","Stabilizers","Grip"], sets: "3", reps: "8 each" },
    { name: "Kettlebell Reverse Lunge", eq: ["Kettlebell"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings"], sm: ["Core","Calves","Stabilizers","Grip"], sets: "3", reps: "10 each" },
  ];

  // ─── RESISTANCE BAND ───
  const bandExercises = [
    { name: "Band Row", eq: ["Resistance Band"], diff: "Beginner", mus: "Back", pm: ["Latissimus Dorsi","Rhomboids","Mid Traps","Biceps"], sm: ["Rear Deltoids","Core","Forearms"], sets: "3", reps: "12" },
    { name: "Band Chest Press", eq: ["Resistance Band"], diff: "Beginner", mus: "Chest", pm: ["Pectorals","Triceps","Anterior Deltoids"], sm: ["Core","Shoulders"], sets: "3", reps: "12" },
    { name: "Band Deadlift", eq: ["Resistance Band"], diff: "Beginner", mus: "Legs", pm: ["Glutes","Hamstrings","Erector Spinae","Core"], sm: ["Upper Back","Traps","Grip","Forearms"], sets: "3", reps: "12" },
    { name: "Band Pull-Aparts", eq: ["Resistance Band"], diff: "Beginner", mus: "Back", pm: ["Rear Deltoids","Rhomboids","Mid Traps","Rotator Cuff"], sm: ["Lower Traps","Teres Minor"], sets: "3", reps: "15" },
    { name: "Band Squat", eq: ["Resistance Band"], diff: "Beginner", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings","Core"], sm: ["Hip Flexors","Calves","Upper Back"], sets: "3", reps: "12" },
    { name: "Band Shoulder Press", eq: ["Resistance Band"], diff: "Beginner", mus: "Shoulders", pm: ["Anterior Deltoids","Lateral Deltoids","Triceps"], sm: ["Upper Traps","Core","Forearms"], sets: "3", reps: "12" },
    { name: "Band Lateral Walk", eq: ["Resistance Band Loop"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Medius","Abductors","Hip External Rotators"], sm: ["Core","Quadriceps","Gluteus Maximus"], sets: "3", reps: "15 each" },
    { name: "Band Hip Thrust", eq: ["Resistance Band Loop"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings","Core"], sm: ["Hip Flexors","Adductors","Quadriceps"], sets: "3", reps: "15" },
    { name: "Band Face Pulls", eq: ["Resistance Band"], diff: "Beginner", mus: "Shoulders", pm: ["Rear Deltoids","Rhomboids","Lower Traps"], sm: ["Mid Traps","Rotator Cuff","Forearms"], sets: "3", reps: "15" },
    { name: "Band Pallof Press", eq: ["Resistance Band"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Transverse Abdominis","Core Stabilizers"], sm: ["Shoulders","Chest","Glutes"], sets: "3", reps: "10" },
    { name: "Band Tricep Extension", eq: ["Resistance Band"], diff: "Beginner", mus: "Arms", pm: ["Triceps Brachii","Lateral Head","Long Head"], sm: ["Forearms","Anconeus","Shoulders"], sets: "3", reps: "12" },
    { name: "Band Bicep Curl", eq: ["Resistance Band"], diff: "Beginner", mus: "Arms", pm: ["Biceps Brachii","Brachialis","Brachioradialis"], sm: ["Forearms","Wrist Flexors"], sets: "3", reps: "12" },
    { name: "Band Good Morning", eq: ["Resistance Band"], diff: "Beginner", mus: "Legs", pm: ["Hamstrings","Glutes","Erector Spinae","Core"], sm: ["Upper Back","Adductors","Forearms"], sets: "3", reps: "12" },
    { name: "Band Split Squat", eq: ["Resistance Band"], diff: "Intermediate", mus: "Legs", pm: ["Quadriceps","Glutes","Hamstrings","Hip Flexors"], sm: ["Core","Calves","Adductors","Stabilizers"], sets: "3", reps: "10 each" },
    { "name": "Band Overhead Squat", eq: ["Resistance Band"], diff: "Intermediate", mus: "Full Body", pm: ["Quadriceps","Glutes","Shoulders","Core","Hip Flexors"], sm: ["Hamstrings","Calves","Upper Back","Triceps"], sets: "3", reps: "10" },
    { name: "Band Single-Leg RDL", eq: ["Resistance Band"], diff: "Intermediate", mus: "Legs", pm: ["Hamstrings","Glutes","Erector Spinae","Core"], sm: ["Upper Back","Grip","Calves","Ankle Stabilizers"], sets: "3", reps: "8 each" },
    { name: "Band Front Raise", eq: ["Resistance Band"], diff: "Beginner", mus: "Shoulders", pm: ["Anterior Deltoids","Upper Pectorals"], sm: ["Core","Serratus Anterior","Forearms"], sets: "3", reps: "12" },
    { name: "Band Lateral Raise", eq: ["Resistance Band"], diff: "Beginner", mus: "Shoulders", pm: ["Lateral Deltoids","Anterior Deltoids","Upper Traps"], sm: ["Forearms","Core","Mid Traps"], sets: "3", reps: "12" },
    { name: "Band Pull-Through", eq: ["Resistance Band"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings","Core","Quadriceps"], sm: ["Hip Flexors","Lower Back","Adductors"], sets: "3", reps: "12" },
  ];

  // ─── OLYMPIC ───
  const olympicExercises = [
    { name: "Power Snatch", eq: ["Barbell","Weight Plates","Platform"], diff: "Advanced", mus: "Full Body", pm: ["Full Body","Quadriceps","Glutes","Calves","Shoulders","Traps"], sm: ["Core","Grip","Forearms","Hamstrings"], sets: "5", reps: "3" },
    { name: "Hang Clean", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Full Body","Quadriceps","Glutes","Traps","Shoulders","Core"], sm: ["Hamstrings","Calves","Forearms","Grip","Biceps"], sets: "5", reps: "3" },
    { name: "Push Jerk", eq: ["Barbell","Weight Plates","Platform"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Triceps","Quadriceps","Core","Traps"], sm: ["Calves","Glutes","Forearms","Grip"], sets: "5", reps: "3" },
    { name: "Split Jerk", eq: ["Barbell","Weight Plates","Platform"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Triceps","Quadriceps","Core","Traps"], sm: ["Calves","Glutes","Forearms","Grip","Hip Flexors"], sets: "5", reps: "3" },
    { name: "Clean Pull", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Traps","Upper Back","Lats","Glutes","Hamstrings","Core"], sm: ["Quadriceps","Calves","Forearms","Grip","Biceps"], sets: "5", reps: "3" },
    { name: "Snatch Pull", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Traps","Upper Back","Lats","Rear Deltoids","Core"], sm: ["Quadriceps","Glutes","Hamstrings","Calves","Grip"], sets: "5", reps: "3" },
    { name: "Clean and Jerk Complex", eq: ["Barbell","Weight Plates","Platform"], diff: "Advanced", mus: "Full Body", pm: ["Full Body","Quadriceps","Glutes","Shoulders","Traps","Core"], sm: ["Hamstrings","Calves","Forearms","Grip","Biceps"], sets: "5", reps: "1+1+1" },
    { name: "Overhead Squat", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Core","Quadriceps","Glutes","Traps","Ankle Stabilizers"], sm: ["Upper Back","Hamstrings","Hip Flexors","Grip","Forearms"], sets: "5", reps: "3" },
    { name: "Jerk Recovery", eq: ["Barbell","Weight Plates","Rack"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Core","Quadriceps","Glutes","Traps"], sm: ["Calves","Hamstrings","Forearms","Grip","Hip Flexors"], sets: "5", reps: "3" },
    { name: "Muscle Snatch", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Shoulders","Traps","Core","Quadriceps","Glutes","Calves"], sm: ["Lats","Hamstrings","Hip Flexors","Forearms","Grip"], sets: "5", reps: "3" },
    { name: "Power Clean and Push Press", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Full Body","Shoulders","Quadriceps","Glutes","Traps","Core"], sm: ["Hamstrings","Calves","Forearms","Grip","Biceps","Triceps"], sets: "5", reps: "3" },
    { name: "Barbell Complex", eq: ["Barbell","Weight Plates"], diff: "Advanced", mus: "Full Body", pm: ["Full Body","Quadriceps","Glutes","Back","Shoulders","Core"], sm: ["Hamstrings","Calves","Forearms","Grip","Biceps","Triceps"], sets: "5", reps: "1+1+1+1" },
    { name: "Hang Power Clean", eq: ["Barbell","Weight Plates"], diff: "Intermediate", mus: "Full Body", pm: ["Full Body","Quadriceps","Glutes","Traps","Shoulders","Core"], sm: ["Hamstrings","Calves","Forearms","Grip","Biceps"], sets: "5", reps: "5" },
    { name: "Dumbbell Clean", eq: ["Dumbbells"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Quadriceps","Glutes","Hamstrings"], sm: ["Traps","Calves","Forearms","Grip","Biceps"], sets: "4", reps: "6" },
    { name: "Single-Arm Dumbbell Snatch", eq: ["Dumbbell"], diff: "Intermediate", mus: "Full Body", pm: ["Shoulders","Core","Quadriceps","Glutes","Lats","Hip Flexors"], sm: ["Triceps","Calves","Forearms","Grip","Hamstrings"], sets: "4", reps: "6 each" },
  ];

  // ─── REHAB / PREHAB ───
  const rehabExercises = [
    { name: "Single-Leg Glute Bridge with Band", eq: ["Resistance Band","Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Maximus","Hamstrings","Core"], sm: ["Hip Flexors","Lower Back","Gluteus Medius"], sets: "3", reps: "12 each" },
    { name: "Wall Slide", eq: ["Wall"], diff: "Beginner", mus: "Shoulders", pm: ["Lower Trapezius","Serratus Anterior","Rhomboids"], sm: ["Rotator Cuff","Mid Traps","Core"], sets: "3", reps: "10" },
    { name: "Band External Rotation", eq: ["Resistance Band"], diff: "Beginner", mus: "Shoulders", pm: ["Infraspinatus","Teres Minor","Rotator Cuff"], sm: ["Rear Deltoids","Rhomboids"], sets: "3", reps: "12 each" },
    { name: "Scapular Push-Up", eq: ["None"], diff: "Beginner", mus: "Back", pm: ["Serratus Anterior","Lower Trapezius","Rhomboids"], sm: ["Core","Shoulders","Chest"], sets: "3", reps: "12" },
    { name: "Ankle Dorsiflexion with Band", eq: ["Resistance Band"], diff: "Beginner", mus: "Legs", pm: ["Tibialis Anterior","Ankle Dorsiflexors"], sm: ["Calf Soleus","Shin Muscles","Peroneals"], sets: "3", reps: "15 each" },
    { name: "Prone Y-T-W Raises", eq: ["Yoga Mat","Light Dumbbells"], diff: "Beginner", mus: "Back", pm: ["Lower Trapezius","Mid Trapezius","Rhomboids","Rear Deltoids"], sm: ["Erector Spinae","Core","Rotator Cuff"], sets: "3", reps: "8 each" },
    { name: "Clamshells", eq: ["Resistance Band Loop"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Medius","Hip External Rotators","Hip Abductors"], sm: ["Core","Gluteus Maximus","Pelvic Floor"], sets: "3", reps: "15 each" },
    { name: "Hip 90/90 Lift Off", eq: ["None"], diff: "Beginner", mus: "Legs", pm: ["Hip Flexors","Core","Iliopsoas","Quadriceps"], sm: ["Glutes","Hamstrings","Lower Back"], sets: "3", reps: "10 each" },
    { name: "Shoulder Dislocates with Dowel", eq: ["PVC Pipe","Dowel"], diff: "Intermediate", mus: "Shoulders", pm: ["Rotator Cuff","Shoulders","Thoracic Spine"], sm: ["Triceps","Core","Upper Back"], sets: "3", reps: "10" },
    { name: "Pallof Press with Band", eq: ["Resistance Band"], diff: "Intermediate", mus: "Core", pm: ["Obliques","Transverse Abdominis","Core Stabilizers"], sm: ["Shoulders","Chest","Glutes"], sets: "3", reps: "10" },
    { name: "Glute Bridge March", eq: ["Yoga Mat"], diff: "Beginner", mus: "Legs", pm: ["Gluteus Maximus","Core","Hip Flexors"], sm: ["Hamstrings","Lower Back","Gluteus Medius"], sets: "3", reps: "10 each" },
    { name: "Wrist Extensions", eq: ["Light Dumbbell"], diff: "Beginner", mus: "Arms", pm: ["Wrist Extensors","Forearm Extensors"], sm: ["Grip","Fingers","Brachioradialis"], sets: "3", reps: "15" },
    { name: "Resisted Neck Flexion", eq: ["Resistance Band"], diff: "Beginner", mus: "Full Body", pm: ["Neck Flexors","Sternocleidomastoid","Scalenes"], sm: ["Upper Traps","Levator Scapulae"], sets: "3", reps: "10" },
    { "name": "Resisted Neck Extension", eq: ["Resistance Band"], diff: "Beginner", mus: "Full Body", pm: ["Neck Extensors","Upper Traps","Levator Scapulae"], sm: ["Scalenes","Sternocleidomastoid","Suboccipitals"], sets: "3", reps: "10" },
    { name: "Tennis Ball Plantar Fascia Release", eq: ["Tennis Ball"], diff: "Beginner", mus: "Legs", pm: ["Plantar Fascia","Intrinsic Foot Muscles"], sm: ["Calves","Achilles Tendon"], sets: "1", reps: "60 sec each" },
    { name: "Band Pull-Aparts with Hold", eq: ["Resistance Band"], diff: "Beginner", mus: "Back", pm: ["Rear Deltoids","Rhomboids","Mid Traps","Rotator Cuff"], sm: ["Lower Traps","Core","Forearms"], sets: "3", reps: "12" },
  ];

  // ─── Now process all exercises through a template builder ───
  const allTemplates = [
    ...chestExercises.map(e => ({...e, cat: "Strength", tags: ["chest", "press", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...backExercises.map(e => ({...e, cat: "Strength", tags: ["back", "row", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...shoulderExercises.map(e => ({...e, cat: "Strength", tags: ["shoulders", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...legExercises.map(e => ({...e, cat: "Strength", tags: ["legs", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...armExercises.map(e => ({...e, cat: "Strength", tags: ["arms", "isolation", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...cardioExercises.map(e => ({...e, cat: "Cardio", tags: ["cardio", "conditioning", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...coreExercises.map(e => ({...e, cat: "Core", tags: ["core", "abs", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...flexibilityExercises.map(e => ({...e, cat: "Flexibility", tags: ["flexibility", "stretch", "mobility", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...hiitExercises.map(e => ({...e, cat: "HIIT", tags: ["hiit", "intervals", "conditioning", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...plyometricExercises.map(e => ({...e, cat: "Plyometric", tags: ["plyometric", "explosive", "power", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...functionalExercises.map(e => ({...e, cat: "Functional", tags: ["functional", "carry", "full body", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...calisthenicsExercises.map(e => ({...e, cat: "Calisthenics", tags: ["calisthenics", "bodyweight", "gymnastics", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...kettlebellExercises.map(e => ({...e, cat: "Strength", tags: ["kettlebell", "kb", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...bandExercises.map(e => ({...e, cat: "Strength", tags: ["band", "resistance band", "home", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...olympicExercises.map(e => ({...e, cat: "Olympic", tags: ["olympic", "weightlifting", "power", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
    ...rehabExercises.map(e => ({...e, cat: "Rehabilitation", tags: ["rehab", "prehab", "recovery", ...e.eq.map(eq => eq.toLowerCase().replace(/\s+/g,''))].slice(0,4)})),
  ];

  // Instruction templates by category
  const instructionTemplates = {
    "Chest": [
      `Set up the ${0} with proper positioning and alignment.`,
      `Ensure your core is engaged and your back is in a neutral position throughout.`,
      `Execute the primary movement pattern with controlled tempo.`,
      `Squeeze your chest muscles at the peak of the contraction for 1-2 seconds.`,
      `Slowly return to the starting position, maintaining tension on the target muscles.`,
    ],
    "Back": [
      `Position yourself correctly on or at the ${0} with a stable base.`,
      `Initiate the movement by driving your elbows back and down, squeezing your shoulder blades.`,
      `Pull until the implement reaches your torso, maintaining a neutral spine.`,
      `Hold the peak contraction for 1-2 seconds, focusing on squeezing your back muscles.`,
      `Release the weight slowly with control, allowing your arms to fully extend.`,
    ],
    "Shoulders": [
      `Set up with proper posture, retracting your shoulder blades slightly.`,
      `Begin the movement with your shoulders down and back, away from your ears.`,
      `Execute the pressing or raising motion with controlled tempo.`,
      `Pause briefly at the top of the movement, squeezing the target muscles.`,
      `Lower back to the starting position with control, maintaining shoulder stability.`,
    ],
    "Legs": [
      `Position your feet and body correctly for the exercise pattern.`,
      `Engage your core and maintain a neutral spine throughout the movement.`,
      `Execute the lower body movement with control, focusing on the target muscles.`,
      `Drive through the appropriate part of your foot (heel or midfoot) for maximum activation.`,
      `Return to the starting position with control, maintaining tension throughout.`,
    ],
    "Arms": [
      `Position yourself with your arm(s) properly supported or free-hanging as needed.`,
      `Keep your elbow(s) pinned in place — isolate the movement to your forearm only.`,
      `Perform the curl or extension with a slow, controlled tempo.`,
      `Squeeze the target muscle at full contraction for 1-2 seconds.`,
      `Slowly release back to the starting position, fighting the resistance on the way down.`,
    ],
    "Cardio": [
      `Begin with a proper warm-up at a low intensity for 2-3 minutes.`,
      `Set your pace or resistance to the prescribed level for the workout.`,
      `Maintain proper form and posture throughout the exercise duration.`,
      `Focus on breathing rhythmically — inhale through nose, exhale through mouth.`,
      `Cool down with 3-5 minutes of reduced intensity after completing the workout.`,
    ],
    "Core": [
      `Set up in the starting position with your spine in a neutral position.`,
      `Engage your core by drawing your belly button toward your spine.`,
      `Execute the movement slowly and with control, avoiding momentum.`,
      `Breathe steadily — exhale during the exertion phase, inhale during the return.`,
      `Maintain core tension throughout the entire set for maximum effectiveness.`,
    ],
  };

  const defaultInstructions = [
    `Set up the equipment and position your body correctly for this exercise.`,
    `Engage your core and establish proper breathing before beginning.`,
    `Execute the primary movement pattern with controlled, deliberate tempo.`,
    `Focus on the target muscles and squeeze at peak contraction for 1-2 seconds.`,
    `Return to the starting position with control, maintaining proper form throughout.`,
  ];

  for (const t of allTemplates) {
    const templates = instructionTemplates[t.mus] || defaultInstructions;
    const instructions = templates.map(tpl => {
      if (tpl.includes('${0}')) {
        return tpl.replace('${0}', t.eq[0] || 'equipment');
      }
      return tpl;
    });

    exercises.push({
      name: t.name,
      muscleGroup: t.mus,
      primaryMuscles: t.pm,
      secondaryMuscles: t.sm,
      difficulty: t.diff,
      sets: t.sets || (t.cat === "Cardio" ? "1" : t.diff === "Beginner" ? "3" : t.diff === "Intermediate" ? "3" : "4"),
      reps: t.reps || (t.cat === "Cardio" ? "30 min" : t.diff === "Beginner" ? "12" : t.diff === "Intermediate" ? "10" : "8"),
      equipment: t.eq,
      tags: [...new Set(t.tags)],
      instructions,
      category: t.cat,
      overview: `${t.difficulty} ${t.mus.toLowerCase()} exercise: ${t.name}. Targets ${t.pm.join(', ').toLowerCase()} using ${t.eq.join(', ').toLowerCase()}.`,
      benefits: [
        `Builds ${t.pm[0].toLowerCase()} strength`,
        `Improves ${t.mus.toLowerCase()} muscular development`,
        t.cat === "Cardio" ? "Enhances cardiovascular endurance" : "Supports functional movement patterns",
      ],
    });
  }

  return exercises;
}

// ═════════════════════════════════════════════════════════════════
// CONVEX SERVER MANAGEMENT
// ═════════════════════════════════════════════════════════════════

function isConvexUp() {
  return new Promise((resolve) => {
    const sock = net.createConnection({ port: CONVEX_PORT, host: '127.0.0.1' });
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
  });
}

async function ensureConvex() {
  console.log(`[convex] Checking ${CONVEX_URL} ...`);
  if (await isConvexUp()) {
    console.log('[convex] Already running.');
    return;
  }
  console.log('[convex] Starting in background ...');
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const env = { ...process.env, CONVEX_AGENT_MODE: 'anonymous' };
  // Remove problematic env vars that can confuse Convex
  delete env.CONVEX_DISABLE_UPGRADE_PROMPT;
  const child = spawn(cmd, ['convex', 'dev', '--local', '--typecheck', 'disable'], {
    stdio: 'ignore', detached: false, shell: process.platform === 'win32', env,
    cwd: path.resolve(__dirname, '..'),
  });
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    if (await isConvexUp()) {
      console.log('[convex] Started successfully.');
      return child;
    }
  }
  throw new Error('Convex failed to start after 2 minutes');
}

// ═════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════

async function main() {
  console.log('=== Exercise Library Seeder ===\n');

  // 1. Ensure Convex is running
  await ensureConvex();

  const client = new ConvexClient(CONVEX_URL);

  // 2. Generate exercises
  console.log('\n[generate] Creating exercises...');
  const allExercises = generateExercises();
  console.log(`[generate] Generated ${allExercises.length} exercises.`);

  // 3. Check current count
  const currentExercises = await client.query('exercises:list', { adminSecret: ADMIN_SECRET, limit: 1 });
  // The list query may return paginated or array format
  const currentCount = Array.isArray(currentExercises) ? currentExercises.length :
    (currentExercises?.page?.length || currentExercises?.length || 0);
  console.log(`[db] Current exercises in database: ~${currentCount}`);

  // 4. Insert in batches of 50
  const BATCH_SIZE = 25;
  let totalInserted = 0;
  let totalSkipped = 0;
  const totalBatches = Math.ceil(allExercises.length / BATCH_SIZE);

  for (let i = 0; i < allExercises.length; i += BATCH_SIZE) {
    const batch = allExercises.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\n[insert] Batch ${batchNum}/${totalBatches} (${batch.length} exercises)...`);

    try {
      const result = await client.mutation('exercises:batchCreate', {
        adminSecret: ADMIN_SECRET,
        exercises: batch,
      });
      // batchCreate returns undefined on success — it inserts silently
      totalInserted += batch.length;
      console.log(`[insert] Batch ${batchNum} complete. +${batch.length} exercises.`);
    } catch (err) {
      if (err.message?.includes('duplicate') || err.message?.includes('already exists')) {
        console.log(`[insert] Batch ${batchNum}: some duplicates skipped.`);
        totalSkipped += batch.length;
      } else {
        console.error(`[insert] Batch ${batchNum} error: ${err.message}`);
        // Try one by one
        for (const ex of batch) {
          try {
            await client.mutation('exercises:batchCreate', {
              adminSecret: ADMIN_SECRET,
              exercises: [ex],
            });
            totalInserted++;
          } catch (e2) {
            if (e2.message?.includes('duplicate') || e2.message?.includes('already exists')) {
              totalSkipped++;
            } else {
              console.error(`  [error] ${ex.name}: ${e2.message}`);
            }
          }
        }
      }
    }

    // Small delay between batches to avoid overwhelming the local server
    if (i + BATCH_SIZE < allExercises.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Inserted: ${totalInserted}`);
  console.log(`Skipped (duplicates): ${totalSkipped}`);
  console.log(`Total generated: ${allExercises.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
