import { v } from "convex/values";
import { query } from "./_generated/server";

export const checkAccountExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email)
      )
      .first();
    
    return !!existingAccount;
  },
});

export const getProfileForBootstrap = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_email_authSource", (q) => q.eq("email", args.email).eq("authSource", "client"))
      .first();
  },
});
