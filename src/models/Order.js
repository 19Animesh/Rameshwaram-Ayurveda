import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  variantLabel: { type: String, default: null },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true },
});

const statusHistoryEntrySchema = new mongoose.Schema({
  previousStatus: { type: String },
  newStatus:      { type: String, required: true },
  changedAt:      { type: Date, default: Date.now },
  changedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:          { type: String, default: 'confirmed' },
  totalAmount:     { type: Number, required: true },
  paymentMethod:   { type: String, required: true },

  // Razorpay identifiers — indexed for fast duplicate-payment lookups
  paymentId:       { type: String, default: null, index: true },  // razorpay_payment_id
  razorpayOrderId: { type: String, default: null, index: true },  // razorpay_order_id

  shippingAddr: { type: String }, // Old JSON snapshot of address (fallback)
  shippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  items:        [orderItemSchema],
  statusHistory: [statusHistoryEntrySchema],
}, { timestamps: true });

// Every order query filters by userId and sorts by createdAt — but no index
// covered that combination, so each lookup scanned the whole collection and
// sorted in memory. This is the single most-used query in the account area.
orderSchema.index({ userId: 1, createdAt: -1 });

// Admin dashboard lists all orders newest-first.
orderSchema.index({ createdAt: -1 });

// Status filtering in the admin order table.
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.set('autoIndex', process.env.NODE_ENV !== 'production');

export default mongoose.models.Order || mongoose.model('Order', orderSchema);

