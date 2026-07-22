// Check whether any of the 46 Jasmine-with-URL rows share a name.
// Each exercise _id is unique regardless, so the migration is safe;
// this is purely informational for the final report.
const fs = require('fs');
const path = require('path');

const found = 'C:/Users/thebe/AppData/Local/Temp/exercises.json';
const raw = fs.readFileSync(found, 'utf8');
const trimmed = raw.replace(/^\[\s*/, '').replace(/\]\s*$/, '').trim();
const docs = JSON.parse('[' + trimmed.split(/\s*,\s*,\s*/).join(',') + ']');

const jasmine = docs.filter(d => d.trainerFirstName === 'Jasmine' && d.trainerLastName === 'Trainer');
const validUrl = jasmine.filter(d => typeof d.videoUrl === 'string' && d.videoUrl.trim().length > 0);

// Duplicate names within the valid-URL set?
const byName = {};
for (const d of validUrl) (byName[d.name] ||= []).push(d._id);
const dupes = Object.entries(byName).filter(([_, ids]) => ids.length > 1);
console.log('JASMINE_VALID_URL_ROWS:', validUrl.length);
console.log('DUPLICATE_NAMES_WITHIN_VALID_URL:', dupes.length);
for (const [name, ids] of dupes) console.log(`  - ${name}: ${ids.length} rows (${ids.join(', ')})`);

// Sample one full row so we can see the complete shape returned to the frontend
console.log('\n--- FULL SAMPLE ROW (first valid-URL Jasmine exercise) ---');
console.log(JSON.stringify(validUrl[0], null, 2));

// Confirm trainer record once more for the report
console.log('\n--- URL HOSTS (where do Jasmine videos live?) ---');
const hosts = {};
for (const d of validUrl) {
  try {
    const h = new URL(d.videoUrl).host;
    hosts[h] = (hosts[h] || 0) + 1;
  } catch { hosts['(invalid)'] = (hosts['(invalid)'] || 0) + 1; }
}
console.log(hosts);
