import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery, useConvex, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();
  const getOrCreateUser = useMutation(api.functions.auth.getOrCreateUser);

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

        const createdOrFound = await getOrCreateUser({
          email: args.email,
          fullName: args.name,
          authSource: 'client',
        });

        const currentUser = await waitForAuthenticatedUser();
        loginUser = currentUser ?? createdOrFound ?? null;

        if (loginUser) {
          setSessionUser(loginUser);
          setBootstrappedIdentity(loginUser, args.email);
        } else {
          const bootstrapProfile = await fetchBootstrapProfile(args.email);
          if (bootstrapProfile) {
            loginUser = bootstrapProfile;
            setSessionUser(bootstrapProfile);
            setBootstrappedIdentity(bootstrapProfile, args.email);
          }
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
  }, [signIn, waitForAuthenticatedUser, fetchBootstrapProfile, setBootstrappedIdentity, getOrCreateUser]);

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
    () => ({ isAuthenticated: isAuthenticatedFinal, isAuthLoading: isAuthLoading && !isForced, user, login, logout, isLoading, error, fieldError, clearFieldError }),
    [isAuthenticatedFinal, isAuthLoading, user, login, logout, isLoading, error, fieldError, clearFieldError]
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