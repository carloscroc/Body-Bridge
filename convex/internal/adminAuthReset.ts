import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const deletePasswordUserByEmail = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", email))
      .collect();

    if (accounts.length === 0) {
      return { ok: false as const, message: "No password auth account found for email.", email };
    }

    const deleted = {
      authAccounts: 0,
      authSessions: 0,
      authRefreshTokens: 0,
      authVerificationCodes: 0,
      profiles: 0,
      users: 0,
    };

    for (const account of accounts) {
      const userId = account.userId;

      // Remove verification codes tied to this account.
      const verificationCodes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of verificationCodes) {
        await ctx.db.delete(code._id);
        deleted.authVerificationCodes++;
      }

      // Remove sessions + refresh tokens.
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      for (const session of sessions) {
        const refreshTokens = await ctx.db
          .query("authRefreshTokens")
          .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
          .collect();
        for (const rt of refreshTokens) {
          await ctx.db.delete(rt._id);
          deleted.authRefreshTokens++;
        }
        await ctx.db.delete(session._id);
        deleted.authSessions++;
      }

      // Remove app profile(s) for this user.
      const profiles = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const profile of profiles) {
        await ctx.db.delete(profile._id);
        deleted.profiles++;
      }

      // Remove auth account.
      await ctx.db.delete(account._id);
      deleted.authAccounts++;

      // Remove user document.
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.delete(userId);
        deleted.users++;
      }
    }

    return { ok: true as const, email, deleted };
  },
});
