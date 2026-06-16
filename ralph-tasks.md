# Ralph Loop Goal: Fix All Pre-Launch Bugs

## Phase 1 — CRITICAL Blockers (Login/Register/Orders Broken)
- [x] BUG-002/020: Fix AuthContext sends `identifier` but API expects `phone`
- [x] BUG-003: Fix Register page sends raw phone instead of formattedPhone
- [x] BUG-006: Fix getOrders uses plain string userId instead of ObjectId
- [x] BUG-004: Fix profile API inconsistency (returns `{user}` not `{data:{user}}`)
- [x] BUG-022: Fix garbled `Ã—` character in checkout order success screen

## Phase 2 — CRITICAL Security
- [x] BUG-008: Add status allowlist validation to order PUT endpoint
- [x] BUG-009: Remove/protect clear-orders DELETE endpoint
- [x] BUG-001: Validate productId format before sending to verify API
- [x] BUG-005: Fix cookie parsing regex in getUserFromRequest
- [x] BUG-007: Fix userId string comparison in orders GET (normalize to string)

## Phase 3 — HIGH Priority
- [x] BUG-011: Fix admin sidebar shows undefined when user has no email
- [x] BUG-013: Fix products page silently swallows fetch errors
- [x] BUG-015: Add validation - price must be > 0 for product creation
- [x] BUG-016: Remove 103 lines of commented-out dead code in products/route.js
- [x] BUG-017: Add ObjectId format check before Product.findById()
- [x] BUG-018: Add pagination to admin orders fetch
- [x] BUG-019: Fix deserialiseOrder overwrites real statusHistory
- [x] BUG-032: Remove/reduce verbose PII logging in getUserFromRequest
- [x] BUG-043: Remove unused import of getUserByEmailOrPhone in login route

## Phase 4 — MEDIUM Priority
- [x] BUG-023: Fix STATUS_COLOR keys to lowercase in account/page.js
- [x] BUG-025: Fix wrong brand name "AyurVeda Store" on home page
- [x] BUG-027: Add expiry date validation (must be future date)
- [x] BUG-028: Remove/cap fetchAll=10000 limit in productService
- [x] BUG-029: Fix admin stats - use actual sales data not reviewCount
- [x] BUG-031: Trim search input to 100 chars max (ReDoS protection)
- [x] BUG-040: Use finally block in verifyAndCreateOrder for setLoading

## Phase 5 — LOW Priority / Deployment
- [x] BUG-021: Show past order shipping addresses in account Addresses tab
- [x] BUG-024: Fix "Track Order" link pointing to non-existent route
- [x] BUG-035: Add security headers to next.config.mjs
- [x] BUG-036: Move WhatsApp number to env variable
- [x] BUG-044: Verify/create robots.txt in /public
- [x] BUG-010: Verified admin page already waits for authLoading before checking isAdmin
- [x] BUG-026: Documented rate limiter fail-open behavior
- [x] BUG-030: Category slugs already stored consistently in DB
