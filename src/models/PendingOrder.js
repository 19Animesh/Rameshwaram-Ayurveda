/**
 * src/models/PendingOrder.js
 * A server-side snapshot of what a Razorpay order was created FOR.
 *
 * WHY THIS EXISTS — this closes a real vulnerability
 * ---------------------------------------------------
 * The Razorpay signature proves that a payment id belongs to an order id.
 * It proves NOTHING about which products were bought.
 *
 * Previously /api/payment/verify accepted the `items` array from the browser,
 * recalculated the total from those items, and created the order. A customer
 * could pay for one cheap item, then replay the same valid signature while
 * substituting a cart full of expensive ones — the signature still verified,
 * and the server happily created a confirmed order and shipped the goods.
 *
 * Storing the verified cart here at order-creation time means verification can
 * read what the customer ACTUALLY paid for, and ignore the request body
 * entirely for anything money-related.
 *
 * Documents self-delete an hour after creation via the TTL index below, so
 * this collection never grows unbounded.
 */
import mongoose from 'mongoose';

const pendingItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Set when a specific size was bought. Declared explicitly: Mongoose's strict
  // mode would otherwise drop these fields and the size would be lost.
  variantId:    { type: mongoose.Schema.Types.ObjectId, default: null },
  variantLabel: { type: String, default: null },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },  // price at time of order creation
  quantity:  { type: Number, required: true },
}, { _id: false });

const pendingOrderSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items:          { type: [pendingItemSchema], required: true },
  subtotal:       { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  totalAmount:    { type: Number, required: true },  // rupees
  amountPaise:    { type: Number, required: true },  // exactly what Razorpay was told

  consumedAt: { type: Date, default: null }, // set once an order is created from it

  // Reconciliation trail: set when a payment was captured but the order could
  // not be created. Declared here because Mongoose runs in strict mode and
  // would otherwise silently discard these fields on update.
  failureReason: { type: String, default: null },
  failedAt:      { type: Date, default: null },
  razorpayPaymentId: { type: String, default: null },
}, { timestamps: true });

// TTL: abandoned checkouts disappear an hour after creation.
pendingOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

pendingOrderSchema.set('autoIndex', process.env.NODE_ENV !== 'production');

export default mongoose.models.PendingOrder ||
  mongoose.model('PendingOrder', pendingOrderSchema);
