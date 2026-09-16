/**
 * src/lib/razorpay.js
 * Lazily-constructed Razorpay client plus a configuration probe.
 *
 * WHY THIS EXISTS
 * ---------------
 * The old version of this file built a Razorpay instance at module scope with
 * `process.env.RAZORPAY_KEY_ID || ''`, which silently produced a client
 * configured with empty credentials. Nothing imported it, so it was deleted;
 * this replacement is imported and does the opposite — it refuses to hand back
 * a half-configured client, and lets callers ask whether payments are set up
 * *before* they start a checkout.
 *
 * Keys are read on each call rather than at module load, so adding them to the
 * environment takes effect on the next request instead of requiring a code
 * change.
 */
import Razorpay from 'razorpay';

/** True when both Razorpay credentials are present. */
export function isPaymentConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** The publishable key id. Safe to send to the browser. */
export function getPublicKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

/** The signing secret. Server-only — never return this in a response. */
export function getKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET || null;
}

/**
 * Returns a configured Razorpay client.
 * Throws a tagged error so routes can answer 503 ("not configured yet")
 * instead of a generic 500 that tells the customer nothing.
 */
export function getRazorpayClient() {
  if (!isPaymentConfigured()) {
    const err = new Error(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET ' +
      'in .env locally, or under Settings -> Environment Variables in Vercel.'
    );
    err.isConfigurationError = true;
    throw err;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}
