import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN;
const TARGET_EXERCISES = ['Goblet Squat', 'Plank Hold', 'Walking Lunge', 'Bent-Over Row', 'Overhead Press', 'Romanian Deadlift'];

console.log('NOTION_ACCESS_TOKEN:', NOTION_ACCESS_TOKEN?.substring(0, 10) + '...');

async function searchDatabase(databaseId) {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
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
      return null; // Skip databases we can't access
    }

    const data = await response.json();
    const foundExercises = [];

    data.results.forEach(page => {
      const props = page.properties;
      const name = props.Name?.title?.[0]?.plain_text || '';

      if (TARGET_EXERCISES.some(t => name.toLowerCase().includes(t.toLowerCase()))) {
        const video = props['⭐Video']?.url || null;
        foundExercises.push({ name, video });
      }
    });

    return foundExercises;
  } catch (error) {
    return null;
  }
}

async function searchAllDatabases() {
  try {
    const response = await fetch(
      'https://api.notion.com/v1/search',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_ACCESS_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            value: 'database',
            property: 'object'
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Error searching databases');
      return;
    }

    const data = await response.json();
    console.log(`\n🔍 Searching ${data.results.length} databases for our target exercises...\n`);

    for (const db of data.results) {
      const title = db.title?.[0]?.plain_text || 'No title';
      const id = db.id;

      console.log(`📂 Checking database: "${title}"`);

      const foundExercises = await searchDatabase(id);

      if (foundExercises && foundExercises.length > 0) {
        console.log(`   ✅ Found ${foundExercises.length} target exercises!`);
        foundExercises.forEach(ex => {
          console.log(`      - "${ex.name}": ${ex.video || 'NO VIDEO'}`);
        });
      }
    }

    console.log('\n✅ Search complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

searchAllDatabases();