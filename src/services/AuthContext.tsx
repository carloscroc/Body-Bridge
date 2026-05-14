import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery, useConvex } from 'convex/react';
import { api } from '@convex/_generated/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: any | null | undefined;
  login: (args: { email: string; password: string; name?: string; flow: 'signIn' | 'signUp' }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();

  // Dev override
  const isForced = false;

  const userQuery = useQuery(api.functions.auth.getCurrentUser, isForced ? 'skip' : { authSource: 'client' });
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const hasStoredAuthTokens = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return Object.keys(window.localStorage).some(
      (key) => key.startsWith('__convexAuthJWT_') || key.startsWith('__convexAuthRefreshToken_'),
    );
  }, []);

  const getStoredAccessToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const tokenKey = Object.keys(window.localStorage).find((key) => key.startsWith('__convexAuthJWT_'));
    return tokenKey ? window.localStorage.getItem(tokenKey) : null;
  }, []);

  const getBootstrappedEmail = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('body-bridge_last_auth_email');
  }, []);

  const setBootstrappedIdentity = useCallback((profile: any | null, email?: string) => {
    if (typeof window === 'undefined') return;
    if (profile?.email || email) {
      window.localStorage.setItem('body-bridge_last_auth_email', profile?.email ?? email ?? '');
    }
  }, []);

  const clearBootstrappedIdentity = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('body-bridge_last_auth_email');
  }, []);

  const fetchBootstrapProfile = useCallback(async (email?: string | null) => {
    const targetEmail = email ?? getBootstrappedEmail();
    if (!targetEmail) {
      return null;
    }

    return await convex.query(api.auth_helpers.getProfileForBootstrap, { email: targetEmail });
  }, [convex, getBootstrappedEmail]);

  const fetchCurrentUserWithStoredToken = useCallback(async () => {
    const token = getStoredAccessToken();
    const convexUrl = import.meta.env.VITE_CONVEX_URL;

    if (!token || !convexUrl) {
      return null;
    }

    const response = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        path: 'functions/auth:getCurrentUser',
        format: 'convex_encoded_json',
        args: [{ authSource: 'client' }],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (payload?.status !== 'success') {
      return null;
    }

    return payload.value ?? null;
  }, [getStoredAccessToken]);

  const waitForAuthenticatedUser = useCallback(async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const currentUser = await fetchCurrentUserWithStoredToken();
      if (currentUser) {
        return currentUser;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    return null;
  }, [fetchCurrentUserWithStoredToken]);

  useEffect(() => {
    if (userQuery) {
      setSessionUser(userQuery);
      setBootstrappedIdentity(userQuery);
      return;
    }

    if (isAuthenticated || !hasStoredAuthTokens()) {
      setSessionUser(null);
      if (!hasStoredAuthTokens()) {
        clearBootstrappedIdentity();
      }
    }
  }, [userQuery, isAuthenticated, hasStoredAuthTokens, setBootstrappedIdentity, clearBootstrappedIdentity]);

  useEffect(() => {
    if (isForced || isAuthenticated || userQuery || !hasStoredAuthTokens()) {
      return;
    }

    let cancelled = false;

    void waitForAuthenticatedUser().then((currentUser) => {
      if (!cancelled && currentUser) {
        setSessionUser(currentUser);
        setBootstrappedIdentity(currentUser);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userQuery, hasStoredAuthTokens, waitForAuthenticatedUser, setBootstrappedIdentity]);

  useEffect(() => {
    if (userQuery || sessionUser || !getBootstrappedEmail()) {
      return;
    }

    let cancelled = false;

    void fetchBootstrapProfile().then((profile) => {
      if (!cancelled && profile) {
        setSessionUser(profile);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userQuery, sessionUser, getBootstrappedEmail, fetchBootstrapProfile]);

  useEffect(() => {
    const convexClient = convex as typeof convex & {
      setAuth?: (fetchToken: (args: { forceRefreshToken: boolean }) => Promise<string | null>, onChange?: (isAuthenticated: boolean) => void) => void;
      clearAuth?: () => void;
    };

    if (!convexClient.setAuth) {
      return;
    }

    if (!hasStoredAuthTokens()) {
      convexClient.clearAuth?.();
      return;
    }

    convexClient.setAuth(
      async () => getStoredAccessToken(),
      (authenticated) => {
        if (!authenticated && !hasStoredAuthTokens()) {
          setSessionUser(null);
        }
      },
    );
  }, [convex, getStoredAccessToken, hasStoredAuthTokens]);

  const user = isForced ? { onboardingComplete: true, fullName: 'Local Developer' } : (userQuery ?? sessionUser);
  const isAuthenticatedFinal = isAuthenticated || !!sessionUser || isForced;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (args: { email: string; password: string; name?: string; flow: 'signIn' | 'signUp' }) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Pre-flight check to determine exact error if authentication fails
      const accountExists = await convex.query(api.auth_helpers.checkAccountExists, { 
        email: args.email 
      });

      if (args.flow === 'signUp' && accountExists) {
        throw new Error('An account with this email already exists. Please log in instead.');
      }

      if (args.flow === 'signIn' && !accountExists) {
        throw new Error('No account found for this email. Please sign up first.');
      }

      const formData = new FormData();
      formData.set('email', args.email);
      formData.set('password', args.password);
      formData.set('flow', args.flow);
      if (args.flow === 'signUp' && args.name) {
        formData.set('name', args.name);
      }
      
      try {
        console.log('[Auth] Attempting signIn:', args.flow, args.email);
        await signIn('password', formData);
        console.log('[Auth] signIn call finished');
        const currentUser = await waitForAuthenticatedUser();
        if (currentUser) {
          setSessionUser(currentUser);
          setBootstrappedIdentity(currentUser, args.email);
        } else {
          const bootstrapProfile = await fetchBootstrapProfile(args.email);
          if (bootstrapProfile) {
            setSessionUser(bootstrapProfile);
            setBootstrappedIdentity(bootstrapProfile, args.email);
          }
        }
      } catch (signInErr: any) {
        // If we reach here, we know the account exists (for signIn) or doesn't exist (for signUp).
        // Since Convex masks the exact reason with a 500 Server Error, we can now confidently infer it.
        if (args.flow === 'signIn') {
          throw new Error('Incorrect password. Please try again.');
        } else {
          throw new Error('Could not create account. Please ensure your password is at least 8 characters long.');
        }
      }
    } catch (err: any) {
      // Log full error object to console for easier debugging of server-side failures
      // eslint-disable-next-line no-console
      console.error('[Auth] signIn error:', err);
      setError(err?.message || 'Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [convex, signIn, waitForAuthenticatedUser, fetchBootstrapProfile, setBootstrappedIdentity]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
      setSessionUser(null);
      clearBootstrappedIdentity();
      const convexClient = convex as typeof convex & { clearAuth?: () => void };
      convexClient.clearAuth?.();
    } catch (err: any) {
      setError(err?.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearBootstrappedIdentity, convex, signOut]);

  const value = useMemo(
    () => ({ isAuthenticated: isAuthenticatedFinal, isAuthLoading: isAuthLoading && !isForced, user, login, logout, isLoading, error }),
    [isAuthenticatedFinal, isAuthLoading, user, login, logout, isLoading, error]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};