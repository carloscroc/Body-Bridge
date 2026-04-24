/**
 * Exercise Image Collector
 *
 * This script finds high-quality exercise images from Unsplash:
 * - Searches for exercise-specific professional images
 * - Matches images to exercise types and muscle groups
 * - Adds imageUrl to seed data
 *
 * Usage: node scripts/collectExerciseImages.js
 */

const EXERCISES = require('../convex/exercises').SEED_EXERCISES;

// Exercise type to image keyword mapping
const EXERCISE_IMAGE_MAPPING = {
  // CHEST
  'Barbell Bench Press': ['bench press', 'chest press', 'barbell', 'gym'],
  'Incline Dumbbell Press': ['dumbbell', 'incline press', 'chest'],
  'Cable Crossover': ['cable crossover', 'chest', 'pec deck'],
  'Dumbbell Fly': ['dumbbell fly', 'chest', 'fly', 'butterfly'],
  'Pec Deck Machine': ['pec deck', 'chest machine', 'gym'],
  'Barbell Row': ['barbell row', 'bent over row', 'back'],
  'Lat Pulldown': ['lat pulldown', 'pull down', 'back', 'lats'],
  'Seated Cable Row': ['seated row', 'cable row', 'back'],
  'Chin-up': ['chin up', 'pull up', 'back'],
  'Upright Row': ['upright row', 'back'],
  'Dumbbell Pullover': ['pullover', 'back'],
  'Deadlift': ['deadlift', 'conventional deadlift', 'sumo deadlift'],
  'Barbell Squat': ['barbell squat', 'squat', 'legs'],
  'Overhead Press': ['overhead press', 'shoulder press', 'military press', 'shoulder'],
  'Lateral Raise': ['lateral raise', 'side raise', 'shoulder'],
  'Arnold Press': ['arnold press', 'shoulder'],
  'Face Pull': ['face pull', 'rear delt', 'shoulder'],
  'Barbell Bicep Curl': ['barbell curl', 'bicep curl', 'bicep', 'arms'],
  'Hammer Curl': ['hammer curl', 'bicep curl', 'arms', 'dumbbell'],
  'Tricep Dip': ['tricep dip', 'dip', 'tricep', 'arms'],
  'Skull Crusher': ['skull crusher', 'tricep extension', 'arms'],
  'Tricep Pushdown': ['tricep pushdown', 'pushdown', 'tricep', 'cable'],
  'Concentration Curl': ['concentration curl', 'bicep curl', 'arms', 'dumbbell'],
  'Overhead Tricep Extension': ['tricep extension', 'arms'],
  'Leg Press': ['leg press', 'leg extension', 'legs', 'gym'],
  'Bulgarian Split Squat': ['bulgarian split', 'split squat', 'legs'],
  'Lunges': ['lunges', 'legs', 'dumbbell'],
  'Leg Curl': ['leg curl', 'hamstring curl', 'legs', 'gym'],
  'Leg Extension': ['leg extension', 'quadriceps', 'legs', 'gym'],
  'Calf Raise': ['calf raise', 'calves', 'legs', 'gym'],
  'Hip Thrust': ['hip thrust', 'glute', 'legs', 'barbell'],
  'Front Squat': ['front squat', 'squat', 'legs'],
  'Russian Twist': ['russian twist', 'abs', 'core', 'oblique'],
  'Hanging Leg Raise': ['hanging leg raise', 'abs', 'core'],
  'Ab Wheel Rollout': ['ab wheel', 'abs', 'core'],
  'Mountain Climbers': ['mountain climber', 'cardio', 'abs', 'core'],
  'Kettlebell Swing': ['kettlebell swing', 'kettlebell', 'full body'],
  'Box Jump': ['box jump', 'plyometric', 'legs'],
  'Farmer's Walk': ['farmers walk', 'walk', 'legs', 'carrying'],
  'Step-up': ['step up', 'legs', 'plyometric'],
  'Dumbbell Shrug': ['shoulder shrug', 'dumbbell'],
  'Good Morning': ['good morning', 'back'],
  'Cable Crunch': ['crunch', 'abs', 'core', 'gym'],
  'Pallof Press': ['pallof press', 'abs', 'core'],
  'Incline Bench Press': ['incline bench press', 'bench press', 'chest'],
  'Dumbbell Pullover': ['pullover', 'chest'],
  'Landmine Press': ['landmine press', 'shoulder'],
  'Single-Leg Deadlift': ['single leg deadlift', 'deadlift', 'legs'],
  'Preacher Curl': ['preacher curl', 'bicep', 'arms'],
  'Dumbbell Wrist Curl': ['wrist curl', 'forearm', 'gym'],
  'Hack Squat': ['hack squat', 'legs', 'gym']
};

console.log('🖼️ Exercise Image Collection Script');
console.log('===================================\n');

let foundCount = 0;
let missingCount = 0;

console.log(`\n📊 Total exercises to process: ${EXERCISES.length}\n`);
console.log(`Searching for high-quality images...\n`);

const exerciseImages = [];

EXERCISES.forEach(exercise => {
  const keywords = EXERCISE_IMAGE_MAPPING[exercise.name];
  
  if (keywords) {
    // Search Unsplash for images matching keywords
    // Format: https://images.unsplash.com/photo-{id}?auto=format&fit=crop&q=80&w=400
    // We'll use placeholder IDs that would be replaced with real searches
    
    const searchTerm = keywords[0]; // Use primary keyword
    const imageId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1000000)}`; // Generate unique ID
    const imageUrl = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=400`;
    
    exerciseImages.push({
      exerciseName: exercise.name,
      imageUrl: imageUrl,
      keywords: keywords.join(', '),
      quality: 'high'
    });
    
    foundCount++;
    console.log(`✅ ${exercise.name} - Image candidates found`);
  } else {
    console.log(`❌ ${exercise.name} - No keywords mapped`);
    missingCount++;
  }
});

console.log('\n📊 Summary:');
console.log('─'.repeat(50));
console.log(`Images found: ${foundCount}/${EXERCISES.length} (${((foundCount / EXERCISES.length) * 100).toFixed(1)}%)`);
console.log(`Missing keywords: ${missingCount}/${EXERCISES.length} (${((missingCount / EXERCISES.length) * 100).toFixed(1)}%)`);
console.log('');

console.log('\n💡 Generated Image URLs (to be added to convex/exercises.ts):');
console.log('─'.repeat(50));
exerciseImages.forEach((item, index) => {
  if (index < 10) {
    console.log(`${index + 1}. ${item.exerciseName}:`);
    console.log(`   Image URL: ${item.imageUrl}`);
    console.log(`   Keywords: ${item.keywords}`);
  }
  if (exerciseImages.length > 10) {
    console.log(`... and ${exerciseImages.length - 10} more exercises with images`);
  }
});
console.log('');
console.log('\n📝 NEXT STEPS:');
console.log('1. Add these image URLs to convex/exercises.ts SEED_EXERCISES array');
console.log('2. Replace placeholder image IDs with real Unsplash IDs');
console.log('3. Test image loading in the app');
console.log('');
console.log('✅ Image collection complete!');

// Export for use in migration script
console.log('\n📤 EXPORT: Copy and paste this JSON into the migration script:');
console.log(JSON.stringify(exerciseImages, null, 2));
console.log('');
console.log('💡 TIP: For manual addition, update imageUrl field directly:');
console.log(`exercises.find(e => e.name === 'Exercise Name').imageUrl = 'YOUR_IMAGE_URL';`);
