# Database Seeding Guide

This directory contains seed scripts and data files for populating the database with all necessary data for Android app testing.

## Overview

The seeding process is organized into 8 modular scripts that run in a specific order to ensure data dependencies are satisfied:

1. **01-config.mjs** - API configuration and feature flags
2. **02-categories-tags.mjs** - Exercise categories and tags
3. **03-media-metadata.mjs** - Video and image metadata
4. **04-users-auth.mjs** - User profiles and authentication tokens
5. **05-exercises.mjs** - Exercises with category, tag, and media mappings
6. **06-localization.mjs** - UI strings, error messages, and exercise descriptions
7. **07-progress.mjs** - Exercise progress, workout sessions, achievements, and streaks
8. **08-test-data.mjs** - Sample workouts, notifications, and other test data

## Usage

### Run All Seed Scripts

To run all seed scripts in order:

```bash
node scripts/seed/seed-all.mjs
```

### Run Individual Seed Scripts

To run a specific seed script:

```bash
node scripts/seed/01-config.mjs
node scripts/seed/02-categories-tags.mjs
# ... etc
```

### Run with Convex Dev Server

The seed scripts will automatically start the Convex dev server if it's not already running. You can also start it manually:

```bash
npx convex dev
```

## Data Files

### Localization

Located in `scripts/data/localization/`:

- `en.json` - English strings
- `es.json` - Spanish strings

Add more language files as needed.

### Test Data

Located in `scripts/data/test-data/`:

- `test-data.json` - Sample users and progress data

## Data Entities

### User Profiles & Authentication
- User profiles with email, name, avatar, role
- User preferences (theme, language, notifications, units)
- Authentication tokens (access token, refresh token, expiry)

### Progress Records
- Exercise progress (completion date, score, attempts)
- Workout sessions (start/end time, duration, exercises completed)
- Achievements (unlocked date)
- Streaks (current streak, longest streak, last activity date)

### Categories & Tags
- Primary categories (Strength, Cardio, Flexibility, etc.)
- Subcategories (Chest, Back, Shoulders, Legs, Arms)
- Equipment tags (Dumbbell, Barbell, Machine, etc.)
- Muscle group tags (Pectorals, Lats, Triceps, etc.)
- Difficulty tags (Beginner, Intermediate, Advanced)

### Media Metadata
- Video metadata (title, URL, duration, thumbnail, subtitles)
- Image metadata (title, URL, alt text, dimensions)
- Thumbnail metadata (parent media, URL, dimensions)
- Subtitles (video ID, language, URL, format)

### API Configuration & Feature Flags
- API config (base URL, version, timeout, retry policy)
- Feature flags (feature name, enabled, description, rollout percentage)
- App settings (version, min supported version, maintenance mode)

### Localization Strings
- UI strings (navigation, buttons, messages, etc.)
- Error messages (error code, language, message, solution)
- Exercise descriptions (exercise ID, language, description, instructions)

### Test Seed Data
- Sample workouts (name, description, category, difficulty, duration, exercises)
- Notifications (user ID, type, title, message, read status)
- Workout-exercise mappings (workout ID, exercise ID, order, sets, reps)
- User workout favorites (user ID, workout ID, added date)

## Verification

After running the seed scripts, verify the data by:

1. Check that all tables are populated
2. Verify foreign key relationships are correct
3. Test that the Android app can fetch and display all data
4. Confirm that test users can authenticate
5. Validate that exercises display with categories and tags
6. Ensure media loads with metadata
7. Check that progress records persist correctly
8. Verify localization strings load for all supported languages
9. Confirm feature flags toggle correctly

## Adding New Data

To add new data:

1. Identify which seed script to modify
2. Add the new data to the appropriate array in the script
3. Run the specific seed script again
4. Verify the data appears correctly

## Troubleshooting

### Convex Server Not Starting

If the Convex dev server fails to start:

1. Check that port 3210 is not in use
2. Verify that Convex is installed: `npx convex --version`
3. Check the Convex logs for errors

### Seed Script Fails

If a seed script fails:

1. Check the error message for details
2. Verify that previous seed scripts have run successfully
3. Check that the Convex dev server is running
4. Review the script for any syntax errors

### Data Not Appearing

If seeded data doesn't appear:

1. Check the Convex database schema matches the seed script
2. Verify that the mutation/query paths are correct
3. Check for any validation errors in the data
4. Review the Convex logs for insertion errors

## Security Notes

- The seed scripts use the `ADMIN_SCRIPT_SECRET` environment variable
- Test users have simple passwords for testing purposes
- Authentication tokens are generated with reasonable expiry times
- Do not use these credentials in production

## Next Steps

After seeding the database:

1. Test the Android app with the seeded data
2. Verify all features work correctly
3. Add more test data as needed
4. Update seed scripts as the database schema evolves
5. Consider adding more languages to localization
6. Add more sample workouts and exercises
7. Create additional test scenarios

## Support

For issues or questions about the seeding process, refer to the main project documentation or create an issue in the repository.