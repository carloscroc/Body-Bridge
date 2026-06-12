
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import App from './App';
import { AuthProvider } from './services/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const normalizedConvexUrl = typeof convexUrl === 'string' && convexUrl !== 'YOUR_CONVEX_URL_HERE' && convexUrl !== 'null' && convexUrl !== 'undefined'
  ? convexUrl
  : null;
const convex = normalizedConvexUrl ? new ConvexReactClient(normalizedConvexUrl) : null;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

function StartupIssueScreen({
  title,
  issue,
  fix,
  extra,
  onRetry,
}: {
  title: string;
  issue: string;
  fix: string;
  extra: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/45">Startup Check</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
      The UI was blank because the app crashed during startup when Convex was unavailable.
      Body Bridge now shows this screen instead of failing silently.
        </p>

        <div className="mt-6 space-y-3 text-sm text-white/80">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold text-white">Issue detected</p>
            <p className="mt-1 text-white/65">
              {issue}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold text-white">What to fix</p>
            <p className="mt-1 text-white/65">
              {fix}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold text-white">Also check</p>
            <p className="mt-1 text-white/65">
              {extra}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-8 w-full rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/15 border-t-white animate-spin" />
        <p className="mt-5 text-sm font-semibold text-white">Connecting...</p>
        <p className="mt-2 text-sm text-white/60">
          Waiting for the Convex app data service to respond.
        </p>
      </div>
    </div>
  );
}

function BootstrapRoot() {
  const [convexStatus, setConvexStatus] = useState<'checking' | 'ready' | 'offline'>(convex ? 'checking' : 'offline');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!normalizedConvexUrl) {
      setConvexStatus('offline');
      return;
    }

    setConvexStatus('checking');

    let cancelled = false;
    const controller = new AbortController();
    // Increased timeout to 15s to account for slow local backend startup
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    void fetch(normalizedConvexUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    })
      .then(() => {
        if (!cancelled) {
          setConvexStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConvexStatus('offline');
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [retryNonce]);

  if (!convex) {
    return (
        <StartupIssueScreen
          title="Body Bridge is running, but app data is offline."
          issue="`VITE_CONVEX_URL` is missing or still set to the placeholder value in your environment config."
          fix="Set a real Convex deployment URL in your env file (`.env.local` for dev, `.env.production` for builds), then restart."
          extra="Your backend server also needs port `3001` available so proxied API calls can succeed."
          onRetry={() => setRetryNonce(n => n + 1)}
        />
    );
  }

  if (convexStatus === 'checking') {
    return <LoadingScreen />;
  }

  if (convexStatus === 'offline') {
    return (
        <StartupIssueScreen
          title="Body Bridge is running, but Convex is not reachable."
          issue="The frontend found `VITE_CONVEX_URL`, but the Convex service did not respond in time."
          fix="Check your internet connection. If running locally, make sure Convex is started. If on a built app, the deployment URL may be incorrect."
          extra="If Convex asks to upgrade in the terminal, update the `convex` package or run the upgrade interactively before retrying."
          onRetry={() => setRetryNonce(n => n + 1)}
        />
    );
  }

  return (
    <ConvexAuthProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConvexAuthProvider>
  );
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BootstrapRoot />
    </ErrorBoundary>
  </React.StrictMode>
);
