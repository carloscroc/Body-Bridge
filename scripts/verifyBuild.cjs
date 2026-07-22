const fs = require('fs');
const path = require('path');

const distAssetsPath = path.resolve(__dirname, '..', 'dist', 'assets');
const expectedUrl = 'https://upbeat-chickadee-781.convex.cloud';
const leakedLocalUrl = '127.0.0.1:3210';

if (!fs.existsSync(distAssetsPath)) {
  console.error(`ERROR: Build output directory not found: ${distAssetsPath}`);
  process.exit(1);
}

const indexBundles = fs.readdirSync(distAssetsPath).filter((fileName) => /^index-.*\.js$/.test(fileName));

if (indexBundles.length === 0) {
  console.error('ERROR: Could not find dist/assets/index-*.js to verify the production bundle.');
  process.exit(1);
}

let matchedBundlePath = null;

for (const bundleName of indexBundles) {
  const bundlePath = path.join(distAssetsPath, bundleName);
  const bundleContents = fs.readFileSync(bundlePath, 'utf8');

  if (bundleContents.includes(leakedLocalUrl)) {
    console.error(`ERROR: Local Convex URL leaked into the production bundle: ${bundlePath} contains ${leakedLocalUrl}`);
    process.exit(1);
  }

  if (bundleContents.includes(expectedUrl)) {
    matchedBundlePath = bundlePath;
  }
}

if (!matchedBundlePath) {
  console.error(`ERROR: Expected Convex URL was not found in dist/assets/index-*.js: ${expectedUrl}`);
  process.exit(1);
}

console.log(`Verified production bundle contains Convex URL: ${expectedUrl} (${matchedBundlePath})`);
