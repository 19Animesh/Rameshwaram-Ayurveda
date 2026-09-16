/**
 * POST /api/payment/create-order
 *
 * Step 1 of checkout. The browser sends only product ids and quantities.
 * Prices, delivery charge and the total are computed here from the database.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. Razorpay keys are read per-request instead of at module load, and a
 *    missing key now returns 503 with an explicit "payments not configured"
 *    message. Previously it threw a bare Error that the catch block flattened
 *    into "Failed to create payment order" — so with no keys set (the current
 *    state of this project) every checkout failed with no clue why.
 *
 * 2. The verified cart is persisted as a PendingOrder keyed by the Razorpay
 *    order id. /api/payment/verify reads the cart from there rather than from
 *    the request body. See src/models/PendingOrder.js for why that matters.
 *
 * 3. Responses use the standard { success, data } envelope like every other
 *    route in the app.
 *
 * 4. Size variants. A product card can add a specific size (e.g. "250g") with
 *    its own price and stock. The browser used to send "<id>-250g" as the
 *    product id, which this route rejected, so those items could never be
 *    bought — and the base product price would have been charged anyway. Items
 *    now carry `variantId` / `variantLabel`, and price and stock are read from
 *    that variant.
 */
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import PendingOrder from '@/models/PendingOrder';
import { getUserFromRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { successResponse, errorResponse, failure } from '@/lib/apiResponse';
import { getRazorpayClient, getPublicKeyId, isPaymentConfigured } from '@/lib/razorpay';
import { DELIVERY_FREE_THRESHOLD, DELIVERY_CHARGE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const MAX_QTY_PER_ITEM = 99;
const OBJECTID_RE = /^[a-fA-F0-9]{24}$/;

/**
 * Price, stock and display name for one cart line, from the database.
 * Returns { error } when the requested size does not exist.
 */
function resolveLine(product, item) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const wantsVariant = Boolean(item.variantId || item.variantLabel);

  if (wantsVariant) {
    const variant =
      (item.variantId && variants.find((v) => v._id && String(v._id) === item.variantId)) ||
      (item.variantLabel && variants.find((v) => v.label === item.variantLabel)) ||
      null;
    if (!variant || !Number.isFinite(variant.price)) {
      return { error: `The selected size of "${product.name}" is no longer available. Please remove it from your cart and add it again.` };
    }
    return {
      price: variant.price,
      stock: variant.stock ?? 0,
      name: `${product.name} (${variant.label})`,
      variantId: variant._id || null,
      variantLabel: variant.label,
    };
  }

  // The product card only offers a size choice when there are two or more.
  if (variants.length > 1) {
    return { error: `Please choose a size for "${product.name}" before checking out.` };
  }

  return {
    price: product.price,
    stock: product.stock,
    name: product.name,
    variantId: null,
    variantLabel: null,
  };
}

export async function POST(request) {
  try {
    // Answer before doing any work, so an unconfigured store fails clearly.
    if (!isPaymentConfigured()) {
      return errorResponse(
        'Online payment is not available yet. Please contact us on WhatsApp to place your order.',
        503
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 10, 60000, 'payment-create'))) {
      return errorResponse('Too many requests. Please wait a moment and try again.', 429);
    }

    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return errorResponse('Please sign in to continue to payment.', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Request body must be valid JSON', 400);
    }

    const { items } = body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Your cart is empty.', 400);
    }

    // ── Validate every item before touching the database ──────────────────
    const seenLines = new Set();
    for (const item of items) {
      if (!item?.productId || typeof item.productId !== 'string' || !OBJECTID_RE.test(item.productId)) {
        return errorResponse('Cart contains an invalid product reference.', 400);
      }
      if (item.variantId != null && (typeof item.variantId !== 'string' || !OBJECTID_RE.test(item.variantId))) {
        return errorResponse('Cart contains an invalid size selection.', 400);
      }
      if (item.variantLabel != null && (typeof item.variantLabel !== 'string' || item.variantLabel.length > 100)) {
        return errorResponse('Cart contains an invalid size selection.', 400);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_ITEM) {
        return errorResponse(`Quantity must be between 1 and ${MAX_QTY_PER_ITEM}.`, 400);
      }
      // Different sizes of one product are separate lines; the same size twice is not.
      const lineKey = `${item.productId}|${item.variantId || item.variantLabel || ''}`;
      if (seenLines.has(lineKey)) {
        return errorResponse('The same product appears twice in your cart. Please merge the quantities.', 400);
      }
      seenLines.add(lineKey);
    }

    // ── Authoritative prices from the database ────────────────────────────
    await connectToDatabase();

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name price stock requiresPrescription variants')
      .lean();

    if (products.length !== productIds.length) {
      return errorResponse(
        'Some items in your cart are no longer available. Please refresh and try again.',
        400
      );
    }

    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    // ── Prescription gate ─────────────────────────────────────────────────
    for (const item of items) {
      const product = productMap[item.productId];
      if (product.requiresPrescription) {
        return errorResponse(
          `"${product.name}" requires a prescription. Prescription upload is not available yet — please contact us to order this item.`,
          400
        );
      }
    }

    // ── Stock check and server-side total ─────────────────────────────────
    // Prices are read only from the database; nothing here comes from the body.
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = productMap[item.productId];
      const line = resolveLine(product, item);
      if (line.error) {
        return errorResponse(line.error, 409);
      }
      if (line.stock < item.quantity) {
        return errorResponse(
          `Only ${line.stock} left of "${line.name}". Please reduce the quantity.`,
          409
        );
      }
      subtotal += line.price * item.quantity;
      verifiedItems.push({
        productId: product._id,
        variantId: line.variantId,
        variantLabel: line.variantLabel,
        name: line.name,
        price: line.price,
        quantity: item.quantity,
      });
    }

    const deliveryCharge = subtotal > DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const totalAmount = subtotal + deliveryCharge;
    // Round in paise to avoid floating-point drift on prices like 99.99.
    const amountPaise = Math.round(totalAmount * 100);

    // ── Create the Razorpay order ─────────────────────────────────────────
    const receipt = `rcpt_${crypto.randomBytes(8).toString('hex')}`;
    const razorpay = getRazorpayClient();

    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { userId: String(authUser.userId) },
    });

    // ── Record what this payment is FOR ───────────────────────────────────
    // Written before the customer pays, so verification has a trustworthy
    // reference even if the browser sends something different afterwards.
    await PendingOrder.create({
      razorpayOrderId: rzpOrder.id,
      userId: authUser.userId,
      items: verifiedItems,
      subtotal,
      deliveryCharge,
      totalAmount,
      amountPaise,
    });

    return successResponse({
      razorpayOrderId: rzpOrder.id,
      amount: totalAmount,       // rupees, for display
      amountPaise: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: getPublicKeyId(),   // publishable key — safe in the browser
    });
  } catch (error) {
    if (error?.isConfigurationError) {
      console.error('[payment/create-order]', error.message);
      return errorResponse('Online payment is not available yet.', 503);
    }
    // Razorpay API errors carry a description worth surfacing in development.
    if (error?.statusCode && error?.error?.description) {
      console.error('[payment/create-order] Razorpay rejected the order:', error.error);
      return errorResponse(
        process.env.NODE_ENV === 'production'
          ? 'Could not start the payment. Please try again.'
          : `Razorpay: ${error.error.description}`,
        502
      );
    }
    return failure(error, 'Could not start the payment');
  }
}
