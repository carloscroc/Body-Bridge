import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Convex Auth Configuration
 * 
 * This replaces the previous Supabase Auth integration.
 * Now using native Convex Auth with Password provider.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Get the user ID from the auth system (this is the Convex Auth user ID)
      let userId = args.existingUserId;
      
      try {
        if (!userId) {
          // Create new user in the auth system
          userId = await ctx.db.insert("users", {
            name: args.profile.name || "",
            email: args.profile.email,
          });
        }

        // Check if profile already exists for this user
        // Check if profile already exists for this email (migration/re-auth case)
        const profileByEmail = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("email"), args.profile.email))
          .first();

        if (profileByEmail) {
          // Link existing profile to new userId if different
          if (profileByEmail.userId !== userId) {
            await ctx.db.patch(profileByEmail._id, {
              userId: userId as any, // Cast to any because it might be a new Id type
              updatedAt: Date.now(),
            });
          } else {
            await ctx.db.patch(profileByEmail._id, {
              updatedAt: Date.now(),
            });
          }
          return userId;
        }
        // Check if profile already exists for this user by userId
        const existingProfile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), userId))
          .first();

        if (existingProfile) {
          // Update last login
          await ctx.db.patch(existingProfile._id, {
            updatedAt: Date.now(),
          });
          return userId;
        }

        // Create new profile for this user
        const email = args.profile?.email || "";
        const fullName = args.profile?.name || "";
        const authSource = "client"; // Default to client

        await ctx.db.insert("profiles", {
          userId,
          email,
          fullName,
          authSource,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        return userId;
      } catch (error) {
        throw error;
      }
    },
  },
});
