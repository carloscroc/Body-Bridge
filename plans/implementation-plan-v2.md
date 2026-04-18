# Forge: Real Data Implementation Plan (v2)

> **Goal:** Replace all mock/hardcoded data with real Convex-backed data flows. Ship a fully functional fitness app with real users, real exercises, real workout tracking, and real social features.

---

## Guiding Principles

1. **Identity first** — every feature depends on knowing *who* the user is. Fix this before everything else.
2. **Server authority** — the backend owns truth. Client never sends user ID, author info, or ownership fields.
3. **No mock fallbacks** — if Convex returns empty, show an empty state. Never silently substitute fake data.
4. **One flow at a time** — each phase ends with a testable end-to-end flow, not a partial implementation.

---

## Phase 1: Trust & Identity :lock:

**Deliverable:** Every screen and mutation uses a single, consistent identity model derived server-side.

### 1A — Canonical identity mapping
- Document the identity contract: `AuthContext.user` = profile document (has `_id` = profile ID, `userId` = auth user ID)
- Create a shared `useCurrentUser()` hook that returns `{ profileId, userId, profile }` — single source of truth
- Replace all `user.profileId` references (CommunityView lines 811, 829, 841, 970, 1016) with `user._id` or the new hook
- Replace all raw `user._id` usage (WorkoutDetail lines 136, 146) with the new hook

**Files:** `src/services/AuthContext.tsx`, `src/screens/CommunityView.tsx`, `src/screens/WorkoutDetail.tsx`, new `src/hooks/useCurrentUser.ts`

### 1B — Server-side auth enforcement
- `createWorkoutLog` (convex/progress.ts): derive `userId` from `ctx.auth`, reject client-sent `userId`
- `createPost` (convex/social.ts): derive `authorId`/`authorName`/`authorAvatar`/`authorRole` from authenticated session
- `updatePlanItem`, `removeFromPlan`, `togglePlanItemStatus` (convex/userPlans.ts): verify `profileId` owns the plan item before mutating
- All mutations: replace any `v.any()` identity fields with proper types or server-derived values

**Files:** `convex/progress.ts`, `convex/social.ts`, `convex/userPlans.ts`, `convex/workouts.ts`

### 1C — Tighten validators (replace `v.any()`)
- `profiles.units` -> `v.object({ weight: v.string(), height: v.string(), distance: v.string() })`
- `profiles.subscription` -> proper subscription object
- Plan `item` payloads -> `v.union(workoutItem, mealItem)` or typed per `type` field
- Exercise arrays in workouts -> proper exercise validator
- Measurements in progress -> `v.object({ ... })`

**Files:** `convex/schema.ts`

**Risk:** High — identity bugs break everything
**Verification:** Sign up as new user -> complete onboarding -> create workout log -> verify correct profile ownership

---

## Phase 2: Real Data In, Mock Data Out :wastebasket:

**Deliverable:** Zero mock data in the app. All data comes from Convex or shows proper empty states.

### 2A — Seed real exercise library
- Expand the `seedExercises` mutation with 50+ real exercises covering all muscle groups
- Include: name, category, muscleGroup, primaryMuscles, secondaryMuscles, equipment, difficulty, instructions
- Ensure the seed is idempotent (safe to re-run)

**Files:** `convex/exercises.ts`

### 2B — Remove mock fallbacks
- `ExercisePicker.tsx` (line 117-121): remove `MOCK_EXERCISES` fallback, show "No exercises found" empty state
- `CommunityView.tsx` (line 738-749): remove `getProfileForName` with pravatar URLs, use real profile lookup
- `constants.tsx`: delete `MOCK_EXERCISES` array and `MOCK_MEMBERS` array (15 fake members)
- Any other hardcoded mock data references

**Files:** `src/components/ExercisePicker.tsx`, `src/screens/CommunityView.tsx`, `src/constants.tsx`

### 2C — Frontend type alignment
- `Exercise.agonistMuscles` -> align with Convex `primaryMuscles`/`secondaryMuscles`
- `Exercise.equipment: string` -> align with Convex `equipment: v.array(v.string())`
- `Workout` type: map `coach`, `intensity`, `kcal`, `focus`, `equipment`, `coachNotes` to Convex `workouts` table fields
- `Member` type: align `stats` with derived `getUserStats` shape
- `PlanItem.item: Meal | Workout | UserWorkout` -> properly typed based on `type` discriminator

**Files:** `src/types.ts`, any components reading these types

**Risk:** Medium — breaking existing UI is possible
**Verification:** Run app with seeded exercises -> browse exercises -> verify all display correctly. Delete all mock data -> verify empty states render.

---

## Phase 3: Workout Pipeline (Core Loop) :muscle:

**Deliverable:** Full workout lifecycle: create -> schedule -> execute -> log -> view history.

### 3A — Workout creation with real exercises
- `CreateWorkout.tsx`: verify it saves exercises as properly typed objects (not `v.any()`)
- `WorkoutBuilderWorkspace.tsx`: ensure exercise references point to real Convex exercise IDs
- Workouts saved with all required fields matching the Convex schema

**Files:** `src/components/CreateWorkout.tsx`, `src/components/WorkoutBuilderWorkspace.tsx`, `convex/workouts.ts`

### 3B — Plan scheduling
- `addToPlan` mutation: verify `item` payload matches tightened schema
- `HomeView` / `TodayView`: display real plan items from Convex
- Plan completion flow: `togglePlanItemStatus` works with proper ownership check

**Files:** `src/screens/HomeView.tsx`, `src/screens/TodayView.tsx`, `convex/userPlans.ts`

### 3C — Workout session & logging
- `WorkoutDetail.tsx`: session player uses real exercise data
- Completion flow: `createWorkoutLog` receives exercise results, saves with proper auth
- `getClientWorkoutLogs` / history views: display real logged workouts

**Files:** `src/screens/WorkoutDetail.tsx`, `convex/progress.ts`

**Risk:** Medium — core feature, must work end-to-end
**Verification:** Create workout with real exercises -> add to plan -> complete workout -> verify log appears in history

---

## Phase 4: Progress & Social (Engagement) :bar_chart:

**Deliverable:** Real stats, real progress tracking, real community interactions.

### 4A — Stats & progress
- `getUserStats` (convex/stats.ts): verify it correctly aggregates from `workoutLogs`
- `ProgressEntry` creation: save real measurements with proper types (no `v.any()`)
- `MembersView`: show real profiles with real stats derived from their workout logs
- Member detail: display workout history, streak, achievements from real data

**Files:** `convex/stats.ts`, `convex/progress.ts`, `src/screens/MembersView.tsx`

### 4B — Community (social)
- `createPost`: author info derived server-side (Phase 1B)
- `getPosts`: return posts with real author profiles
- `createComment` / `toggleLike`: use proper profileId from auth
- Remove all fake profile/avatar generation code
- Verify posts, comments, likes all persist correctly for real users

**Files:** `convex/social.ts`, `src/screens/CommunityView.tsx`

**Risk:** Medium — depends on Phase 1 identity fixes
**Verification:** As user A, create a post -> as user B, like and comment -> verify both see the interaction

---

## Phase 5: Ship-Ready :rocket:

**Deliverable:** Production-quality app ready for deployment.

### 5A — Notifications & settings
- `notifications.ts`: verify CRUD works with real user identities
- `SettingsView`: all profile fields editable and persisting
- `NotificationBell`: displays real notifications
- Account deletion flow (`convex/account.ts`) works end-to-end

**Files:** `convex/notifications.ts`, `src/screens/SettingsView.tsx`, `src/components/NotificationBell.tsx`

### 5B — Production hardening
- Error boundaries on all major screens
- Loading states for all Convex queries (no blank screens during fetch)
- Proper empty states (not mock data) for new users
- Onboarding flow creates profile with all required fields

**Files:** `src/App.tsx`, all screen components

### 5C — Deployment readiness
- Convex schema validates without warnings
- No `console.log` debug statements in production paths
- Environment variables documented
- Build succeeds cleanly (`npm run build`)

**Files:** Root config, `.env.example`, build pipeline

**Risk:** Low — polish phase
**Verification:** Fresh signup -> onboarding -> create workout -> complete workout -> post in community -> verify entire flow works on clean deployment

---

## Dependency Graph

```
Phase 1 (Identity) --+---> Phase 3 (Workouts) ---> Phase 4 (Progress & Social)
                      |
                      +---> Phase 2 (Real Data) ---> Phase 4
                      
Phase 5 (Ship-Ready) <--- depends on all above
```

- Phase 1 and Phase 2 can overlap (identity fixes + mock removal are independent)
- Phase 3 depends on Phase 1 (auth) and Phase 2 (real exercises)
- Phase 4 depends on Phase 1 (identity) and optionally Phase 3 (workout logs for stats)
- Phase 5 is last

## Estimated Effort

| Phase | Scope | Key Risk |
|-------|-------|----------|
| 1. Trust & Identity | ~15 files | Breaking existing auth flows |
| 2. Real Data In | ~5 files | Type mismatches breaking UI |
| 3. Workout Pipeline | ~6 files | Core loop must work perfectly |
| 4. Progress & Social | ~5 files | Multi-user interactions |
| 5. Ship-Ready | ~8 files | Polish, low risk |

## Changes from v1 Plan

- **10 phases -> 5 phases**: Consolidated related work. Each phase is larger but has a clearer deliverable.
- **Merged Phase 0+1**: No separate "tracking setup" phase — tracking happens as we go.
- **Merged exercise seeding + mock removal**: These are two sides of the same coin — you remove fake data and add real data.
- **Merged progress + social**: Both are "engagement" features that depend on identity being fixed.
- **Merged Phase 7-9 into Phase 5**: Notifications, settings, hardening, and deployment are all "ship-ready" polish.
