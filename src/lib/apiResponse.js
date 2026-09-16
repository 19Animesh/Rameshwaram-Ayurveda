/**
 * src/lib/apiResponse.js
 * Consistent JSON envelope for every API route.
 *
 * Every response is `{ success: boolean, ... }` so clients can branch on one
 * field. Success payloads live under `data`; failures carry `error` and an
 * optional `details` array.
 */
import { NextResponse } from 'next/server';

export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message = 'Internal Server Error', status = 500, errors = null) {
  const payload = { success: false, error: message };
  if (errors) payload.details = errors;
  return NextResponse.json(payload, { status });
}

/**
 * Turns a caught exception into an appropriate response.
 *
 * WHY THIS EXISTS
 * ---------------
 * Routes previously did `catch (e) { return errorResponse('Failed to ...') }`,
 * which collapsed every distinct failure into one indistinguishable 500. A
 * database outage, a validation bug and a Cloudinary timeout all looked the
 * same from the browser, so the only way to diagnose anything was to read
 * server logs.
 *
 * Now:
 *   - Connection failures return 503 with a message naming the likely cause,
 *     so the client can show "temporarily unavailable" rather than "error".
 *   - In development the real message is returned to the browser.
 *   - In production the generic message is returned, but the full error is
 *     always logged server-side with a short reference code that also appears
 *     in the response — so a user can quote it and you can grep for it.
 *
 * @param {unknown} error    The caught exception.
 * @param {string} fallback  User-facing message for unexpected failures.
 */
export function failure(error, fallback = 'Something went wrong') {
  const isDev = process.env.NODE_ENV !== 'production';
  const ref = Math.random().toString(36).slice(2, 8).toUpperCase();

  console.error(`[api:${ref}]`, error);

  if (error?.isConnectionError) {
    return errorResponse(
      isDev
        ? error.message
        : `The service is temporarily unavailable. Please try again shortly. (ref ${ref})`,
      503
    );
  }

  return errorResponse(
    isDev ? error?.stack || error?.message || String(error) : `${fallback} (ref ${ref})`,
    500
  );
}

/**
 * Adds CDN cache headers to a response.
 *
 * WHY: every product request previously woke a serverless function and queried
 * MongoDB, even though the catalogue is identical for every visitor and changes
 * rarely. With these headers Vercel's edge network answers repeat requests
 * directly.
 *
 * `s-maxage` applies to the shared CDN cache only — browsers are told not to
 * cache, so a customer always sees fresh stock after a hard refresh.
 * `stale-while-revalidate` lets the CDN serve the slightly-old copy instantly
 * while it fetches a new one in the background.
 *
 * ONLY use this on responses that are the same for every user. Never on
 * anything derived from a session.
 *
 * @param {Response} response
 * @param {number} sMaxAge  Seconds the CDN may serve without revalidating.
 * @param {number} swr      Extra seconds it may serve a stale copy.
 */
export function withCache(response, sMaxAge = 60, swr = 300) {
  response.headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
  );
  return response;
}
