import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN;
const NOTION_DATABASE_ID = 'dfe11066-43af-4297-9a97-05da2b4b384c';

console.log('NOTION_ACCESS_TOKEN:', NOTION_ACCESS_TOKEN?.substring(0, 10) + '...');
console.log('NOTION_DATABASE_ID:', NOTION_DATABASE_ID);

(async () => {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_ACCESS_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', response.status, response.statusText);
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log('Total exercises:', data.results.length);

    // Print all exercise names to find our targets
    console.log('\n=== ALL EXERCISES ===');
    data.results.forEach((page, index) => {
      const props = page.properties;
      const name = props.Name?.title?.[0]?.plain_text || '';
      const video = props['⭐Video']?.url || null;

      console.log(`${index + 1}. "${name}" - Video: ${video ? video : 'NO VIDEO'}`);
    });

    // Now search for our target exercises
    const targets = ['Goblet Squat', 'Plank Hold', 'Walking Lunge', 'Bent-Over Row', 'Overhead Press', 'Romanian Deadlift'];

    console.log('\n\n=== TARGET EXERCISES SEARCH RESULTS ===');
    const foundTargets = [];
    data.results.forEach(page => {
      const props = page.properties;
      const name = props.Name?.title?.[0]?.plain_text || '';
      const video = props['⭐Video']?.url || null;

      if (targets.some(t => name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(name.toLowerCase()))) {
        foundTargets.push({ name, video });
        console.log(`\n✅ Found: "${name}"`);
        console.log(`   Video URL: ${video || 'MISSING'}`);
      }
    });

    console.log('\n\n=== SUMMARY ===');
    console.log(`Found ${foundTargets.length} of ${targets.length} target exercises`);
    if (foundTargets.length < targets.length) {
      console.log('\nMissing:');
      targets.forEach(target => {
        if (!foundTargets.some(f => f.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(f.name.toLowerCase()))) {
          console.log(`  - ${target}`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
})();