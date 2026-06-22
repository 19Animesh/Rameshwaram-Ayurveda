import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
});

const statusHistoryEntrySchema = new mongoose.Schema({
  previousStatus: { type: String },
  newStatus:      { type: String, required: true },
  changedAt:      { type: Date, default: Date.now },
  changedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Enum-constrained status prevents arbitrary strings from being stored
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'confirmed',
  },
  totalAmount:     { type: Number, required: true },
  // paymentMethod is always set server-side — never trust client value
  paymentMethod:   { type: String, enum: ['razorpay', 'cod', 'bank_transfer'], required: true },

  // Razorpay identifiers — unique sparse index enforces atomic duplicate-payment protection at DB level
  paymentId:       { type: String, default: null, index: true, unique: true, sparse: true }, // razorpay_payment_id
  razorpayOrderId: { type: String, default: null, index: true },                             // razorpay_order_id

  // Structured shipping address (single source of truth — legacy shippingAddr removed)
  shippingAddress: {
    fullName: { type: String },
    phone:    { type: String },
    street:   { type: String },
    city:     { type: String },
    state:    { type: String },
    pincode:  { type: String },
  },
  items:        [orderItemSchema],
  statusHistory: [statusHistoryEntrySchema],
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
