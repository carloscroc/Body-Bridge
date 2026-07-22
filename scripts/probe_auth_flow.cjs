/**
 * Standalone auth-flow probe.
 * Runs against DEVELOPMENT Convex (upbeat-chickadee-781) to see exactly which step
 * fails: signIn → JWT present → /api/query auth → getOrCreateUser mutation →
 * completeOnboarding mutation.
 *
 * Usage: node scripts/probe_auth_flow.cjs
 *
 * This is a DIAGNOSTIC tool, not part of the test suite.
 */
const fs = require('fs');
const path = require('path');

const CONVEX_URL = 'https://upbeat-chickadee-781.convex.cloud';
const CONVEX_AUTH_URL = CONVEX_URL + '/api/auth';

const ts = Date.now();
const EMAIL = `probe_${ts}@example.com`;
const PASSWORD = 'ProbePass123!';
const NAME = `Probe ${ts}`;

function log(label, value) {
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  console.log(`[${label}] ${v}`);
}

async function main() {
  log('config', { CONVEX_URL, EMAIL });

  // Step 1: Sign up via Convex Auth password provider.
  // The auth endpoint expects FormData with email/password/flow.
  log('step', '1. signIn (signUp)');
  const form = new FormData();
  form.append('email', EMAIL);
  form.append('password', PASSWORD);
  form.append('flow', 'signUp');
  form.append('name', NAME);

  const signInRes = await fetch(`${CONVEX_AUTH_URL}/signIn/password`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  log('signIn status', signInRes.status);
  const signInText = await signInRes.text();
  log('signIn body', signInText.slice(0, 400));

  // Extract JWT from Set-Cookie or response
  const setCookie = signInRes.headers.get('set-cookie') || '';
  log('set-cookie', setCookie.slice(0, 200));

  // Step 2: Try to read the JWT. Convex Auth stores it via the /api/auth
  // endpoint, typically as a cookie or in the response body.
  log('step', '2. extract token');
  let token = null;
  try {
    const parsed = JSON.parse(signInText);
    token = parsed.token || parsed.access_token || parsed.jwt || null;
  } catch {}

  // If not in body, try the getFreshToken endpoint
  if (!token) {
    log('step', '2b. fetching token from /api/auth/getToken');
    const tokRes = await fetch(`${CONVEX_AUTH_URL}/getToken`, {
      credentials: 'include',
    });
    const tokText = await tokRes.text();
    log('getToken status', tokRes.status);
    log('getToken body', tokText.slice(0, 300));
    try {
      const parsed = JSON.parse(tokText);
      token = parsed.token || parsed.access_token || null;
    } catch {}
  }

  if (!token) {
    log('ERROR', 'No JWT token obtained. Cannot continue.');
    process.exit(1);
  }
  log('token', token.slice(0, 40) + '...');

  // Step 3: Test /api/query with the token (the getCurrentUser probe)
  log('step', '3. /api/query getCurrentUser with token');
  const queryRes = await fetch(`${CONVEX_URL}/api/query`, {
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
  const queryBody = await queryRes.text();
  log('query status', queryRes.status);
  log('query body', queryBody.slice(0, 400));

  // Step 4: getOrCreateUser mutation with the token
  log('step', '4. /api/mutation getOrCreateUser with token');
  const mutRes = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      path: 'functions/auth:getOrCreateUser',
      format: 'json',
      args: { email: EMAIL, fullName: NAME, authSource: 'client' },
    }),
  });
  const mutBody = await mutRes.text();
  log('mutation status', mutRes.status);
  log('mutation body', mutBody.slice(0, 400));

  // Step 5: completeOnboarding mutation with the token
  log('step', '5. /api/mutation completeOnboarding with token');
  const coRes = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      path: 'functions/auth:completeOnboarding',
      format: 'json',
      args: { fullName: NAME, goal: 'Strength', migratedFromLocal: true },
    }),
  });
  const coBody = await coRes.text();
  log('completeOnboarding status', coRes.status);
  log('completeOnboarding body', coBody.slice(0, 400));

  log('done', 'probe complete');
}

main().catch((err) => {
  log('FATAL', err?.stack || err?.message || String(err));
  process.exit(1);
});
