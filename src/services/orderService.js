import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * Orders for one user, or every order when userId is null (admin view).
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. `.lean()` added. The previous version hydrated a full Mongoose document
 *    for every order — building getters, virtuals and change tracking — then
 *    immediately threw all of that away by calling `.toObject()`. For a
 *    read-only list that work is pure overhead; lean is several times faster
 *    and allocates far less.
 *
 * 2. A limit was added. The admin dashboard called this with no user filter,
 *    so it read EVERY order in the database on every dashboard load, forever.
 *    That is fine at 50 orders and a serious problem at 50,000.
 *
 * 3. The legacy `shippingAddr` JSON string is only parsed when the structured
 *    `shippingAddress` is absent, instead of on every record.
 */
const DEFAULT_LIMIT = 100;

export async function getOrders(userId = null, { limit = DEFAULT_LIMIT, skip = 0 } = {}) {
  await connectToDatabase();

  const where = userId ? { userId } : {};

  const orders = await Order.find(where)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 500))
    .lean();

  return orders.map((o) => ({
    ...o,
    id: o._id?.toString(),
    // The UI binds to `total` and `address`; the schema stores `totalAmount`
    // and `shippingAddress`. Mapped here so components need no knowledge of it.
    total: o.totalAmount,
    address: o.shippingAddress || parseLegacyAddress(o.shippingAddr),
  }));
}

/** Older orders stored the address as a JSON string. */
function parseLegacyAddress(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Total order count, for pagination. */
export async function countOrders(userId = null) {
  await connectToDatabase();
  return Order.countDocuments(userId ? { userId } : {});
}
