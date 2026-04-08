/**
 * POST /api/payment/create-order
 *
 * STEP 1 — Secure Razorpay order creation.
 * - Receives only productIds + quantities from frontend (NEVER price)
 * - Fetches authoritative prices from MongoDB
 * - Calculates total on the server
 * - Creates a Razorpay order and returns orderId + server-calculated amount
 *
 * Security guarantees:
 *   ✅ Amount is never read from the request body
 *   ✅ Razorpay secret stays server-side only
 *   ✅ Requires a valid JWT session
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

// ── Validate env at startup (fail loudly rather than silently) ──────────────
const KEY_ID     = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.error('[payment/create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing!');
}

const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

// Delivery charge logic (must mirror checkout UI exactly so totals match)
const DELIVERY_THRESHOLD = 500; // orders >= ₹500 get free delivery
const DELIVERY_CHARGE    = 49;

export async function POST(request) {
  try {
    // ── 1. Rate-limit ──────────────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // ── 2. Auth check ──────────────────────────────────────────────────────
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 3. Parse & validate request body ──────────────────────────────────
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required and must not be empty' }, { status: 400 });
    }

    // Each item must have a productId (string/ObjectId) and a positive quantity
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Each item must have a valid productId' }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: `Quantity for product ${item.productId} must be a positive integer` }, { status: 400 });
      }
    }

    // ── 4. Fetch prices from DB (authoritative source) ─────────────────────
    await connectToDatabase();

    const productIds = items.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } }).select('_id name price stock').lean();

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p._id.toString());
      const missing  = productIds.filter(id => !foundIds.includes(id));
      return NextResponse.json({ error: `Products not found: ${missing.join(', ')}` }, { status: 404 });
    }

    // ── 5. Stock check + server-side total calculation ─────────────────────
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    let subtotal = 0;

    for (const item of items) {
      const product = productMap[item.productId];
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
          { status: 409 }
        );
      }
      subtotal += product.price * item.quantity;
    }

    const deliveryCharge = subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const totalAmount    = subtotal + deliveryCharge; // in ₹

    // ── 6. Create Razorpay order ──────────────────────────────────────────
    const receipt = `rcpt_${crypto.randomBytes(8).toString('hex')}`;

    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt,
    });

    // ── 7. Respond — only public fields (key_id not secret) ───────────────
    return NextResponse.json({
      success:      true,
      razorpayOrderId: rzpOrder.id,
      amount:       totalAmount,       // ₹ — shown to user
      amountPaise:  rzpOrder.amount,   // paise — passed to Razorpay SDK
      currency:     rzpOrder.currency,
      keyId:        KEY_ID,            // public key is safe to expose
    });

  } catch (error) {
    console.error('[payment/create-order] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
