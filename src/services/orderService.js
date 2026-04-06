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
      address: (() => {
        try { return JSON.parse(rawForm.shippingAddr); } catch { return rawForm.shippingAddr || {}; }
      })(),
    };
  });
}

export async function placeOrder({ userId, items, address, paymentMethod, paymentId, totalAmount, status = 'confirmed' }) {
  await connectToDatabase();
  
  // Create Order in Mongoose
  // 1. Decrement stock for all items
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
  }

  // 2. Create the order
  const order = await Order.create([{
    userId,
    status,
    totalAmount,
    paymentMethod,
    shippingAddr: JSON.stringify(address || {}),
    items: items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variantId: item.variantId || null,
    })),
  }]);

  const rawOrder = order[0].toObject();
  return { ...rawOrder, id: rawOrder._id.toString() };
}
