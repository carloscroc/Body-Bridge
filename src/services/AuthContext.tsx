import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery, useConvex, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { recordAuthOp } from '../components/AuthDiagnostics';

// Lazy load token sync with error handling for Capacitor unavailability
let tokenSync: any = null;
try {
  tokenSync = require('../utils/tokenSync');
} catch (e) {
  console.warn('[Auth] Token sync not available:', e);
}
export type AuthFieldError = {
  field: 'email' | 'password' | 'general';
  message: string;
};

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: any | null | undefined;
  login: (args: { email: string; password: string; name?: string; flow: 'signIn' | 'signUp' }) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldError: AuthFieldError | null;
  clearFieldError: () => void;
  /**
   * Resolves once the underlying Convex auth session (`useConvexAuth`) reports
   * authenticated. Use before calling auth-gated mutations (e.g. completeOnboarding)
   * to avoid hitting UNAUTHENTICATED errors during session-propagation lag.
   * Rejects with a timeout after `timeoutMs`.
   */
  waitForConvexAuth: (timeoutMs?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();
  const getOrCreateUser = useMutation(api.functions.auth.getOrCreateUser);

  // Track the latest Convex auth state and userQuery in refs so an async
  // waiter can poll them. This lets callers (e.g. completeOnboarding) wait
  // for the REAL Convex auth session to propagate before firing auth-gated
  // mutations — avoiding the UNAUTHENTICATED errors caused by
  // session-propagation lag.
  const convexAuthRef = React.useRef(isAuthenticated);
  useEffect(() => {
    convexAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);
  // Dev override
  const isForced = false;

  const userQuery = useQuery(api.functions.auth.getCurrentUser, isForced ? 'skip' : { authSource: 'client' });
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const userQueryRef = React.useRef(userQuery);
  useEffect(() => {
    userQueryRef.current = userQuery;
  }, [userQuery]);

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

  // Wait until the Convex auth session is actually established server-side.
  // This is needed before firing auth-gated mutations (getOrCreateUser,
  // completeOnboarding) because the mutation context's getAuthUserId stays
  // empty until the Convex client has propagated the JWT — which lags,
  // especially over production latency in the WebView.
  //
  // We poll two signals:
  // 1. useConvexAuth().isAuthenticated (the Convex React client knows about the session)
  // 2. useQuery(getCurrentUser) returning a non-null profile (the server
  //    actually recognizes the session and can serve data for it).
  // When BOTH are true, mutations will work.
  // Wait until the Convex auth session is actually established server-side.
  // This is needed before firing auth-gated mutations (getOrCreateUser,
  // completeOnboarding) because the mutation context's getAuthUserId stays
  // empty until the Convex client has propagated the JWT — which lags,
  // especially over production latency in the WebView.
  //
  // We only require isAuthenticated (the Convex React client knows about
  // the session). The userQuery (getCurrentUser) may lag behind, but mutations
  // will still work because getAuthUserId is available once isAuthenticated
  // is true. This reduces timeout failures in high-latency WebView environments.
  const waitForConvexAuth = useCallback((timeoutMs = 30000) => {
    return new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const tick = () => {
        // Only require isAuthenticated - the userQuery can lag but
        // mutations will still work once the auth session is established
        if (convexAuthRef.current) {
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          reject(new Error('Timed out waiting for Convex auth session. Please try again.'));
          return;
        }
        window.setTimeout(tick, 250);
      };
      tick();
    });
  }, []);

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

  // Bootstrap hint: if we have a real Convex auth session AND a remembered email
  // but the getCurrentUser query hasn't returned yet, fetch the profile by email
  // as a *data hint only*. We deliberately require `isAuthenticated` to be true
  // so this can never fake an authenticated state — it only pre-fills profile data.
  useEffect(() => {
    if (!isAuthenticated || userQuery || sessionUser || !getBootstrappedEmail()) {
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
  }, [isAuthenticated, userQuery, sessionUser, getBootstrappedEmail, fetchBootstrapProfile]);

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
  const [fieldError, setFieldError] = useState<AuthFieldError | null>(null);

  const mapAuthError = (err: any, flow: 'signIn' | 'signUp'): AuthFieldError => {
    const message = err?.message || '';

    if (message.includes('already exists')) {
      return { field: 'email', message: 'An account with this email already exists. Please log in instead.' };
    }
    if (message === 'InvalidSecret') {
      return { field: 'password', message: 'Incorrect password. Please try again.' };
    }
    if (message === 'InvalidAccountId') {
      return { field: 'email', message: 'No account found with this email. Please sign up first.' };
    }
    if (message === 'TooManyFailedAttempts') {
      return { field: 'general', message: 'Too many failed attempts. Please try again later.' };
    }
    if (message === 'Invalid password') {
      return { field: 'password', message: 'Password must be at least 8 characters.' };
    }
    if (message.startsWith('Missing `password`')) {
      return { field: 'password', message: 'Password is required.' };
    }

    return { field: 'general', message: 'Authentication failed. Please try again.' };
  };

  const login = useCallback(async (args: { email: string; password: string; name?: string; flow: 'signIn' | 'signUp' }) => {
    setIsLoading(true);
    setError(null);
    setFieldError(null);
    let loginUser: any = null;
    try {
      const formData = new FormData();
      formData.set('email', args.email);
      formData.set('password', args.password);
      formData.set('flow', args.flow);
      if (args.flow === 'signUp' && args.name) {
        formData.set('name', args.name);
      }

      try {
        await signIn('password', formData);
        recordAuthOp({ step: 'signIn', status: 'success', at: Date.now() });

        // CRITICAL: wait for the REAL Convex auth session (useConvexAuth) to
        // report authenticated before calling getOrCreateUser. The mutation
        // context's getAuthUserId is empty until the Convex client has fetched
        // and validated the JWT, which lags behind signIn() returning —
        // especially over production latency in the WebView.
        try {
          await waitForConvexAuth(15000);
          recordAuthOp({ step: 'waitForConvexAuth(login)', status: 'success', at: Date.now() });
        } catch (waitErr: any) {
          recordAuthOp({ step: 'waitForConvexAuth(login)', status: 'error', detail: waitErr?.message ?? String(waitErr), at: Date.now() });
        }

        // Poll getCurrentUser via the stored JWT as an additional signal.
        recordAuthOp({ step: 'waitForAuthenticatedUser', status: 'pending', at: Date.now() });
        const polledUser = await waitForAuthenticatedUser();
        if (polledUser) {
          recordAuthOp({ step: 'waitForAuthenticatedUser', status: 'success', detail: polledUser.email, at: Date.now() });
        } else {
          recordAuthOp({ step: 'waitForAuthenticatedUser', status: 'noop', detail: 'returned null after polling', at: Date.now() });
        }

        // Retry getOrCreateUser a few times: even after the JWT authenticates
        // against /api/query, the mutation context's getAuthUserId can lag.
        let createdOrFound: any = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          recordAuthOp({ step: `getOrCreateUser#${attempt}`, status: 'pending', at: Date.now() });
          try {
            createdOrFound = await getOrCreateUser({
              email: args.email,
              fullName: args.name,
              authSource: 'client',
            });
          } catch (mutErr: any) {
            recordAuthOp({ step: `getOrCreateUser#${attempt}`, status: 'error', detail: mutErr?.message ?? String(mutErr), at: Date.now() });
            // Server now throws ConvexError (after convex/functions/auth.ts fix).
            // Only retry on auth-not-ready codes; rethrow real validation errors.
            const code = mutErr?.data?.code || mutErr?.message || '';
            if (!/UNAUTHENTICATED|not.*auth|session/i.test(String(code))) {
              throw mutErr;
            }
          }
          if (createdOrFound) {
            recordAuthOp({ step: `getOrCreateUser#${attempt}`, status: 'success', detail: createdOrFound.email, at: Date.now() });
            break;
          }
          // Backoff: 300ms, 600ms
          if (attempt < 3) {
            await new Promise((r) => window.setTimeout(r, 300 * attempt));
          }
        }

        loginUser = polledUser ?? createdOrFound ?? null;

        // Data-only fallback: if the authenticated paths above haven't
        // resolved yet (auth propagation lag), fetch the profile by email as
        // PROFILE DATA ONLY. This does NOT grant authentication — signIn has
        // already established the real Convex auth session (JWT in localStorage
        // + setAuth effect authenticates the ConvexReactClient). The Phase 2E
        // guard ensures the bootstrap can never fake isAuthenticated on its own.
        // We need the profile data so the UI knows whether onboardingComplete
        // is set (for returning users) or not (for new users → onboarding).
        if (!loginUser) {
          recordAuthOp({ step: 'fetchBootstrapProfile', status: 'pending', detail: 'data-only fallback', at: Date.now() });
          const bootstrapProfile = await fetchBootstrapProfile(args.email);
          if (bootstrapProfile) {
            loginUser = bootstrapProfile;
            setSessionUser(bootstrapProfile);
            setBootstrappedIdentity(bootstrapProfile, args.email);
            recordAuthOp({ step: 'fetchBootstrapProfile', status: 'success', detail: bootstrapProfile.email, at: Date.now() });
          }
        } else {
          setSessionUser(loginUser);
          setBootstrappedIdentity(loginUser, args.email);
        }

        persistOnboardingLocally(loginUser);

        if (!loginUser) {
          recordAuthOp({ step: 'login', status: 'error', detail: 'no user after all fallbacks', at: Date.now() });
          throw new Error('Could not load your profile. Please try again.');
        }
      } catch (signInErr: any) {
        const mapped = mapAuthError(signInErr, args.flow);
        setFieldError(mapped);
        setError(mapped.message);
        throw signInErr;
      }
    } catch (err: any) {
      console.error('[Auth] signIn error:', err);
      if (!error) {
        setError(err?.message || 'Authentication failed');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
    return loginUser;
  }, [signIn, waitForAuthenticatedUser, waitForConvexAuth, fetchBootstrapProfile, setBootstrappedIdentity, getOrCreateUser]);

  const persistOnboardingLocally = (userData: any) => {
    if (userData?.onboardingComplete) {
      try { localStorage.setItem('body-bridge_onboarding_complete', 'true'); } catch (e) { /* Safari private mode / restricted WebView */ }
    }
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFieldError(null);
    try {
      await signOut();
      setSessionUser(null);
      clearBootstrappedIdentity();
      const convexClient = convex as typeof convex & { clearAuth?: () => void };
      convexClient.clearAuth?.();
      try { localStorage.removeItem('body-bridge_onboarding_complete'); } catch (e) { }
    } catch (err: any) {
      setError(err?.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearBootstrappedIdentity, convex, signOut]);

  const clearFieldError = useCallback(() => {
    setFieldError(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated: isAuthenticatedFinal, isAuthLoading: isAuthLoading && !isForced, user, login, logout, isLoading, error, fieldError, clearFieldError, waitForConvexAuth }),
    [isAuthenticatedFinal, isAuthLoading, user, login, logout, isLoading, error, fieldError, clearFieldError, waitForConvexAuth]
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