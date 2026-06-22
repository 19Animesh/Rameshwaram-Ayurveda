# Ralph Loop Goal: Fix All Audit Errors

## Critical / Blockers
- [x] T01: Fix cart brand bug — `item.brand` → `item.brandName` in `cart/page.js:51`
- [x] T02: Disable `clear-orders` endpoint in production
- [x] T03: Fix revenue stat full collection scan → `$sum` aggregation in `stats/route.js`
- [x] T04: Convert home `page.js` to Server Component (fix SEO)
- [x] T05: Implement Forgot Password flow (new page + API route)

## High Severity Bugs
- [x] T06: Fix product POST — use validated `price` variable instead of raw `data.price` in `products/route.js:120`
- [x] T07: Fix admin orders pagination (add page/total support)
- [x] T08: Fix admin dashboard error swallowing — add UI error state
- [x] T09: Fix account orders silent failure — add error state
- [x] T10: Fix addresses tab race condition in `account/page.js`

## Medium Severity / UX
- [x] T11: Replace `alert()` in `admin/page.js` with toast (already has toast system)
- [x] T12: Replace `alert()` in `checkout/page.js` with inline error
- [x] T13: Add admin orders pagination UI

## Low / Code Quality
- [x] T14: Fix `isNaN(pincode)` → `/^\d{6}$/.test(pincode)` in `validate-pincode/route.js`
- [x] T15: Add shared `normalizePhone()` utility in `lib/phone.js`; use it across 6 files (login page, register page, forgot-password page, login API, register API, verify-otp API, reset-password API)
- [x] T16: Remove dead files: `lib/razorpay.js`, `services/userService.js` (Note: `lib/cloudinary-client.js` is active and must be kept)
- [x] T17: Remove `console.log` from production code paths

## Verification
- [x] T18: `npm run lint` passes with zero warnings/errors
- [x] T19: `npm run build` passes cleanly
