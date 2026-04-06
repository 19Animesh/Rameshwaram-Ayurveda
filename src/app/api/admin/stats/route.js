import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';


export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Admin-only endpoint
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      console.warn('GET /api/admin/stats — Unauthorized', { authUser });
      return errorResponse('Unauthorized', 401);
    }

    console.log('Admin stats requested', { userId: authUser.id });

    await connectToDatabase();

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      orders,
      lowStockProductsRaw,
      categoryGroups,
      topProductsRaw,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.find({}, 'totalAmount').lean(),
      Product.find({ stock: { $lt: 10 } }, 'name stock')
        .sort({ stock: 1 })
        .limit(20)
        .lean(),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Product.find({}, 'name reviewCount price')
        .sort({ reviewCount: -1 })
        .limit(5)
        .lean(),
    ]);

    const lowStockProducts = lowStockProductsRaw.map(p => ({
      id: p._id.toString(),
      name: p.name,
      stock: p.stock
    }));

    const topProducts = topProductsRaw.map(p => ({
      id: p._id.toString(),
      name: p.name,
      sales: p.reviewCount,
      revenue: (p.price || 0) * (p.reviewCount || 0)
    }));

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const categoryDistribution = {};
    for (const g of categoryGroups) {
      if (g._id) categoryDistribution[g._id] = g.count;
    }

    // ✅ Wrap in successResponse() so admin page's `statsFull.data` works correctly
    return successResponse({
      stats: { totalRevenue, totalOrders, totalProducts, totalCustomers },
      topProducts,
      lowStockProducts,
      categoryDistribution,
      recentOrders: [],
    });
  } catch (error) {
    console.error('Admin Stats GET Error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return errorResponse(isDev ? (error.stack || error.message) : 'Failed to fetch stats', 500);
  }
}
