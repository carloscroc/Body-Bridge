# Notion→Convex Exercise Integration Plan

## Overview
Integrate Notion database as a source for personal trainer exercises, with trainer tracking and multi-trainer support.

---

## Current System Analysis

### Database Schema (Convex)
- **`exercises` table**: Already has `coachId: v.optional(v.id("profiles"))` field
- **`profiles` table**: Has `authSource` ("trainer" or "client") + `fullName`
- **Existing filtering**: `advancedSearch` already supports `coachId` and `onlyMyExercises` filters

### Key Insight
The `coachId` field on exercises already provides trainer tracking. We need to:
1. Add trainer identification metadata
2. Create Notion→Convex sync pipeline
3. Add "hide existing" behavior (soft delete/archive flag)
4. Support trainer-specific exercise imports

---

## Phase 1: Database Schema Extensions

### 1.1 Add Trainer Identification to Exercises
**File**: `convex/schema.ts`

Add new fields to `exercises` table:

```typescript
trainerFirstName: v.optional(v.string()),  // e.g., "Jasmine"
trainerLastName: v.optional(v.string()),   // e.g., "Smith"
sourceSystem: v.optional(v.union(v.literal("notion"), v.literal("seed"), v.literal("manual"), v.literal("import"))),
sourceId: v.optional(v.string()),          // Notion page ID, external reference
isActive: v.boolean(),                      // Soft delete flag - new field
```

**Index additions**:
```typescript
.index("by_trainer_and_active", ["trainerFirstName", "trainerLastName", "isActive"])
.index("by_source_system", ["sourceSystem"])
```

### 1.2 Create Trainers Management Table
**File**: `convex/schema.ts`

```typescript
trainers: defineTable({
  firstName: v.string(),
  lastName: v.string(),
  fullName: v.string(),                    // "Jasmine Smith"
  email: v.optional(v.string()),           // Trainer contact
  notionDatabaseId: v.optional(v.string()),  // Notion database ID
  notionAccessToken: v.optional(v.string()), // Encrypted Notion API token
  profileId: v.optional(v.id("profiles")),  // Link to Convex profile if exists
  createdAt: v.number(),
  updatedAt: v.number(),
  isActive: v.boolean(),
})
  .index("by_fullName", ["fullName"])
  .index("by_active", ["isActive"])
  .index("by_profile", ["profileId"])
```

### 1.3 Data Migration
**Action**: Run Convex migration to add new fields and set defaults

```typescript
// convex/schema.ts migration
- Set `isActive: true` on all existing exercises
- Set `sourceSystem: "seed"` on all existing exercises
```

---

## Phase 2: Notion Integration Module

### 2.1 Create Notion Service
**File**: `convex/services/notionService.ts` (new file)

```typescript
// Notion API client with database operations
export class NotionExerciseService {
  constructor(
    private accessToken: string,
    private databaseId: string,
    private trainer: { firstName: string; lastName: string }
  ) {}

  // Fetch all exercises from Notion database
  async fetchExercises(): Promise<NotionExercise[]> {
    // Query Notion API
    // Map Notion properties to exercise schema
  }

  // Map Notion page to exercise
  private mapNotionPageToExercise(page: NotionPage): Exercise {
    return {
      name: page.properties.Name.title[0].plain_text,
      videoUrl: page.properties.Video?.url,
      instructions: page.properties.Instructions.rich_text.map(r => r.plain_text),
      // ... other mappings
      trainerFirstName: this.trainer.firstName,
      trainerLastName: this.trainer.lastName,
      sourceSystem: "notion",
      sourceId: page.id,
      isActive: true,
    };
  }
}
```

### 2.2 Notion Configuration
**File**: `convex/notion.ts` (new file)

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertTrainer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    notionDatabaseId: v.string(),
    notionAccessToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Create or update trainer record
    // Store encrypted Notion token
  },
});

export const syncNotionExercises = mutation({
  args: {
    trainerId: v.id("trainers"),
    forceResync: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Fetch trainer config
    // Call Notion API
    // Insert/update exercises with sourceSystem="notion"
    // Track sync timestamps
  },
});

export const listTrainers = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Return all trainers
  },
});
```

### 2.3 Environment Variables
**File**: `.env.local.example` and `.env.local`

```bash
# Notion Integration (per trainer)
NOTION_ACCESS_TOKEN=secret_*
NOTION_JASMINE_DATABASE_ID=abc123def456
```

---

## Phase 3: Exercise Display Logic

### 3.1 Modify advancedSearch Query
**File**: `convex/exercises.ts`

Update `advancedSearch` to support:

```typescript
args: {
  // ... existing args
  showInactive: v.optional(v.boolean()), // Default: false
  trainerName: v.optional(v.string()),   // "Jasmine Smith" for filtering
}

handler: async (ctx, args) => {
  // Add filter: isActive defaults to true (hide old exercises)
  // Add trainerName filter if provided
}
```

### 3.2 Add Trainer Exercise Filter
**File**: `convex/exercises.ts`

```typescript
export const getTrainerExercises = query({
  args: {
    trainerFirstName: v.string(),
    trainerLastName: v.string(),
  },
  handler: async (ctx, args) => {
    // Return exercises where trainer matches
    // Filter by isActive=true
  },
});
```

### 3.3 Frontend Exercise List Component Updates
**Files**: Frontend components displaying exercises

- Add trainer badge on exercise cards: "From Jasmine's library"
- Add trainer filter dropdown: "All Trainers", "Jasmine Smith", "Other..."
- Default to showing only `isActive=true` exercises

---

## Phase 4: Admin/Trainer Import Flow

### 4.1 Admin UI for Adding Trainers
**File**: `convex/admin.ts` (new file)

```typescript
export const createTrainerFromAdmin = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    notionDatabaseId: v.string(),
    notionAccessToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate admin session
    // Create trainer record
    // Run initial sync
  },
});
```

### 4.2 Initial Jasmine Setup
**Action**: Create Jasmine trainer record

```typescript
// One-time setup via Convex dashboard or admin script
await api.notion.upsertTrainer({
  firstName: "Jasmine",
  lastName: "Smith",
  email: "jasmine@example.com",
  notionDatabaseId: process.env.NOTION_JASMINE_DATABASE_ID,
  notionAccessToken: process.env.NOTION_ACCESS_TOKEN,
});
```

### 4.3 Sync Triggers
**Options**:
- Manual: Admin clicks "Sync Now" button
- Scheduled: Cron job every 6 hours
- Webhook: Notion webhook on database changes

---

## Phase 5: Testing with Real Trainer (Jasmine)

### 5.1 Notion Database Setup
**Notion Database Schema** (for Jasmine):

| Property | Type | Example |
|----------|------|---------|
| Name | Title | "Squat Jumps" |
| Video | URL | "https://youtube.com/watch?v=..." |
| Instructions | Rich Text | Multi-step instructions |
| Equipment | Multi-select | ["Barbell", "Jump Box"] |
| Primary Muscles | Multi-select | ["Quadriceps", "Glutes"] |
| Secondary Muscles | Multi-select | ["Calves"] |
| Difficulty | Select | "Intermediate" |
| Sets | Number | 3 |
| Reps | Number | 12 |
| Rest (seconds) | Number | 60 |
| Category | Select | "Power" |

### 5.2 Test Procedure
1. **Add sample exercises** to Jasmine's Notion database
2. **Run sync**: `api.notion.syncNotionExercises({ trainerId: jasmineTrainerId })`
3. **Verify in app**: Exercises appear in exercise library
4. **Check trainer badge**: "From Jasmine's library" displayed
5. **Test filtering**: Filter by "Jasmine Smith" shows only her exercises
6. **Hide existing**: Old exercises not visible (isActive=false on migration)

### 5.3 Test Cases
- [ ] Sync adds new exercises from Notion
- [ ] Sync updates existing exercises (based on sourceId match)
- [ ] Old exercises (sourceSystem="seed") are hidden by default
- [ ] Can view all exercises with admin override
- [ ] Trainer filter works correctly
- [ ] Multiple trainers don't conflict

---

## Phase 6: Multi-Trainer Support

### 6.1 Add Second Trainer
Repeat Phase 4 and 5 for additional trainers:
1. Create trainer record
2. Configure Notion database
3. Run sync
4. Verify isolation

### 6.2 Exercise Attribution Display
**UI Updates**:
- Exercise card: "From [First Last]'s library"
- Search filter: "All Trainers" → "Jasmine Smith" → "Mike Johnson" → ...
- Admin view: See sourceSystem, sourceId for each exercise

---

## Implementation Order

1. **Week 1**: Phase 1 (Schema + Migration)
2. **Week 2**: Phase 2 (Notion Integration Module)
3. **Week 3**: Phase 3 (Display Logic + Frontend)
4. **Week 4**: Phase 4 (Admin Flow + Jasmine Setup)
5. **Week 5**: Phase 5 (Testing with Jasmine)
6. **Week 6**: Phase 6 (Multi-Trainer + Polish)

---

## Success Criteria

- ✅ Jasmine's Notion exercises sync to Convex automatically
- ✅ Exercises show "From Jasmine's library" badge
- ✅ Old exercises (seed data) are hidden by default
- ✅ Admin can still see/archive old exercises
- ✅ Multiple trainers can have separate exercise libraries
- ✅ Trainer filter isolates exercises correctly
- ✅ Sync is idempotent (can run multiple times safely)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Notion API rate limits | Implement pagination, sync in batches |
| Schema conflicts | Add fields as optional, use migration |
| Notion database structure changes | Use flexible mapping, validate before sync |
| Token security | Encrypt Notion tokens, store in environment |
| Sync conflicts | Use sourceId to identify updates vs inserts |

---

## Next Steps

1. **Confirm Notion database structure** with Jasmine
2. **Set up Notion integration token** and database ID
3. **Review and approve this plan**
4. **Begin Phase 1 implementation**