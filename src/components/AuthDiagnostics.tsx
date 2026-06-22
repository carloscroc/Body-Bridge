import React, { useEffect, useState } from 'react';

/**
 * In-app auth diagnostics overlay.
 *
 * Why this exists: in the APK we have no DevTools, and the login/onboarding
 * flow was silently failing (mutations returning null were swallowed). This
 * panel surfaces the exact state the auth pipeline is in so we can see *where*
 * it breaks on a real device.
 *
 * Gated off by default. Enabled when:
 *   - running in dev (`import.meta.env.DEV`), OR
 *   - built with `VITE_DIAG=1` (used for debug APK builds)
 *
 * Toggle with: 5 quick taps on the app title, or `?diag=1` in the URL.
 */

const DIAG_ENABLED =
  import.meta.env.DEV === true || import.meta.env.VITE_DIAG === '1';

/** Most recent auth operation result, for the panel to display. */
export type AuthOpStatus = {
  step: string;
  status: 'pending' | 'success' | 'error' | 'noop';
  detail?: string;
  at: number;
};

let listeners: Array<() => void> = [];
let current: AuthOpStatus | null = null;

/** Record the result of an auth step (login, getOrCreateUser, completeOnboarding, …). */
export function recordAuthOp(status: AuthOpStatus) {
  current = status;
  // Mirror to console so headless test runs / APK remote logs can see the flow.
  // eslint-disable-next-line no-console
  console.log(`[AUTH_DIAG] ${status.step} -> ${status.status}${status.detail ? ` | ${status.detail}` : ''}`);
  listeners.forEach((l) => l());
}

/** Subscribe to the latest auth-op status. Returns the current value + unsubscribe. */
function useAuthOpStatus(): AuthOpStatus | null {
  const [value, setValue] = useState<AuthOpStatus | null>(current);
  useEffect(() => {
    const l = () => setValue(current);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return value;
}

function readStoredTokenState() {
  if (typeof window === 'undefined') return { jwt: false, refresh: false };
  const keys = Object.keys(window.localStorage);
  return {
    jwt: keys.some((k) => k.startsWith('__convexAuthJWT_')),
    refresh: keys.some((k) => k.startsWith('__convexAuthRefreshToken_')),
    bootstrapEmail: !!window.localStorage.getItem('body-bridge_last_auth_email'),
  };
}

const AuthDiagnostics: React.FC<{ authSnapshot?: () => any }> = ({ authSnapshot }) => {
  const [open, setOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [, forceTick] = useState(0);
  const lastOp = useAuthOpStatus();

  // Open via ?diag=1
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('diag=1')) {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-refresh every second while open so the live state is visible
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => forceTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // 5-tap-to-open gesture on the whole overlay trigger area
  useEffect(() => {
    if (!DIAG_ENABLED) return;
    if (tapCount === 0) return;
    const id = window.setTimeout(() => setTapCount(0), 1500);
    if (tapCount >= 5) {
      setOpen((o) => !o);
      setTapCount(0);
    }
    return () => window.clearTimeout(id);
  }, [tapCount]);

  if (!DIAG_ENABLED) return null;

  const stored = readStoredTokenState();
  const snap = (() => {
    try {
      return authSnapshot ? authSnapshot() : null;
    } catch {
      return null;
    }
  })();

  const row = (label: string, value: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, padding: '2px 0' }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all' }}>
        {value === undefined ? 'undefined' : value === null ? 'null' : typeof value === 'boolean' ? String(value) : value}
      </span>
    </div>
  );

  return (
    <>
      {/* Invisible 5-tap zone, bottom-right corner */}
      <div
        data-testid="auth-diag-trigger"
        onClick={() => setTapCount((c) => c + 1)}
        style={{ position: 'fixed', bottom: 0, right: 0, width: 60, height: 60, zIndex: 9998 }}
      />

      {open && (
        <div
          data-testid="auth-diag-panel"
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 9999,
            maxWidth: 420,
            margin: '0 auto',
            background: 'rgba(0,0,0,0.92)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: 12,
            color: '#fff',
            fontSize: 11,
            fontFamily: 'ui-monospace, monospace',
            backdropFilter: 'blur(6px)',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ letterSpacing: 1 }}>AUTH DIAGNOSTICS</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '2px 8px', fontSize: 10 }}
            >
              close
            </button>
          </div>

          <section style={{ marginBottom: 8, opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.6 }}>ENV</div>
            {row('VITE_CONVEX_URL', import.meta.env.VITE_CONVEX_URL ?? '(unset)')}
            {row('VITE_DIAG', import.meta.env.VITE_DIAG ?? '(unset)')}
            {row('platform', (typeof navigator !== 'undefined' && navigator.userAgent) || 'unknown')}
          </section>

          <section style={{ marginBottom: 8, opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.6 }}>AUTH SNAPSHOT</div>
            {snap ? (
              <>
                {row('isAuthenticated', snap.isAuthenticated)}
                {row('isAuthLoading', snap.isAuthLoading)}
                {row('user.email', snap.user?.email)}
                {row('user.onboardingComplete', snap.user?.onboardingComplete)}
                {row('user._id', snap.user?._id)}
                {row('user.userId', snap.user?.userId)}
              </>
            ) : (
              <div style={{ opacity: 0.5 }}>no snapshot wired</div>
            )}
          </section>

          <section style={{ marginBottom: 8, opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.6 }}>STORAGE</div>
            {row('JWT present', stored.jwt)}
            {row('Refresh token', stored.refresh)}
            {row('bootstrap email', stored.bootstrapEmail)}
          </section>

          <section style={{ opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.6 }}>LAST AUTH OP</div>
            {lastOp ? (
              <>
                {row('step', lastOp.step)}
                {row('status', lastOp.status)}
                {row('detail', lastOp.detail)}
                {row('at', new Date(lastOp.at).toLocaleTimeString())}
              </>
            ) : (
              <div style={{ opacity: 0.5 }}>none yet</div>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default AuthDiagnostics;
