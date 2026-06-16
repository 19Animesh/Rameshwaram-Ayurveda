import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/clear-orders?confirm=DELETE_ALL_ORDERS
 * Admin-only endpoint to delete all orders (for clearing demo data).
 * Requires ?confirm=DELETE_ALL_ORDERS query param as a safety guard.
 */
export async function DELETE(request) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safety guard — must explicitly confirm the destructive action
    const { searchParams } = new URL(request.url);
    if (searchParams.get('confirm') !== 'DELETE_ALL_ORDERS') {
      return NextResponse.json(
        { error: 'Missing confirmation. Add ?confirm=DELETE_ALL_ORDERS to proceed.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const result = await Order.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} orders.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Clear orders error:', error);
    return NextResponse.json({ error: 'Failed to clear orders' }, { status: 500 });
  }
}
