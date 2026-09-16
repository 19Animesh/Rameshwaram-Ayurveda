/**
 * GET /api/products/filters
 * Returns the distinct categories and brands present in the catalogue, so the
 * storefront filter UI always reflects real data.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. Removed the unused NextResponse import.
 * 2. Results are cached for 5 minutes. Two `distinct()` calls scan the whole
 *    collection, and this endpoint is hit on every visit to the home page and
 *    the products page — it was the single most wasteful query in the app.
 * 3. Failures now degrade gracefully: an empty filter list is returned with a
 *    200 so the product grid still renders, instead of a 500 that blanked the
 *    entire page.
 */
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import { successResponse, withCache } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/** In-memory cache. Per-instance, which is fine for a hint-style endpoint. */
let cache = { at: 0, payload: null };
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (cache.payload && Date.now() - cache.at < TTL_MS) {
    return withCache(successResponse(cache.payload), 300, 3600);
  }

  try {
    await connectToDatabase();

    const [rawCategories, rawBrands] = await Promise.all([
      Product.distinct('category'),
      Product.distinct('brandName'),
    ]);

    const categories = rawCategories
      .filter(Boolean)
      .sort()
      .map((name) => ({
        id: String(name).toLowerCase().replace(/\s+/g, '-'),
        name,
      }));

    const brands = rawBrands.filter(Boolean).sort();
    const payload = { categories, brands };

    cache = { at: Date.now(), payload };
    return withCache(successResponse(payload), 300, 3600);
  } catch (error) {
    console.error('[api] /api/products/filters failed:', error);

    // Serve stale data if we have any, otherwise an empty (but valid) shape.
    // The filter sidebar is an enhancement; it must never break the page.
    if (cache.payload) return successResponse(cache.payload);
    return successResponse({ categories: [], brands: [], degraded: true });
  }
}
