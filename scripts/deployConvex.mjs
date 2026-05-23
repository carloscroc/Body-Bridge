#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

// Load environment variables
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, quiet: true });
}
if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false, quiet: true });
}

console.log('🚀 Deploying Convex backend to cloud...\n');

// Check if logged in
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log('Step 1: Checking authentication...');
const loginCheck = spawn(command, ['convex', 'dashboard'], {
  cwd: rootDir,
  stdio: 'pipe',
  shell: process.platform === 'win32',
});

loginCheck.on('error', () => {
  console.log('❌ Not authenticated with Convex.');
  console.log('Please run: npx convex login');
  process.exit(1);
});

// Deploy to cloud
console.log('Step 2: Deploying functions to production...');
const deploy = spawn(command, ['convex', 'deploy', '--verbose'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

deploy.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Deployment successful!\n');
    console.log('Your Convex backend is now running in the cloud.');
    console.log('Update your .env.local with the deployment URL if needed.');
    
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev:app');
    console.log('2. Your app will connect to the cloud deployment automatically');
    
    process.exit(0);
  } else {
    console.log('\n❌ Deployment failed.');
    console.log('Make sure you are logged in: npx convex login');
    process.exit(1);
  }
});

deploy.on('error', (error) => {
  console.error('Failed to deploy:', error.message);
  process.exit(1);
});