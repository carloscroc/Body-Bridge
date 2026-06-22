const fs = require('fs');
const path = require('path');

const FALLBACK_CONVEX_URL = 'https://groovy-pig-414.convex.cloud';
const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env.production');

const convexUrl = process.env.VITE_CONVEX_URL || FALLBACK_CONVEX_URL;

// VITE_DIAG enables the in-app auth diagnostics overlay for debug builds.
// Leave unset for release builds so the panel stays off in production.
const diagLine = process.env.VITE_DIAG ? `VITE_DIAG=${process.env.VITE_DIAG}` : null;

const envFileContents = [
  `VITE_CONVEX_URL=${convexUrl}`,
  'VITE_CONVEX_SITE_URL=https://groovy-pig-414.convex.site',
  'VITE_APP_NAME=Body Bridge',
  'CONVEX_DEPLOYMENT=groovy-pig-414',
  diagLine,
  '',
].filter(Boolean).join('\n');

fs.writeFileSync(ENV_FILE_PATH, envFileContents, 'utf8');

if (!process.env.VITE_CONVEX_URL) {
  console.error('WARNING: VITE_CONVEX_URL is not set. Falling back to https://groovy-pig-414.convex.cloud for this build.');
}

console.log(`Build env written to .env.production: VITE_CONVEX_URL=${convexUrl}`);
