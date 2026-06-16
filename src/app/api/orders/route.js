import { NextResponse } from 'next/server';
import { getOrders, placeOrder } from '@/services/orderService';
import { orderSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getUserFromRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    // 1. Literal string "undefined" is always a bug from client state
    if (userId === 'undefined' || userId === 'null') {
      return successResponse({ orders: [], total: 0, page, limit });
    }

    // 2. Authorization check
    const isAdmin = authUser?.role === 'admin';
    const finalUserId = userId || null;

    // 3. Security: Regular users can only see their own orders
    if (!isAdmin) {
      if (!authUser) return errorResponse('Unauthorized', 401);
      // If a userId was passed, it must match the logged-in user
      if (finalUserId && finalUserId !== authUser.userId?.toString()) {
        return errorResponse('Forbidden', 403);
      }
      // If no userId passed, default to their own
      const secureId = finalUserId || authUser.userId;
      const { orders, total } = await getOrders(secureId, { page, limit });
      return successResponse({ orders, total, page, limit });
    }

    // 4. Admins can fetch specific user or ALL (if finalUserId is null) — paginated
    const { orders, total } = await getOrders(finalUserId, { page, limit });
    return successResponse({ orders, total, page, limit });
  } catch (error) {
    console.error('Orders GET Error:', error);
    return errorResponse('Failed to fetch orders');
  }
}

export async function POST(request) {
  // ⛔ INSECURE ROUTE DISABLED.
  // Order creation is now strictly handled through /api/payment/verify
  return errorResponse('Method Not Allowed: Use /api/payment/create-order and /api/payment/verify to create orders.', 405);
}
