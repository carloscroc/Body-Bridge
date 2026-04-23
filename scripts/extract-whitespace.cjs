const fs = require('fs');
const content = fs.readFileSync('scripts/recipeScraper.js', 'utf8');
const lines = content.split('\n');
console.log('Lines 118-133:');
for (let i = 117; i < 133 && i < lines.length; i++) {
  console.log(`${i+1}: "${lines[i].replace(/\n/g, '\\n')}"`);
}