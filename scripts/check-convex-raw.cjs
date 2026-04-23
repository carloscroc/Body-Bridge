const http = require('http');

const url = 'http://127.0.0.1:3210/api/query';
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    path: 'convex/recipes.list',
    args: {},
  }),
};

console.log('Querying recipes...');
const req = http.request(url, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log('\n=== Recipes in Convex ===');
      if (result && result.length > 0) {
        console.log(`\nTotal recipes: ${result.length}`);
        result.slice(0, 3).forEach((r, i) => {
          console.log(`${i+1}. ${r.source_site} - ${r.recipe_title}`);
        });
      } else {
        console.log('No recipes found');
      }
    } catch {
      console.error('Error:', e.message);
      console.error('Response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(body);
req.end();
