import { mutation } from "./_generated/server";
import { getMaybeProfileId } from "./lib/auth";
import { Id } from "./_generated/dataModel";

const types = ["message", "comment", "follow", "like", "system"] as const;
const titles: string[] = [
  "New message",
  "Comment on your post",
  "New follower",
  "Someone liked your post",
  "System notice",
  "Profile update recommended",
];
const messages = [
  "You have a new message in your inbox.",
  "Someone replied to your post.",
  "A new user started following you.",
  "Your post received a new like.",
  "System maintenance will occur soon.",
  "Consider updating your profile to improve discovery.",
];

// Seed 1 notification for a single profile, using `offset` to vary content
async function seedForProfile(
  ctx: any,
  profileId: Id<"profiles">,
  link: string,
  offset: number
): Promise<void> {
  const t = types[offset % types.length];
  const title = titles[offset % titles.length];
  const message = messages[offset % messages.length];
  await ctx.db.insert("notifications", {
    userId: profileId,
    type: t,
    title,
    message,
    payload: undefined,
    link,
    isRead: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export const seedNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    // Try to fetch a recent post for link references
    let postId: string | null = null;
    try {
      const recentPost = await ctx.db
        .query("socialPosts")
        .withIndex("by_createdAt", (q: any) => q)
        .order("desc")
        .first();
      if (recentPost && recentPost._id) postId = recentPost._id;
    } catch {
      // ignore
    }

    // Determine recipient profile(s)
    const profileId = await getMaybeProfileId(ctx);

    if (profileId) {
      // ── Auth path: seed for the authenticated user only ──
      const link = postId
        ? `/posts/${postId}`
        : `/profile/${profileId}`;
      await seedForProfile(ctx, profileId, link, 0);
      return { ok: true, totalInserted: 1, seededUserCount: 1, seededUserIds: [profileId] };
    }

    // ── No-auth path (CLI): seed 1 notif each for many profiles ──
    const allProfiles = await ctx.db.query("profiles").collect();
    if (!allProfiles || allProfiles.length === 0) {
      return { ok: false, reason: "no_profile" };
    }
    allProfiles.sort(
      (a: any, b: any) => ((b.createdAt as number) || 0) - ((a.createdAt as number) || 0)
    );
    // Use a generous cap so whichever profile is active in the UI will see seed data.
    const targetProfiles = allProfiles.slice(0, 50);

    let totalInserted = 0;
    const seededUserIds: Id<"profiles">[] = [];

    for (let i = 0; i < targetProfiles.length; i++) {
      const profile = targetProfiles[i];
      const link = postId
        ? `/posts/${postId}`
        : `/profile/${profile._id}`;
      await seedForProfile(ctx, profile._id, link, i);
      totalInserted++;
      seededUserIds.push(profile._id);
    }

    return {
      ok: true,
      totalInserted,
      seededUserCount: seededUserIds.length,
      seededUserIds,
    };
  },
});
