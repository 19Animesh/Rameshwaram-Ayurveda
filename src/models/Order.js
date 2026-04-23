import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true },
});

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
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);

