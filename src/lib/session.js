/**
 * src/lib/session.js
 * Centralised session cookie handling.
 *
 * WHY THIS EXISTS
 * ---------------
 * Cookie options were duplicated across four auth routes with slightly
 * different values, which is how auth bugs start. They now live in one place.
 *
 * Two cookies are set together:
 *   - `token`       httpOnly JWT. The browser cannot read it, which is the point.
 *   - `has_session` readable, valueless hint. Lets the client skip a doomed
 *                   /api/auth/profile request for anonymous visitors instead
 *                   of firing one failed call on every page load.
 */

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/** Attaches session cookies to a NextResponse. */
export function setSessionCookies(response, token) {
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('token', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_SECONDS,
    path: '/',
  });

  response.cookies.set('has_session', '1', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_SECONDS,
    path: '/',
  });

  return response;
}

/** Clears both session cookies. */
export function clearSessionCookies(response) {
  const secure = process.env.NODE_ENV === 'production';
  const expired = { expires: new Date(0), path: '/', secure, sameSite: 'lax' };

  response.cookies.set('token', '', { ...expired, httpOnly: true });
  response.cookies.set('has_session', '', { ...expired, httpOnly: false });

  return response;
}

export { SEVEN_DAYS_SECONDS };
