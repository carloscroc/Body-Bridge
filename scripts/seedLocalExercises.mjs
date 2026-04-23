import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const convexUrl = process.env.VITE_CONVEX_URL;
const adminSecret = process.env.ADMIN_SCRIPT_SECRET;

if (!convexUrl) {
  console.error("Error: VITE_CONVEX_URL must be set in .env.local");
  process.exit(1);
}

console.log(`Seeding exercises to Convex...`);
console.log(`Convex URL: ${convexUrl}`);

const client = new ConvexHttpClient(convexUrl);

async function main() {
  try {
    const jsonPath = 'C:/Users/thebe/Downloads/fitness-database/exercises/exercises.json';
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: File not found at ${jsonPath}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const allExercises = data.exercises.map(ex => {
      return {
        libraryId: ex.id || `lib-${Math.random().toString(36).substr(2, 9)}`,
        name: ex.name,
        category: ex.category || 'strength',
        muscleGroup: (ex.primary_muscles && ex.primary_muscles[0]) || 'general',
        primaryMuscles: ex.primary_muscles || [],
        secondaryMuscles: ex.secondary_muscles || [],
        equipment: ex.equipment || [],
        overview: ex.description || '',
        instructions: ex.instructions || [],
        benefits: ex.benefits || [],
        difficulty: ex.difficulty || 'Beginner',
        sets: "3",
        reps: "10",
        tags: ex.tags || [],
        imageUrl: ex.image_url || '',
        videoUrl: ex.video || ''
      };
    });

    console.log(`Found ${allExercises.length} exercises to seed.`);

    // Seed in batches of 50 to avoid timeout
    const BATCH_SIZE = 50;
    for (let i = 0; i < allExercises.length; i += BATCH_SIZE) {
      const batch = allExercises.slice(i, i + BATCH_SIZE);
      console.log(`Seeding batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allExercises.length/BATCH_SIZE)}...`);
      
      // Note: batchCreate in convex/exercises.ts requires requireTrainer
      // Since we are running as a script, we might need an admin bypass
      // OR we can use the seed mutation which has adminSecret bypass
      
      await client.mutation(api.exercises.batchCreate, { 
        exercises: batch,
        adminSecret: adminSecret 
      });
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
