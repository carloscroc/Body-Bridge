import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN;

console.log('NOTION_ACCESS_TOKEN:', NOTION_ACCESS_TOKEN?.substring(0, 10) + '...');

(async () => {
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
      const errorText = await response.text();
      console.error('Notion API error:', response.status, response.statusText);
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log('Total databases found:', data.results.length);

    console.log('\n=== ALL NOTION DATABASES ===');
    data.results.forEach((db, index) => {
      const title = db.title?.[0]?.plain_text || 'No title';
      const id = db.id;
      console.log(`${index + 1}. "${title}" (ID: ${id})`);

      // If it looks like exercise database, show details
      if (title.toLowerCase().includes('exercise') || title.toLowerCase().includes('library') || title.toLowerCase().includes('jasmine')) {
        console.log(`   ⭐ This might be the database we need!`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
})();