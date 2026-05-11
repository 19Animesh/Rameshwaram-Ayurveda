# Claude Code Instructions for Ayurvedic Store

## Project Context
This is a Next.js 14 Ayurvedic ecommerce project in D:\Ayurvedic.
The goal is to make the app production-ready without breaking checkout, auth, admin, products, orders, SEO, or payment flow.

## Safety Rules
- Never delete files, folders, branches, database data, or environment files without explicit user approval.
- Never run `npm audit fix --force` without explicit user approval.
- Never overwrite `.env`, `.env.local`, Vercel config, or secrets.
- Never hardcode API keys, payment secrets, MongoDB URLs, OTP secrets, or admin credentials.
- Do not change payment provider logic unless the current code clearly requires it.
- Preserve existing business logic unless a bug is proven.
- Make small commits by category, not one huge commit.

## Required Workflow
1. Inspect before editing.
2. Explain the suspected bug.
3. Make the smallest safe fix.
4. Run the relevant verification command.
5. Show changed files and summarize risk.
6. Stop and ask before high-risk changes.

## Verification Commands
Use the commands already present in package.json when available.
At minimum, run:
- npm run build
- npm audit
- any available lint/type/test command from package.json

## Known Current Issues From Baseline Logs
- npm audit reports 12 vulnerabilities: 4 moderate, 8 high.
- build logs warn that RAZORPAY_KEY_SECRET is not set.
- /api/validate-pincode uses request.url and triggers Dynamic server usage warning.
- /api/auth/profile uses request.headers and triggers Dynamic server usage warning.
- Build currently succeeds, so fixes should preserve successful production build.