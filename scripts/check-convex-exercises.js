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
    const exercises = await client.query('exercises:listForMigration', {
      adminSecret: ADMIN_SECRET,
    });

    console.log(`✅ Found ${exercises.length} exercises in Convex`);

    // Filter for Jasmine Hensley's exercises
    const jasmineExercises = exercises.filter(ex =>
      ex.trainerFirstName === 'Jasmine' &&
      ex.trainerLastName === 'Hensley'
    );

    console.log(`\n👩‍🏫 Found ${jasmineExercises.length} exercises for Jasmine Hensley:\n`);

    jasmineExercises.forEach((ex, index) => {
      console.log(`${index + 1}. ${ex.name}`);
      console.log(`   Library ID: ${ex.libraryId}`);
      console.log(`   Convex ID: ${ex._id}`);
      console.log(`   Video URL: ${ex.videoUrl || 'MISSING'}`);
      console.log(`   Source: ${ex.sourceSystem}`);
      console.log(`   Source ID: ${ex.sourceId || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
})();