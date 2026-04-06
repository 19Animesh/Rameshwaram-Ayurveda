import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch unique categories and brands directly from database
    const rawCategories = await Product.distinct('category');
    const rawBrands = await Product.distinct('brandName');

    // Clean up empty strings or nulls and sort
    const validCategories = rawCategories.filter(Boolean).sort();
    const validBrands = rawBrands.filter(Boolean).sort();

    // Map to objects matching frontend structure
    const categories = validCategories.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name
    }));

    return successResponse({ categories, brands: validBrands });
  } catch (error) {
    console.error("❌ Products API Filters GET Error:", error);
    return errorResponse('Failed to fetch filters', 500);
  }
}
