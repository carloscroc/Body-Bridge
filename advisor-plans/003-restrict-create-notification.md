# Plan 003: Restrict createNotification to prevent cross-user notification spam

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1043760..HEAD -- convex/notifications.ts convex/social.ts convex/functions/auth.ts src/App.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a1043760`, 2026-06-18

## Why this matters

The `createNotification` mutation in `convex/notifications.ts` takes a `userId` argument and creates a notification for that user without any verification that the caller has the right to do so. Any authenticated user can send arbitrary notifications to any other user by providing their profile ID. This is used by the social module (likes, comments) and by the app's self-reminder system, but the generic mutation is too permissive — a client could use it to spam or phish other users via in-app notifications.

The existing `createSelfNotification` mutation is the correct pattern for user-initiated notifications (it uses `requireProfileId` and sets `userId` automatically). The `createNotification` mutation should only be callable from other Convex functions (server-side), not from the client.

## Current state

`convex/notifications.ts` lines 6-33:
```typescript
export const createNotification = mutation({
  args: {
    userId: v.id("profiles"),
    type: v.union(
      v.literal("message"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("like"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    payload: v.optional(v.any()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      payload: args.payload,
      link: args.link,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
```

Callers of `createNotification`:
- `convex/social.ts:287` — `ctx.db.insert("notifications", {...})` inline in `createComment` (does NOT call `createNotification` — it inserts directly)
- `convex/social.ts:469` — `ctx.db.insert("notifications", {...})` inline in `toggleLike` (does NOT call `createNotification` — inserts directly)
- `src/App.tsx:157` — client-side calls `createSelfNotification` (the safe one), not `createNotification`

The social module does NOT use the `createNotification` mutation — it inserts notifications directly into the `notifications` table via `ctx.db.insert`. So `createNotification` appears to have no internal callers; it is exposed to the client as a callable mutation.

## Commands you will need

| Purpose      | Command                                          | Expected on success           |
|--------------|--------------------------------------------------|-------------------------------|
| Build        | `npm run build`                                  | exit 0                        |

## Scope

**In scope**:
- `convex/notifications.ts` — restrict `createNotification`

**Out of scope**:
- `convex/social.ts` — does not use `createNotification`; its direct inserts are correct (they happen in authenticated mutation handlers with ownership checks)
- `src/App.tsx` — already uses `createSelfNotification`, not `createNotification`
- Any changes to the `notifications` table schema

## Git workflow

- Branch: `advisor/003-restrict-create-notification`
- Commit message style: `fix(security): restrict createNotification to server-side use only`

## Steps

### Step 1: Make createNotification internal-only

Since `createNotification` has no internal callers (the social module inserts directly), the simplest fix is to convert it to an **internal mutation** that cannot be called from the client at all.

Replace:
```typescript
export const createNotification = mutation({
```

With:
```typescript
export const createNotification = internalMutation({
```

And update the import at the top of the file from:
```typescript
import { mutation, query } from "./_generated/server";
```

To:
```typescript
import { mutation, query, internalMutation } from "./_generated/server";
```

This makes `createNotification` callable only from other Convex functions via `ctx.runMutation(api.notifications.createNotification, ...)`, not from the client.

**Verify**: the file does not have TypeScript errors. The build should still pass.

### Step 2: Update any references

Search the codebase for any client-side calls to `createNotification`:

```bash
grep -rn "api\.notifications\.createNotification" src/
```

If any exist (unlikely based on the audit), they must be either:
- Replaced with `createSelfNotification`, or
- Moved to a server-side Convex function that calls `createNotification` internally.

Also check Convex files:
```bash
grep -rn "notifications\.createNotification" convex/ --include="*.ts"
```

No changes should be needed since the social module inserts directly.

**Verify**: `npm run build` exits 0.

## Test plan

1. Deploy locally with `npm run dev:convex`
2. Verify that client-side code CANNOT call `createNotification` directly — it should not appear in the generated API types exposed to the frontend
3. Verify that the community like/comment notifications still work (they insert directly, not via `createNotification`)
4. Verify that self-notifications (`createSelfNotification`) from the app still work

## Done criteria

- [ ] `createNotification` is declared as `internalMutation`, not `mutation`
- [ ] `internalMutation` is imported from the Convex server module
- [ ] No client-side code references `api.notifications.createNotification`
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `convex/notifications.ts:6-33` doesn't match the excerpts above.
- Client-side code IS found calling `api.notifications.createNotification` — this plan needs adjustment before proceeding.
- A step's verification fails twice.

## Maintenance notes

- If a future feature needs server-triggered notifications (e.g., a scheduled job), it can call `createNotification` as an internal mutation from within Convex.
- The `createSelfNotification` mutation remains the correct client-facing API for user-initiated notifications.
