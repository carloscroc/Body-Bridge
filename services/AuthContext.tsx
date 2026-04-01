import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery, useConvex } from 'convex/react';
import { api } from '../convex/_generated/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: any | null | undefined;
  login: (args: { email: string; password: string; name?: string; flow: 'signIn' | 'signUp' }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();

  // Dev override
  const isForced = false;

  const userQuery = useQuery(api.functions.auth.getCurrentUser, isForced ? 'skip' : { authSource: 'client' });
  
  const user = isForced ? { onboardingComplete: true, fullName: 'Local Developer' } : userQuery;
  const isAuthenticatedFinal = isAuthenticated || isForced;

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
        await signIn('password', formData);
        // Force a brief delay and check if we're still on the auth page
        setTimeout(() => {
          if (window.location.pathname === '/' || window.location.hash === '#/auth') {
            window.location.href = '/dashboard';
          }
        }, 800);
      } catch (signInErr: any) {
        // 2. If we reach here, we know the account exists (for signIn) or doesn't exist (for signUp).
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
  }, [convex, signIn]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
    } catch (err: any) {
      setError(err?.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  const value = useMemo(
    () => ({ isAuthenticated: isAuthenticatedFinal, isAuthLoading: isAuthLoading && !isForced, user, login, logout, isLoading, error }),
    [isAuthenticatedFinal, isAuthLoading, isForced, user, login, logout, isLoading, error]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
