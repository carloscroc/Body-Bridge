import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-256-bit-secret';

const OIDC_ISSUER = process.env.OIDC_ISSUER;
const OIDC_AUDIENCE = process.env.OIDC_AUDIENCE;

const getJwksUrl = () => {
  if (!OIDC_ISSUER) return null;
  const issuer = OIDC_ISSUER.replace(/\/$/, '');
  return new URL(`${issuer}/.well-known/jwks.json`);
};

const OIDC_JWKS = (() => {
  const url = getJwksUrl();
  return url ? createRemoteJWKSet(url) : null;
})();

const getCookie = (req, name) => {
  const header = req.headers?.cookie;
  if (!header) return null;
  const parts = header.split(';').map((p) => p.trim());
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx);
    if (k === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers?.authorization;
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (bearer) return bearer;
  return getCookie(req, 'forge_session');
};

const verifyDevJwt = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const verifyOidcJwt = async (token) => {
  if (!OIDC_ISSUER || !OIDC_AUDIENCE || !OIDC_JWKS) {
    throw new Error('OIDC verifier not configured');
  }
  const { payload } = await jwtVerify(token, OIDC_JWKS, {
    issuer: OIDC_ISSUER,
    audience: OIDC_AUDIENCE,
  });
  return payload;
};

export const authenticateToken = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    if (process.env.NODE_ENV === 'development' && process.env.REQUIRE_AUTH !== 'true') {
        logger.warn('Unauthenticated request allowed in development mode (set REQUIRE_AUTH=true to enforce)');
        return next();
    }
    logger.warn('Unauthorized access attempt: No token provided');
    return res.sendStatus(401);
  }

  try {
    // If OIDC is configured and the request provided a Bearer token, verify via JWKS.
    const authHeader = req.headers?.authorization;
    const isBearer = !!(authHeader && authHeader.startsWith('Bearer '));
    const user = (OIDC_ISSUER && OIDC_AUDIENCE && isBearer)
      ? await verifyOidcJwt(token)
      : verifyDevJwt(token);

    req.user = user;
    return next();
  } catch (err) {
    logger.warn('Forbidden access attempt: Invalid token', { error: err?.message || String(err) });
    return res.sendStatus(403);
  }
};
