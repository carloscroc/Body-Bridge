const { ConvexHttpClient } = require('convex/browser');
require('dotenv').config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210');

async function findAllExercisesWithVideos() {
  try {
    console.log('📥 Fetching all exercises from Convex...');
    
    // Use advancedSearch to get exercises
    const result = await client.query('exercises:advancedSearch', {
      limit: 100
    });
    
    if (!result || !result.exercises || result.exercises.length === 0) {
      console.log('❌ No exercises found');
      return;
    }

    console.log(`✅ Found ${result.exercises.length} total exercises`);
    
    const exercisesWithVideo = result.exercises.filter(ex => !!ex.videoUrl);
    
    console.log(`\n📊 ${exercisesWithVideo.length} exercises with videos:`);
    
    exercisesWithVideo.forEach((ex, index) => {
      console.log(`${index + 1}. ${ex.name}`);
      console.log(`   - Video: ${ex.videoUrl}`);
      console.log(`   - Trainer: ${ex.trainerFirstName} ${ex.trainerLastName}`);
      console.log(`   - ID: ${ex._id}`);
      console.log('');
    });
    
    if (exercisesWithVideo.length > 0) {
      console.log(`✅ Validation PASSED: Found exercises with videoUrls`);
    } else {
      console.log(`❌ No exercises found with videoUrls - need to seed sample videos`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching exercises:', error.message);
  }
}

findAllExercisesWithVideos();