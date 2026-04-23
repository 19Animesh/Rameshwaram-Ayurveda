// import { getProducts, createProduct } from '@/services/productService';
// import { successResponse, errorResponse } from '@/lib/apiResponse';
// import { logger } from '@/lib/logger';
// import { getUserFromRequest } from '@/lib/auth';
// import { uploadImage } from '@/lib/cloudinary';
// import Product from '@/models/Product';
// import connectToDatabase from '@/lib/mongodb';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);

//     const pageParam = parseInt(searchParams.get('page'));
//     const limitParam = parseInt(searchParams.get('limit'));

//     const productsResult = await getProducts({
//       page: !isNaN(pageParam) && pageParam > 0 ? pageParam : 1,
//       limit: !isNaN(limitParam) && limitParam > 0 ? limitParam : 12,
//       search: searchParams.get('search') || undefined,
//       category: searchParams.get('category') || undefined,
//       brand: searchParams.get('brand') || undefined,
//       minPrice: searchParams.get('minPrice') || undefined,
//       maxPrice: searchParams.get('maxPrice') || undefined,
//       sort: searchParams.get('sort') || undefined,
//       // ✅ Only pass featured:true when explicitly requested — avoids accidental false filter
//       ...(searchParams.get('featured') === 'true' ? { featured: true } : {}),
//       fetchAll: searchParams.get('all') === 'true',
//     });

//     return successResponse(productsResult);
//   } catch (error) {
//     logger.error({ err: error }, 'Products API GET Error');
//     const isDev = process.env.NODE_ENV !== 'production';
//     return errorResponse(isDev ? (error.stack || error.message || String(error)) : 'Failed to fetch products', 500);
//   }
// }

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser || authUser.role !== 'admin') {
//       logger.warn({ authUser }, 'POST /api/products - Unauthorized attempt (check token in Authorization header)');
//       return errorResponse('Unauthorized', 401);
//     }
//     logger.info({ userId: authUser.id, role: authUser.role }, 'Admin creating product');

//     const data = await request.json();

//     // Auto-generate ID if not provided.
//     await connectToDatabase();
//     const productCount = await Product.countDocuments();
//     const id = data.id || `prod_${String(productCount + 1).padStart(3, '0')}`;

//     let imageUrl = '';
//     let imagePublicId = '';

//     if (data.image) {
//       try {
//         // Deterministic publicId for manual uploads too!
//         const slug = (data.name || 'product')
//           .toString().toLowerCase().trim()
//           .replace(/\s+/g, '_').replace(/[^\w-]+/g, '').replace(/--+/g, '_');
//         const brandId = data.brandId || '27';
//         const deterministicId = `${slug}_${brandId}`;

//         const result = await uploadImage(data.image, 'products', deterministicId);
//         imageUrl = result.url;
//         imagePublicId = result.publicId;
//       } catch (uploadErr) {
//         logger.error({ err: uploadErr }, 'Image upload failed during POST');
//         return errorResponse(uploadErr.message, 400);
//       }
//     }

//     const newProduct = await createProduct({
//       id,
//       name: data.name,
//       brandId: data.brandId || '27',
//       brandName: data.brandName || 'Store Brand',
//       category: data.category || 'general-wellness',
//       description: data.description || '',
//       price: data.price || 0,
//       originalPrice: data.originalPrice || data.price || 0,
//       stock: data.stock || 50,
//       expiryDate: data.expiryDate || new Date(Date.now() + 31536000000).toISOString(),
//       dosage: data.dosage || '',
//       usage: data.usage || '',
//       sideEffects: data.sideEffects || '',
//       featured: data.featured || false,
//       imageUrl: imageUrl,
//       imagePublicId: imagePublicId,
//       variants: []
//     });

//     return successResponse({ product: newProduct }, 201);
//   } catch (error) {
//     logger.error({ err: error }, 'Products API POST Error');
//     const isDev = process.env.NODE_ENV !== 'production';
//     return errorResponse(isDev ? (error.stack || error.message || String(error)) : 'Failed to add product', 500);
//   }
// }
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

    const productsResult = await getProducts({
      page: !isNaN(pageParam) && pageParam > 0 ? pageParam : 1,
      limit: !isNaN(limitParam) && limitParam > 0 ? limitParam : 12,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sort: searchParams.get('sort') || undefined,
      ...(searchParams.get('featured') === 'true' ? { featured: true } : {}),
      fetchAll: searchParams.get('all') === 'true',
    });

    console.log("✅ Products fetched:", productsResult?.products?.length || 0);

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

    console.log("🛠 Admin creating product:", authUser);

    const data = await request.json();

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
      price: data.price || 0,
      originalPrice: data.originalPrice || data.price || 0,
      stock: data.stock || 50,
      expiryDate: data.expiryDate || new Date(Date.now() + 31536000000).toISOString(),
      dosage: data.dosage || '',
      usage: data.usage || '',
      sideEffects: data.sideEffects || '',
      featured: data.featured || false,
      imageUrl,
      imagePublicId,
      variants: []
    });

    console.log("✅ Product created:", newProduct?.id);

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
