const fs = require('fs');
const path = require('path');

const FALLBACK_CONVEX_URL = 'https://groovy-pig-414.convex.cloud';
const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env.production');

const convexUrl = process.env.VITE_CONVEX_URL || FALLBACK_CONVEX_URL;

const envFileContents = [
  `VITE_CONVEX_URL=${convexUrl}`,
  'VITE_CONVEX_SITE_URL=https://groovy-pig-414.convex.site',
  'VITE_APP_NAME=Body Bridge',
  'CONVEX_DEPLOYMENT=groovy-pig-414',
  '',
].join('\n');

fs.writeFileSync(ENV_FILE_PATH, envFileContents, 'utf8');

if (!process.env.VITE_CONVEX_URL) {
  console.error('WARNING: VITE_CONVEX_URL is not set. Falling back to https://groovy-pig-414.convex.cloud for this build.');
}

console.log(`Build env written to .env.production: VITE_CONVEX_URL=${convexUrl}`);
