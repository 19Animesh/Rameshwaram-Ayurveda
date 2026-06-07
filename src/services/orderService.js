import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function getOrders(userId = null) {
  await connectToDatabase();
  const where = userId ? { userId } : {};

  const orders = await Order.find(where).sort({ createdAt: -1 });

  return orders.map(o => {
    const rawForm = o.toObject();
    return {
      ...rawForm,
      id: rawForm._id?.toString(),
      total: rawForm.totalAmount, // Map strict MongoDB field to loose component binding
      address: rawForm.shippingAddress || (() => {
        try { return JSON.parse(rawForm.shippingAddr || '{}'); } catch { return rawForm.shippingAddr || {}; }
      })(),
    };
  });
}

/** @deprecated Use `/api/orders` route which performs server-side payment verification. */
export async function placeOrder({ userId, items, address, paymentMethod, paymentId, totalAmount, status = 'confirmed' }) {
  throw new Error('placeOrder service function is deprecated. Orders must be created securely via the API route with payment verification.');
}
