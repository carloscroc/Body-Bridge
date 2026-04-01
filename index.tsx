
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import App from './App';
import { AuthProvider, AuthContext } from './services/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL');
}
const convex = new ConvexReactClient(convexUrl);

const isForced = typeof window !== 'undefined' && (new URL(window.location.href).searchParams.get('forceExercises') === '1' || new URL(window.location.href).searchParams.get('forceSettings') === '1');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (isForced) {
  // Simple mock provider for forced dev mode
  const mockValue = {
    isAuthenticated: true,
    isAuthLoading: false,
    user: { onboardingComplete: true, fullName: 'Local Developer' },
    login: async () => {},
    logout: async () => {},
    isLoading: false,
    error: null,
  };

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthContext.Provider value={mockValue}>
          <App />
        </AuthContext.Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ConvexAuthProvider client={convex}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConvexAuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
