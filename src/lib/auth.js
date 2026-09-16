/**
 * src/lib/auth.js
 * Server-side JWT helpers shared across API routes.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. The module-level `throw` on a missing JWT_SECRET was removed. Any route
 *    importing this file crashed at load time rather than returning a useful
 *    error. The check is now performed inside the functions that need it.
 * 2. Removed console logging of decoded user identity. Writing user IDs and
 *    roles to logs on every authenticated request is needless PII exposure.
 * 3. Cookie parsing rewritten. The old regex could match cookies whose names
 *    merely ended in "token" (e.g. `csrf_token`).
 */
import jwt from 'jsonwebtoken';
import { enforceAdminPhoneList } from '@/lib/adminPhones';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Authentication cannot work. Add it to .env locally, or under Settings -> Environment Variables in Vercel.'
    );
  }
  return secret;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, getSecret());
  } catch {
    return null;
  }
  // Admin granted through the phone list ends as soon as the number is
  // removed from lib/adminPhones.js, even if the token has not expired.
  return enforceAdminPhoneList(payload);
}

/** Reads a single cookie by exact name from a raw Cookie header. */
function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/**
 * Extracts the verified user from a Request.
 * Checks the Authorization header first, then the httpOnly `token` cookie.
 * Returns null when there is no valid token — callers decide the status code.
 */
export function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  let token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    token = readCookie(request.headers.get('cookie'), 'token') || '';
  }
  if (!token) return null;

  return verifyToken(token);
}

/** True when the request carries a valid admin token. */
export function isAdminRequest(request) {
  const user = getUserFromRequest(request);
  return Boolean(user && user.role === 'admin');
}
