/**
 * src/lib/auth.js
 * Server-side JWT helpers shared across API routes.
 * Eliminates duplicate token-verification code in every route.
 */
import jwt from 'jsonwebtoken';

// JWT_SECRET is strictly required for production
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}

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
    // Reliable cookie extraction: split on ';', find token= entry, rejoin on '=' to preserve base64 padding
    const tokenCookie = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=').slice(1).join('=');
    }
  }

  if (!token) {
    console.warn('[auth] getUserFromRequest: No token found in Authorization header');
    return null;
  }
  
  const user = verifyToken(token);
  if (!user) {
    console.warn('[auth] getUserFromRequest: Token verification failed (expired or invalid secret)');
  }
  return user;
}
