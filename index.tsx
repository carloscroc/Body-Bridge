
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import App from './App';
import { AuthProvider } from './services/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const hasValidConvexUrl = Boolean(
  convexUrl && convexUrl !== 'YOUR_CONVEX_URL_HERE'
);
const convex = hasValidConvexUrl ? new ConvexReactClient(convexUrl) : null;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

function StartupIssueScreen() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/45">Startup Check</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">Forge is running, but app data is offline.</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          The UI was blank because the app crashed during startup when Convex was not configured.
          Forge now shows this screen instead of failing silently.
        </p>

        <div className="mt-6 space-y-3 text-sm text-white/80">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold text-white">Issue detected</p>
            <p className="mt-1 text-white/65">
              `VITE_CONVEX_URL` is missing or still set to the placeholder value in `.env.local`.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold text-white">What to fix</p>
            <p className="mt-1 text-white/65">
              Set a real Convex deployment URL in `.env.local`, then restart `npm run dev:all`.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold text-white">Also check</p>
            <p className="mt-1 text-white/65">
              Your backend server also failed to bind to port `3001`, so API requests will not reach Forge until that port conflict is resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {convex ? (
        <ConvexAuthProvider client={convex}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConvexAuthProvider>
      ) : (
        <StartupIssueScreen />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
