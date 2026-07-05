/**
 * Token Sync Utility for Capacitor WebViews
 *
 * Convex Auth stores JWT tokens in localStorage, which is unreliable in Capacitor WebViews
 * (tokens get cleared on app background/close). This utility syncs tokens between localStorage
 * and Capacitor Preferences (native persistent storage) to ensure they persist correctly.
 *
 * Usage:
 * - Call syncTokensToCapacitor() whenever auth state changes (login, logout, token refresh)
 * - Call restoreTokensFromCapacitor() on app startup to restore tokens from Capacitor to localStorage
 */

import { Preferences } from '@capacitor/preferences';

const CONVEX_JWT_PREFIX = '__convexAuthJWT_';
const CONVEX_REFRESH_PREFIX = '__convexAuthRefreshToken_';

/**
 * Get all Convex auth keys from localStorage
 */
function getConvexAuthKeys(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return Object.keys(window.localStorage).filter(
      key => key.startsWith(CONVEX_JWT_PREFIX) || key.startsWith(CONVEX_REFRESH_PREFIX)
    );
  } catch (error) {
    console.warn('[TokenSync] Failed to get localStorage keys:', error);
    return [];
  }
}

/**
 * Save all Convex auth tokens to Capacitor Preferences
 * Call this after successful login, logout, or token refresh
 */
export async function syncTokensToCapacitor(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('[TokenSync] syncTokensToCapacitor: window is undefined (SSR)');
    return;
  }

  try {
    const keys = getConvexAuthKeys();
    
    // Clear existing tokens from Capacitor
    for (const key of keys) {
      await Preferences.remove({ key: `convex_auth_${key}` });
    }

    // Save new tokens to Capacitor
    for (const key of keys) {
      const value = window.localStorage.getItem(key);
      if (value) {
        await Preferences.set({
          key: `convex_auth_${key}`,
          value: value
        });
      }
    }

    // Store a timestamp to know when last sync happened
    await Preferences.set({
      key: 'convex_auth_last_sync',
      value: Date.now().toString()
    });

    console.log(`[TokenSync] Synced ${keys.length} Convex auth tokens to Capacitor Preferences`);
  } catch (error) {
    console.error('[TokenSync] Failed to sync tokens to Capacitor:', error);
  }
}

/**
 * Restore Convex auth tokens from Capacitor Preferences to localStorage
 * Call this on app startup to restore tokens that were lost from localStorage
 */
export async function restoreTokensFromCapacitor(): Promise<boolean> {
  if (typeof window === 'undefined') {
    console.warn('[TokenSync] restoreTokensFromCapacitor: window is undefined (SSR)');
    return false;
  }

  try {
    // Check if we have any synced tokens
    const lastSync = await Preferences.get({ key: 'convex_auth_last_sync' });
    if (!lastSync.value) {
      console.log('[TokenSync] No synced tokens found in Capacitor Preferences');
      return false;
    }

    // Get all Capacitor auth keys
    const { keys } = await Preferences.keys();
    const convexKeys = keys.filter(key => key.startsWith('convex_auth_'));

    if (convexKeys.length === 0) {
      console.log('[TokenSync] No Convex auth keys in Capacitor Preferences');
      return false;
    }

    // Restore each token to localStorage
    let restoredCount = 0;
    for (const capacitorKey of convexKeys) {
      const result = await Preferences.get({ key: capacitorKey });
      if (result.value) {
        // Extract the original key (remove 'convex_auth_' prefix)
        const originalKey = capacitorKey.replace('convex_auth_', '');
        window.localStorage.setItem(originalKey, result.value);
        restoredCount++;
      }
    }

    console.log(`[TokenSync] Restored ${restoredCount} Convex auth tokens from Capacitor Preferences to localStorage`);
    
    // Clear tokens from Capacitor to avoid conflicts (they're now in localStorage)
    for (const key of convexKeys) {
      await Preferences.remove({ key: key });
    }
    await Preferences.remove({ key: 'convex_auth_last_sync' });

    return restoredCount > 0;
  } catch (error) {
    console.error('[TokenSync] Failed to restore tokens from Capacitor:', error);
    return false;
  }
}

/**
 * Clear all Convex auth tokens from both localStorage and Capacitor Preferences
 * Call this on logout
 */
export async function clearTokensFromCapacitor(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('[TokenSync] clearTokensFromCapacitor: window is undefined (SSR)');
    return;
  }

  try {
    // Clear from localStorage
    const keys = getConvexAuthKeys();
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }

    // Clear from Capacitor
    const { keys: capacitorKeys } = await Preferences.keys();
    const convexKeys = capacitorKeys.filter(key => key.startsWith('convex_auth_'));
    
    for (const key of convexKeys) {
      await Preferences.remove({ key: key });
    }

    await Preferences.remove({ key: 'convex_auth_last_sync' });

    console.log(`[TokenSync] Cleared ${keys.length} tokens from localStorage and ${convexKeys.length} from Capacitor`);
  } catch (error) {
    console.error('[TokenSync] Failed to clear tokens from Capacitor:', error);
  }
}

/**
 * Check if there are tokens stored in Capacitor (from a previous session)
 */
export async function hasPendingCapacitorTokens(): Promise<boolean> {
  try {
    const lastSync = await Preferences.get({ key: 'convex_auth_last_sync' });
    return !!lastSync.value;
  } catch (error) {
    return false;
  }
}