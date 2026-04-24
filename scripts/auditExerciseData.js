/**
 * Exercise Data Audit Script
 * 
 * This script audits the current exercise data in the database to identify:
 * - Which exercises have video URLs
 * - Which exercises have image URLs
 * - Which exercises have detailed overviews
 * - Which exercises have specific benefits
 * - Which exercises have training parameters
 * - Which exercises have notes
 * 
 * Usage: node scripts/auditExerciseData.js
 */

const { ConvexHttpClient } = require('./convexAdminClient');

async function auditExerciseData() {
  console.log('🔍 Starting Exercise Data Audit...\n');

  const client = new ConvexHttpClient();

  try {
    // Fetch all exercises
    const exercises = await client.query('exercises:list', {
      adminSecret: process.env.ADMIN_SCRIPT_SECRET
    });

    console.log(`📊 Total exercises in database: ${exercises.length}\n`);

    // Initialize counters
    const stats = {
      total: exercises.length,
      hasVideoUrl: 0,
      hasImageUrl: 0,
      hasOverview: 0,
      hasBenefits: 0,
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

    // Detailed breakdown by exercise
    const exerciseDetails = [];

    for (const exercise of exercises) {
      const detail = {
        name: exercise.name,
        libraryId: exercise.libraryId,
        category: exercise.category,
        muscleGroup: exercise.muscleGroup,
        difficulty: exercise.difficulty,
        hasVideoUrl: !!exercise.videoUrl,
        hasImageUrl: !!exercise.imageUrl,
        hasOverview: !!exercise.overview,
        hasBenefits: exercise.benefits && exercise.benefits.length > 0,
        hasInstructions: exercise.instructions && exercise.instructions.length > 0,
        hasTempo: !!exercise.tempo,
        hasRest: !!exercise.rest,
        hasWeight: !!exercise.weight,
        hasDuration: !!exercise.duration,
        hasNotes: !!exercise.notes,
        // Check if overview is specific (not auto-generated)
        hasSpecificOverview: exercise.overview && 
          !exercise.overview.includes('is a great exercise for'),
        // Check if benefits are specific (not generic)
        hasSpecificBenefits: exercise.benefits && 
          exercise.benefits.length > 0 &&
          !exercise.benefits.includes('Increased strength'),
        // Check if has any training parameters
        hasTrainingParameters: !!exercise.tempo || 
          !!exercise.rest || 
          !!exercise.weight ||
          !!exercise.duration ||
          !!exercise.notes
      };

      // Update counters
      if (detail.hasVideoUrl) stats.hasVideoUrl++;
      if (detail.hasImageUrl) stats.hasImageUrl++;
      if (detail.hasOverview) stats.hasOverview++;
      if (detail.hasBenefits) stats.hasBenefits++;
      if (detail.hasInstructions) stats.hasInstructions++;
      if (detail.hasTempo) stats.hasTempo++;
      if (detail.hasRest) stats.hasRest++;
      if (detail.hasWeight) stats.hasWeight++;
      if (detail.hasDuration) stats.hasDuration++;
      if (detail.hasNotes) stats.hasNotes++;
      if (detail.hasSpecificOverview) stats.hasSpecificOverview++;
      if (detail.hasSpecificBenefits) stats.hasSpecificBenefits++;
      if (detail.hasTrainingParameters) stats.hasTrainingParameters++;

      // Check if exercise is complete
      const isComplete = detail.hasVideoUrl &&
        detail.hasImageUrl &&
        detail.hasSpecificOverview &&
        detail.hasSpecificBenefits &&
        detail.hasInstructions &&
        detail.hasTrainingParameters;

      if (isComplete) {
        stats.completeExercises++;
      } else {
        stats.incompleteExercises++;
      }

      exerciseDetails.push(detail);
    }

    // Print summary statistics
    console.log('📈 Summary Statistics:');
    console.log('─'.repeat(50));
    console.log(`Total Exercises: ${stats.total}`);
    console.log(`Has Video URL: ${stats.hasVideoUrl} (${((stats.hasVideoUrl / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Image URL: ${stats.hasImageUrl} (${((stats.hasImageUrl / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Overview: ${stats.hasOverview} (${((stats.hasOverview / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Benefits: ${stats.hasBenefits} (${((stats.hasBenefits / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Instructions: ${stats.hasInstructions} (${((stats.hasInstructions / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Tempo: ${stats.hasTempo} (${((stats.hasTempo / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Rest: ${stats.hasRest} (${((stats.hasRest / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Weight: ${stats.hasWeight} (${((stats.hasWeight / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Duration: ${stats.hasDuration} (${((stats.hasDuration / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Notes: ${stats.hasNotes} (${((stats.hasNotes / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Specific Overview: ${stats.hasSpecificOverview} (${((stats.hasSpecificOverview / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Specific Benefits: ${stats.hasSpecificBenefits} (${((stats.hasSpecificBenefits / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Has Training Parameters: ${stats.hasTrainingParameters} (${((stats.hasTrainingParameters / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Complete Exercises: ${stats.completeExercises} (${((stats.completeExercises / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Incomplete Exercises: ${stats.incompleteExercises} (${((stats.incompleteExercises / stats.total) * 100).toFixed(1)}%)`);
    console.log('');

    // Print exercises missing critical fields
    console.log('⚠️  Exercises Missing Critical Fields:');
    console.log('─'.repeat(50));

    const missingVideos = exerciseDetails.filter(e => !e.hasVideoUrl);
    if (missingVideos.length > 0) {
      console.log(`\n❌ Missing Video URLs (${missingVideos.length}):`);
      missingVideos.forEach(e => console.log(`   - ${e.name}`));
    }

    const missingImages = exerciseDetails.filter(e => !e.hasImageUrl);
    if (missingImages.length > 0) {
      console.log(`\n❌ Missing Image URLs (${missingImages.length}):`);
      missingImages.forEach(e => console.log(`   - ${e.name}`));
    }

    const missingSpecificOverview = exerciseDetails.filter(e => !e.hasSpecificOverview);
    if (missingSpecificOverview.length > 0) {
      console.log(`\n❌ Missing Specific Overviews (${missingSpecificOverview.length}):`);
      missingSpecificOverview.forEach(e => console.log(`   - ${e.name}`));
    }

    const missingSpecificBenefits = exerciseDetails.filter(e => !e.hasSpecificBenefits);
    if (missingSpecificBenefits.length > 0) {
      console.log(`\n❌ Missing Specific Benefits (${missingSpecificBenefits.length}):`);
      missingSpecificBenefits.forEach(e => console.log(`   - ${e.name}`));
    }

    const missingTrainingParams = exerciseDetails.filter(e => !e.hasTrainingParameters);
    if (missingTrainingParams.length > 0) {
      console.log(`\n❌ Missing Training Parameters (${missingTrainingParams.length}):`);
      missingTrainingParams.forEach(e => console.log(`   - ${e.name}`));
    }

    // Print complete exercises
    const completeExercises = exerciseDetails.filter(e => 
      e.hasVideoUrl && 
      e.hasImageUrl && 
      e.hasSpecificOverview && 
      e.hasSpecificBenefits && 
      e.hasInstructions && 
      e.hasTrainingParameters
    );

    if (completeExercises.length > 0) {
      console.log(`\n✅ Complete Exercises (${completeExercises.length}):`);
      completeExercises.forEach(e => console.log(`   - ${e.name}`));
    }

    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: stats,
      exercises: exerciseDetails,
      missingVideos: missingVideos.map(e => e.name),
      missingImages: missingImages.map(e => e.name),
      missingSpecificOverview: missingSpecificOverview.map(e => e.name),
      missingSpecificBenefits: missingSpecificBenefits.map(e => e => name),
      missingTrainingParams: missingTrainingParams.map(e => e.name),
      completeExercises: completeExercises.map(e => e.name)
    };

    const fs = require('fs');
    const reportPath = 'exercise-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    console.log('\n✅ Audit complete!');

  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

// Run the audit
auditExerciseData();
