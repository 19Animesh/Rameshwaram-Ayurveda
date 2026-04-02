import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadImage } from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/products
 * 
 * Supports filtering, sorting, and PAGINATION via SQLite:
 *   ?page=1       → page number (default: 1)
 *   ?limit=12     → products per page (default: 12)
 *   ?search=...   → search by name, brand, description
 *   ?category=... → filter by category
 *   ?brand=...    → filter by brand
 *   ?minPrice=... → minimum price filter
 *   ?maxPrice=... → maximum price filter
 *   ?sort=...     → price-asc, price-desc, rating, name
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Extract query parameters ──
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');

    // ── Pagination params ──
    const fetchAll = searchParams.get('all') === 'true'; // admin bypass
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = fetchAll ? 10000 : Math.max(1, Math.min(100, parseInt(searchParams.get('limit')) || 12));

    // ── Build Prisma WHERE clause ──
    const featured = searchParams.get('featured');
    const where = {};
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // ── Build Prisma ORDER BY clause ──
    let orderBy = [];
    if (sort) {
      switch (sort) {
        case 'price-asc':  orderBy.push({ price: 'asc' }); break;
        case 'price-desc': orderBy.push({ price: 'desc' }); break;
        case 'rating':     orderBy.push({ rating: 'desc' }); break;
        case 'name':       orderBy.push({ name: 'asc' }); break;
      }
    }

    // ── Query Database ──
    const total = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      skip: (page - 1) * limit,
      take: limit,
      include: { variants: true } // Include variants in response
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Add a new product — Admin only.
 */
export async function POST(request) {
  try {
    // Admin guard
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Auto-generate ID if not provided
    const productCount = await prisma.product.count();
    const id = data.id || `prod_${String(productCount + 1).padStart(3, '0')}`;

    const newProduct = await prisma.product.create({
      data: {
        id,
        name: data.name,
        brand: data.brand || 'Store Brand',
        category: data.category || 'general-wellness',
        description: data.description || '',
        price: data.price || 0,
        originalPrice: data.originalPrice || data.price || 0,
        stock: data.stock || 50,
        expiryDate: data.expiryDate || new Date(Date.now() + 31536000000).toISOString(),
        dosage: data.dosage || '',
        howToConsume: data.howToConsume || '',
        sideEffects: data.sideEffects || '',
        featured: data.featured || false,
        image: data.image?.startsWith('data:image/') 
                   ? await uploadImage(data.image) 
                   : (data.image || `/images/placeholder.jpg`)
      },
      include: { variants: true }
    });
    
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Products Create API Error:', error);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

