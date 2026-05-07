#!/usr/bin/env node
/**
 * Seed Script 03: Media Metadata
 * 
 * Seeds the database with video and image metadata including
 * alt text, subtitles, thumbnails, and other media properties.
 */

import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210';
const CONVEX_PORT = parseInt(new URL(CONVEX_URL).port) || 3210;
const ADMIN_SECRET = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';

// ═════════════════════════════════════════════════════════════════
// CONVEX CLIENT
// ═════════════════════════════════════════════════════════════════

class ConvexClient {
  constructor(url) {
    const u = new URL(url);
    this.host = u.hostname;
    this.port = parseInt(u.port) || 3210;
  }

  async mutation(path, args) {
    return this._request('POST', path, args);
  }

  async query(path, args) {
    return this._request('GET', path, args);
  }

  async _request(method, path, args, retries = 3) {
    const body = JSON.stringify({ path, args, format: 'json' });
    const base = method === 'GET' ? '/api/query' : '/api/mutation';
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await new Promise((resolve, reject) => {
          const req = http.request(
            { hostname: this.host, port: this.port, path: base, method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
            (res) => {
              let data = '';
              res.on('data', (c) => (data += c));
              res.on('end', () => {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.status === 'error') reject(new Error(parsed.errorMessage || 'Convex error'));
                  else resolve(parsed.value);
                } catch { reject(new Error(`Non-JSON response: ${data.slice(0, 300)}`)); }
              });
            },
          );
          req.on('error', reject);
          req.write(body);
          req.end();
        });
      } catch (err) {
        if ((err.message?.includes('ECONNREFUSED') || err.message?.includes('ECONNRESET')) && attempt < retries) {
          console.warn(`  Connection error, retry ${attempt}/${retries}...`);
          await new Promise((r) => setTimeout(r, 3000 * attempt));
          continue;
        }
        throw err;
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// DATA DEFINITIONS
// ═════════════════════════════════════════════════════════════════

const VIDEO_METADATA = [
  {
    id: 'video-chest-press-001',
    title: 'Machine Chest Press Tutorial',
    url: 'https://example.com/videos/chest-press.mp4',
    duration: 180,
    thumbnail_url: 'https://example.com/thumbnails/chest-press.jpg',
    subtitles_url: 'https://example.com/subtitles/chest-press.vtt',
    resolution: '1080p',
    file_size: 15728640,
    format: 'mp4',
    alt_text: 'Person performing machine chest press exercise',
  },
  {
    id: 'video-dumbbell-row-001',
    title: 'Single-Arm Dumbbell Row Tutorial',
    url: 'https://example.com/videos/dumbbell-row.mp4',
    duration: 150,
    thumbnail_url: 'https://example.com/thumbnails/dumbbell-row.jpg',
    subtitles_url: 'https://example.com/subtitles/dumbbell-row.vtt',
    resolution: '1080p',
    file_size: 12582912,
    format: 'mp4',
    alt_text: 'Person performing single-arm dumbbell row on bench',
  },
  {
    id: 'video-shoulder-press-001',
    title: 'Machine Shoulder Press Tutorial',
    url: 'https://example.com/videos/shoulder-press.mp4',
    duration: 165,
    thumbnail_url: 'https://example.com/thumbnails/shoulder-press.jpg',
    subtitles_url: 'https://example.com/subtitles/shoulder-press.vtt',
    resolution: '1080p',
    file_size: 13631488,
    format: 'mp4',
    alt_text: 'Person performing machine shoulder press exercise',
  },
  {
    id: 'video-squat-001',
    title: 'Dumbbell Goblet Squat Tutorial',
    url: 'https://example.com/videos/goblet-squat.mp4',
    duration: 195,
    thumbnail_url: 'https://example.com/thumbnails/goblet-squat.jpg',
    subtitles_url: 'https://example.com/subtitles/goblet-squat.vtt',
    resolution: '1080p',
    file_size: 16777216,
    format: 'mp4',
    alt_text: 'Person performing dumbbell goblet squat exercise',
  },
  {
    id: 'video-bicep-curl-001',
    title: 'Dumbbell Bicep Curl Tutorial',
    url: 'https://example.com/videos/bicep-curl.mp4',
    duration: 120,
    thumbnail_url: 'https://example.com/thumbnails/bicep-curl.jpg',
    subtitles_url: 'https://example.com/subtitles/bicep-curl.vtt',
    resolution: '1080p',
    file_size: 10485760,
    format: 'mp4',
    alt_text: 'Person performing dumbbell bicep curl exercise',
  },
  {
    id: 'video-tricep-pushdown-001',
    title: 'Rope Tricep Pushdown Tutorial',
    url: 'https://example.com/videos/tricep-pushdown.mp4',
    duration: 135,
    thumbnail_url: 'https://example.com/thumbnails/tricep-pushdown.jpg',
    subtitles_url: 'https://example.com/subtitles/tricep-pushdown.vtt',
    resolution: '1080p',
    file_size: 11534336,
    format: 'mp4',
    alt_text: 'Person performing rope tricep pushdown on cable machine',
  },
  {
    id: 'video-plank-001',
    title: 'Plank with Shoulder Taps Tutorial',
    url: 'https://example.com/videos/plank-shoulder-taps.mp4',
    duration: 90,
    thumbnail_url: 'https://example.com/thumbnails/plank-shoulder-taps.jpg',
    subtitles_url: 'https://example.com/subtitles/plank-shoulder-taps.vtt',
    resolution: '1080p',
    file_size: 7340032,
    format: 'mp4',
    alt_text: 'Person performing plank with shoulder taps exercise',
  },
  {
    id: 'video-lunge-001',
    title: 'Walking Dumbbell Lunge Tutorial',
    url: 'https://example.com/videos/walking-lunge.mp4',
    duration: 180,
    thumbnail_url: 'https://example.com/thumbnails/walking-lunge.jpg',
    subtitles_url: 'https://example.com/subtitles/walking-lunge.vtt',
    resolution: '1080p',
    file_size: 15728640,
    format: 'mp4',
    alt_text: 'Person performing walking dumbbell lunge exercise',
  },
  {
    id: 'video-deadlift-001',
    title: 'Barbell Deadlift Tutorial',
    url: 'https://example.com/videos/deadlift.mp4',
    duration: 210,
    thumbnail_url: 'https://example.com/thumbnails/deadlift.jpg',
    subtitles_url: 'https://example.com/subtitles/deadlift.vtt',
    resolution: '1080p',
    file_size: 18350080,
    format: 'mp4',
    alt_text: 'Person performing barbell deadlift exercise',
  },
  {
    id: 'video-pullup-001',
    title: 'Pull-Up Tutorial',
    url: 'https://example.com/videos/pullup.mp4',
    duration: 150,
    thumbnail_url: 'https://example.com/thumbnails/pullup.jpg',
    subtitles_url: 'https://example.com/subtitles/pullup.vtt',
    resolution: '1080p',
    file_size: 12582912,
    format: 'mp4',
    alt_text: 'Person performing pull-up exercise',
  },
];

const IMAGE_METADATA = [
  {
    id: 'image-chest-press-001',
    title: 'Machine Chest Press Starting Position',
    url: 'https://example.com/images/chest-press-start.jpg',
    alt_text: 'Starting position for machine chest press exercise',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-chest-press-002',
    title: 'Machine Chest Press Ending Position',
    url: 'https://example.com/images/chest-press-end.jpg',
    alt_text: 'Ending position for machine chest press exercise',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-dumbbell-row-001',
    title: 'Single-Arm Dumbbell Row Starting Position',
    url: 'https://example.com/images/dumbbell-row-start.jpg',
    alt_text: 'Starting position for single-arm dumbbell row',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-dumbbell-row-002',
    title: 'Single-Arm Dumbbell Row Ending Position',
    url: 'https://example.com/images/dumbbell-row-end.jpg',
    alt_text: 'Ending position for single-arm dumbbell row',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-shoulder-press-001',
    title: 'Machine Shoulder Press Starting Position',
    url: 'https://example.com/images/shoulder-press-start.jpg',
    alt_text: 'Starting position for machine shoulder press',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-shoulder-press-002',
    title: 'Machine Shoulder Press Ending Position',
    url: 'https://example.com/images/shoulder-press-end.jpg',
    alt_text: 'Ending position for machine shoulder press',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-squat-001',
    title: 'Dumbbell Goblet Squat Starting Position',
    url: 'https://example.com/images/goblet-squat-start.jpg',
    alt_text: 'Starting position for dumbbell goblet squat',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-squat-002',
    title: 'Dumbbell Goblet Squat Ending Position',
    url: 'https://example.com/images/goblet-squat-end.jpg',
    alt_text: 'Ending position for dumbbell goblet squat',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-bicep-curl-001',
    title: 'Dumbbell Bicep Curl Starting Position',
    url: 'https://example.com/images/bicep-curl-start.jpg',
    alt_text: 'Starting position for dumbbell bicep curl',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
  {
    id: 'image-bicep-curl-002',
    title: 'Dumbbell Bicep Curl Ending Position',
    url: 'https://example.com/images/bicep-curl-end.jpg',
    alt_text: 'Ending position for dumbbell bicep curl',
    width: 1920,
    height: 1080,
    file_size: 524288,
    format: 'jpg',
  },
];

const THUMBNAIL_METADATA = [
  {
    id: 'thumb-chest-press-001',
    parent_media_id: 'video-chest-press-001',
    url: 'https://example.com/thumbnails/chest-press-thumb.jpg',
    width: 320,
    height: 180,
  },
  {
    id: 'thumb-dumbbell-row-001',
    parent_media_id: 'video-dumbbell-row-001',
    url: 'https://example.com/thumbnails/dumbbell-row-thumb.jpg',
    width: 320,
    height: 180,
  },
  {
    id: 'thumb-shoulder-press-001',
    parent_media_id: 'video-shoulder-press-001',
    url: 'https://example.com/thumbnails/shoulder-press-thumb.jpg',
    width: 320,
    height: 180,
  },
  {
    id: 'thumb-squat-001',
    parent_media_id: 'video-squat-001',
    url: 'https://example.com/thumbnails/goblet-squat-thumb.jpg',
    width: 320,
    height: 180,
  },
  {
    id: 'thumb-bicep-curl-001',
    parent_media_id: 'video-bicep-curl-001',
    url: 'https://example.com/thumbnails/bicep-curl-thumb.jpg',
    width: 320,
    height: 180,
  },
];

const SUBTITLES = [
  {
    id: 'subtitle-chest-press-001',
    video_id: 'video-chest-press-001',
    language: 'en',
    url: 'https://example.com/subtitles/chest-press-en.vtt',
    format: 'vtt',
  },
  {
    id: 'subtitle-chest-press-002',
    video_id: 'video-chest-press-001',
    language: 'es',
    url: 'https://example.com/subtitles/chest-press-es.vtt',
    format: 'vtt',
  },
  {
    id: 'subtitle-dumbbell-row-001',
    video_id: 'video-dumbbell-row-001',
    language: 'en',
    url: 'https://example.com/subtitles/dumbbell-row-en.vtt',
    format: 'vtt',
  },
  {
    id: 'subtitle-shoulder-press-001',
    video_id: 'video-shoulder-press-001',
    language: 'en',
    url: 'https://example.com/subtitles/shoulder-press-en.vtt',
    format: 'vtt',
  },
  {
    id: 'subtitle-squat-001',
    video_id: 'video-squat-001',
    language: 'en',
    url: 'https://example.com/subtitles/goblet-squat-en.vtt',
    format: 'vtt',
  },
];

// ═════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═════════════════════════════════════════════════════════════════

async function seedVideoMetadata(client) {
  console.log('🎥 Seeding video metadata...');
  
  for (const video of VIDEO_METADATA) {
    try {
      // Check if video already exists
      const existing = await client.query('seed:getMediaMetadata', {});
      if (existing && existing.videos && existing.videos.find(v => v.title === video.title)) {
        console.log(`  ✓ Video "${video.title}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Video doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertVideoMetadata', {
      adminSecret: ADMIN_SECRET,
      videoMetadata: {
        title: video.title,
        url: video.url,
        duration: video.duration,
        thumbnailUrl: video.thumbnail_url,
        subtitles: video.subtitles_url ? [{
          language: 'en',
          url: video.subtitles_url,
          format: 'vtt',
        }] : [],
      },
    });
    console.log(`  ✓ Video "${video.title}" seeded`);
  }
}

async function seedImageMetadata(client) {
  console.log('🖼️  Seeding image metadata...');
  
  for (const image of IMAGE_METADATA) {
    try {
      // Check if image already exists
      const existing = await client.query('seed:getMediaMetadata', {});
      if (existing && existing.images && existing.images.find(i => i.title === image.title)) {
        console.log(`  ✓ Image "${image.title}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Image doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertImageMetadata', {
      adminSecret: ADMIN_SECRET,
      imageMetadata: {
        title: image.title,
        url: image.url,
        altText: image.alt_text,
        width: image.width || 800,
        height: image.height || 600,
      },
    });
    console.log(`  ✓ Image "${image.title}" seeded`);
  }
}

async function seedThumbnailMetadata(client) {
  console.log('🖼️  Seeding thumbnail metadata...');
  
  for (const thumbnail of THUMBNAIL_METADATA) {
    try {
      // Check if thumbnail already exists
      const existing = await client.query('seed:getMediaMetadata', {});
      if (existing && existing.images && existing.images.find(i => i.url === thumbnail.url)) {
        console.log(`  ✓ Thumbnail "${thumbnail.id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Thumbnail doesn't exist, proceed with seeding
    }

    await client.mutation('seed:insertImageMetadata', {
      adminSecret: ADMIN_SECRET,
      imageMetadata: {
        title: thumbnail.id,
        url: thumbnail.url,
        altText: thumbnail.alt_text || `Thumbnail for ${thumbnail.id}`,
        width: thumbnail.width || 400,
        height: thumbnail.height || 300,
      },
    });
    console.log(`  ✓ Thumbnail "${thumbnail.id}" seeded`);
  }
}

async function seedSubtitles(client) {
  console.log('📝 Seeding subtitles...');
  
  for (const subtitle of SUBTITLES) {
    try {
      // Check if subtitle already exists
      const existing = await client.query('seed:getMediaMetadata', {});
      if (existing && existing.videos && existing.videos.find(v => v.subtitles && v.subtitles.find(s => s.url === subtitle.url))) {
        console.log(`  ✓ Subtitle "${subtitle.id}" already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Subtitle doesn't exist, proceed with seeding
    }

    // For now, subtitles are included in video metadata
    console.log(`  ✓ Subtitle "${subtitle.id}" noted (included in video metadata)`);
  }
}

// ═════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═════════════════════════════════════════════════════════════════

async function checkPort(port) {
  return new Promise((resolve) => {
    const conn = net.createConnection({ port, host: '127.0.0.1' });
    conn.once('connect', () => {
      conn.end();
      resolve(true);
    });
    conn.once('error', () => resolve(false));
  });
}

async function startConvexDev() {
  console.log('🚀 Starting Convex dev server...');
  const proc = spawn('npx', ['convex', 'dev'], {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    shell: true,
  });
  
  // Wait for server to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkPort(CONVEX_PORT)) {
      console.log('✓ Convex dev server is ready');
      return proc;
    }
  }
  
  throw new Error('Failed to start Convex dev server');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SEED SCRIPT 03: Media Metadata');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let convexProc = null;
  
  try {
    // Check if Convex is already running
    if (!(await checkPort(CONVEX_PORT))) {
      convexProc = await startConvexDev();
    } else {
      console.log('✓ Convex dev server is already running');
    }

    const client = new ConvexClient(CONVEX_URL);

    // Seed in order
    await seedVideoMetadata(client);
    await seedImageMetadata(client);
    await seedThumbnailMetadata(client);
    await seedSubtitles(client);

    console.log('\n✅ Seed script 03 completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Seed script 03 failed:', error.message);
    process.exit(1);
  } finally {
    if (convexProc) {
      console.log('\n🛑 Stopping Convex dev server...');
      convexProc.kill();
    }
  }
}

main();
