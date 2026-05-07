#!/usr/bin/env node
/**
 * Seed Orchestrator
 * 
 * Runs all seed scripts in the correct order to populate the database
 * with all necessary data for Android app testing.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SEED_SCRIPTS = [
  '01-config.mjs',
  '02-categories-tags.mjs',
  '03-media-metadata.mjs',
  '04-users-auth.mjs',
  '05-exercises.mjs',
  '06-localization.mjs',
  '07-progress.mjs',
  '08-test-data.mjs',
];

async function runScript(scriptName) {
  console.log(`\n🔄 Running ${scriptName}...`);
  console.log('─'.repeat(50));
  
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [path.join(__dirname, scriptName)], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with code ${code}`);
        reject(new Error(`Script ${scriptName} failed`));
      }
    });
    
    proc.on('error', (err) => {
      console.error(`❌ ${scriptName} error:`, err.message);
      reject(err);
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATABASE SEEDING ORCHESTRATOR');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📋 Running seed scripts in order:');
  SEED_SCRIPTS.forEach((script, index) => {
    console.log(`  ${index + 1}. ${script}`);
  });
  console.log('─'.repeat(50));
  
  const startTime = Date.now();
  
  try {
    for (const script of SEED_SCRIPTS) {
      await runScript(script);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(50));
    console.log('✅ ALL SEED SCRIPTS COMPLETED SUCCESSFULLY!');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('\n' + '═'.repeat(50));
    console.error('❌ SEEDING FAILED!');
    console.error('═'.repeat(50));
    console.error(error);
    process.exit(1);
  }
}

main();
