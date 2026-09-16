import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  label: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  brandName: { type: String, required: true },
  category: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  stock: { type: Number, default: 50 },
  usage: { type: String, default: null },
  dosage: { type: String, default: null },
  sideEffects: { type: String, default: null },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: null },
  expiryDate: { type: String, default: null },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  requiresPrescription: { type: Boolean, default: false },
  variants: [productVariantSchema]
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────
// One product per (name, brand).
productSchema.index({ name: 1, brandId: 1 }, { unique: true });

// The default listing sorts by createdAt with no filter. Without this index
// MongoDB performs an in-memory sort of the entire collection on every
// request to /api/products, which is the slowest query in the application.
productSchema.index({ createdAt: -1 });

// The home page requests featured products on every visit.
productSchema.index({ featured: 1, createdAt: -1 });

// Category and brand are the two storefront filters; compound with the sort
// key so filtered listings are also served from an index.
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ brandName: 1, createdAt: -1 });

// Text index powers the search box far more efficiently than the regex scan
// currently used. See FUTURE_FEATURES.js for the drop-in service change.
productSchema.index({ name: 'text', brandName: 'text', description: 'text' });

// Index builds are expensive and should not run on every serverless cold
// start in production. Create them once (they are declared above, so a single
// `Product.syncIndexes()` run against production applies them), then let the
// runtime skip the check.
productSchema.set('autoIndex', process.env.NODE_ENV !== 'production');

export default mongoose.models.Product || mongoose.model('Product', productSchema);
