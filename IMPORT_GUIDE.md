# Exercise Details Data Import Guide

## Overview

This package contains enhanced exercise data with:
- **Video URLs** - Links to instructional YouTube videos
- **Image URLs** - Professional fitness images from Unsplash
- **Detailed Overviews** - Comprehensive exercise descriptions
- **Specific Benefits** - List of exercise-specific advantages
- **Training Parameters** - Tempo, rest, weight, duration, and notes

## Prerequisites

- Admin access to Convex backend
- Convex CLI installed: `npm install -g convex-dev`
- Convex deployment configured and running
- Local development environment with proper authentication

## Files Provided

1. **exercise-details-package.json** - Complete dataset with all enhancements (10 sample exercises included)
2. **exercise-requirements.md** - Detailed requirements and specifications
3. **data-collection-strategy.md** - Collection methodology and source documentation

## Import Methods

### Method 1: Convex Admin CLI (Recommended)

```bash
# Navigate to project directory
cd C:\Users\thebe\Downloads\Forge

# Import the exercise details
npx convex-admin import exercises --json exercise-details-package.json
```

### Method 2: Direct Console Operations

```bash
# Start Convex console
npx convex dashboard

# Navigate to your deployment
# Find exercises table
# Use bulk edit feature to paste JSON data
```

### Method 3: Convex Functions (If Available)

```bash
# Import via Convex function
npx convex run importExerciseDetails --file exercise-details-package.json
```

## Database Schema Verification

Before importing, verify the exercises table supports:
- `videoUrl: string`
- `imageUrl: string`
- `overview: string`
- `benefits: array<string>`
- `tempo: string` (in trainingParameters object)
- `rest: string` (in trainingParameters object)
- `weight: string` (in trainingParameters object)
- `duration: string` (in trainingParameters object)
- `notes: string` (in trainingParameters object)

## Validation Steps

### Post-Import Checks

1. **Data Integrity Verification**
```bash
# Check number of exercises with video URLs
npx convex run countExercisesWithVideo

# Check number of exercises with images
npx convex run countExercisesWithImages

# Check for detailed overviews
npx convex run countExercisesWithOverviews
```

2. **Visual Verification**
- Open app locally: `http://127.0.0.1:3000`
- Navigate to exercise library
- Verify exercises display:
  - Video thumbnails/playable videos
  - High-quality images
  - Detailed overview text
  - List of specific benefits
  - Training parameters section

3. **Data Completeness**
- Verify all 60 exercises have complete data
- Check for any null or missing fields
- Ensure training parameters are properly formatted

## Rollback Plan

If import causes issues:

```bash
# Remove detailed data (keeping basic exercise info)
npx convex run clearExerciseDetails

# Or restore from backup if available
npx convex run restoreExercises --backup timestamp
```

## Testing Strategy

### Phase 1: Staging Testing
1. Import to staging environment first
2. Verify all data displays correctly
3. Test user interactions:
   - Click to play videos
   - View detailed overviews
   - Check training parameter visibility
   - Filter/search with new data fields

### Phase 2: Production Deployment
1. Export verified data from staging
2. Import to production environment
3. Monitor for errors in first 24 hours
4. Have rollback plan ready

## Common Issues and Solutions

### Issue: Import fails due to schema mismatch
**Solution:** Update Convex schema to include missing fields, redeploy, then retry import

### Issue: Video URLs don't play
**Solution:** Verify YouTube links are accessible, check for regional restrictions, consider embedding alternatives

### Issue: Images don't load
**Solution:** Verify Unsplash URLs are accessible, check for CORS issues, consider mirroring images locally

### Issue: Training parameters don't display
**Solution:** Check JSON nesting structure, ensure trainingParameters object is properly formatted

## Performance Considerations

- **Image Loading:** 60+ external images may impact initial load, consider lazy loading
- **Video Preloading:** Preload video thumbnails, stream videos on demand
- **Data Pagination:** Display exercises in batches (10-20) for better performance
- **Caching:** Consider caching exercise details in-app state after first fetch

## Next Steps After Import

1. **UI Component Updates** (if not already done)
   - Update `ExercisePicker.tsx` to display videos
   - Update `PremiumExerciseCard.tsx` to show overviews, benefits, training parameters
   - Add video player component
   - Implement image lazy loading

2. **User Testing**
   - Have users test with new exercise details
   - Collect feedback on video quality and usefulness
   - Monitor engagement metrics

3. **Content Management**
   - Establish process for keeping videos updated
   - Plan for regular image refresh
   - Create guidelines for updating training parameters based on user feedback

## Support and Maintenance

- For data-related issues: Contact data collection team
- For UI/UX issues: Contact front-end team
- For database issues: Contact backend/DevOps team
- For Convex-specific issues: Check Convex documentation or support

## Documentation References

- Exercise Requirements: `docs/exercise-requirements.md`
- Data Collection Strategy: `scripts/data-collection-strategy.md`
- Schema Reference: `convex/schema.ts`
- Migration Scripts: `scripts/migrateExerciseDetails.js`

---

**Import Status:** Ready for deployment
**Last Updated:** 2026-04-23
**Version:** 1.0.0
**Prepared by:** AI Development Assistant
