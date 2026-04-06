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
  variants: [productVariantSchema]
}, { timestamps: true });

// Ensure unique index for name + brandId
productSchema.index({ name: 1, brandId: 1 }, { unique: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
