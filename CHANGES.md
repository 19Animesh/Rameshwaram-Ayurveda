# Rameshwaram Ayurveda — Codebase Changes Summary

This file tracks all modifications made to the codebase phase by phase, listing the files changed, why they were changed, and a summary of the diff.

---

## Phase 1: Critical Security & Logic Fixes

* **`src/lib/auth.js`**: Removed PII (`user.email`) from standard request decoding console log to prevent leakage in production server logs (CRIT-1).
* **`src/app/admin/page.js`**: 
  * Removed token lookup from `localStorage` in `authHeaders()` as auth relies on secure `httpOnly` cookies (CRIT-2).
  * Added response validation checks (`res.ok`) to `handleDelete` (CRIT-3), `handleOrderStatus` (CRIT-4), and `saveInlineStock` (MED-7) to prevent silent failures.
  * Added `hasLoadedData` ref and optimized `handleSearch` to prevent duplicate API requests and race conditions during mount (MED-6).
* **`src/services/orderService.js`**: Deprecated and stubbed out the insecure `placeOrder` function, causing it to throw an explicit error to prevent bypass of payment/cart verification (CRIT-5).
* **`src/app/api/auth/logout/route.js`**: Created a new server route that explicitly clears the secure `httpOnly` cookie (`token`) on logout (HIGH-6 helper).
* **`src/context/AuthContext.js`**: Updated the client-side `logout` function to invoke the new `/api/auth/logout` API before clearing user state (HIGH-6).
* **`src/app/api/auth/login/route.js`**: Added support for sending an SMS OTP via MSG91 for unverified phone numbers on login (HIGH-2).
* **`src/app/account/page.js`**: Removed redundant `localStorage` token lookup in profile loading.
* **`src/lib/api.js`**: Removed unused `getToken` and simplified `authHeaders` to align with cookie-only auth.

---

## Phase 2: Auth Refactor: Phone-Only OTP

* **`src/app/api/auth/register/route.js`**: Enforced phone number as a required field and made email optional. Set MSG91 SMS OTP sending as the default and required verification path for registration.
* **`src/app/auth/register/page.js`**: Updated the UI to require phone number, made email optional, and updated button labels/verification headers to refer to phone number instead of email.
* **`src/app/auth/login/page.js`**: Updated identifier input label and placeholder to prioritize phone number first.
* **`src/lib/mailer.js`**: Lazily initialized the nodemailer transporter inside `getTransporter()` to prevent start-up crashes when SMTP environment variables are missing (LOW-3).

---

## Phase 3: Rate Limiting & Admin Fixes

* **`src/lib/rateLimit.js`**: Refactored the rate-limiting verification logic to perform a clean combination of `findOne` and atomic `findOneAndUpdate`. This fixes the issue where `record.save()` could fail or behave unpredictably when MongoDB's TTL index concurrently deleted the document.

---

## Phase 4: Security Hardening

* **`src/services/productService.js`**: Added a regex character escaping helper (`escapeRegex`) and used it on search, category, and brand filters to protect against ReDoS and query injection (MED-2, MED-4).
* **`src/app/api/products/[id]/route.js`**: Removed redundant `!product` validation check in the `GET` route (MED-3).

---

## Phase 5: Next.js Version Check & Params

* **Verification**: Checked `package.json` and verified that the project is running Next.js version `^14.2.0` (Next.js 14). In Next.js 14, `params` in dynamic API routes and page components is a plain synchronous object, and therefore does not need to be awaited. Awaiting it is not required. (No changes required for MED-5).

---

## Phase 6: Minor UX Polish

* **`src/app/api/products/route.js`**: Removed a verbose success console log from the products fetch route (LOW-1).
* **`src/services/productService.js`**: Removed redundant console logs from `getProducts` to keep server output clean.
* **`src/context/CartContext.js`**: Refactored the `addToCart`, `removeFromCart`, `updateQuantity`, `addToWishlist`, `removeFromWishlist`, `isInWishlist`, and `isInCart` functions to systematically normalize product IDs (supporting both `id` and `_id` and storing them consistently as `id`) (HIGH-4).
* **`src/app/checkout/page.js`**:
  * Captured `deliveryCharge` directly at the time of purchase in `finalOrderState` and displayed it on the success screen, preventing any rounding/calculation mismatches (LOW-2).
  * Guarded the empty cart redirect check with `!orderPlaced` to prevent screen flickering/race conditions when clearing the cart after a successful order (HIGH-5).
---

## Phase 7: Firebase Phone Authentication Migration

* **`src/lib/firebase.js`** [NEW]: Initialized the Firebase Client SDK web configuration keys dynamically with safety checks to support SSR.
* **`src/lib/firebaseAdmin.js`** [NEW]: Configured the Firebase Admin SDK lazily using project environment variables to support secure server-side verification of Firebase ID Tokens and avoid startup crashes.
* **`src/context/AuthContext.js`**: Updated `register` and `verifyOtp` API helper wrappers to accept and forward the `firebaseToken` to the server.
* **`src/app/api/auth/register/route.js`**: Refactored registration API to require `firebaseToken` and verify it server-side using the Firebase Admin SDK. Validates that the verified phone number matches the registration phone, then creates the user with `isPhoneVerified: true` directly.
* **`src/app/api/auth/verify-otp/route.js`**: Replaced custom database OTP lookup/verification logic with server-side validation of the Firebase ID Token.
* **`src/app/api/auth/login/route.js`**: Removed custom local OTP generation, mail, and MSG91 SMS dispatch code. Simplified the unverified user response to return `requireVerification: true` and the user's `phone` number to allow client-side OTP trigger.
* **`src/app/auth/register/page.js`**: Integrated client-side Firebase Phone Auth widget (RecaptchaVerifier and SMS code verification), submitting the verified token to the register API.
* **`src/app/auth/login/page.js`**: Integrated client-side Phone Auth widget for unverified users logging in, forwarding the verified token to verify-otp.
* **Deleted Deprecated OTP & Mailer Files** [DELETE]: Removed `src/lib/msg91.js`, `src/models/OTP.js`, `src/app/api/auth/resend-otp/route.js`, and `src/lib/mailer.js`. Uninstalled `nodemailer` package, leaving the codebase lighter, cleaner, and easier to understand.

---

## Phase 8: Mobile Phone-Only Authentication & 20s OTP Resend Cooldown

* **`src/app/auth/login/page.js`**: 
  * Restrained the login form to accept strictly mobile phone numbers (removed the email login reference).
  * Added client-side OTP resend capability for login with a **20-second cooldown** timer.
* **`src/app/auth/register/page.js`**: Updated the registration verification OTP resend cooldown timer from 60 seconds to **20 seconds**.
* **`src/app/api/auth/login/route.js`**: Changed the login schema validation to require `phone` strictly, connecting and looking up users strictly by their phone numbers and ignoring email fallbacks.
* **`src/app/api/auth/verify-otp/route.js`**: Removed legacy email-specific branches and ensured the backend always validates that the user's registered phone number matches the decoded Firebase phone number token before updating the verified status.

