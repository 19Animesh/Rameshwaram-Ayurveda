/**
 * src/middleware.js
 * Edge middleware guarding admin, checkout and order-write routes.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * The module previously threw at import time if JWT_SECRET was unset. In Edge
 * middleware that is the worst possible place to throw: it breaks every single
 * matched request, including the login page users would need to recover. The
 * secret is now read per-request, and a missing secret fails closed (deny)
 * with a clear log line rather than crashing the runtime.
 */
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { enforceAdminPhoneList } from '@/lib/adminPhones';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

/** Returns the JWT payload, or null if absent/invalid. */
async function readToken(request) {
  const authHeader = request.headers.get('authorization');
  const token =
    (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null) ||
    request.cookies.get('token')?.value;

  if (!token) return null;

  const key = getSecretKey();
  if (!key) {
    console.error('[middleware] JWT_SECRET is not set — denying protected routes.');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key);
    // Same rule as lib/auth.js: phone-granted admin ends when the number is
    // removed from the admin list.
    return enforceAdminPhoneList(payload);
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── Admin UI ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const payload = await readToken(request);
    if (!payload || payload.role !== 'admin') {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── Admin API ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    const payload = await readToken(request);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
  }

  // ── Checkout ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/checkout')) {
    const payload = await readToken(request);
    if (!payload) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('next', '/checkout');
      return NextResponse.redirect(url);
    }
  }

  // ── Order writes ──────────────────────────────────────────────────────
  if (pathname.startsWith('/api/orders') && request.method !== 'GET') {
    const payload = await readToken(request);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to place an order.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin',
    '/api/admin/:path*',
    '/checkout',
    '/checkout/:path*',
    '/api/orders',
    '/api/orders/:path*',
  ],
};
