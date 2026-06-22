import { getProducts, createProduct } from '@/services/productService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getUserFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import Product from '@/models/Product';
import connectToDatabase from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// =====================
// GET PRODUCTS
// =====================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = parseInt(searchParams.get('page'));
    const limitParam = parseInt(searchParams.get('limit'));

    const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = !isNaN(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 12;

    const productsResult = await getProducts({
      page,
      limit,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sort: searchParams.get('sort') || undefined,
      ...(searchParams.get('featured') === 'true' ? { featured: true } : {}),
      fetchAll: searchParams.get('all') === 'true',
    });

    return successResponse(productsResult);

  } catch (error) {
    console.error("❌ Products API GET Error:", error);

    const isDev = process.env.NODE_ENV !== 'production';
    return errorResponse(
      isDev ? (error.stack || error.message || String(error)) : 'Failed to fetch products',
      500
    );

  }
}

// =====================
// CREATE PRODUCT
// =====================
export async function POST(request) {
  try {
    const authUser = getUserFromRequest(request);

    if (!authUser || authUser.role !== 'admin') {
      console.warn("⚠️ Unauthorized attempt:", authUser);
      return errorResponse('Unauthorized', 401);
    }

    const data = await request.json();

    // Validate required fields server-side
    if (!data.name?.trim()) {
      return errorResponse('Product name is required', 400);
    }
    const price = Number(data.price);
    if (!price || price <= 0 || isNaN(price)) {
      return errorResponse('A valid selling price greater than 0 is required', 400);
    }
    const stock = Number(data.stock);
    if (isNaN(stock) || stock < 0) {
      return errorResponse('Stock must be 0 or greater', 400);
    }

    // Ensure DB connection
    await connectToDatabase();

    // Auto-generate ID
    const productCount = await Product.countDocuments();
    const id = data.id || `prod_${String(productCount + 1).padStart(3, '0')}`;

    let imageUrl = '';
    let imagePublicId = '';

    // Handle image upload
    if (data.image && data.image.startsWith('data:image/')) {
      // Base64 image → upload to Cloudinary
      try {
        const slug = (data.name || 'product')
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '_');

        const brandId = data.brandId || '27';
        const deterministicId = `${slug}_${brandId}`;

        const result = await uploadImage(data.image, 'products', deterministicId);
        imageUrl = result.url;
        imagePublicId = result.publicId;
      } catch (uploadErr) {
        console.error("❌ Image upload failed:", uploadErr);
        return errorResponse(uploadErr.message, 400);
      }
    } else if (data.imageUrl && data.imageUrl.startsWith('http')) {
      // Already a hosted URL — use directly
      imageUrl = data.imageUrl;
    }

    const newProduct = await createProduct({
      id,
      name: data.name,
      brandId: data.brandId || '27',
      brandName: data.brandName || 'Store Brand',
      category: data.category || 'general-wellness',
      description: data.description || '',
      price,                                                 // validated Number
      originalPrice: Number(data.originalPrice) || price,
      stock,                                                 // validated Number
      expiryDate: data.expiryDate || new Date(Date.now() + 31536000000).toISOString(),
      dosage: data.dosage || '',
      usage: data.usage || '',
      sideEffects: data.sideEffects || '',
      featured: data.featured || false,
      requiresPrescription: Boolean(data.requiresPrescription),
      imageUrl,
      imagePublicId,
      variants: []
    });

    return successResponse({ product: newProduct }, 201);

  } catch (error) {
    console.error("❌ Products API POST Error:", error);

    const isDev = process.env.NODE_ENV !== 'production';
    return errorResponse(
      isDev ? (error.stack || error.message || String(error)) : 'Failed to add product',
      500
    );

  }
}
