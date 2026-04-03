import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

function deserialiseOrder(order) {
  return {
    ...order,
    total: order.totalAmount,
    address: (() => {
      try { return JSON.parse(order.shippingAddr); } catch { return {}; }
    })(),
    statusHistory: [{ status: order.status, date: order.updatedAt, note: `Order ${order.status}` }],
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Optional: restrict to order owner or admin
    const authUser = getUserFromRequest(request);
    if (authUser && authUser.role !== 'admin' && order.userId && order.userId !== authUser.userId) {
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
    const { id } = await params;

    // Only admins can update order status
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json({ order: deserialiseOrder(updated) });
  } catch (error) {
    console.error('Order PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
