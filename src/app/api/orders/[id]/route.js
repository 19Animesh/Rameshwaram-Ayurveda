import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';
export const dynamic = 'force-dynamic';

function deserialiseOrder(order) {
  return {
    ...order,
    total: order.totalAmount,
    address: order.shippingAddress || (() => {
      try { return JSON.parse(order.shippingAddr || '{}'); } catch { return {}; }
    })(),
    statusHistory: [{ status: order.status, date: order.updatedAt, note: `Order ${order.status}` }],
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    await connectToDatabase();
    // Mongoose query. `items` are embedded, so no need for `include` equivalent directly, just lean()
    const orderRaw = await Order.findById(id).lean();
    
    if (!orderRaw) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const { _id, ...rest } = orderRaw;
    const order = { ...rest, id: _id.toString() };

    // Done above

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

    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    const existing = await Order.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedRaw = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
    const { _id, ...rest } = updatedRaw;
    const updated = { ...rest, id: _id.toString() };

    return NextResponse.json({ order: deserialiseOrder(updated) });
  } catch (error) {
    console.error('Order PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
