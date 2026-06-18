# Plan 005: Replace getEngagementTrend's O(days×3) table scans with a single aggregate query

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1043760..HEAD -- convex/social.ts convex/schema.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a1043760`, 2026-06-18

## Why this matters

`getEngagementTrend` in `convex/social.ts` (lines 1079-1148) fires 3 separate full-table `.collect()` calls per day in a loop. For a 30-day trend, that's 90 queries, each scanning the entire `socialPosts`, `socialLikes`, or `socialComments` table and filtering by `_creationTime` in JavaScript. At scale, this will time out or exceed Convex's query limits. The same file's `getCommunityAnalytics` (lines 934-1077) has a related problem — it loads 5 entire tables into memory simultaneously.

This plan replaces the per-day loop with a single query per table, then aggregates in JavaScript using the already-fetched data.

## Current state

`convex/social.ts:1079-1148` — current `getEngagementTrend`:
```typescript
export const getEngagementTrend = query({
  args: { days: v.number() },
  // ... returns v.array(...)
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const trend = [];

    for (let i = args.days - 1; i >= 0; i--) {
      const date = new Date(now - i * oneDay);
      const startOfDay = Math.floor(date.getTime() / oneDay) * oneDay;
      const endOfDay = startOfDay + oneDay;

      // Posts — FULL TABLE SCAN per day
      const dayPosts = await ctx.db
        .query("socialPosts")
        .filter((q) => q.and(
          q.gte(q.field("_creationTime"), startOfDay),
          q.lt(q.field("_creationTime"), endOfDay)
        ))
        .collect();

      // Likes — FULL TABLE SCAN per day
      const dayLikes = await ctx.db
        .query("socialLikes")
        .filter((q) => q.and(
          q.gte(q.field("_creationTime"), startOfDay),
          q.lt(q.field("_creationTime"), endOfDay)
        ))
        .collect();

      // Comments — FULL TABLE SCAN per day
      const dayComments = await ctx.db
        .query("socialComments")
        .filter((q) => q.and(
          q.gte(q.field("_creationTime"), startOfDay),
          q.lt(q.field("_creationTime"), endOfDay)
        ))
        .collect();

      // ... push aggregated data ...
    }
    return trend;
  },
});
```

**Convention**: Other queries in this file use `.withIndex(...)` and `.paginate(...)`. The `getPosts` query (lines 9-68) is a good exemplar of paginated, indexed access. However, for analytics, we need all data in a date range — pagination isn't suitable. The fix fetches each table once (using `_creationTime` filter on a single range) and groups in JS.

## Commands you will need

| Purpose      | Command                                          | Expected on success           |
|--------------|--------------------------------------------------|-------------------------------|
| Build        | `npm run build`                                  | exit 0                        |

## Scope

**In scope**:
- `convex/social.ts` — modify `getEngagementTrend` handler

**Out of scope**:
- `convex/schema.ts` — no schema changes required (the existing indexes on `createdAt` for posts/comments and `_creationTime` for likes are not indexed, but Convex's default `_creationTime` can be filtered in a single range query)
- `getCommunityAnalytics` — this also has performance issues but is a larger rewrite; defer to a follow-up plan
- Frontend code that calls `getEngagementTrend`

## Git workflow

- Branch: `advisor/005-fix-engagement-trend-perf`
- Commit message style: `perf: replace getEngagementTrend O(days×3) scan with single aggregate query`

## Steps

### Step 1: Replace the per-day loop with a single query per table

Replace the handler body of `getEngagementTrend` with:

```typescript
handler: async (ctx, args) => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const startDate = now - args.days * oneDay;

  // Fetch each table once, filtered to the date range
  const allPosts = await ctx.db
    .query("socialPosts")
    .filter((q) => q.gte(q.field("_creationTime"), startDate))
    .collect();

  const allLikes = await ctx.db
    .query("socialLikes")
    .filter((q) => q.gte(q.field("_creationTime"), startDate))
    .collect();

  const allComments = await ctx.db
    .query("socialComments")
    .filter((q) => q.gte(q.field("_creationTime"), startDate))
    .collect();

  // Bucket into days and aggregate
  const dayBuckets = new Map<string, { posts: number; likes: number; comments: number }>();

  // Initialize all days (including days with 0 activity)
  for (let i = args.days - 1; i >= 0; i--) {
    const date = new Date(now - i * oneDay);
    const key = date.toISOString().split("T")[0];
    dayBuckets.set(key, { posts: 0, likes: 0, comments: 0 });
  }

  // Count posts
  for (const post of allPosts) {
    const key = new Date(post._creationTime).toISOString().split("T")[0];
    const bucket = dayBuckets.get(key);
    if (bucket) bucket.posts++;
  }

  // Count likes
  for (const like of allLikes) {
    const key = new Date(like._creationTime).toISOString().split("T")[0];
    const bucket = dayBuckets.get(key);
    if (bucket) bucket.likes++;
  }

  // Count comments
  for (const comment of allComments) {
    const key = new Date(comment._creationTime).toISOString().split("T")[0];
    const bucket = dayBuckets.get(key);
    if (bucket) bucket.comments++;
  }

  // Build trend array in chronological order
  const trend: Array<{ date: string; posts: number; likes: number; comments: number; engagement: number }> = [];
  for (let i = args.days - 1; i >= 0; i--) {
    const date = new Date(now - i * oneDay);
    const key = date.toISOString().split("T")[0];
    const bucket = dayBuckets.get(key)!;
    const engagement = bucket.posts > 0
      ? parseFloat(((bucket.likes + bucket.comments) / bucket.posts * 100).toFixed(1))
      : 0;
    trend.push({
      date: key,
      posts: bucket.posts,
      likes: bucket.likes,
      comments: bucket.comments,
      engagement,
    });
  }

  return trend;
},
```

This reduces the query count from `3 × days` to exactly `3`, regardless of the date range. The JS-side aggregation is O(N) where N is the data in the date range.

**Verify**: `npm run build` exits 0.

### Step 2: Add a date-range limit for safety

Add a guard at the top of the handler to prevent unbounded queries:

```typescript
const safeDays = Math.min(Math.max(args.days, 1), 90);
```

And use `safeDays` instead of `args.days` throughout. This prevents a client from requesting `days: 3650` and loading years of data.

Also update the `startDate` calculation:
```typescript
const startDate = now - safeDays * oneDay;
```

**Verify**: `npm run build` exits 0.

## Test plan

Manual verification:
1. Deploy to local Convex: `npm run dev:convex`
2. Open the community view in the app
3. Navigate to the analytics/leaderboards section
4. Verify that the engagement trend chart still renders correctly
5. Verify the returned data shape matches the query's return type

If no UI renders the engagement trend directly, verify from the Convex dashboard:
1. Open the Convex dashboard → Functions → `social:getEngagementTrend`
2. Call it with `{ days: 7 }`
3. Verify it returns an array of 7 objects with `date`, `posts`, `likes`, `comments`, `engagement` fields

## Done criteria

- [ ] `getEngagementTrend` handler makes exactly 3 queries (not 3 × days)
- [ ] A `safeDays` guard limits queries to 90 days max
- [ ] The return type and data shape are unchanged
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `getEngagementTrend` function at `convex/social.ts:1079-1148` doesn't match the excerpts.
- The Convex query API doesn't support the `.filter()` range pattern on `_creationTime` (verify in Convex docs).
- A step's verification fails twice.

## Maintenance notes

- `getCommunityAnalytics` (lines 934-1077) has a similar problem with 5 full-table `.collect()` calls. This should be addressed in a follow-up plan using a pre-aggregated `socialAnalytics` table that already exists in the schema but appears unused.
- If the `socialAnalytics` table is populated (e.g., by a scheduled job), both `getEngagementTrend` and `getCommunityAnalytics` could be reduced to single-table reads.
