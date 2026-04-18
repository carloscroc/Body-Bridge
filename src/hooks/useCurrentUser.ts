import { useAuth } from '../services/AuthContext';
import type { Id } from '@convex/_generated/dataModel';

/**
 * Single source of truth for user identity across the app.
 *
 * `user` from AuthContext is a Convex profile document, so:
 *   - profileId = user._id   (Id<"profiles">)
 *   - authUserId = user.userId  (Id<"users">)
 *   - profile = full profile document
 */
export function useCurrentUser() {
  const { user, isAuthenticated, isAuthLoading } = useAuth();

  const profileId = (user?._id ?? null) as Id<"profiles"> | null;
  const authUserId = (user?.userId ?? null) as Id<"users"> | null;

  return {
    /** The profile document ID — use this as authorId, userId, etc. in Convex mutations */
    profileId,
    /** The auth users table ID — rarely needed directly */
    authUserId,
    /** Full profile document from Convex */
    profile: user ?? null,
    /** Whether the user is authenticated */
    isAuthenticated,
    /** Whether auth state is still loading */
    isLoading: isAuthLoading,
    /** Convenience: user's display name */
    displayName: user?.fullName || 'Member',
    /** Convenience: user's avatar URL */
    avatarUrl: user?.avatarUrl ?? null,
    /** Convenience: user's auth source (client or trainer) */
    authSource: user?.authSource as 'client' | 'trainer' | null,
  };
}
