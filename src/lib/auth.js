/**
 * src/lib/auth.js
 * Server-side JWT helpers shared across API routes.
 * Eliminates duplicate token-verification code in every route.
 */
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'ayurvedic_jwt_secret_2024';

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
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  return verifyToken(token);
}
