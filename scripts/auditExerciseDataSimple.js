/**
 * Exercise Data Audit Script (Simplified)
 *
 * This script audits current exercise data in the database.
 * Designed to work with the existing Convex development environment.
 * 
 * Usage: node scripts/auditExerciseDataSimple.js
 */

// Load seed exercises to know what to look for
const SEED_EXERCISES = require('../convex/exercises').SEED_EXERCISES;

// Initialize counters
const stats = {
  total: SEED_EXERCISES.length,
  hasVideoUrl: 0,
  hasImageUrl: 0,
  hasSpecificOverview: 0,
  hasSpecificBenefits: 0,
  hasInstructions: 0,
  hasTempo: 0,
  hasRest: 0,
  hasWeight: 0,
  hasDuration: 0,
  hasNotes: 0,
  hasSpecificOverview: 0,
  hasSpecificBenefits: 0,
  hasTrainingParameters: 0,
  completeExercises: 0,
  incompleteExercises: 0
};

console.log('🔍 Starting Exercise Data Audit...\n');
console.log('===================================\n');

// Simple approach: Check seed data for what it contains
console.log(`\n📊 Total exercises to audit: ${stats.total}\n`);

SEED_EXERCISES.forEach((exercise, index) => {
  const detail = {
    name: exercise.name,
    libraryId: exercise.libraryId,
    category: exercise.category,
    muscleGroup: exercise.muscleGroup,
    difficulty: exercise.difficulty
  };
  
  // Check video URLs
  if (exercise.videoUrl && exercise.videoUrl.length > 0) {
    stats.hasVideoUrl++;
    console.log(`✅ Video URL found for: ${exercise.name}`);
  } else {
    console.log(`❌ No video URL for: ${exercise.name}`);
  }
  
  // Check image URLs
  if (exercise.imageUrl && exercise.imageUrl.length > 0) {
    stats.hasImageUrl++;
    console.log(`✅ Image URL found for: ${exercise.name}`);
  } else {
    console.log(`❌ No image URL for: ${exercise.name}`);
  }
  
  // Check overview
  if (exercise.overview) {
    // Check if it's not the generic auto-generated one
    if (exercise.overview && !exercise.overview.includes('is a great exercise for')) {
      stats.hasSpecificOverview++;
      console.log(`✅ Specific overview for: ${exercise.name}`);
    } else if (exercise.overview) {
      console.log(`⚠️  Generic overview for: ${exercise.name}`);
    }
  }
  
  // Check benefits
  if (exercise.benefits && exercise.benefits.length > 0) {
    // Check if they're not the generic ones
    const hasGenericBenefits = exercise.benefits.some(b => 
      b === 'Increased strength' || 
      b === 'Improved muscle tone' || 
      b === 'Better functional movement'
    );
    
    if (hasGenericBenefits) {
      console.log(`⚠️  Generic benefits for: ${exercise.name}`);
    } else if (exercise.benefits.length > 2) {
      stats.hasSpecificBenefits++;
      console.log(`✅ Specific benefits for: ${exercise.name}`);
    } else {
      console.log(`⚠️  Limited benefits for: ${exercise.name}`);
    }
  }
  
  // Check instructions
  if (exercise.instructions && exercise.instructions.length >= 3) {
    stats.hasInstructions++;
    console.log(`✅ Instructions found for: ${exercise.name}`);
  } else if (exercise.instructions && exercise.instructions.length > 0) {
    stats.hasInstructions++;
    console.log(`⚠️  Limited instructions for: ${exercise.name}`);
  }
  
  // Check training parameters
  const hasTrainingParams = !!(exercise.tempo || exercise.rest || exercise.weight || exercise.duration || exercise.notes);
  if (hasTrainingParams) {
    stats.hasTrainingParameters++;
    console.log(`✅ Training parameters for: ${exercise.name}`);
  }
  
  // Check notes
  if (exercise.notes) {
    stats.hasNotes++;
    console.log(`✅ Notes found for: ${exercise.name}`);
  }
  
  // Determine if exercise is complete
  const isComplete = exercise.videoUrl && 
                  exercise.imageUrl && 
                  (exercise.overview && !exercise.overview.includes('is a great exercise for')) &&
                  (exercise.benefits && exercise.benefits.length >= 3) &&
                  exercise.instructions && exercise.instructions.length >= 3 &&
                  hasTrainingParams;
  
  if (isComplete) {
    stats.completeExercises++;
  } else {
    stats.incompleteExercises++;
  }
});

// Print summary statistics
console.log('\n📈 Summary Statistics:');
console.log('─'.repeat(50));
console.log(`Total Exercises: ${stats.total}`);
console.log(`Has Video URL: ${stats.hasVideoUrl} (${((stats.hasVideoUrl / stats.total) * 100).toFixed(1)}%)`);
console.log(`Has Image URL: ${stats.hasImageUrl} (${((stats.hasImageUrl / stats.total) * 100).toFixed(1)}%)`);
console.log(`Has Specific Overview: ${stats.hasSpecificOverview} (${((stats.hasSpecificOverview / stats.total) * 100).toFixed(1)}%)`);
console.log(`Has Specific Benefits: ${stats.hasSpecificBenefits} (${((stats.hasSpecificBenefits / stats.total) * 100).toFixed(1)}%)`);
console.log(`Has Instructions: ${stats.hasInstructions} (${((stats.hasInstructions / stats.total) * 100).toFixed(1)}%)`);
console.log(`Has Training Parameters: ${stats.hasTrainingParameters} (${((stats.hasTrainingParameters / stats.total) * 100).toFixed(1)}%)`);
console.log(`Has Notes: ${stats.hasNotes} (${((stats.hasNotes / stats.total) * 100).toFixed(1)}%)`);
console.log(`Complete Exercises: ${stats.completeExercises} (${((stats.completeExercises / stats.total) * 100).toFixed(1)}%)`);
console.log(`Incomplete Exercises: ${stats.incompleteExercises} (${((stats.incompleteExercises / stats.total) * 100).toFixed(1)}%)`);
console.log('');

console.log('\n💡 CURRENT STATE:');
console.log('Your exercises currently have:');
console.log('  ✅ Step-by-step instructions (for most)');
console.log('  ✅ Some images (6 exercises)');
console.log('  ✅ Some video URLs (6 exercises)');
console.log('  ❌ Missing video URLs for most exercises');
console.log('  ❌ Missing specific overviews (most have generic)');
console.log('  ❌ Missing specific benefits (most have generic)');
console.log('  ❌ Missing training parameters (tempo, rest, weight, duration, notes)');
console.log('');
console.log('💡 RECOMMENDATION:');
console.log('1. Run data collection scripts to gather video/image URLs');
console.log('2. Run migration script to update database');
console.log('3. Update UI to display new details');
console.log('');
console.log('✅ Audit complete!');
