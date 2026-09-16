import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const OBJECTID_RE = /^[a-fA-F0-9]{24}$/;

/** The statuses the admin panel offers. Anything else is rejected. */
const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_NOTES = {
  confirmed: 'Order confirmed',
  processing: 'Order is being prepared',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled',
};

/**
 * Shapes an order for the tracking page.
 *
 * `statusHistory` used to be invented from the current status alone, so the
 * "Status History" card only ever showed one line. Real history is now
 * recorded on every change (see PUT) and returned here, oldest first. Orders
 * saved before this change fall back to the single current-status line.
 */
function deserialiseOrder(order) {
  const recorded = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const statusHistory = recorded.length
    ? recorded.map((h) => ({
        status: h.newStatus,
        date: h.changedAt,
        note: STATUS_NOTES[h.newStatus] || `Order ${h.newStatus}`,
      }))
    : [{ status: order.status, date: order.updatedAt, note: STATUS_NOTES[order.status] || `Order ${order.status}` }];

  return {
    ...order,
    total: order.totalAmount,
    address: order.shippingAddress || (() => {
      try { return JSON.parse(order.shippingAddr || '{}'); } catch { return {}; }
    })(),
    statusHistory,
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // A malformed id is simply "not found", not a server error.
    if (!OBJECTID_RE.test(String(id))) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await connectToDatabase();
    const orderRaw = await Order.findById(id).lean();

    if (!orderRaw) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { _id, ...rest } = orderRaw;
    const order = { ...rest, id: _id.toString() };

    // Strict ownership check: restrict to order owner or admin
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role !== 'admin' && order.userId && order.userId.toString() !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order: deserialiseOrder(order) });
  } catch (error) {
    console.error('Order GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    // Only admins can update order status
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!OBJECTID_RE.test(String(id))) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : '';
    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Order.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let updatedRaw = existing;
    if (existing.status !== status) {
      updatedRaw = await Order.findByIdAndUpdate(
        id,
        {
          $set: { status },
          $push: {
            statusHistory: {
              previousStatus: existing.status,
              newStatus: status,
              changedAt: new Date(),
              changedBy: authUser.userId,
            },
          },
        },
        { new: true }
      ).lean();
    }

    const { _id, ...rest } = updatedRaw;
    const updated = { ...rest, id: _id.toString() };

    return NextResponse.json({ order: deserialiseOrder(updated) });
  } catch (error) {
    console.error('Order PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
