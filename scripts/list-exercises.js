import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const ADMIN_SECRET = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';

console.log('☁️  Convex URL:', CONVEX_URL);

(async () => {
  try {
    const client = new ConvexHttpClient(CONVEX_URL);

    // Try to fetch exercises
    console.log('📥 Fetching exercises from Convex...');
    const exercises = await client.query('exercises:list', {
      adminSecret: ADMIN_SECRET,
      limit: 50
    });

    console.log(`✅ Found ${exercises.length} exercises in Convex\n`);

    // Show exercises with videos
    const withVideo = exercises.filter(ex => ex.videoUrl && ex.videoUrl.trim() !== '');
    const withoutVideo = exercises.filter(ex => !ex.videoUrl || ex.videoUrl.trim() === '');

    console.log(`📹 WITH VIDEO: ${withVideo.length} exercises`);
    withVideo.slice(0, 5).forEach((ex, index) => {
      console.log(`   ${index + 1}. ${ex.name}`);
      console.log(`      Video URL: ${ex.videoUrl}`);
      console.log(`      Image URL: ${ex.imageUrl || 'N/A'}`);
      console.log('');
    });

    console.log(`🖼️  WITHOUT VIDEO: ${withoutVideo.length} exercises`);
    withoutVideo.slice(0, 5).forEach((ex, index) => {
      console.log(`   ${index + 1}. ${ex.name}`);
      console.log(`      Image URL: ${ex.imageUrl || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
})();