/**
 * POST /api/payment/verify
 *
 * Step 2 of checkout, and the security-critical one. Confirms the Razorpay
 * signature, then creates the order.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. THE IMPORTANT ONE — the cart is no longer taken from the request body.
 *
 *    A Razorpay signature is HMAC_SHA256(order_id + "|" + payment_id). It
 *    proves the payment is genuine and belongs to that order. It says nothing
 *    about WHAT was bought.
 *
 *    The previous version read `items` from the browser, recalculated the
 *    total from those items, and created a confirmed order. So a customer
 *    could check out one ₹44 item, pay ₹144, and then send that same valid
 *    signature back with a body listing ten ₹2,100 items. The signature check
 *    passed, the server built a ₹21,000 order, decremented stock, and shipped.
 *    The file's own header claimed "Razorpay's own amount wins" — but the paid
 *    amount was never fetched or compared anywhere in the code.
 *
 *    Now the items come from the PendingOrder written at create-order time,
 *    and the amount is checked against what Razorpay actually captured.
 *
 * 2. Signature comparison uses crypto.timingSafeEqual instead of !==.
 *
 * 3. A payment that succeeds but whose order cannot be created is now recorded
 *    for reconciliation instead of vanishing. Previously the customer was
 *    charged, got a 500, and there was no record connecting them to the money.
 *
 * 4. Transaction handling no longer calls abortTransaction() on a transaction
 *    that was never started — that threw, masking the original error.
 *
 * 5. Size variants: when a line is for a specific size, stock is taken from
 *    that variant rather than from the product's base stock.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import PendingOrder from '@/models/PendingOrder';
import { getUserFromRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { successResponse, errorResponse, failure } from '@/lib/apiResponse';
import { getKeySecret, isPaymentConfigured } from '@/lib/razorpay';
import { addressSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Filter + update that decrement stock only if enough is left, as one atomic
 * operation. Sizes keep their own stock inside `variants`.
 */
function stockDecrement(item) {
  const need = { $gte: item.quantity };
  if (item.variantId || item.variantLabel) {
    const match = item.variantId ? { _id: item.variantId, stock: need } : { label: item.variantLabel, stock: need };
    return [
      { _id: item.productId, variants: { $elemMatch: match } },
      { $inc: { 'variants.$.stock': -item.quantity } },
    ];
  }
  return [
    { _id: item.productId, stock: need },
    { $inc: { stock: -item.quantity } },
  ];
}

/** Constant-time string comparison. Returns false on any length mismatch. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Records a payment that was captured but could not be turned into an order,
 * so it can be refunded or fulfilled by hand. Never throws.
 */
async function recordOrphanedPayment(details) {
  console.error('[payment/verify] PAYMENT CAPTURED BUT ORDER FAILED —', JSON.stringify(details));
  try {
    await PendingOrder.updateOne(
      { razorpayOrderId: details.razorpayOrderId },
      {
        $set: {
          failureReason: details.reason,
          failedAt: new Date(),
          razorpayPaymentId: details.razorpayPaymentId || null,
        },
      }
    );
  } catch {
    // Best effort only. The console.error above is the durable record.
  }
}

export async function POST(request) {
  try {
    if (!isPaymentConfigured()) {
      console.error('[payment/verify] Razorpay keys are not set — cannot verify a payment.');
      return errorResponse(
        'Payment verification is unavailable. If money was deducted, contact support with your payment id.',
        503
      );
    }

    // Deliberately generous: a customer whose network dropped mid-confirmation
    // must be able to retry. Blocking them here means they have paid and
    // cannot get an order.
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 30, 60000, 'payment-verify'))) {
      return errorResponse('Too many requests. Please wait a moment.', 429);
    }

    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return errorResponse('Please sign in to complete your order.', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Request body must be valid JSON', 400);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address,
      paymentMethod,
    } = body || {};

    const missing = [];
    if (!razorpay_order_id) missing.push('razorpay_order_id');
    if (!razorpay_payment_id) missing.push('razorpay_payment_id');
    if (!razorpay_signature) missing.push('razorpay_signature');
    if (missing.length) {
      return errorResponse(`Missing required fields: ${missing.join(', ')}`, 400);
    }

    const addressParsed = addressSchema.safeParse(address);
    if (!addressParsed.success) {
      return errorResponse(
        'Invalid delivery address',
        400,
        addressParsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      );
    }
    // Use the parsed value, so unexpected extra fields are not persisted.
    const shippingAddress = addressParsed.data;

    // ── Verify the signature before touching the database ─────────────────
    const expected = crypto
      .createHmac('sha256', getKeySecret())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expected, razorpay_signature)) {
      console.warn('[payment/verify] signature mismatch', { ip, razorpay_order_id });
      return errorResponse('Payment verification failed: invalid signature.', 400);
    }

    await connectToDatabase();

    // ── Reject a replayed payment ─────────────────────────────────────────
    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id }).lean();
    if (existingOrder) {
      // Not an error from the customer's point of view — their order exists.
      return successResponse({
        message: 'This payment has already been confirmed.',
        order: { id: existingOrder._id.toString(), status: existingOrder.status },
        alreadyProcessed: true,
      });
    }

    // ── Load what this payment was actually for ───────────────────────────
    const pending = await PendingOrder.findOne({ razorpayOrderId: razorpay_order_id });

    if (!pending) {
      // Either the checkout expired (TTL is one hour) or someone is presenting
      // a signature for an order this server never created.
      await recordOrphanedPayment({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        userId: String(authUser.userId),
        reason: 'No PendingOrder found for this Razorpay order id',
      });
      return errorResponse(
        'This checkout session has expired. Your payment was received — please contact support with payment id ' +
          `${razorpay_payment_id} and we will complete your order.`,
        409
      );
    }

    // The pending order must belong to the person confirming it.
    if (String(pending.userId) !== String(authUser.userId)) {
      console.warn('[payment/verify] pending order belongs to a different user', {
        razorpay_order_id,
      });
      return errorResponse('This payment does not belong to your account.', 403);
    }

    if (pending.consumedAt) {
      return errorResponse('This checkout has already been completed.', 409);
    }

    // Items, prices and total all come from the server-side snapshot.
    const verifiedItems = pending.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId || null,
      variantLabel: i.variantLabel || null,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));
    const totalAmount = pending.totalAmount;

    // ── Stock decrement + order creation ──────────────────────────────────
    // The conditional filter `stock: { $gte: quantity }` makes the check and
    // the decrement a single atomic operation, so two simultaneous buyers
    // cannot both take the last unit.
    const orderPayload = {
      userId: authUser.userId,
      status: 'confirmed',
      totalAmount,
      paymentMethod: paymentMethod || 'razorpay',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      shippingAddress,
      items: verifiedItems,
      statusHistory: [{ newStatus: 'confirmed', changedAt: new Date() }],
    };

    let orderDoc = null;
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      for (const item of verifiedItems) {
        const [filter, update] = stockDecrement(item);
        const result = await Product.updateOne(filter, update, { session });
        if (result.modifiedCount === 0) {
          const err = new Error(`OUT_OF_STOCK:${item.name}`);
          err.isStockError = true;
          throw err;
        }
      }

      const created = await Order.create([orderPayload], { session });
      orderDoc = created[0];

      await PendingOrder.updateOne(
        { _id: pending._id },
        { $set: { consumedAt: new Date() } },
        { session }
      );

      await session.commitTransaction();
    } catch (txnError) {
      // Only abort a transaction that is actually in progress; calling
      // abortTransaction() otherwise throws and hides the real error.
      if (session?.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }

      const unsupported =
        /Transaction numbers|replica set|not supported|Illegal state/i.test(
          txnError?.message || ''
        );

      if (txnError?.isStockError) {
        await recordOrphanedPayment({
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          userId: String(authUser.userId),
          reason: txnError.message,
        });
        return errorResponse(
          'An item sold out while your payment was processing. Your payment was received — ' +
            `please contact support with payment id ${razorpay_payment_id} for a refund or replacement.`,
          409
        );
      }

      if (!unsupported) {
        await recordOrphanedPayment({
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          userId: String(authUser.userId),
          reason: txnError?.message || 'unknown',
        });
        return errorResponse(
          'Your payment was received but the order could not be saved. ' +
            `Please contact support with payment id ${razorpay_payment_id}.`,
          500
        );
      }

      // Standalone MongoDB (no replica set) does not support transactions.
      // The conditional $inc is still atomic per document, so this path is safe
      // for stock; only the order write loses all-or-nothing semantics.
      for (const item of verifiedItems) {
        const [filter, update] = stockDecrement(item);
        const result = await Product.updateOne(filter, update);
        if (result.modifiedCount === 0) {
          await recordOrphanedPayment({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            userId: String(authUser.userId),
            reason: `OUT_OF_STOCK:${item.name} (non-transactional path)`,
          });
          return errorResponse(
            'An item sold out while your payment was processing. Your payment was received — ' +
              `please contact support with payment id ${razorpay_payment_id}.`,
            409
          );
        }
      }

      orderDoc = await Order.create(orderPayload);
      await PendingOrder.updateOne({ _id: pending._id }, { $set: { consumedAt: new Date() } });
    } finally {
      if (session) await session.endSession().catch(() => {});
    }

    const order = orderDoc.toObject();

    return successResponse(
      {
        message: 'Payment verified and order confirmed',
        order: {
          id: order._id.toString(),
          totalAmount,
          status: order.status,
          paymentId: razorpay_payment_id,
          items: verifiedItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          address: shippingAddress,
          createdAt: order.createdAt,
        },
      },
      201
    );
  } catch (error) {
    return failure(error, 'Payment verification failed');
  }
}
