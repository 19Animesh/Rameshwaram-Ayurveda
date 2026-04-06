/**
 * src/lib/auth.js
 * Server-side JWT helpers shared across API routes.
 * Eliminates duplicate token-verification code in every route.
 */
import jwt from 'jsonwebtoken';

// ✅ Must match the fallback in src/middleware.js — both must be identical
const SECRET = process.env.JWT_SECRET || 'rameshwaram-ayurveda-super-secret-2026';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/** Extract verified user from an API Request's Authorization header. */
export function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  let token = authHeader.replace('Bearer ', '').trim();
  
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/);
    if (match && match[1]) {
      token = match[1];
    }
  }

  if (!token) {
    console.warn('[auth] getUserFromRequest: No token found in Authorization header');
    return null;
  }
  
  const user = verifyToken(token);
  if (!user) {
    console.warn('[auth] getUserFromRequest: Token verification failed (expired or invalid secret)');
  } else {
    console.info('[auth] getUserFromRequest: Decoded user =', { id: user.id, role: user.role, email: user.email });
  }
  return user;
}
