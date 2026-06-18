# Plan 002: Add authorization to pinPost mutation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a1043760..HEAD -- convex/social.ts`
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

The `pinPost` mutation in `convex/social.ts` allows any authenticated user to pin or unpin any community post. Only the post author or a trainer should be able to pin posts. Currently, a regular client user could pin their own posts to the top of the community feed, displacing official announcements.

## Current state

The file is `convex/social.ts`. The current `pinPost` mutation (lines 188–205):

```typescript
export const pinPost = mutation({
  args: {
    postId: v.id("socialPosts"),
    isPinned: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(args.postId, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });
    return null;
  },
});
```

Notice: `requireProfileId` is never called, and there is no check on `post.authorId` or the caller's role.

**Existing authorization pattern** in the same file: `deletePost` and `updatePost` correctly check `post.authorId !== profileId`. The `removeGroupMember` mutation checks `isTrainer` via `profile.authSource`. This plan follows those patterns.

**Convention for auth helpers** (from `convex/lib/auth.ts`):
- `requireProfileId(ctx)` — returns the caller's profile ID, throws if unauthenticated
- `requireTrainer(ctx)` — returns the caller's profile if they are a trainer, throws otherwise

```typescript
// convex/lib/auth.ts — existing helper
export async function requireTrainer(ctx: QueryCtx) {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .first();
    if (!profile) throw new Error("Profile not found");
    if (profile.authSource !== "trainer") throw new Error("Unauthorized: Only trainers can perform this action");
    return profile;
}
```

## Commands you will need

| Purpose      | Command                                          | Expected on success           |
|--------------|--------------------------------------------------|-------------------------------|
| Build        | `npm run build`                                  | exit 0                        |
| Convex typecheck | `npx convex typecheck` (if available)       | exit 0                        |

## Scope

**In scope**:
- `convex/social.ts` — modify `pinPost` mutation handler

**Out of scope**:
- `convex/lib/auth.ts` — do not modify (the helper already exists)
- Any changes to the frontend code that calls `pinPost`
- Any other mutations in `convex/social.ts`

## Git workflow

- Branch: `advisor/002-fix-pinpost-authz`
- Commit message style: `fix(security): add authorization check to pinPost mutation`

## Steps

### Step 1: Add authorization to pinPost

Replace the `pinPost` handler with this code:

```typescript
export const pinPost = mutation({
  args: {
    postId: v.id("socialPosts"),
    isPinned: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profileId = await requireProfileId(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    // Only the post author or a trainer can pin/unpin
    const profile = await ctx.db.get(profileId);
    const isTrainer = profile?.authSource === "trainer";
    if (post.authorId !== profileId && !isTrainer) {
      throw new Error("Not authorized to pin this post");
    }
    await ctx.db.patch(args.postId, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });
    return null;
  },
});
```

This follows the exact same pattern as `updatePost` (author check) and `removeGroupMember` (trainer check) in the same file.

**Verify**: the file compiles — `npx convex typecheck` or at minimum the build does not error.

### Step 2: Ensure requireProfileId is imported

Verify that `requireProfileId` is already imported at the top of `convex/social.ts`. If it is not (check the existing import from `./lib/auth`), add it.

Current import line (line 5):
```typescript
import { requireProfileId } from "./lib/auth";
```

This should already be present. If not, add `requireProfileId` to the import.

**Verify**: no TypeScript import error.

## Test plan

No automated tests exist for Convex functions. After the change:

1. Deploy to local Convex: `npm run dev:convex`
2. In the app, verify that:
   - A trainer can pin their own post ✓
   - A trainer can pin another user's post ✓
   - A client can pin their own post ✓
   - A client CANNOT pin another user's post (should get "Not authorized" error) ✓

## Done criteria

- [ ] `pinPost` mutation calls `requireProfileId(ctx)`
- [ ] `pinPost` checks `post.authorId !== profileId` before allowing the operation
- [ ] Trainers can bypass the author check (`isTrainer` flag)
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `convex/social.ts:188-205` doesn't match the excerpts above.
- `requireProfileId` is not exportable from `convex/lib/auth.ts`.
- A step's verification fails twice.

## Maintenance notes

- If a role-based access control (RBAC) system is ever added, replace the `authSource === "trainer"` check with a proper role check.
- The `pinPost` function is only called from the community admin UI — reviewer should check that the frontend gracefully handles the new "Not authorized" error (display an error toast or similar).
