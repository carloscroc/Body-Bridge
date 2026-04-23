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
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n=== Recipes in Convex ===');
      if (result && result.length > 0) {
        console.log('Total recipes:', result.length);
        result.slice(0, 5).forEach((r, i) => {
          console.log(`  ${i+1}. ${r.source_site} - ${r.recipe_title}`);
        });
      } else {
        console.log('No recipes found');
      }
    } catch (e) {
      console.error('Error:', e);
      console.error('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(body);
req.end();
