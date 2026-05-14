# Rameshwaram Ayurveda - Comprehensive Code Audit Report

## 1. Executive Summary

A thorough review of the current codebase against the previous `BUG_AUDIT.md` reveals that significant and excellent progress has been made. Critical security flaws regarding rate limiting and server-side payment verification have been successfully resolved. However, major compliance and functionality gaps remain, particularly regarding prescription handling, OTP delivery for mobile-only users, and missing audit trails.

This document details exactly what has been fixed, what remains broken, and highlights newly identified logic conflicts.

---

## 2. Status of Previous Audit Findings (`BUG_AUDIT.md`)

### ✅ Resolved Issues
The following issues from the previous audit have been **successfully fixed**:

* **[C-3] Email Verification Removed**: `isEmailVerified` was successfully stripped from the `User` model. Registration defaults correctly to `isPhoneVerified: false`.
* **[C-4] Rate Limiting Implemented**: `checkRateLimit` is now actively protecting `/api/auth/register`, `resend-otp`, and `verify-otp`.
* **[C-5] Server-Side Payment Verification**: Both `create-order` and `verify` payment routes now correctly fetch canonical product prices directly from MongoDB. Frontend price tampering is no longer possible.
* **[C-6] URL Mismatch**: `layout.js` now uses `NEXT_PUBLIC_APP_URL`, accurately matching the `.env.example` file.
* **[H-1] Cart Delivery Charge Sync**: The cart page delivery charge calculation now correctly matches the backend logic (Free over ₹500, otherwise ₹100).
* **[H-2] Checkout Form Usability**: The `readOnly` attribute was removed from City/State inputs, allowing users to manually enter their location if the Pincode API fails.
* **[H-3] ESM Imports**: `require()` was removed from `resend-otp` in favor of standard ES6 `import`.
* **[H-6] Remote Patterns**: The dangerous wildcard domain (`**`) was removed from `next.config.mjs`, mitigating SSRF risks.
* **[M-3] OTP Brute-Force Protection**: `verify-otp` now actively tracks failed attempts and invalidates the OTP after 5 consecutive failures.

### ❌ Unresolved / Lingering Issues
The following issues remain **unfixed and present in the codebase**:

* **[C-1] Prescription Logic**: Still completely absent. `Product.js` lacks a `requiresPrescription` boolean, and the checkout flow does not prompt for or handle prescription image uploads. **(Critical Legal Risk)**
* **[C-2] SMS OTP via MSG91**: Still not implemented. The system relies entirely on `sendOtpEmail`.
* **[H-4 & H-5] Order Status History & Notifications**: The `Order.js` schema does not persist a `statusHistory` array. Furthermore, status changes made via `PUT` in `/api/orders/[id]/route.js` do not trigger email or SMS notifications to the customer.
* **[H-7] Dual Token Storage Architecture**: `api.js` still contains dead code that checks `localStorage` for `ayurvedic_token`, despite the application securely relying on `httpOnly` cookies.
* **[H-8] Admin `clear-orders` Risk**: `/api/admin/clear-orders/route.js` continues to perform a hard `deleteMany({})` operation without an audit log or soft-delete mechanism.
* **[M-4] Pincode API Caching**: `/api/validate-pincode` queries the external PostGrid API on every keystroke/request without caching, risking rate limits and increased latency.
* **[M-6] Scratch Directory**: The `scratch/` directory is still present in the repository root.
* **[M-8] Content Security Policy**: CSP headers remain missing from `middleware.js` and `next.config.mjs`.

---

## 3. New Logic Conflicts & Architectural Observations

### A. The "Ghost User" OTP Lockout (Logic Conflict)
In `api/auth/register/route.js` and `api/auth/resend-otp/route.js`, the system allows registration using *only* a phone number. However, the OTP delivery mechanism is strictly gated behind an email check:
```javascript
if (email) {
  await sendOtpEmail(email, otpCode);
}
```
**Impact:** If a user registers with a phone number and leaves the email blank, the user account is created in MongoDB, but the OTP is never dispatched anywhere. The user is stranded on the verification screen and permanently locked out of the account.

### B. Fragmented Delivery Constants (Maintenance Risk)
The delivery threshold (`₹500`) and the delivery charge (`₹100`) are hardcoded individually across three entirely separate files:
1. `src/app/cart/page.js`
2. `src/app/checkout/page.js`
3. `src/app/api/payment/create-order/route.js`

**Impact:** If business requirements change (e.g., offering free delivery over ₹1000), a developer might update the frontend but miss the backend `create-order` route, immediately resulting in Razorpay signature mismatches and broken checkouts. 

### C. Brittle Order Address Deserialization
In `api/orders/[id]/route.js`, the code attempts to handle a schema transition between an old stringified JSON `shippingAddr` and a new structured `shippingAddress` object. It uses an inline Immediately Invoked Function Expression (IIFE) with an empty `try/catch` block to parse the old data.
**Impact:** This is error-prone. A one-time MongoDB migration script should be run to normalize all legacy `shippingAddr` strings into structured `shippingAddress` objects to cleanly remove this technical debt.

### D. Incomplete MongoDB Transaction Fallback
In `api/payment/verify/route.js`, the fallback block for MongoDB setups lacking replica sets (which do not support ACID transactions) executes operations sequentially. 
**Impact:** It decrements product stock iteratively. If the subsequent `Order.create()` call fails (due to a validation error, network blip, etc.), the stock remains permanently deducted, creating "ghost inventory" losses.

---

## 4. Recommended Action Plan

### Phase 1: Compliance & Critical Unblocking
1. **MSG91 SMS Integration**: Implement the MSG91 API in `register` and `resend-otp` routes so that phone-only users actually receive their OTPs.
2. **Prescription Gate**: Add `requiresPrescription` to the Product schema. Intercept the checkout UI to require an image upload if a restricted product is in the cart.
3. **Consolidate Business Rules**: Create `src/lib/constants.js` and export `DELIVERY_CHARGE` and `DELIVERY_FREE_THRESHOLD`. Import this single source of truth into the cart, checkout, and API routes.

### Phase 2: Data Integrity & Traceability
1. **Order Audit Trails**: Update the `Order` schema with `statusHistory: [{ status: String, changedAt: Date }]`. Ensure the admin PUT route pushes to this array and triggers a customer notification.
2. **Admin Safeguards**: Refactor `/api/admin/clear-orders` to either soft-delete (using an `isDeleted` flag) or write to an immutable audit collection before executing the drop.
3. **Pincode Caching**: Add a simple in-memory `Map` with a TTL or utilize Redis for `/api/validate-pincode` to prevent hammering the external PostGrid service.

### Phase 3: Cleanup
1. Delete the `scratch/` directory.
2. Remove all `localStorage.getItem('ayurvedic_token')` references from `api.js` to solidify the `httpOnly` cookie architecture.
3. Implement strict CSP headers in `next.config.mjs`.
