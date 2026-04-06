import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Note: references embedded variant _id
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'PENDING' },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  shippingAddr: { type: String, required: true }, // Stored snapshot of address
  items: [orderItemSchema]
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
