# Rameshwaram Ayurveda — Full Bug Audit

> Branch: `openclaw-industry-ready-fixes`
> Generated: May 13, 2026 — Sisyphus codebase audit

---

## Priority: Critical

### C‑1 ❌ Prescription-required product logic — entirely absent

**Files:** `src/models/Product.js`, `src/app/api/payment/verify/route.js`, `src/app/api/orders/[id]/route.js`,
`src/app/cart/page.js`, `src/app/checkout/page.js`

**Issue:** AGENTS.md demands:
> "Prescription-required products must not bypass prescription upload/review logic."

The `Product` model has no `requiresPrescription` boolean. There is zero code anywhere in the codebase that:
- Marks a product as prescription-only
- Blocks checkout if a prescription item is in the cart
- Uploads / displays / stores prescription images
- Lets admin review prescriptions

**Impact:** If a product legally requires a prescription (common in Ayurveda for medicated oils, tablets, etc.), nothing prevents unlicensed sale. **Legal/compliance risk.**

**Fix:** Add `requiresPrescription` to Product → block cart/payment if present → upload flow → admin review → release order.

---

### C‑2 ❌ SMS OTP delivery — not implemented

**Files:** `src/app/api/auth/register/route.js`, `src/app/api/auth/resend-otp/route.js`

**Issue:** AGENTS.md requires:
> "SMS OTP should use MSG91."

Both `register` and `resend-otp` routes send OTP **only via email** (`transporter.sendMail`). If a user registers with only a phone number (no email), no OTP is ever sent. The User model allows `phone` to be the sole identifier.

**Impact:** Phone-only users can never complete OTP verification. Registration is broken for non-email users.

**Fix:** Integrate MSG91 SMS API path → send OTP via SMS when user has no email.

---

### C‑3 ❌ Email verification still in schema + code

**Files:** `src/models/User.js`, `src/app/api/auth/register/route.js`, `src/app/api/auth/verify-otp/route.js`

**Issue:** AGENTS.md says:
> "Email verification should be removed from auth."

The `User` model still has `isEmailVerified: { type: Boolean, default: false }`. The register route sets `isEmailVerified: false`. The verify-otp route uses it:
```js
await User.findByIdAndUpdate(user._id, { isEmailVerified: true });
```

**Impact:** Dead field with enforcement logic. Contradicts project requirements.

**Fix:** Remove `isEmailVerified` from schema and all references. Re‑verify‑otp is a phone/OTP check, not email.

---

### C‑4 ❌ Rate limiting on OTP/auth endpoints — absent

**Files:** `src/app/api/auth/register/route.js`, `src/app/api/auth/verify-otp/route.js`, `src/app/api/auth/resend-otp/route.js`
**Related:** `src/lib/rateLimit.js`

**Issue:** RateLimit model and `rateLimit.js` helper exist but are **never imported or used** by any auth endpoint. The `rateLimit.js` has a potential bug: `windowMs` defaults to `60000` (1 min) and `max` defaults to `5`, but the model lookup uses `new Date(Date.now())` which may not align with the timestamp precision. More critically — none of the three auth routes invoke it.

**Impact:** No protection against OTP brute-force, SMS spam, or credential stuffing. An attacker can:
- Call `/api/auth/register` unlimited times (DB spam)
- Call `/api/auth/verify-otp` unlimited times (OTP brute-force on a 6-digit code)
- Call `/api/auth/resend-otp` unlimited times (SMS/email spam)

**Fix:** Integrate `checkRateLimit` into all three auth routes. Wrap handlers.

---

### C‑5 ❌ Server-side payment verification — missing fields validated

**Files:** `src/app/api/payment/create-order/route.js`, `src/app/api/payment/verify/route.js`

**Issue:** `verify/route.js` recalculates `deliveryCharge` based on `subtotal > 500`. However:

1. It does **not** verify that the products being ordered exist and have correct prices in the DB before trusting the client-computed `subtotal`.
2. The order is created inside a transaction that fetches products, but the `amountInPaise` from Razorpay's webhook/response is what's verified, not the individual line items.

**Impact:** If an attacker manipulates the price sent to `create-order`, the order amount could be lower than expected.

**Severity note:** The Razorpay payment verification does validate `amount` and `order_id`, which is the primary check. But there's no per-item price audit against the database at `create-order` time.

**Fix:** Re-fetch all products from DB in `create-order`, compute the real total server-side, compare against the client's subtotal.

---

### C‑6 ❌ `SITE_URL` vs `APP_URL` env var mismatch

**Files:** `src/app/layout.js`, `src/app/sitemap.js`, `.env.example`

**Issue:** `layout.js` and `sitemap.js` reference `process.env.NEXT_PUBLIC_SITE_URL`. `.env.example` defines `NEXT_PUBLIC_APP_URL`.

```js
// layout.js  (line 13)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// sitemap.js (line 8)
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// .env.example
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Impact:** In deployments where the env file is sourced literally, `SITE_URL` is undefined and falls back to `localhost:3000`. **Canonical URLs and sitemap URLs will be wrong in production** — duplicate content / SEO penalty risk.

**Fix:** Align to a single name. If you keep `APP_URL`, rename references in layout and sitemap. Or rename the env var to `SITE_URL`.

---

## Priority: High

### H‑1 ❌ Cart page delivery charge — always ₹100, ignores threshold

**File:** `src/app/cart/page.js`

**Issue:** Cart page always adds ₹100 delivery charge:
```js
const deliveryCharge = 100;
```

But the checkout page and payment routes use:
```js
deliveryCharge = subtotal > 500 ? 0 : 100;
```

**Impact:** User sees ₹100 delivery charge in cart, but payment uses different logic. Mismatch erodes user trust. The cart page should show the *actual* charge the user will pay.

**Fix:** Make delivery charge a dynamic calculation in cart, same logic: `subtotal > 500 ? 0 : 100`.

---

### H‑2 ❌ City/State inputs `readOnly` — user can't correct failed pincode lookup

**File:** `src/app/checkout/page.js`

**Issue:** City and state inputs have `readOnly` attribute:
```jsx
<Input readOnly style={{ backgroundColor: 'var(--gray-50)' }} ... />
```

When the pincode API fails or returns no data, the user **cannot manually type city/state**, rendering the form unusable.

**Impact:** Checkout dead-end for any pincode that isn't in the API's database.

**Fix:** Remove `readOnly`. Pre-fill from API but allow manual override.

---

### H‑3 ❌ `resend-otp` uses `require('bcryptjs')` inside function body

**File:** `src/app/api/auth/resend-otp/route.js` (line 43)

**Issue:** The file uses ESM `import` at the top level but falls back to CJS `require` for `bcryptjs`:
```js
const bcrypt = require('bcryptjs');
```
This only works because Next.js transpiles mixed module systems. Every other route `import`s bcrypt at the top.

**Impact:** Inconsistent pattern. May break under strict ESM bundlers or build tooling changes.

**Fix:** Add `import bcrypt from 'bcryptjs'` at top, remove `require()`.

---

### H‑4 ❌ Order status changes — no history / audit trail

**File:** `src/models/Order.js`, `src/app/api/orders/[id]/route.js`

**Issue:** The Order model has a single `status` string:
```js
status: { type: String, enum: ['pending','confirmed','shipped','delivered','cancelled'], default: 'pending' }
```

The PUT handler overwrites the field directly:
```js
order.status = status;
await order.save();
```

**Impact:** No record of when status changed or what the previous status was. Audit and customer-support impossible.

**Fix:** Add `statusHistory: [{ status: String, changedAt: Date, changedBy: ObjectId }]` array. Push each change.

---

### H‑5 ❌ No email/notification on order status change

**File:** `src/app/api/orders/[id]/route.js`

**Issue:** The PUT handler updates order status but sends zero notifications (email or otherwise) to the customer.

**Impact:** Customer never knows their order status changed unless they manually refresh the site.

**Fix:** Call `mailer.sendOrderUpdateEmail()` (or similar) after successful status update.

---

### H‑6 ❌ `next.config.mjs` — wildcard `remotePatterns`

**File:** `next.config.mjs`

**Issue:**
```js
remotePatterns: [
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  { protocol: 'https', hostname: '**' },
]
```

`hostname: '**'` allows images from **any** HTTPS host, which defeats the purpose of `remotePatterns` and opens potential for SSRF or abuse via `next/image`.

**Impact:** If an attacker can inject an image URL (e.g., via product description), it will be fetched by the server.

**Fix:** Remove the `**` entry. Expand Cloudinary-specific patterns as needed:
```js
remotePatterns: [
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  { protocol: 'https', hostname: 'res-1.cloudinary.com' },
]
```

---

### H‑7 ❌ Token stored in both httpOnly cookie + localStorage — messy dual pattern

**Files:** `src/lib/api.js`, `src/middleware.js`, `src/app/admin/page.js`, `src/lib/auth.js`

**Issue:** The login/verify-otp routes set an httpOnly cookie (`token`) AND return the token in the response body. The client-side `api.js` reads from `localStorage.getItem('ayurvedic_token')` for the `Authorization` header. The admin page has a custom `getTokenFromLocalStorage()`.

But **nothing writes `ayurvedic_token` to localStorage** — the `AuthContext` login only sets user state, not localStorage. So `api.js` always sends `Authorization: Bearer null` for localStorage-dependent requests. Meanwhile, the browser auto-sends the httpOnly cookie on same-origin requests, so auth still works (the backend `getUserFromRequest` falls back to cookie).

**Impact:** Confusing architecture. The localStorage path is dead code that gives a false sense of auth. If someone later adds XSS, the cookie is at least httpOnly-protected, but the localStorage key is still read.

**Fix:** Decide one canonical auth transport. Either (a) pure httpOnly cookie + remove all localStorage token reads, or (b) pure Authorization header + remove cookie setting.

---

### H‑8 ❌ Admin clear-orders — no audit trail or soft-delete

**File:** `src/app/api/admin/clear-orders/route.js`

**Issue:** DELETE handler runs:
```js
await Order.deleteMany({});
```

This permanently destroys all order data with no recovery possible. No confirmation beyond the admin frontend's `confirm()`. No soft-delete flag. No audit log of who cleared orders and when.

**Impact:** A rogue admin or compromised admin session can destroy all sales records irrecoverably.

**Fix:** Either (a) add an `isDeleted` flag and use `findByIdAndUpdate` to soft-delete, or (b) log the action to a separate audit collection before delete. At minimum log admin ID + timestamp.

---

## Priority: Medium

### M‑1 ❌ `orderService.placeOrder()` — no transaction, dead code

**File:** `src/services/orderService.js`

**Issue:** `placeOrder()` decrements stock then creates the order sequentially but **not atomically**. If the order creation fails after stock decrement, inventory is corrupted.

It's also **dead code** — no route calls it. POST `/api/orders` returns 405. Order creation happens in the payment verify route, which **does** use transactions.

**Fix:** Either remove the dead function or add a transaction to it (and wire it up). At minimum add a comment: *"Currently unused — order creation is handled in /api/payment/verify"*.

---

### M‑2 ❌ Unused dependencies with vulnerabilities

**Files:** `package.json`, npm audit results

| Dependency | Usage | Vulns | Notes |
|---|---|---|---|
| `xlsx` | Not imported anywhere | 2 high (no fix) | Unused, should remove |
| `pg` | Not imported anywhere | — | Unused (MongoDB project), should remove |
| `axios` | Not imported in source | 15 vulns (6 high) | Transitive, not direct — still in lockfile |

**Fix:** `npm uninstall xlsx pg`. For axios, run `npm audit fix` to dedupe/upgrade transitive.

---

### M‑3 ❌ Verify-OTP — no attempt limiting per code

**File:** `src/app/api/auth/verify-otp/route.js`

**Issue:** The handler finds the OTP doc and calls `bcrypt.compare(code, otp.code)`. If the comparison fails, the same OTP document can be retried infinitely (up to MongoDB document age via TTL). A 6-digit OTP has only 1M combinations — an attacker could brute-force in hours.

**Impact:** Weak OTP verification despite bcrypt, because there's no rate limit or max-attempt counter on the OTP document itself.

**Fix:** Add an `attempts` field to the OTP model. Increment on each failed verify. Delete OTP after 3-5 failed attempts.

---

### M‑4 ❌ Pincode validation — no caching

**File:** `src/app/api/validate-pincode/route.js`

**Issue:** Every request hits the external PostGrid API. No in-memory or Redis cache for previously-validated pincodes. If 100 users enter the same pincode, the API is called 100 times.

**Impact:** Unnecessary latency (external API round-trip) and cost (PostGrid billing).

**Fix:** Add a simple in-memory cache (`Map` with TTL) or a local pincode collection in MongoDB. TTL cache is simplest.

---

### M‑5 ❌ Profile route PUT — no current-password check for phone change

**File:** `src/app/api/auth/profile/route.js`

**Issue:** The PUT handler updates `phone` directly after token verification:
```js
if (body.phone) updateFields.phone = body.phone;
```

No current-password re-verification. If a user's session token is stolen (XSS, etc.), an attacker can change the phone number and trigger password reset to take over the account.

**Fix:** Require `currentPassword` for sensitive field changes (email, phone).

---

### M‑6 ❌ `scratch/` directory — leftover temp files

**Files:** `src/app/scratch/fix.js`, `src/app/scratch/fix2.js`, `src/app/scratch/fix3.js`

**Issue:** Three scratch files in the source tree. These should not be part of the production codebase.

**Fix:** Delete the `scratch/` directory.

---

### M‑7 ❌ Sitemap — database fetch on every request

**File:** `src/app/sitemap.js`

**Issue:** The sitemap handler fetches all products from MongoDB on every invocation. For high-traffic sites, this adds DB load and latency to every sitemap request (including search engine bots).

**Impact:** Unnecessary DB load. Potential slow response for crawlers.

**Fix:** Add in-memory caching with 1-hour TTL, or pre-generate a static sitemap on build.

---

### M‑8 ❌ No Content Security Policy headers

**Files:** `src/middleware.js` (no CSP), `next.config.mjs` (no CSP)

**Issue:** The application sets no Content Security Policy headers. This means any XSS vulnerability can be exploited without restriction (inline scripts, inline styles, eval, etc.).

**Impact:** Elevated risk from any XSS flaw.

**Fix:** Add CSP headers in `next.config.mjs` via `headers()` async function:
```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{ key: 'Content-Security-Policy', value: "..." }],
  }];
}
```

---

### M‑9 ❌ No request body size limits

**Files:** All API routes, `next.config.mjs`

**Issue:** No `bodyParser` size limit configured. Standard Next.js API routes accept up to 4MB implicitly, but there's no explicit limit per-endpoint. Large payloads can cause memory pressure.

**Impact:** DoS via oversized request bodies.

**Fix:** Either set `api: { bodyParser: { sizeLimit: '500kb' } }` in next.config.mjs, or use per-route body size checks.

---

## Priority: Low

### L‑1 ❌ `rateLimit.js` — `windowStart` may drift

**File:** `src/lib/rateLimit.js`

**Issue:** `windowStart` is set to `new Date(Date.now())` which is precise to the millisecond. Two requests 59 seconds apart could fall into different windows depending on startup timing. For a 60-second window, using `Math.floor(Date.now() / 60000) * 60000` would be more consistent.

**Impact:** Low — window drift is a minor edge case, not a security hole.

**Fix:** Round `windowStart` to the window boundary.

---

### L‑2 ❌ `/api/payment/verify` — order note field limited but not sanitized

**File:** `src/app/api/payment/verify/route.js`

**Issue:** The `orderNote` from the client is stored directly into the Order model:
```js
orderNote: body.orderNote || '',
```

No length limit or sanitization. While MongoDB text fields aren't executable, excessively long notes waste DB space.

**Fix:** Truncate to 500 characters.

---

### L‑3 ❌ `/api/admin/stats` — no date range filtering

**File:** `src/app/api/admin/stats/route.js`

**Issue:** Stats aggregates all time and totals revenue. For larger datasets, this becomes slow and less useful.

**Fix:** Add optional `startDate` / `endDate` query params. Default to current month.

---

### L‑4 ❌ `/api/payment/verify` — error swallows details

**File:** `src/app/api/payment/verify/route.js`

**Issue:** The catch block logs to console but returns a generic message:
```js
return errorResponse('Payment verification failed', 500);
```

No way for the client to distinguish *why* it failed (signature mismatch vs. product out of stock vs. DB error).

**Fix:** Differentiate error messages (don't expose internals — just give a more useful category).

---

### L‑5 ❌ `AuthContext` — no token refresh / auto-logout

**File:** `src/context/AuthContext.js`

**Issue:** No token expiry check. A session could be expired server-side (cookie removed) while the client still shows a logged-in state.

**Impact:** User sees stale UI until they interact with an API that returns 401.

**Fix:** Periodically verify token validity, or check `jwtExpiresIn` on mount and auto-logout if expired.

---

### L‑6 ❌ `CartContext` — persistent storage, not server-authoritative

**File:** `src/context/CartContext.js`, `src/app/api/payment/create-order/route.js`

**Issue:** Cart is stored in `localStorage` alone. The order total is trusted from client-side and used to create the Razorpay order. While payment verification happens later, this means `create-order` creates a Razorpay order for any amount the client claims.

**Razorpay note:** The payment gateway itself checks the amount — the customer pays the exact `amount` specified in the Razorpay order. So changing it on the client would cause a payment mismatch. This is partially mitigated by the signature verification.

**Fix:** Re-compute the total server-side in `create-order` from the DB product prices, rather than trusting the client's `subtotal`.

---

### L‑7 ❌ `mongoose.set('strictQuery', true)` — already set

**File:** `src/lib/mongodb.js`

**Issue:** This is the default in Mongoose 7+. No impact, just noise. Keep or remove — harmless either way.

---

### L‑8 ❌ `jsconfig.json` path alias mismatch

**File:** `jsconfig.json`

**Issue:**
```json
"paths": {
  "@/*": ["./src/*"]
}
```

Some imports use `@/` (correct), others use relative imports (e.g., `../../models/User`). Mixed styles make refactoring harder.

**Fix:** Normalize all imports to use the `@/` alias.

---

## Summary Table

| Priority | Count | Key Items |
|---|---|---|
| **Critical** | 6 | No prescription logic, no SMS OTP, email verification still present, no rate limiting on OTP, missing server-side price validation, SITE_URL/APP_URL mismatch |
| **High** | 8 | Cart delivery charge mismatch, readOnly city/state, `require()` in ESM, no order status history, no status change notification, wildcard remotePatterns, token dual storage mess, clear-orders no audit |
| **Medium** | 9 | Dead code in orderService, unused deps with vulns, no OTP brute-force protection, no pincode caching, no current-password check for phone, scratch dir, sitemap no cache, no CSP headers, no body size limits |
| **Low** | 8 | rateLimit window drift, unsanitized orderNote, stats no date filter, error message generic, no auto-logout, cart not server-authoritative, strictQuery noise, mixed import styles |
| **Total** | **31** | |

---

## Recommended Implementation Order

### Phase 1 — Security (Critical/High)
1. C‑1: Prescription product model + checkout block
2. C‑2: MSG91 SMS OTP integration
3. C‑4: Rate limiting on auth/OTP endpoints
4. C‑5: Server-side price verification at `create-order`
5. C‑6: Fix SITE_URL/APP_URL mismatch
6. H‑6: Remove wildcard remotePatterns
7. H‑8: Add audit to clear-orders
8. H‑7: Resolve token transport strategy

### Phase 2 — Data Integrity (Critical/High)
9. C‑3: Remove isEmailVerified
10. H‑1: Fix cart delivery charge
11. H‑4: Add order status history
12. H‑5: Order status change notifications
13. H‑2: City/state editable fallback
14. M‑1: Handle dead orderService code
15. M‑3: OTP attempt limiting

### Phase 3 — Cleanup & Polish (Medium/Low)
16. H‑3: Fix resend-otp import style
17. M‑2: Remove unused deps
18. M‑4: Pincode caching
19. M‑5: Current-password check for phone
20. M‑6: Remove scratch/ directory
21. M‑7: Sitemap caching
22. M‑8: CSP headers
23. M‑9: Body size limits
24. L‑1: L‑8: Remaining low-priority items

---

*End of bug audit — 31 issues total.*
