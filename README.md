# Rameshwaram Ayurveda — E-Commerce Platform 🌿

A full-stack Ayurvedic e-commerce platform built with **Next.js 14 (App Router)**, **React 18** and **MongoDB**. Customers browse a catalogue of traditional Ayurvedic medicines, filter by category and brand, and check out through Razorpay.

**Live:** https://rameshwaram-ayurveda.vercel.app

---

## Features

**Storefront**
- Catalogue of 350+ Ayurvedic medicines, paginated and filterable
- Category and brand filters, with the filter values read from the database rather than hardcoded, so new brands appear automatically
- Search across product name, brand and description
- Cart and wishlist held in React context with local persistence

**Accounts**
- Sign-up and sign-in with mobile number + OTP (Firebase phone verification); no passwords
- Session held in an httpOnly JWT cookie (7-day expiry)
- Order history and per-order tracking with recorded status history

**Payments**
- Razorpay checkout, INR-native
- Payment signature verified server-side with HMAC-SHA256 before an order is recorded — the client is never trusted to report success
- Pincode serviceability check at checkout

**Admin**
- Dashboard with order statistics
- Product create / update / delete with Cloudinary image upload
- Order status management
- Admin access by role in MongoDB, or by phone number listed in `src/lib/adminPhones.js` (or `ADMIN_PHONE_NUMBERS`)
- Guarded by JWT role check in both Edge middleware and the route handlers

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (`jsonwebtoken` server-side, `jose` in Edge middleware), Firebase phone verification (OTP) |
| Payments | Razorpay |
| Images | Cloudinary |
| Validation | Zod |
| Styling | Vanilla CSS (custom design system, no framework) |
| Analytics | `@vercel/analytics` |
| Hosting | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── api/           Route handlers — validate input, call a service, shape the response
│   ├── (pages)/       Storefront, account, admin, checkout, policy pages
│   ├── error.js       Route-level error boundary
│   └── global-error.js
├── services/          Business logic (products, orders, users). Routes stay thin.
├── models/            Mongoose schemas and indexes
├── lib/               Cross-cutting concerns
│   ├── mongodb.js     Cached connection with explicit timeouts and retry
│   ├── env.js         Environment validation (non-fatal by design — see below)
│   ├── auth.js        JWT sign/verify, request → user
│   ├── session.js     Session cookie handling in one place
│   ├── apiResponse.js Uniform `{ success, data | error }` envelope
│   ├── validation.js  Zod schemas
│   ├── rateLimit.js   Per-IP and per-identifier limits
│   └── cloudinary.js  Image upload with deterministic public IDs
├── components/        UI components
├── context/           Cart and auth React contexts
└── middleware.js      Edge guards for /admin, /api/admin, /checkout, order writes
```

**Response envelope.** Every API route returns `{ success: true, data }` or `{ success: false, error, details? }`. Clients should check `res.ok` **and** `body.success` before reading `data`.

**Environment validation is deliberately non-fatal.** `lib/env.js` reports missing variables but does not throw at import time. An earlier version threw at module scope, and because `lib/mongodb.js` imports it, one missing variable took every database-backed route offline with an unreadable 500. Variables are now checked where they are used, so a missing Razorpay key disables payments without taking down the storefront.

---

## Running locally

**Prerequisites:** Node.js 18+, a MongoDB Atlas cluster (or local `mongod`), and Cloudinary / Razorpay / Firebase accounts if you need those features.

```bash
git clone https://github.com/19Animesh/Rameshwaram-Ayurveda.git
cd Rameshwaram-Ayurveda
npm install
cp .env.example .env      # then fill in the values
npm run dev
```

Open http://localhost:3000

Only `MONGODB_URI` and `JWT_SECRET` are required to boot. Without the others the app runs and logs which features are disabled.

### After deploying, run once

Product, Order and PendingOrder declare indexes but have `autoIndex` off in production. Create them on your live database once (with the production `MONGODB_URI` in `.env`):

```bash
npm run db:indexes
```

It only creates missing indexes and never drops any, so it is safe to re-run. Without it, duplicate products are not blocked, queries slow down as data grows, and abandoned checkouts are never cleaned up. Needs Node.js 20.19+ or 22.12+.

---

## Troubleshooting

**`querySrv ENOTFOUND _mongodb._tcp...`** — the SRV/DNS lookup for Atlas failed. Either the cluster hostname in `MONGODB_URI` is wrong, or your network blocks SRV records. Use the non-SRV connection string from Atlas → Connect (it lists hosts explicitly and skips SRV).

**Intermittent 500s on API routes in production** — check Atlas → Network Access allows `0.0.0.0/0`. Vercel's IPs rotate, so a fixed allowlist fails unpredictably. Also check whether an M0 cluster has auto-paused.

**A page loads but shows "Couldn't load…"** — that message is deliberate. Open the browser console for the underlying error, then Vercel → Logs for the server-side stack trace and its `ref` code.

**Where errors go.** In development, API errors return the full stack to the browser. In production they return a generic message plus a short reference like `(ref A3F9K2)`; grep that reference in the Vercel logs to find the matching stack trace.

---

## Security notes

- `RAZORPAY_KEY_SECRET`, `CLOUDINARY_API_SECRET`, `FIREBASE_PRIVATE_KEY`, `JWT_SECRET` and `MONGODB_URI` are server-only and must never carry a `NEXT_PUBLIC_` prefix.
- The `NEXT_PUBLIC_FIREBASE_*` values **are** meant to be public. That is how the Firebase web SDK works; access is controlled by Firebase Security Rules and authorised domains, not by hiding the key.
- Payment signatures are verified server-side. A client claiming success is not sufficient to create an order.
- Security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.mjs`. A Content-Security-Policy tuned for Razorpay is provided, commented, in `FUTURE_FEATURES.js`.

---

## `FUTURE_FEATURES.js`

Root-level file containing fully commented-out implementations of features that would move this project further toward production readiness — per-product SEO metadata and JSON-LD, race-safe stock decrement, full-text search, CSP, Redis rate limiting, transactional email, and an index-sync script. Nothing in it executes or affects the build; copy a section out when you want it.

---

*Developed for Rameshwaram Ayurveda.*
