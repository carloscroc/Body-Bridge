// Read-only audit of the exported exercises.json.
// Computes exact counts needed for the Jasmine migration plan.
const fs = require('fs');
const path = require('path');

// Try multiple possible locations for the export.
const candidates = [
  path.join(process.env.TEMP || '', 'exercises.json'),
  path.join(process.env.LOCALAPPDATA || '', 'Temp', 'exercises.json'),
  'C:/Users/thebe/AppData/Local/Temp/exercises.json',
];
const found = candidates.find(p => { try { return fs.statSync(p).size > 0; } catch { return false; } });
if (!found) {
  console.error('Could not find exercises.json in:', candidates);
  process.exit(1);
}
console.error('Reading:', found);

const raw = fs.readFileSync(found, 'utf8');
// The Convex CLI prints a JSON array with objects separated by ",," on new lines.
// Normalize: strip outer brackets, split on ",," (with optional whitespace/newlines), wrap in [].
const trimmed = raw.replace(/^\[\s*/, '').replace(/\]\s*$/, '').trim();
const parts = trimmed.split(/\s*,\s*,\s*/); // split on the double commas
const docs = JSON.parse('[' + parts.join(',') + ']');

console.log('TOTAL_DOCS:', docs.length);

const jasmine = docs.filter(d => d.trainerFirstName === 'Jasmine' && d.trainerLastName === 'Trainer');
console.log('JASMINE_TAGGED:', jasmine.length);
console.log('JASMINE_ISACTIVE_TRUE:', jasmine.filter(d => d.isActive === true).length);
console.log('JASMINE_ISACTIVE_FALSE:', jasmine.filter(d => d.isActive === false).length);
console.log('JASMINE_ISACTIVE_MISSING:', jasmine.filter(d => d.isActive === undefined || d.isActive === null).length);

const isValidUrl = d => typeof d.videoUrl === 'string' && d.videoUrl.trim().length > 0;
const jasmineValidUrl = jasmine.filter(isValidUrl);
const jasmineMissingUrl = jasmine.filter(d => !isValidUrl(d));
console.log('JASMINE_WITH_VALID_URL:', jasmineValidUrl.length);
console.log('JASMINE_MISSING_OR_EMPTY_URL:', jasmineMissingUrl.length);

const untagged = docs.filter(d => !d.trainerFirstName && !d.trainerLastName);
console.log('UNTAGGED_OPENSOURCE:', untagged.length);
console.log('UNTAGGED_ISACTIVE_TRUE:', untagged.filter(d => d.isActive === true).length);
console.log('UNTAGGED_ISACTIVE_MISSING:', untagged.filter(d => d.isActive === undefined || d.isActive === null).length);

// Any trainer that is NOT Jasmine?
const otherTrainers = new Set();
for (const d of docs) {
  if (d.trainerFirstName && !(d.trainerFirstName === 'Jasmine' && d.trainerLastName === 'Trainer')) {
    otherTrainers.add(`${d.trainerFirstName} | ${d.trainerLastName}`);
  }
}
console.log('OTHER_TRAINER_TAGGINGS:', [...otherTrainers]);

// Duplicate canonical exercises by name?
const byName = {};
for (const d of docs) byName[d.name] = (byName[d.name] || 0) + 1;
const dupes = Object.entries(byName).filter(([_, c]) => c > 1);
console.log('DUPLICATE_NAMES_COUNT:', dupes.length);
if (dupes.length) console.log('SAMPLE_DUPLICATE_NAMES:', dupes.slice(0, 5).map(([n, c]) => `${n} (x${c})`));

// Distinct URL fields present on Jasmine docs
const urlLikeFields = new Set();
for (const d of jasmine) {
  for (const k of Object.keys(d)) {
    if (/url/i.test(k)) urlLikeFields.add(k);
  }
}
console.log('URL_LIKE_FIELDS_ON_JASMINE_DOCS:', [...urlLikeFields]);

// Sample data
console.log('\n--- 3 SAMPLE ROWS WITH VALID URL ---');
for (const d of jasmineValidUrl.slice(0, 3)) {
  console.log(`  _id: ${d._id}`);
  console.log(`  name: ${d.name}`);
  console.log(`  videoUrl: ${d.videoUrl}`);
  console.log(`  isActive: ${d.isActive}`);
  console.log('');
}
console.log('--- 3 SAMPLE ROWS WITH MISSING URL ---');
for (const d of jasmineMissingUrl.slice(0, 3)) {
  console.log(`  _id: ${d._id}`);
  console.log(`  name: ${d.name}`);
  console.log(`  videoUrl: ${JSON.stringify(d.videoUrl)}`);
  console.log(`  has videoUrl key: ${Object.prototype.hasOwnProperty.call(d, 'videoUrl')}`);
  console.log('');
}

// Distinct fields on Jasmine-tagged docs vs untagged
const jasmineKeys = new Set();
for (const d of jasmine) for (const k of Object.keys(d)) jasmineKeys.add(k);
console.log('\nALL_FIELDS_ON_JASMINE_DOCS:', [...jasmineKeys].sort().join(', '));
