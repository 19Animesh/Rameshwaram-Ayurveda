/* eslint-disable */
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FUTURE_FEATURES.js — Rameshwaram Ayurveda
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Everything in this file is COMMENTED OUT ON PURPOSE. Nothing here runs,
 *  nothing here is imported, and nothing here affects your build.
 *
 *  It is a staging area for the changes that would move this project from
 *  "working store" to "industry ready". Each section says what problem it
 *  solves, which files it touches, and how much work it is — so you can pick
 *  one up when you want it and skip the rest.
 *
 *  TO USE A SECTION: copy the code into the file named in its header,
 *  uncomment it, and install any listed packages.
 *
 *  Ordered roughly by value-for-effort. Sections 1–4 are the ones I would do
 *  first for a real storefront.
 * ═══════════════════════════════════════════════════════════════════════════
 */


/* ═══════════════════════════════════════════════════════════════════════════
 * 1. PRODUCT PAGE SEO — server-rendered metadata + JSON-LD
 *    ✅ PARTLY IMPLEMENTED: per-product metadata and JSON-LD now come from
 *    src/app/products/[id]/layout.js. The page body itself is still rendered
 *    in the browser; the full server/client split below remains optional.
 * ───────────────────────────────────────────────────────────────────────────
 * PROBLEM: Every product page is a client component, so Google receives an
 *   empty shell with the same generic <title> for all 350+ products. Right now
 *   the catalogue is effectively invisible in search. For a store whose
 *   customers search by medicine name, this is the single biggest lost
 *   opportunity in the project.
 *
 * FILES:  src/app/products/[id]/page.js  (split into a server + client pair)
 * EFFORT: ~2 hours.  IMPACT: very high.
 *
 * HOW IT WORKS: the route becomes a Server Component that fetches the product
 *   directly from the service layer (no HTTP round-trip), exports
 *   generateMetadata for real per-product titles, emits Product JSON-LD so
 *   Google can show price and availability in results, and renders the
 *   existing interactive UI as a child client component.
 * ═══════════════════════════════════════════════════════════════════════════ */

// // ── src/app/products/[id]/page.js  (Server Component) ──────────────────
// import { notFound } from 'next/navigation';
// import { getProductById } from '@/services/productService';
// import ProductDetailClient from './ProductDetailClient';
//
// // Re-render at most hourly; new prices appear without a redeploy.
// export const revalidate = 3600;
//
// export async function generateMetadata({ params }) {
//   const product = await getProductById(params.id).catch(() => null);
//   if (!product) return { title: 'Product Not Found — Rameshwaram Ayurveda' };
//
//   const title = `${product.name} — ${product.brandName} | Rameshwaram Ayurveda`;
//   const description =
//     (product.description || `Buy ${product.name} by ${product.brandName} online.`)
//       .slice(0, 155);
//
//   return {
//     title,
//     description,
//     alternates: { canonical: `/products/${product.id}` },
//     openGraph: {
//       title,
//       description,
//       type: 'website',
//       images: product.imageUrl ? [{ url: product.imageUrl }] : [],
//     },
//   };
// }
//
// export default async function ProductPage({ params }) {
//   const product = await getProductById(params.id).catch(() => null);
//   if (!product) notFound();
//
//   // Structured data: lets Google render price + stock directly in results.
//   const jsonLd = {
//     '@context': 'https://schema.org',
//     '@type': 'Product',
//     name: product.name,
//     description: product.description || undefined,
//     image: product.imageUrl || undefined,
//     brand: { '@type': 'Brand', name: product.brandName },
//     offers: {
//       '@type': 'Offer',
//       priceCurrency: 'INR',
//       price: String(product.price),
//       availability:
//         product.stock > 0
//           ? 'https://schema.org/InStock'
//           : 'https://schema.org/OutOfStock',
//       url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}`,
//     },
//     ...(product.reviewCount > 0 && {
//       aggregateRating: {
//         '@type': 'AggregateRating',
//         ratingValue: String(product.rating),
//         reviewCount: String(product.reviewCount),
//       },
//     }),
//   };
//
//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />
//       {/* Move the current 'use client' page body into ProductDetailClient.js
//           and pass the already-fetched product in as a prop. The page then
//           renders complete HTML on the first byte — no loading spinner, no
//           client fetch, and fully indexable. */}
//       <ProductDetailClient product={product} />
//     </>
//   );
// }


/* ═══════════════════════════════════════════════════════════════════════════
 * 2. RACE-SAFE STOCK DECREMENT — ✅ NOW IMPLEMENTED
 * ───────────────────────────────────────────────────────────────────────────
 * This section previously held proposed code. It is now live in
 * src/app/api/payment/verify/route.js, using the conditional-update pattern:
 *
 *     Product.updateOne(
 *       { _id: id, stock: { $gte: qty } },
 *       { $inc: { stock: -qty } }
 *     )
 *
 * The filter and the write are evaluated atomically by MongoDB, so two
 * simultaneous buyers cannot both take the last unit. When modifiedCount is 0
 * the item sold out mid-payment, and the route records the captured payment
 * for manual refund rather than losing it.
 *
 * Still worth adding: an automated refund call to the Razorpay API on that
 * path, so an out-of-stock race resolves itself without a support message.
 *
 *   // await razorpay.payments.refund(razorpay_payment_id, {
 *   //   amount: pending.amountPaise,
 *   //   speed: 'normal',
 *   //   notes: { reason: 'Item sold out during payment' },
 *   // });
 * ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
 * 3. FULL-TEXT SEARCH (replaces the regex scan)
 * ───────────────────────────────────────────────────────────────────────────
 * PROBLEM: getProducts() builds `$regex` over name, brandName AND description.
 *   A regex that is not anchored to the start of a string cannot use an index,
 *   so every search reads all 350+ documents and every description in full.
 *   It also cannot rank results — an exact name match sorts no higher than an
 *   incidental mention in a description.
 *
 * FILES:  src/services/productService.js
 * SETUP:  the text index is ALREADY declared in src/models/Product.js. Apply
 *         it to your live database once with:
 *             node -e "require('./scripts/syncIndexes.mjs')"
 *         or from the Atlas UI. See section 8 for the sync script.
 * EFFORT: ~30 minutes.  IMPACT: high once the catalogue grows.
 * ═══════════════════════════════════════════════════════════════════════════ */

// // ── inside getProducts(), replacing the current `if (search)` block ─────
// if (search) {
//   // $text uses the text index and returns a relevance score.
//   where.$text = { $search: search };
//
//   // When searching, rank by relevance first, then apply the user's sort.
//   sortObj = { score: { $meta: 'textScore' }, ...sortObj };
// }
//
// // ...and the find() call gains the score projection:
// // Product.find(where, search ? { score: { $meta: 'textScore' } } : {})
//
// // NOTE: $text matches whole words, so "ashwagand" will not match
// // "ashwagandha". If you want as-you-type prefix matching, keep a regex
// // anchored to the start of `name` only — that one CAN use an index:
// //   where.name = { $regex: `^${escapeRegex(search)}`, $options: 'i' };


/* ═══════════════════════════════════════════════════════════════════════════
 * 4. CONTENT SECURITY POLICY
 * ───────────────────────────────────────────────────────────────────────────
 * PROBLEM: The other security headers are now set in next.config.mjs, but CSP
 *   is not, because Razorpay injects scripts and iframes and a wrong CSP
 *   breaks checkout silently. This policy is written for Razorpay + Cloudinary
 *   + Vercel Analytics specifically.
 *
 * FILES:  next.config.mjs → securityHeaders array
 * EFFORT: 15 minutes + testing.  IMPACT: medium-high.
 *
 * DEPLOY IT SAFELY: ship it first as `Content-Security-Policy-Report-Only`,
 * watch the browser console for violations for a few days, then switch the
 * header name to the enforcing version.
 * ═══════════════════════════════════════════════════════════════════════════ */

// const csp = [
//   "default-src 'self'",
//   // 'unsafe-inline'/'unsafe-eval' are required by Next.js's inline bootstrap
//   // and by Razorpay's checkout script. Removing them needs nonce support.
//   "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.vercel-scripts.com",
//   "style-src 'self' 'unsafe-inline'",
//   "img-src 'self' data: blob: https://res.cloudinary.com",
//   "font-src 'self' data:",
//   "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.vercel-insights.com https://identitytoolkit.googleapis.com",
//   "frame-src https://api.razorpay.com https://checkout.razorpay.com",
//   "object-src 'none'",
//   "base-uri 'self'",
//   "form-action 'self'",
//   "frame-ancestors 'self'",
//   'upgrade-insecure-requests',
// ].join('; ');
//
// // Add to the securityHeaders array in next.config.mjs:
// // { key: 'Content-Security-Policy-Report-Only', value: csp },


/* ═══════════════════════════════════════════════════════════════════════════
 * 5. DURABLE RATE LIMITING
 * ───────────────────────────────────────────────────────────────────────────
 * PROBLEM: src/lib/rateLimit.js writes a counter document to MongoDB on every
 *   protected request. It works and it is shared across instances (better than
 *   in-memory), but it adds two round-trips to your database on the login and
 *   registration paths — the exact endpoints an attacker will hammer. It also
 *   fails open, so a database problem disables rate limiting entirely.
 *
 * FILES:  src/lib/rateLimit.js
 * INSTALL: npm install @upstash/ratelimit @upstash/redis
 * ENV:     UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * EFFORT: ~1 hour.  IMPACT: medium. Upstash has a free tier that covers this.
 * ═══════════════════════════════════════════════════════════════════════════ */

// import { Ratelimit } from '@upstash/ratelimit';
// import { Redis } from '@upstash/redis';
//
// const redis = Redis.fromEnv();
//
// // Sliding window is the right algorithm here: a fixed window lets an attacker
// // send 2x the limit by straddling the boundary.
// const limiters = {
//   login:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:login' }),
//   register: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '60 s'), prefix: 'rl:register' }),
//   general:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(50, '60 s'), prefix: 'rl:general' }),
// };
//
// export async function checkRateLimit(identifier, _limit, _windowMs, action = 'general') {
//   const limiter = limiters[action] || limiters.general;
//   try {
//     const { success } = await limiter.limit(identifier);
//     return success;
//   } catch (err) {
//     console.error('[ratelimit] backend unavailable:', err);
//     // Decide deliberately: fail OPEN keeps the store usable during an outage,
//     // fail CLOSED protects auth endpoints. Failing closed for auth only is a
//     // reasonable middle ground:
//     return action === 'general';
//   }
// }


/* ═══════════════════════════════════════════════════════════════════════════
 * 6. TRANSACTIONAL EMAIL (order confirmation + status updates)
 * ───────────────────────────────────────────────────────────────────────────
 * PROBLEM: A customer pays and receives nothing. No confirmation, no invoice,
 *   no dispatch notice. This drives avoidable "where is my order" support
 *   messages to the WhatsApp number in your footer.
 *
 * NOTE: your README lists NodeMailer, but no mailer exists in the codebase and
 *   the SMTP_* variables in .env.example were never read by any file. This is
 *   that missing piece.
 *
 * FILES:  new src/lib/mailer.js; called from src/app/api/payment/verify/route.js
 * INSTALL: npm install nodemailer
 * ENV:     SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 * EFFORT: ~3 hours including templates.  IMPACT: high for customer trust.
 * ═══════════════════════════════════════════════════════════════════════════ */

// // ── src/lib/mailer.js ──────────────────────────────────────────────────
// import nodemailer from 'nodemailer';
// import { requireEnv } from '@/lib/env';
//
// let transporter = null;
//
// function getTransporter() {
//   requireEnv('Email', ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD']);
//   if (!transporter) {
//     transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: Number(process.env.SMTP_PORT),
//       secure: Number(process.env.SMTP_PORT) === 465,
//       auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
//     });
//   }
//   return transporter;
// }
//
// export async function sendOrderConfirmation(order, customerEmail) {
//   if (!customerEmail) return;
//
//   const rows = order.items
//     .map(i => `<tr>
//         <td style="padding:8px 0">${i.name} x ${i.quantity}</td>
//         <td style="padding:8px 0;text-align:right">Rs. ${i.price * i.quantity}</td>
//       </tr>`)
//     .join('');
//
//   const html = `
//     <div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto">
//       <h2 style="color:#2d6a4f">Thank you for your order</h2>
//       <p>Order <strong>#${String(order.id).slice(-8).toUpperCase()}</strong> is confirmed.</p>
//       <table style="width:100%;border-collapse:collapse">${rows}</table>
//       <hr>
//       <p style="text-align:right"><strong>Total: Rs. ${order.total}</strong></p>
//       <p style="color:#666;font-size:13px">
//         Ayurvedic products should be taken under the guidance of a qualified practitioner.
//       </p>
//     </div>`;
//
//   // IMPORTANT: never let a mail failure roll back a paid order. Log and move on.
//   try {
//     await getTransporter().sendMail({
//       from: process.env.SMTP_FROM || 'Rameshwaram Ayurveda <no-reply@rameshwaramayurveda.com>',
//       to: customerEmail,
//       subject: `Order confirmed — #${String(order.id).slice(-8).toUpperCase()}`,
//       html,
//     });
//   } catch (err) {
//     console.error('[mailer] order confirmation failed:', err);
//   }
// }


/* ═══════════════════════════════════════════════════════════════════════════
 * 7. PRODUCT REVIEWS
 * ───────────────────────────────────────────────────────────────────────────
 * PROBLEM: Every product card renders "☆☆☆☆☆ (0)". The Product schema has
 *   `rating` and `reviewCount` fields, but nothing ever writes to them, so the
 *   empty stars are permanent — which reads as "nobody has bought this".
 *
 * FILES:  new src/models/Review.js, new src/app/api/products/[id]/reviews/route.js
 * EFFORT: ~4 hours including UI.  IMPACT: medium-high (social proof sells).
 *
 * The verified-purchase check matters: without it, review spam arrives quickly.
 * ═══════════════════════════════════════════════════════════════════════════ */

// // ── src/models/Review.js ───────────────────────────────────────────────
// import mongoose from 'mongoose';
//
// const reviewSchema = new mongoose.Schema({
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//   userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   userName:  { type: String, required: true },
//   rating:    { type: Number, required: true, min: 1, max: 5 },
//   title:     { type: String, maxlength: 120 },
//   body:      { type: String, maxlength: 2000 },
//   verifiedPurchase: { type: Boolean, default: false },
// }, { timestamps: true });
//
// // One review per user per product.
// reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
// reviewSchema.index({ productId: 1, createdAt: -1 });
//
// export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
//
// // ── recalculating the denormalised average after each write ────────────
// export async function recalculateProductRating(productId) {
//   const [agg] = await Review.aggregate([
//     { $match: { productId: new mongoose.Types.ObjectId(productId) } },
//     { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
//   ]);
//
//   await Product.updateOne(
//     { _id: productId },
//     {
//       rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
//       reviewCount: agg ? agg.count : 0,
//     }
//   );
// }


/* ═══════════════════════════════════════════════════════════════════════════
 * 8. INDEX SYNC SCRIPT — ✅ NOW IMPLEMENTED as scripts/syncIndexes.mjs
 *    (run: npm run db:indexes). It uses createIndexes(), which never drops
 *    indexes, and covers Product, Order, PendingOrder and Address.
 * ───────────────────────────────────────────────────────────────────────────
 * WHY: src/models/Product.js now declares several indexes, and `autoIndex` is
 *   disabled in production (building indexes on every cold start is slow and
 *   wasteful). This script applies the declared indexes to your live database
 *   once, deliberately.
 *
 * FILES:  new scripts/syncIndexes.mjs
 * RUN:    node scripts/syncIndexes.mjs
 * EFFORT: 5 minutes. Run it once after deploying this version.
 *
 * syncIndexes() also DROPS indexes that are no longer declared in the schema,
 * which is what you want, but run it against staging first if you have one.
 * ═══════════════════════════════════════════════════════════════════════════ */

// // ── scripts/syncIndexes.mjs ────────────────────────────────────────────
// import 'dotenv/config';
// import mongoose from 'mongoose';
//
// const { default: Product } = await import('../src/models/Product.js');
// const { default: Address } = await import('../src/models/Address.js');
//
// await mongoose.connect(process.env.MONGODB_URI);
//
// for (const Model of [Product, Address]) {
//   const result = await Model.syncIndexes();
//   console.log(`${Model.modelName}: synced`, result);
// }
//
// await mongoose.disconnect();
// console.log('Done.');


/* ═══════════════════════════════════════════════════════════════════════════
 * 9. SMALLER WINS, IN ROUGH PRIORITY ORDER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  a) PRODUCT IMAGES ARE MISSING
 *     Every product currently falls back to the leaf emoji because `imageUrl`
 *     is empty in the database. The rendering code is fine — this is a data
 *     problem. A bulk Cloudinary upload keyed on the deterministic
 *     `${slug}_${brandId}` public ID the POST route already generates would
 *     backfill them. This is probably the highest-impact visual change
 *     available, and it needs no code.
 *
 *  b) ORDER STATUS TIMELINE
 *     /orders/[id]/track exists but shows a single status. Storing a
 *     `statusHistory: [{ status, at, note }]` array and rendering it as a
 *     timeline removes most "where is my order" queries.
 *
 *  c) COUPONS
 *     A `Coupon` model (code, type: percent|flat, value, minOrder, expiresAt,
 *     usageLimit, usedCount) plus validation inside /api/payment/create-order.
 *     Validate server-side only — never trust a discount computed in the
 *     browser.
 *
 *  d) ADMIN PAGE IS 805 LINES
 *     src/app/admin/page.js holds stats, product CRUD, order management and
 *     forms in one file. Splitting it into /admin/products, /admin/orders and
 *     /admin/stats routes would make it far easier to change safely.
 *
 *  e) TESTS
 *     There are none. Start with the service layer, which is pure logic and
 *     easy to cover: `npm i -D vitest` and test getProducts() filter building,
 *     escapeRegex(), and the order total calculation.
 *
 *  f) ERROR MONITORING
 *     `npm i @sentry/nextjs`. Right now a production 500 is only visible if
 *     you happen to open the Vercel log tab. Sentry would have surfaced the
 *     /api/products failure the moment the first customer hit it.
 *
 *  i) OPTIONAL: RENDER THE STOREFRONT ON THE SERVER
 *     The home page and product pages are still client components that fetch
 *     after mount, which costs a round-trip before anything appears and leaves
 *     the HTML empty for crawlers. Section 1 above shows the conversion for
 *     product pages; the same pattern applies to the home page. This is the
 *     largest remaining performance win and was left out of the optimisation
 *     pass because it changes rendering behaviour rather than just efficiency.
 *
 *  j) OPTIONAL: VIRTUALISE LONG LISTS
 *     Only relevant if you raise the page size above ~50. `react-window`
 *     renders just the visible rows.
 *
 *  g) PAGINATION AT DEPTH
 *     `.skip()` re-reads every skipped document. At page 30 of 350 products it
 *     is imperceptible; if the catalogue reaches tens of thousands, switch to
 *     cursor pagination keyed on `_id`.
 *
 *  h) ACCESSIBILITY PASS
 *     Filter radio inputs have no aria-labels, and several icon-only buttons
 *     have no accessible name. For a health-products store serving older
 *     customers this is worth an afternoon.
 */
