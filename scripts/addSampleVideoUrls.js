#!/usr/bin/env node
/**
 * Add sample video URLs to first 5 exercises for testing video preview feature
 */

import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CONVEX_URL = 'http://127.0.0.1:3210';

const sampleUrls = [
  "https://www.youtube.com/watch?v=aclHkVaku9U", // Squat
  "https://www.youtube.com/watch?v=gcNh17Ckjgg", // Pushup
  "https://www.youtube.com/watch?v=U-qHPIq6GWg", // Pullup
  "https://www.youtube.com/watch?v=qWix9d3PV3k", // Plank
  "https://www.youtube.com/watch?v=SW_C1A-rejs",  // Lunge
];

async function addSampleVideoUrls() {
  console.log('🔗 Adding sample video URLs to exercises...');
  console.log(`📡 Convex URL: ${CONVEX_URL}`);

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Fetch exercises
    console.log('\n📥 Fetching exercises from Convex...');
    const exercises = await client.query('exercises:list', { limit: 5 });
    console.log(`✅ Found ${exercises.length} exercises`);

    // Update each exercise with a sample video URL
    console.log('\n🔄 Updating video URLs...');
    for (let i = 0; i < exercises.length && i < sampleUrls.length; i++) {
      const exercise = exercises[i];
      const videoUrl = sampleUrls[i];

      console.log(`   Updating "${exercise.name}" → ${videoUrl}`);

      // Call the updateVideoUrl function
      await client.mutation('exercises:updateVideoUrl', {
        exerciseId: exercise._id,
        videoUrl: videoUrl,
        adminSecret: process.env.ADMIN_SCRIPT_SECRET || 'testsecret123',
      });
    }

    console.log('\n✅ Done! Sample video URLs added to exercises.');
    console.log('\nNow you can test the video preview feature in the app!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSampleVideoUrls();