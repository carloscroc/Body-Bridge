# Notion to Convex YouTube URL Migration

This script syncs YouTube video URLs from your Notion database to the Convex cloud database.

## Setup

### 1. Get Notion Integration Token

1. Go to [Notion My Integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Name it something like "Body Bridge Migration"
4. Select your workspace
5. Copy the "Internal Integration Token" (starts with `secret_`)

### 2. Connect Integration to Your Database

1. Go to your Notion database (ID: `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`)
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select your integration name
5. The integration should now show as "Connected"

### 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
NOTION_ACCESS_TOKEN=secret_your_integration_token_here
ADMIN_SCRIPT_SECRET=testsecret123
VITE_CONVEX_URL=https://groovy-pig-414.convex.cloud
```

## Running the Migration

```bash
node scripts/migrateNotionYoutubeUrls.js
```

## What It Does

1. **Fetches exercises from Notion** - Gets all exercises from your Notion database
2. **Extracts YouTube URLs** - Pulls the Video field URL from each exercise
3. **Matches with Convex** - Finds matching exercises in Convex by name (exact or partial match)
4. **Updates videoUrl field** - Only updates the videoUrl field, no other data is changed

## Expected Output

```
🚀 Starting YouTube URL migration from Notion to Convex Cloud...
📁 Notion Database: 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
☁️  Convex URL: https://groovy-pig-414.convex.cloud

📥 Fetching exercises from Notion...
✅ Found 50 exercises in Notion
📹 42 exercises have YouTube URLs

📥 Fetching existing exercises from Convex...
✅ Found 48 exercises in Convex

🔄 Matching and updating YouTube URLs...
✅ Updated: "Bench Press" → https://youtube.com/watch?v=example1
✅ Updated: "Squat" → https://youtube.com/watch?v=example2
⏭️  Skipped: "Deadlift" (URL already matches)
⚠️  Not found: "Lunges"
❌ Error: "Pull Ups"

📊 Migration Summary:
   ✅ Successfully updated: 38
   ⏭️  Skipped (already matched): 3
   ⚠️  Not found in Convex: 2
   ❌ Errors: 1

🎉 Migration complete!
```

## Troubleshooting

### "Notion API error: 401 Unauthorized"
- Check that your NOTION_ACCESS_TOKEN is correct
- Make sure you've connected the integration to your database (see step 2 above)

### "Exercise not found" errors
- This means some exercises in Notion don't have matching names in Convex
- Check the exercise names match exactly (or are very similar)
- Consider adding the missing exercises to Convex first

### "Unauthorized: admin secret required"
- Check that ADMIN_SCRIPT_SECRET is set in .env.local
- Default value is `testsecret123` for local development

## Notes

- The script only updates the `videoUrl` field in Convex
- No other exercise data is modified
- Existing video URLs that match are skipped
- The script uses the cloud Convex database, not local development
- After migration, the YouTube URLs will be available in the APK