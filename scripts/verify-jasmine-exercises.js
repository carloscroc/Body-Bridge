const { ConvexHttpClient } = require('convex/browser');
require('dotenv').config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210');

async function verifyJasmineExercises() {
  try {
    console.log('📥 Fetching Jasmine Hensley exercises from Convex...');
    
    // Use the getJasmineExercises function from jasmine.ts
    const result = await client.query('jasmine:getJasmineExercises', { limit: 50 });
    
    if (!result || !result.page || result.page.length === 0) {
      console.log('❌ No Jasmine Hensley exercises found');
      return;
    }

    console.log(`✅ Found ${result.page.length} Jasmine Hensley exercises`);
    
    let videoCount = 0;
    let imageCount = 0;
    
    result.page.forEach((ex, index) => {
      const hasVideo = !!ex.videoUrl;
      const hasImage = !!ex.imageUrl;
      
      if (hasVideo) videoCount++;
      if (hasImage) imageCount++;
      
      console.log(`${index + 1}. ${ex.name}`);
      console.log(`   - Video: ${hasVideo ? '✅ ' + ex.videoUrl.substring(0, 50) + '...' : '❌ None'}`);
      console.log(`   - Image: ${hasImage ? '✅ ' + ex.imageUrl.substring(0, 50) + '...' : '❌ None'}`);
      console.log(`   - ID: ${ex._id}`);
      console.log('');
    });

    console.log(`\n📊 Summary:`);
    console.log(`   - Total exercises: ${result.page.length}`);
    console.log(`   - With video: ${videoCount} (${Math.round(videoCount/result.page.length*100)}%)`);
    console.log(`   - With image: ${imageCount} (${Math.round(imageCount/result.page.length*100)}%)`);
    
    if (videoCount > 0) {
      console.log(`\n✅ Validation PASSED: At least one Jasmine Hensley exercise has a valid videoUrl`);
    } else {
      console.log(`\n❌ Validation FAILED: No Jasmine Hensley exercises have videoUrls`);
    }
    
  } catch (error) {
    console.error('❌ Error fetching exercises:', error.message);
    if (error.message.includes('Could not find public function')) {
      console.error('   Make sure jasmine:getJasmineExercises is exported in convex/jasmine.ts');
    }
  }
}

verifyJasmineExercises();