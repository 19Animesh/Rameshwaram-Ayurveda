# Agent Rules for Rameshwaram Ayurveda

You are working on a Next.js / MongoDB ecommerce project for an Ayurveda and medicine-related store.

Primary goal:
Make the website production-ready, secure, reliable, maintainable, mobile-friendly, and industry-ready.

Core business rules:
- Do not trust client-side cart totals, prices, stock status, payment status, prescription status, or user role.
- Payment must always be verified server-side before confirming an order.
- Prescription-required products must not bypass prescription upload/review logic.
- Admin APIs must be protected server-side.
- SMS OTP should use MSG91.
- Email verification should be removed from auth.
- General transactional email may remain for order updates, invoices, support, or admin alerts.
- Existing email-only users must not be locked out immediately.

Hard safety rules:
- Do not modify .env secrets.
- Do not print secrets in logs.
- Do not delete files or folders without listing them first and explaining why.
- Do not run broad destructive commands.
- Do not push to production.
- Do not change deployment settings without explaining the change.
- Do not replace the entire UI unless specifically asked.
- Do not remove medicine/prescription safety logic.
- Do not weaken authentication, authorization, payment verification, or rate limiting.

Required workflow:
1. Audit before editing.
2. List critical, high, medium, and low issues.
3. Propose implementation phases.
4. Make small focused changes.
5. Show changed files after each phase.
6. Run lint/build/tests where available.
7. Fix failing checks instead of hiding them.
8. Summarize remaining risks.

Audit priorities:
1. Authentication and session security
2. SMS OTP correctness
3. Email verification removal
4. Existing-user migration safety
5. Payment verification
6. Order integrity
7. Prescription/restricted product safety
8. Admin authorization
9. API validation
10. Rate limiting
11. Data model consistency
12. SEO and metadata
13. Mobile checkout UX
14. Error/loading states
15. Deployment readiness