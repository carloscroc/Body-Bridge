import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return;

    // Delete profile
    await ctx.db.delete(profile._id);

    // Delete related data (best effort for production readiness)
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();
    for (const w of workouts) {
      await ctx.db.delete(w._id);
    }

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .collect();
    for (const m of meals) {
      await ctx.db.delete(m._id);
    }

    const groupMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .unique();
    if (groupMembership) {
      await ctx.db.delete(groupMembership._id);
    }

    // Note: Convex Auth user deletion usually happens via the auth provider or a separate process
  },
});
