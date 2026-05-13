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

function getRazorpayInstance() {
  if (!KEY_ID || !KEY_SECRET) {
    console.error('[payment/create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing!');
    // return dummy or throw during actual runtime
    throw new Error('Razorpay keys missing');
  }
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

// Delivery charge: free above ₹500 subtotal, otherwise ₹100
const DELIVERY_CHARGE = 100;
const MAX_QTY_PER_ITEM = 99;

// Basic MongoDB ObjectId format check: 24 hex characters
const OBJECTID_RE = /^[a-fA-F0-9]{24}$/;


export async function POST(request) {
  try {
    // ── 1. Rate-limit ──────────────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 5, 60000))) {
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

    // Validate each item thoroughly before touching the DB
    const seenIds = new Set();
    for (const item of items) {
      // productId must be a string matching MongoDB ObjectId format
      if (!item.productId || typeof item.productId !== 'string' || !OBJECTID_RE.test(item.productId)) {
        return NextResponse.json({ error: 'Each item must have a valid productId' }, { status: 400 });
      }
      // quantity must be a positive integer within a reasonable range
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_ITEM) {
        return NextResponse.json(
          { error: `Quantity for product ${item.productId} must be 1–${MAX_QTY_PER_ITEM}` },
          { status: 400 }
        );
      }
      // Reject duplicate productIds — prevents ambiguous stock/price handling
      if (seenIds.has(item.productId)) {
        return NextResponse.json(
          { error: `Duplicate productId: ${item.productId} — merge quantities instead` },
          { status: 400 }
        );
      }
      seenIds.add(item.productId);
    }

    // ── 4. Fetch prices from DB (authoritative source) ─────────────────────
    await connectToDatabase();

    const productIds = items.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } }).select('_id name price stock').lean();

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map(p => p._id.toString()));
      const missing  = productIds.filter(id => !foundIds.has(id));
      return NextResponse.json({ error: `Products not found: ${missing.join(', ')}` }, { status: 400 });
    }

    // ── 5. Stock check + server-side total calculation ─────────────────────
    // PRICE IS NEVER READ FROM THE CLIENT — only from MongoDB below.
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

    // Delivery charge: free above ₹500 subtotal, otherwise ₹100
    // CHARGE IS NEVER READ FROM THE CLIENT — computed here.
    const deliveryCharge = subtotal > 500 ? 0 : DELIVERY_CHARGE;
    const totalAmount    = subtotal + deliveryCharge; // in ₹


    // ── 6. Create Razorpay order using the server-computed total only ──────
    const receipt = `rcpt_${crypto.randomBytes(8).toString('hex')}`;

    const razorpay = getRazorpayInstance();
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
