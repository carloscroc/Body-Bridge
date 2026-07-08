#!/usr/bin/env node
/**
 * Migration: Populate trainer data on exercises
 * 
 * This script assigns all exercises to "Jasmine Hensley" and sets them as active.
 * This fixes the "exercises:advancedSearch" error that occurs when filtering by trainer name.
 */

import dotenv from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://localhost:3210';
const ADMIN_SECRET = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';

console.log('☁️  Convex URL:', CONVEX_URL);
console.log('═══════════════════════════════════════════════════════════════');
console.log('MIGRATION: Populate Trainer Data on Exercises');
console.log('═══════════════════════════════════════════════════════════════\n');

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Step 1: Get all exercises
    console.log('📥 Fetching all exercises from Convex...');
    const exercises = await client.query('exercises:listForMigration', {
      adminSecret: ADMIN_SECRET,
    });

    console.log(`✅ Found ${exercises.length} exercises\n`);

    // Step 2: Check how many already have trainer data
    const withTrainerData = exercises.filter(
      ex => ex.trainerFirstName && ex.trainerLastName
    );
    const withoutTrainerData = exercises.filter(
      ex => !ex.trainerFirstName || !ex.trainerLastName
    );
    const inactiveExercises = exercises.filter(ex => !ex.isActive);

    console.log(`📊 Current state:`);
    console.log(`   - Exercises with trainer data: ${withTrainerData.length}`);
    console.log(`   - Exercises without trainer data: ${withoutTrainerData.length}`);
    console.log(`   - Inactive exercises: ${inactiveExercises.length}\n`);

    if (withoutTrainerData.length === 0 && inactiveExercises.length === 0) {
      console.log('✅ All exercises already have trainer data and are active!');
      console.log('═══════════════════════════════════════════════════════════════');
      return;
    }

    // Step 3: Update exercises without trainer data
    console.log('🔄 Updating exercises with trainer data...\n');

    let updated = 0;
    let errors = 0;

    for (const exercise of withoutTrainerData) {
      try {
        await client.mutation('exercises:updateTrainerData', {
          adminSecret: ADMIN_SECRET,
          exerciseId: exercise._id,
          trainerFirstName: 'Jasmine',
          trainerLastName: 'Hensley',
          isActive: true,
        });

        console.log(`✅ Updated: "${exercise.name}" → Jasmine Hensley`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating "${exercise.name}":`, error.message);
        errors++;
      }
    }

    // Step 4: Activate inactive exercises
    console.log('\n🔄 Activating inactive exercises...\n');

    for (const exercise of inactiveExercises) {
      try {
        await client.mutation('exercises:updateTrainerData', {
          adminSecret: ADMIN_SECRET,
          exerciseId: exercise._id,
          trainerFirstName: exercise.trainerFirstName || 'Jasmine',
          trainerLastName: exercise.trainerLastName || 'Hensley',
          isActive: true,
        });

        console.log(`✅ Activated: "${exercise.name}"`);
        updated++;
      } catch (error) {
        console.error(`❌ Error activating "${exercise.name}":`, error.message);
        errors++;
      }
    }

    // Step 5: Verify the updates
    console.log('\n📥 Fetching updated exercises...');
    const updatedExercises = await client.query('exercises:listForMigration', {
      adminSecret: ADMIN_SECRET,
    });

    const withTrainerDataAfter = updatedExercises.filter(
      ex => ex.trainerFirstName && ex.trainerLastName
    );
    const activeAfter = updatedExercises.filter(ex => ex.isActive);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   ✅ Successfully updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📈 Exercises with trainer data: ${withTrainerDataAfter.length}/${updatedExercises.length}`);
    console.log(`   ✅ Active exercises: ${activeAfter.length}/${updatedExercises.length}`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (errors > 0) {
      console.error('\n❌ Migration completed with errors!');
      process.exit(1);
    }

    console.log('\n🎉 Migration completed successfully!');

    // Test the filter
    console.log('\n🧪 Testing trainer filter...');
    const jasmineExercises = await client.query('exercises:getJasmineExercises', {});
    console.log(`✅ Found ${jasmineExercises.page.length} exercises for Jasmine Hensley`);

    if (jasmineExercises.page.length === 0) {
      console.warn('⚠️  Warning: No exercises returned for Jasmine Hensley filter!');
    } else {
      console.log('✅ Trainer filter is working correctly!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();