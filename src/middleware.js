import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretStr = process.env.JWT_SECRET;
if (!secretStr) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = new TextEncoder().encode(secretStr);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect Admin UI Routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.redirect(new URL('/auth/login', request.url));

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== 'admin') throw new Error('Unauthorized');
    } catch {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Protect Admin API Routes
  if (pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== 'admin') throw new Error('Forbidden');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Protect Checkout Route
  if (pathname.startsWith('/checkout')) {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Protect Orders POST API
  if (pathname.startsWith('/api/orders') && request.method === 'POST') {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in to place an order.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin', '/admin/:path*', 
    '/api/admin', '/api/admin/:path*', 
    '/checkout', '/checkout/:path*', 
    '/api/orders', '/api/orders/:path*'
  ],
};
