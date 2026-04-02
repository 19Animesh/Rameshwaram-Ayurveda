import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Admin-only endpoint
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all stats from Prisma in parallel
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      orders,
      lowStockProducts,
      categoryGroups,
      topProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.order.findMany({ select: { totalAmount: true } }),
      prisma.product.findMany({
        where: { stock: { lt: 50 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 20,
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.product.findMany({
        select: { id: true, name: true, reviewCount: true, price: true },
        orderBy: { reviewCount: 'desc' },
        take: 5,
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const categoryDistribution = {};
    for (const g of categoryGroups) {
      categoryDistribution[g.category] = g._count.id;
    }

    return NextResponse.json({
      stats: { totalRevenue, totalOrders, totalProducts, totalCustomers },
      topProducts: topProducts.map(p => ({
        id: p.id, name: p.name,
        sales: p.reviewCount,
        revenue: p.price * p.reviewCount,
      })),
      lowStockProducts,
      categoryDistribution,
      recentOrders: [], // Can add if needed later
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
