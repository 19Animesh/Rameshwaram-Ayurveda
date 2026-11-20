/**
 * src/lib/validation.js
 * Zod schemas shared by API routes.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * The audit flagged eight write endpoints with no request validation, despite
 * the README claiming all input is Zod-validated. Schemas for products and
 * query parameters were missing entirely. They are added here so routes stay
 * thin and validation rules live in one place.
 */
import { z } from 'zod';

// ── Shared ──────────────────────────────────────────────────────────────
export const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'A valid phone number is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

export const orderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string(),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
        variantId: z.string().optional().nullable(),
      })
    )
    .min(1, 'Cart cannot be empty'),
  address: addressSchema,
  paymentMethod: z.string().min(1),
  paymentId: z.string().optional(),
  subtotal: z.number().min(0),
  deliveryCharge: z.number().min(0),
  total: z.number().min(0),
});

// ── Products ────────────────────────────────────────────────────────────

/**
 * Query string for GET /api/products.
 * Everything arrives as a string, so numeric fields are coerced. Bad values
 * now produce a 400 with a field name rather than a 500 from deep in Mongoose.
 */
export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  // 'rating' is still accepted so old bookmarked URLs don't 400; reviews were
  // removed, so it falls through to the default (newest) order.
  sort: z.enum(['price-asc', 'price-desc', 'rating', 'name', 'newest']).optional(),
  featured: z.string().optional(),
  all: z.string().optional(),
  // 'full' returns whole product documents. The admin edit form needs them;
  // the storefront does not, and asking for them wastes bandwidth.
  fields: z.enum(['list', 'full']).default('list'),
});

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(300),
  brandId: z.string().max(50).optional(),
  brandName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  originalPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  expiryDate: z.string().optional(),
  dosage: z.string().max(1000).optional(),
  usage: z.string().max(2000).optional(),
  sideEffects: z.string().max(2000).optional(),
  featured: z.boolean().optional(),
  requiresPrescription: z.boolean().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
});

/** Same shape as create, but every field optional (PATCH/PUT semantics). */
export const productUpdateSchema = productCreateSchema.partial();

// Kept for backwards compatibility with any existing imports.
export const productSchema = productCreateSchema;
