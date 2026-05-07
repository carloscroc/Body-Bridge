// Extract exercise names from SEED_EXERCISES array
const fs = require('fs');
const content = fs.readFileSync('./convex/exercises.ts', 'utf8');

// Extract exercise names using regex to avoid parsing issues
const nameMatch = content.match(/name:\s*"([^"]+)"/g);

if (nameMatch) {
  const names = nameMatch.map(match => match[1].trim());
  console.log('Exercise Names:', names.join(', '));
  console.log(`\nTotal exercises: ${names.length}`);
} else {
  console.log('Error: Could not find exercise names');
  process.exit(1);
}
