# Schema Classification Report
## Body Bridge Exercise Schema Cleanup

Generated: 2026-07-20
Repository: C:\Users\thebe\Downloads\Body-Bridge

---

### EXERCISES TABLE (lines 83-140 in schema.ts)

#### Fields Classification:

| Field | Type | Classification | Rationale |
|-------|------|----------------|-----------|
| libraryId | v.string() | REQUIRED NOW | Unique identifier for canonical exercise |
| name | v.string() | REQUIRED NOW | Canonical exercise name |
| category | v.string() | REQUIRED NOW | Exercise category for filtering |
| muscleGroup | v.string() | REQUIRED NOW | Primary muscle group |
| primaryMuscles | v.array(v.string()) | REQUIRED NOW | List of primary muscles targeted |
| secondaryMuscles | v.array(v.string()) | REQUIRED NOW | List of secondary muscles targeted |
| equipment | v.array(v.string()) | REQUIRED NOW | Required equipment for exercise |
| overview | v.string() | REQUIRED NOW | Exercise description/overview |
| instructions | v.array(v.string()) | REQUIRED NOW | Step-by-step instructions |
| benefits | v.array(v.string()) | REQUIRED NOW | Exercise benefits |
| videoUrl | v.optional(v.string()) | OPTIONAL NOW | Canonical URL only if truly shared; trainer-specific goes to trainerExercises |
| imageUrl | v.optional(v.string()) | OPTIONAL NOW | Canonical cover image only if truly shared |
| imageMetadata | v.optional(v.any()) | OPTIONAL NOW | Image metadata |
| difficulty | v.union(...) | **LEGACY AND REMOVE** | Explicitly disallowed by requirements |
| sets | v.string() | REQUIRED NOW | Recommended sets |
| reps | v.string() | REQUIRED NOW | Recommended reps |
| tags | v.array(v.string()) | REQUIRED NOW | Exercise tags |
| tempo | v.optional(v.string()) | OPTIONAL NOW | Tempo instruction |
| rest | v.optional(v.string()) | OPTIONAL NOW | Rest period |
| weight | v.optional(v.string()) | OPTIONAL NOW | Weight guidance |
| notes | v.optional(v.string()) | OPTIONAL NOW | Additional notes |
| duration | v.optional(v.string()) | OPTIONAL NOW | Duration for timed exercises |
| distance | v.optional(v.string()) | OPTIONAL NOW | Distance for cardio exercises |
| rpe | v.optional(v.number()) | OPTIONAL NOW | Rate of Perceived Exertion |
| power | v.optional(v.string()) | OPTIONAL NOW | Power measurement |
| cadence | v.optional(v.string()) | OPTIONAL NOW | Cadence instruction |
| heartRate | v.optional(v.string()) | OPTIONAL NOW | Heart rate guidance |
| load | v.optional(v.string()) | OPTIONAL NOW | Load guidance |
| speed | v.optional(v.string()) | OPTIONAL NOW | Speed instruction |
| bpm | v.optional(v.number()) | OPTIONAL NOW | Beats per minute |
| calories | v.optional(v.number()) | OPTIONAL NOW | Estimated calories burned |
| metadata | v.optional(v.any()) | OPTIONAL NOW | Flexible metadata |
| coachId | v.optional(v.id("profiles")) | **LEGACY AND REMOVE** | Trainer-specific, belongs in trainerExercises |
| createdAt | v.optional(v.number()) | OPTIONAL NOW | Timestamp |
| difficultyOrder | v.optional(v.number()) | **LEGACY AND REMOVE** | Explicitly disallowed by requirements |
| workoutCount | v.optional(v.number()) | **UNCERTAIN** | Only used in notion.ts (set to 0), appears unused elsewhere |
| trainerFirstName | v.optional(v.string()) | **LEGACY AND REMOVE** | Trainer-specific, belongs in trainers table |
| trainerLastName | v.optional(v.string()) | **LEGACY AND REMOVE** | Trainer-specific, belongs in trainers table |
| sourceSystem | v.union(...) | **LEGACY AND REMOVE** | Move to trainerExercises for Notion import |
| sourceId | v.optional(v.string()) | **LEGACY AND REMOVE** | Move to trainerExercises for Notion import |
| isActive | v.optional(v.boolean()) | **LEGACY AND REMOVE** | trainerExercises.isActive handles visibility |

#### Indexes Classification:

| Index | Fields | Classification | Purpose |
|-------|--------|----------------|---------|
| by_libraryId | [libraryId] | REQUIRED NOW | Look up canonical exercise by library ID |
| by_category | [category] | REQUIRED NOW | Filter exercises by category |
| by_muscle | [muscleGroup] | REQUIRED NOW | Filter exercises by muscle group |
| by_name | [name] | REQUIRED NOW | Look up by name |
| by_workoutCount | [workoutCount] | **UNCERTAIN** | Only used in schema, no code references found |
| by_difficulty | [difficulty] | **LEGACY AND REMOVE** | Difficulty filtering - disallowed |
| by_difficulty_order | [difficultyOrder] | **LEGACY AND REMOVE** | Difficulty ordering - disallowed |
| by_difficultyOrder_name | [difficultyOrder, name] | **LEGACY AND REMOVE** | Composite difficulty ordering - disallowed |
| by_coach | [coachId] | **LEGACY AND REMOVE** | Coach-specific queries - use trainerExercises |
| by_trainer | [trainerFirstName, trainerLastName] | **LEGACY AND REMOVE** | Trainer-specific queries - use trainerExercises |
| by_source_system | [sourceSystem] | **LEGACY AND REMOVE** | Source filtering - move to trainerExercises |

#### Search Indexes:

| Search Index | Search Field | Filter Fields | Classification |
|--------------|--------------|---------------|----------------|
| search_name | name | [category, muscleGroup, difficulty, coachId] | **PARTIAL LEGACY** - need to remove difficulty and coachId from filterFields |

---

### TRAINERS TABLE (lines 142-156 in schema.ts)

#### Fields Classification:

| Field | Type | Classification | Rationale |
|-------|------|----------------|-----------|
| firstName | v.string() | REQUIRED NOW | Trainer first name |
| lastName | v.string() | REQUIRED NOW | Trainer last name |
| fullName | v.string() | REQUIRED NOW | Full name for display |
| email | v.optional(v.string()) | OPTIONAL NOW | Contact email |
| notionDatabaseId | v.optional(v.string()) | **KEEP** | Required for controlled Notion import |
| notionAccessToken | v.optional(v.string()) | **KEEP** | Required for controlled Notion import |
| profileId | v.optional(v.id("profiles")) | OPTIONAL NOW | Link to profile |
| createdAt | v.number() | REQUIRED NOW | Timestamp |
| updatedAt | v.number() | REQUIRED NOW | Last update timestamp |
| isActive | v.boolean() | REQUIRED NOW | Trainer active status |

#### Indexes:

| Index | Fields | Classification | Purpose |
|-------|--------|----------------|---------|
| by_fullName | [fullName] | REQUIRED NOW | Look up trainer by name |
| by_active | [isActive] | REQUIRED NOW | Find active trainers |
| by_profile | [profileId] | OPTIONAL NOW | Link to profile |

---

### TRAINEREXERCISES TABLE (lines 164-178 in schema.ts)

#### Fields Classification:

| Field | Type | Classification | Rationale |
|-------|------|----------------|-----------|
| trainerId | v.id("trainers") | REQUIRED NOW | Reference to trainer |
| exerciseId | v.id("exercises") | REQUIRED NOW | Reference to canonical exercise |
| videoUrl | v.string() | REQUIRED NOW | Trainer-specific playable URL |
| sourceType | v.optional(v.string()) | OPTIONAL NOW | Source type |
| notionPageId | v.optional(v.string()) | OPTIONAL NOW | Notion page reference |
| isActive | v.boolean() | REQUIRED NOW | Assignment active status |
| assignedAt | v.number() | REQUIRED NOW | Assignment timestamp |
| updatedAt | v.number() | REQUIRED NOW | Last update timestamp |
| sourceSystem | **MISSING** | **ADD** | Required for Notion import tracking |
| sourceId | **MISSING** | **ADD** | Required for Notion import tracking |

#### Indexes:

| Index | Fields | Classification | Purpose |
|-------|--------|----------------|---------|
| by_trainer | [trainerId] | REQUIRED NOW | Get all exercises for trainer |
| by_trainer_exercise | [trainerId, exerciseId] | REQUIRED NOW | **DUPLICATE PREVENTION** - ensures unique trainer-exercise pairs |
| by_exercise | [exerciseId] | REQUIRED NOW | Get all trainers for exercise |

---

### CODE REFERENCES TO REMOVED FIELDS:

#### exercises.ts:
- Lines 113-118, 246-248, 262: isActive filtering
- Lines 120-122, 199-201, 214-216, 226-228, 238-240, 264: sourceSystem filtering
- Lines 142-143, 257-258, 264: trainerFirstName/trainerLastName filtering
- Lines 56-60, 134, 161: difficulty filtering
- Lines 64, 89-98: coachId filtering
- Lines 391: difficultyOrder assignment in addExercise
- Lines 268-272: difficultyOrder sorting
- Lines 296: by_difficultyOrder_name index usage
- Lines 208: by_coach index usage
- Lines 255-259, 747-749: by_trainer index usage

#### notion.ts:
- Lines 134-135: trainerFirstName/trainerLastName in upsert
- Lines 250-253, 262, 285, 290: trainerFirstName/trainerLastName in listExercisesByTrainer and listAllTrainers
- Lines 136: sourceSystem assignment
- Lines 137: sourceId assignment
- Lines 111: difficulty assignment
- Lines 132: difficultyOrder calculation

---

### RECOMMENDED ACTIONS:

#### Remove from exercises schema:
1. trainerFirstName, trainerLastName (trainer-specific)
2. coachId (trainer-specific)
3. sourceSystem, sourceId (move to trainerExercises)
4. isActive (use trainerExercises.isActive)
5. difficulty, difficultyOrder (explicitly disallowed)
6. workoutCount (appears unused, set to 0 in notion.ts only)

#### Remove from exercises indexes:
1. by_trainer (trainerFirstName, trainerLastName)
2. by_coach (coachId)
3. by_difficulty (difficulty)
4. by_difficulty_order (difficultyOrder)
5. by_difficultyOrder_name (difficultyOrder, name)
6. by_source_system (sourceSystem)

#### Add to trainerExercises:
1. sourceSystem: v.optional(v.union(v.literal("notion"), v.literal("manual"), v.literal("import")))
2. sourceId: v.optional(v.string())

#### Keep in trainers:
1. notionDatabaseId, notionAccessToken (for controlled Notion import)

#### Code cleanup required:
1. Remove all trainerFirstName/trainerLastName filtering from exercises.ts
2. Remove all isActive filtering from exercises.ts (use trainerExercises.isActive)
3. Remove all sourceSystem filtering from exercises.ts
4. Remove difficulty from advancedSearch args and queries
5. Remove coachId from advancedSearch args
6. Remove difficultyOrder from addExercise
7. Update notion.ts to not set removed fields on exercises
8. Update Notion sync to create trainerExercises rows instead of setting trainer fields on exercises

---

### WORKOUTCOUNT DETERMINATION:

**Usage Analysis:**
- schema.ts: field defined (line 119)
- schema.ts: index by_workoutCount defined (line 133)
- notion.ts: set to 0 on insert (line 133)
- No other code references found

**Recommendation:** KEEP for now as OPTIONAL, document as unused field for future analytics. Can be removed in a separate cleanup if confirmed unnecessary.

---

### DUPLICATE PREVENTION VERIFICATION:

The trainerExercises table already has the required index:
- `by_trainer_exercise` on [trainerId, exerciseId] (line 177 in schema.ts)

The assignExerciseToTrainer mutation (trainerExercises.ts:235-301) already:
1. Queries by this index to find existing assignments
2. Updates if found, inserts if not
3. No additional application-level check needed

---

END OF REPORT