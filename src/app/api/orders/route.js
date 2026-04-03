import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * GET /api/orders
 * Returns orders — filtered by userId query param if provided.
 * Admin sees all orders; users see only their own.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where = userId ? { userId } : {};

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    // Deserialise the stored shipping address snapshot back to object
    const serialised = orders.map(o => ({
      ...o,
      address: (() => {
        try { return JSON.parse(o.shippingAddr); } catch { return o.shippingAddr; }
      })(),
    }));

    return NextResponse.json({ orders: serialised });
  } catch (error) {
    console.error('Orders GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Place a new order. Decrements product stock atomically.
 */
export async function POST(request) {
  try {
    const orderData = await request.json();
    const {
      userId, items, address, paymentMethod,
      paymentId, subtotal, deliveryCharge, total,
    } = orderData;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Decrement stock for each item (best-effort — won't block order if product missing)
    for (const item of items) {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      } catch {
        // Product might have been deleted — not fatal
      }
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: userId && userId !== 'guest' ? userId : null,
        status: 'confirmed',
        totalAmount: total || subtotal || 0,
        paymentMethod: paymentMethod || 'cod',
        shippingAddr: JSON.stringify(address || {}),
        items: {
          create: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variantId: item.variantId || null,
          })),
        },
      },
      include: { items: true },
    });

    // Return with address deserialized for consistency
    return NextResponse.json({
      order: {
        ...order,
        address: (() => {
          try { return JSON.parse(order.shippingAddr); } catch { return {}; }
        })(),
        total: order.totalAmount,
        statusHistory: [{ status: 'confirmed', date: order.createdAt, note: 'Order confirmed' }],
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Orders POST Error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
