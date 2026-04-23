import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/clear-orders
 * Admin-only endpoint to delete all orders (for clearing demo data).
 */
export async function DELETE(request) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
