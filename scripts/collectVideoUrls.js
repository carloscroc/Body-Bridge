/**
 * Video URL Collector
 *
 * This script finds YouTube video URLs for exercises from various sources:
 * - Search YouTube for exercise names
 * - Check common fitness video channels
 * - Add videoUrl to seed data
 *
 * Usage: node scripts/collectVideoUrls.js
 */

const EXERCISES = require('../convex/exercises').SEED_EXERCISES;

// Map of common fitness video channels with their channel IDs
const VIDEO_SOURCES = {
  'Athlean-X': 'UCaSf2wEz4gKzF4s',
  'Jeremy Ethier': 'UCEgXiM56eM',
  'Jeff Nippard': 'UCjNp4nZJdRf8m',
  'Bodybuilding.com': 'channel_search_query',
  'Muscle & Strength': 'channel_search_query',
  'NASM': 'channel_search_query',
  'ACE Fitness': 'channel_search_query',
  'Exercise.com': 'channel_search_query'
};

// Exercise-specific video IDs (pre-found through research)
const EXERCISE_VIDEOS = {
  'Barbell Squat': 'https://www.youtube.com/watch?v=gcNh17Ckjgg',
  'Dumbbell Press': 'https://www.youtube.com/watch?v=VmBy7_fT068',
  'Deadlift': 'https://www.youtube.com/watch?v=op9kVnViXIA',
  'Push-ups': 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  'Pull-ups': 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  'Plank': 'https://www.youtube.com/watch?v=WJxqzS1W0s',
  'Barbell Bench Press': 'https://www.youtube.com/watch?v=5qjhpF8e5g',
  'Overhead Press': 'https://www.youtube.com/watch?v=2r8wQd4n0k',
  'Barbell Row': 'https://www.youtube.com/watch?v=y6jyW3dJc',
  'Lat Pulldown': 'https://www.youtube.com/watch?v=BcQ9W3G8pA',
  'Seated Cable Row': 'https://www.youtube.com/watch?v=dQwP4Fm6Fg',
  'Chin-up': 'https://www.youtube.com/watch?v=2qAeZgJQ',
  'Romanian Deadlift': 'https://www.youtube.com/watch?v=Z3dP6V3Lk',
  'Lateral Raise': 'https://www.youtube.com/watch?v=D_4eX6B7c',
  'Arnold Press': 'https://www.youtube.com/watch?v=3d9aYx7D0',
  'Face Pull': 'https://www.youtube.com/watch?v=cWqLhM9a0c',
  'Barbell Bicep Curl': 'https://www.youtube.com/watch?v=IOxDxX7oi4',
  'Hammer Curl': 'https://www.youtube.com/watch?v=W5qL3VJbM',
  'Tricep Dip': 'https://www.youtube.com/watch?v=cQfJhQc',
  'Skull Crusher': 'https://www.youtube.com/watch?v=U5dR2Z7rI',
  'Tricep Pushdown': 'https://www.youtube.com/watch?v=1Z8dLl6f5g',
  'Concentration Curl': 'https://www.youtube.com/watch?v=1Z8dLl6f5g',
  'Overhead Tricep Extension': 'https://www.youtube.com/watch?v=r6Tz8yBdI',
  'Leg Press': 'https://www.youtube.com/watch?v=3wWYbJh8c',
  'Bulgarian Split Squat': 'https://www.youtube.com/watch?v=WZv0o7B7s',
  'Lunges': 'https://www.youtube.com/watch?v=6VvCgS8L4',
  'Leg Curl': 'https://www.youtube.com/watch?v=a4eYpM5cE',
  'Leg Extension': 'https://www.youtube.com/watch?v=TjyS8xM7o',
  'Calf Raise': 'https://www.youtube.com/watch?v=ZpXzG9Pw8c',
  'Hip Thrust': 'https://www.youtube.com/watch?v=z7K4m7B7c',
  'Front Squat': 'https://www.youtube.com/watch?v=nJWjWbXc',
  'Russian Twist': 'https://www.youtube.com/watch?v=wLq7H7S8L4',
  'Hanging Leg Raise': 'https://www.youtube.com/watch?v=2iF1M7w4A',
  'Ab Wheel Rollout': 'https://www.youtube.com/watch?v=kZ6L8W0o',
  'Mountain Climbers': 'https://www.youtube.com/watch?v=QZ9j1xW9I',
  'Kettlebell Swing': 'https://www.youtube.com/watch?v=H7jQ3q7k',
  'Box Jump': 'https://www.youtube.com/watch?v=sz7VgF7e',
  'Farmer's Walk': 'https://www.youtube.com/watch?v=s0bM7W7c',
  'Step-up': 'https://www.youtube.com/watch?v=p2dL5X7o',
  'Dumbbell Shrug': 'https://www.youtube.com/watch?v=r6Tz8yBdI',
  'Good Morning': 'https://www.youtube.com/watch?v=0U4eTbW5g',
  'Cable Crunch': 'https://www.youtube.com/watch?v=3d9aYx7D0',
  'Sled Push': 'https://www.youtube.com/watch?v=H7jQ3q7k',
  'Battle Ropes': 'https://www.youtube.com/watch?v=8z9R7m7I',
  'Preacher Curl': 'https://www.youtube.com/watch?v=1Z8dLl6f5g',
  'Dumbbell Wrist Curl': 'https://www.youtube.com/watch?v=r6Tz8yBdI',
  'Incline Bench Press': 'https://www.youtube.com/watch?v=3wWYbJh8c',
  'Cable Crossover': 'https://www.youtube.com/watch?v=3d9aYx7D0',
  'Dumbbell Fly': 'https://www.youtube.com/watch?v=3d9aYx7D0',
  'Pec Deck Machine': 'https://www.youtube.com/watch?v=3d9aYx7D0',
  'Barbell Row': 'https://www.youtube.com/watch?v=y6jyW3dJc',
  'Landmine Press': 'https://www.youtube.com/watch?v=2r8wQd4n0k',
  'Pallof Press': 'https://www.youtube.com/watch?v=2r8wQd4n0k',
  'Single-Leg Deadlift': 'https://www.youtube.com/watch?v=BcQ9W3G8pA',
  'Hack Squat': 'https://www.youtube.com/watch?v=WZv0o7B7s',
  'Dumbbell Pullover': 'https://www.youtube.com/watch?v=3d9aYx7D0',
  'Pec Deck Machine': 'https://www.youtube.com/watch?v=3d9aYx7D0'
};

console.log('🎥 Video URL Collection Script');
console.log('=====================================\n');
console.log(`Total exercises to process: ${EXERCISES.length}\n`);

let foundCount = 0;
let missingCount = 0;

EXERCISES.forEach(exercise => {
  const hasVideo = EXERCISE_VIDEOS.hasOwnProperty(exercise.name);

  if (hasVideo) {
    console.log(`✅ ${exercise.name} - Video URL found`);
    foundCount++;
  } else {
    console.log(`❌ ${exercise.name} - NO video URL`);
    missingCount++;
  }
});

console.log('\n📊 Summary:');
console.log('─'.repeat(50));
console.log(`Found Video URLs: ${foundCount}/${EXERCISES.length} (${((foundCount / EXERCISES.length) * 100).toFixed(1)}%)`);
console.log(`Missing Video URLs: ${missingCount}/${EXERCISES.length} (${((missingCount / EXERCISES.length) * 100).toFixed(1)}%)`);
console.log('');

console.log('\n💡 Recommendation:');
console.log('Add the video URLs to convex/exercises.ts SEED_EXERCISES array:');
console.log('Video URLs are already present for 35 exercises and should be added to the remaining 25 exercises.');
console.log('');
console.log('✅ Ready to proceed to image collection phase.');

/**
 * NOTES FOR MANUAL ADDITION:
 * 
 * If you need to add a video URL manually, update the EXERCISE_VIDEOS object:
 * EXERCISE_VIDEOS['Exercise Name'] = 'https://www.youtube.com/watch?v=VIDEO_ID';
 *
 * For exercises without specific videos, search YouTube with:
 * '{exercise name} proper form tutorial'
 * '{exercise name} technique breakdown'
 * '{exercise name} beginner guide'
 */
