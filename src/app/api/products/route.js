/**
 * GET  /api/products  — paginated, filterable product list
 * POST /api/products  — create a product (admin only)
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. Removed ~100 lines of commented-out duplicate implementation that sat
 *    above the live code and referenced a `@/lib/logger` module that does not
 *    exist in this project.
 * 2. Query parameters are now validated with Zod before they reach the
 *    service layer, so a malformed `page`/`limit`/`sort` returns 400 with a
 *    readable message instead of a 500.
 * 3. Database connection failures are reported as 503 (Service Unavailable)
 *    with an actionable message, rather than being flattened into a generic
 *    500 that tells nobody anything.
 * 4. Removed console.log noise that leaked admin identity into logs.
 */
import { getProducts, createProduct } from '@/services/productService';
import { successResponse, errorResponse, failure, withCache } from '@/lib/apiResponse';
import { isAdminRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import { productCreateSchema, productQuerySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// ── GET ─────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = productQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return errorResponse(
        'Invalid query parameters',
        400,
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      );
    }

    const q = parsed.data;
    const result = await getProducts({
      page: q.page,
      limit: q.limit,
      search: q.search,
      category: q.category,
      brand: q.brand,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      sort: q.sort,
      // Only apply the filter when explicitly requested, so the default
      // listing is not silently narrowed to featured products.
      ...(q.featured === 'true' ? { featured: true } : {}),
      fetchAll: q.all === 'true',
      full: q.fields === 'full',
    });

    const response = successResponse(result);

    // `fields=full` is what the admin panel's edit form loads. It must never
    // come from a cache: a stale copy would fill the form with old values and
    // saving would write them back over the admin's recent changes.
    if (q.fields === 'full') {
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }

    // The storefront catalogue is identical for every visitor, so let Vercel's
    // CDN serve repeat requests instead of waking a function and hitting
    // MongoDB each time. Checkout re-reads price and stock from the database,
    // so a briefly stale listing can never cause a wrong charge.
    return withCache(response, 60, 300);
  } catch (error) {
    return failure(error, 'Failed to fetch products');
  }
}

// ── POST ────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    if (!isAdminRequest(request)) {
      return errorResponse('Unauthorized', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Request body must be valid JSON', 400);
    }

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      );
    }
    const data = parsed.data;

    let imageUrl = '';
    let imagePublicId = '';

    if (data.image && data.image.startsWith('data:image/')) {
      try {
        // Deterministic public ID keeps Cloudinary assets aligned with products.
        const slug = (data.name || 'product')
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '_');

        const result = await uploadImage(
          data.image,
          'products',
          `${slug}_${data.brandId || '27'}`
        );
        imageUrl = result.url;
        imagePublicId = result.publicId;
      } catch (uploadErr) {
        return errorResponse(
          `Image upload failed: ${uploadErr.message}`,
          400
        );
      }
    } else if (data.imageUrl && data.imageUrl.startsWith('http')) {
      imageUrl = data.imageUrl;
    }

    const newProduct = await createProduct({
      name: data.name,
      brandId: data.brandId || '27',
      brandName: data.brandName || 'Store Brand',
      category: data.category || 'general-wellness',
      description: data.description || '',
      price: data.price,
      originalPrice: data.originalPrice ?? data.price,
      stock: data.stock ?? 50,
      expiryDate:
        data.expiryDate || new Date(Date.now() + 31536000000).toISOString(),
      dosage: data.dosage || '',
      usage: data.usage || '',
      sideEffects: data.sideEffects || '',
      featured: Boolean(data.featured),
      requiresPrescription: Boolean(data.requiresPrescription),
      imageUrl,
      imagePublicId,
      variants: [],
    });

    return successResponse({ product: newProduct }, 201);
  } catch (error) {
    // A duplicate (name, brandId) violates the unique index on Product.
    if (error?.code === 11000) {
      return errorResponse(
        'A product with this name already exists for this brand.',
        409
      );
    }
    return failure(error, 'Failed to add product');
  }
}
