import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

type QueryCtx = {
    db: any;
    auth: any;
};

type AuthCtx = {
    auth: any;
};

/**
 * Authentication helper that respects the VITE_DEV_AUTH bypass.
 */
export async function requireIdentity(ctx: AuthCtx): Promise<Id<"users">> {
    const userId = await getAuthUserId(ctx);
    if (userId) return userId;
    const allowUnauthenticated = process.env.VITE_DEV_AUTH === "true" || process.env.ALLOW_UNAUTHENTICATED_EXERCISES === "1" || process.env.ALLOW_UNAUTHENTICATED_AI === "1";
    if (allowUnauthenticated) {
        return "dev" as Id<"users">;
    }
    throw new Error("Unauthenticated");
}

/**
 * Get the current authenticated user's profile ID
 */
export async function requireProfileId(ctx: QueryCtx): Promise<Id<"profiles">> {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .first();

    if (!profile) throw new Error("Profile not found");
    return profile._id;
}

/**
 * Ensures the current user is an authorized trainer and returns their profile.
 */
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

/**
 * Version of requireIdentity that returns null instead of throwing if unauthenticated
 */
export async function getMaybeIdentity(ctx: QueryCtx): Promise<Id<"users"> | null> {
    return await getAuthUserId(ctx);
}

/**
 * Get the current authenticated user's profile ID (nullable)
 */
export async function getMaybeProfileId(ctx: QueryCtx): Promise<Id<"profiles"> | null> {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .first();

    return profile?._id || null;
}
