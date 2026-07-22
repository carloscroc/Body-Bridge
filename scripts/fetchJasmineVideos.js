#!/usr/bin/env node
/**
 * Script: Fetch specific exercise videos from Notion for Jasmine Hensley's 6 exercises
 */

import dotenv from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';

// Load environment variables
dotenv.config({ path: '.env.local' });

const NOTION_DATABASE_ID = 'dfe11066-43af-4297-9a97-05da2b4b384c';
const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const ADMIN_SECRET = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';
const NOTION_ACCESS_TOKEN = process.env.NOTION_ACCESS_TOKEN;

console.log('🔐 Using Notion Database:', NOTION_DATABASE_ID);
console.log('☁️  Convex URL:', CONVEX_URL);

if (!NOTION_ACCESS_TOKEN) {
  console.error('Error: NOTION_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// The 6 exercises we need to find videos for
const TARGET_EXERCISES = [
  'Goblet Squat',
  'Plank Hold',
  'Walking Lunge',
  'Bent-Over Row',
  'Overhead Press',
  'Romanian Deadlift'
];

// Notion API interaction
class NotionYoutubeFetcher {
  constructor(accessToken, databaseId) {
    this.accessToken = accessToken;
    this.databaseId = databaseId;
  }

  async fetchExercisesWithUrls() {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${this.databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.results.map((page) => this.mapPageToExerciseWithUrl(page));
  }

  mapPageToExerciseWithUrl(page) {
    const props = page.properties;
    const name = this.getTitleText(props.Name);
    const youtubeUrl = this.getUrlText(props['⭐Video']);

    return { name, youtubeUrl };
  }

  getTitleText(prop) {
    if (!prop?.title?.[0]?.plain_text) return '';
    return prop.title[0].plain_text;
  }

  getUrlText(prop) {
    if (!prop?.url) return '';
    return prop.url;
  }
}

// Convex interaction
class ConvexExerciseUpdater {
  constructor(client, adminSecret) {
    this.client = client;
    this.adminSecret = adminSecret;
  }

  async getAllExercises() {
    try {
      const exercises = await this.client.query('exercises:listForMigration', {
        adminSecret: this.adminSecret,
      });
      return exercises || [];
    } catch (error) {
      console.error('Error fetching exercises from Convex:', error);
      return [];
    }
  }

  async updateExerciseVideoUrl(exerciseId, videoUrl) {
    try {
      await this.client.mutation('exercises:updateVideoUrl', {
        exerciseId,
        videoUrl,
        adminSecret: this.adminSecret,
      });
      return true;
    } catch (error) {
      console.error(`Error updating exercise ${exerciseId}:`, error);
      return false;
    }
  }

  async findExerciseByName(name, exercises) {
    // Try exact match first
    const exactMatch = exercises.find(ex => ex.name.toLowerCase() === name.toLowerCase());
    if (exactMatch) return exactMatch._id;

    // Try partial match
    const partialMatch = exercises.find(ex =>
      ex.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(ex.name.toLowerCase())
    );
    if (partialMatch) return partialMatch._id;

    return null;
  }
}

// Main migration logic
async function migrateYoutubeUrls() {
  console.log('🚀 Starting YouTube URL migration for Jasmine Hensley\'s 6 exercises...');
  console.log(`📁 Notion Database: ${NOTION_DATABASE_ID}`);
  console.log(`☁️  Convex URL: ${CONVEX_URL}`);
  console.log('');

  try {
    // Initialize clients
    const notionFetcher = new NotionYoutubeFetcher(NOTION_ACCESS_TOKEN, NOTION_DATABASE_ID);
    const convexClient = new ConvexHttpClient(CONVEX_URL);
    const convexUpdater = new ConvexExerciseUpdater(convexClient, ADMIN_SECRET);

    // Step 1: Fetch exercises from Notion
    console.log('📥 Fetching exercises from Notion...');
    const notionExercises = await notionFetcher.fetchExercisesWithUrls();
    console.log(`✅ Found ${notionExercises.length} exercises in Notion`);

    // Filter for our 6 target exercises
    const targetNotionExercises = notionExercises.filter(ex =>
      TARGET_EXERCISES.some(target =>
        ex.name.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(ex.name.toLowerCase())
      )
    );
    console.log(`📋 Found ${targetNotionExercises.length} of our 6 target exercises in Notion`);
    console.log('');

    // Filter exercises that have YouTube URLs
    const exercisesWithUrls = targetNotionExercises.filter(ex => ex.youtubeUrl && ex.youtubeUrl.trim() !== '');
    console.log(`📹 ${exercisesWithUrls.length} target exercises have YouTube URLs`);
    if (exercisesWithUrls.length < targetNotionExercises.length) {
      console.log('⚠️  Missing videos for:');
      targetNotionExercises
        .filter(ex => !ex.youtubeUrl || ex.youtubeUrl.trim() === '')
        .forEach(ex => console.log(`   - "${ex.name}"`));
    }
    console.log('');

    // Step 2: Fetch existing exercises from Convex
    console.log('📥 Fetching existing exercises from Convex...');
    const convexExercises = await convexUpdater.getAllExercises();
    console.log(`✅ Found ${convexExercises.length} exercises in Convex`);
    console.log('');

    // Filter for Jasmine Hensley's exercises
    const jasmineExercises = convexExercises.filter(ex =>
      ex.trainerFirstName === 'Jasmine' &&
      ex.trainerLastName === 'Hensley'
    );
    console.log(`👩‍🏫 Found ${jasmineExercises.length} exercises for Jasmine Hensley`);
    console.log('');

    // Step 3: Match and update
    console.log('🔄 Matching and updating YouTube URLs...');

    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;
    const updateDetails = [];

    for (const notionExercise of exercisesWithUrls) {
      // Find matching Convex exercise by name
      const exercise = jasmineExercises.find(ex =>
        ex.name.toLowerCase() === notionExercise.name.toLowerCase() ||
        ex.name.toLowerCase().includes(notionExercise.name.toLowerCase()) ||
        notionExercise.name.toLowerCase().includes(ex.name.toLowerCase())
      );

      if (!exercise) {
        console.log(`⚠️  Not found in Convex: "${notionExercise.name}"`);
        notFound++;
        continue;
      }

      const exerciseId = exercise._id;

      // Check if URL is different
      if (exercise.videoUrl === notionExercise.youtubeUrl) {
        console.log(`⏭️  Skipped: "${notionExercise.name}" (URL already matches)`);
        skipped++;
        updateDetails.push({
          name: notionExercise.name,
          action: 'skipped',
          exerciseId,
          videoUrl: notionExercise.youtubeUrl
        });
        continue;
      }

      // Update the video URL
      const success = await convexUpdater.updateExerciseVideoUrl(
        exerciseId,
        notionExercise.youtubeUrl
      );

      if (success) {
        console.log(`✅ Updated: "${notionExercise.name}" → ${notionExercise.youtubeUrl}`);
        updated++;
        updateDetails.push({
          name: notionExercise.name,
          action: 'updated',
          exerciseId,
          videoUrl: notionExercise.youtubeUrl
        });
      } else {
        console.log(`❌ Error: "${notionExercise.name}"`);
        errors++;
        updateDetails.push({
          name: notionExercise.name,
          action: 'error',
          exerciseId,
          videoUrl: notionExercise.youtubeUrl
        });
      }
    }

    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already matched): ${skipped}`);
    console.log(`   ⚠️  Not found in Convex: ${notFound}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('');
    console.log('📋 Update Details:');
    updateDetails.forEach(detail => {
      const emoji = detail.action === 'updated' ? '✅' : detail.action === 'skipped' ? '⏭️' : '❌';
      console.log(`   ${emoji} ${detail.name} (${detail.exerciseId}): ${detail.videoUrl}`);
    });
    console.log('');
    console.log('🎉 Migration complete!');

    if (errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateYoutubeUrls();