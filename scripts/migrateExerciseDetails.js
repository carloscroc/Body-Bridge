/**
 * Exercise Data Migration Script
 *
 * This script updates all exercises in the database with:
 * - Video URLs
 * - Image URLs  
 * - Detailed overviews (exercise-specific)
 * - Specific benefits
 * - Training parameters (tempo, rest, weight, duration, notes)
 *
 * Usage: node scripts/migrateExerciseDetails.js
 * 
 * Prerequisites:
 * - Admin secret set in environment (ADMIN_SCRIPT_SECRET)
 * - Convex dev server running
 * - Seed data available in convex/exercises.ts
 *
 * What it does:
 * 1. Loads video URLs from collectVideoUrls.js
 * 2. Loads image URLs from collectExerciseImages.js
 * 3. Loads detailed overviews from generateDetailedOverviews.js
 * 4. Loads training parameters from addTrainingParameters.js
 * 5. Updates each exercise in the database
 * 6. Reports results
 */

const { ConvexHttpClient } = require('./convexAdminClient');

// Import data sources as ES modules
import VIDEO_URLS from './collectVideoUrls.js';
import IMAGE_URLS from './collectExerciseImages.js';
import DETAILED_OVERVIEWS from './generateDetailedOverviews.js';
import TRAINING_PARAMETERS from './addTrainingParameters.js';

console.log('🚀 Exercise Data Migration Script');
console.log('========================================\n');

// Validation
const adminSecret = process.env.ADMIN_SCRIPT_SECRET;
if (!adminSecret) {
  console.error('❌ ADMIN_SCRIPT_SECRET not set in environment!');
  console.error('Please set ADMIN_SCRIPT_SECRET in your .env file');
  process.exit(1);
}

console.log('✅ Admin secret validated');

console.log('\n📊 Data Loaded:');
console.log(`   Video URLs: ${Object.keys(VIDEO_URLS).length} exercises`);
console.log(`   Image URLs: ${IMAGE_URLS.length} exercises`);
console.log(`   Detailed Overviews: ${Object.keys(DETAILED_OVERVIEWS).length} exercises`);
console.log(`   Training Parameters: ${Object.keys(TRAINING_PARAMETERS).length} exercises`);
console.log('');

// Load seed exercises
const SEED_EXERCISES = require('../convex/exercises').SEED_EXERCISES;

async function migrateExerciseDetails() {
  console.log(`\n🔄 Migrating exercise details...\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  const client = new ConvexHttpClient();
  
  // Process each exercise
  for (const exercise of SEED_EXERCISES) {
    const exerciseName = exercise.name;
    
    // Gather all available data
    const videoUrl = VIDEO_URLS[exerciseName];
    const imageData = IMAGE_URLS.find(img => img.exerciseName === exerciseName);
    const imageUrl = imageData ? imageData.imageUrl : undefined;
    const overview = DETAILED_OVERVIEWS[exerciseName]?.overview;
    const benefits = DETAILED_OVERVIEWS[exerciseName]?.benefits || [];
    const trainingParams = TRAINING_PARAMETERS[exerciseName] || {};
    
    // Check if this exercise has been updated before (has specific overview or benefits)
    const isAlreadyUpdated = !!(exercise.overview?.includes('is a great exercise for')) && 
                           (exercise.benefits?.length > 0 && 
                           !exercise.benefits[0].includes('Increased strength'));
    
    // Build update object
    const updates: any = {
      videoUrl: videoUrl || undefined,
      imageUrl: imageUrl || undefined,
      overview: overview || undefined,
      benefits: benefits,
      ...trainingParams
    };
    
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    
    try {
      // Update exercise
      await client.mutation('exercises:update', {
        id: `seed-${exerciseName.toLowerCase().replace(/\s+/g, "-")}`,
        updates,
        adminSecret
      });
      
      updatedCount++;
      console.log(`✅ ${exerciseName} - Updated`);
      
    } catch (error) {
      if (error.message?.includes('Document not found')) {
        console.log(`⏭️ ${exerciseName} - Skipped (exercise not in database)`);
        skippedCount++;
      } else {
        console.error(`❌ ${exerciseName} - Error:`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log('\n📊 Migration Results:');
  console.log('─'.repeat(50));
  console.log(`Total exercises processed: ${SEED_EXERCISES.length}`);
  console.log(`Successfully updated: ${updatedCount}`);
  console.log(`Skipped (not in DB): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('');
  
  console.log('💡 NEXT STEPS:');
  console.log('1. Verify updates in the app');
  console.log('2. Test exercise display');
  console.log('3. Check that all data is showing correctly');
  console.log('');
  console.log('✅ Migration complete!');
}

// Run migration
migrateExerciseDetails();
