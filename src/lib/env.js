/**
 * src/lib/env.js
 * Environment variable validation.
 *
 * IMPORTANT DESIGN NOTE
 * ---------------------
 * This module deliberately does NOT throw at import time.
 *
 * The previous version called validateEnv() at module scope and threw if any
 * one of twelve variables was missing. Because lib/mongodb.js imports this
 * file, a single missing or renamed variable (for example RAZORPAY_KEY_ID)
 * caused every database-backed API route to return 500 with no useful message.
 * One typo in the Vercel dashboard could take the entire storefront offline.
 *
 * Instead:
 *   - Variables the app genuinely cannot run without are HARD requirements.
 *     They are reported loudly, and throw only where they are actually used.
 *   - Everything else is feature-scoped: the app logs a clear warning and
 *     degrades that one feature, leaving the rest of the site up.
 */

/** Without these, nothing works. */
const HARD_REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

/** Feature-scoped. Missing => that feature is disabled, site stays up. */
const FEATURE_VARS = {
  'Image uploads (Cloudinary)': [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ],
  'Phone verification (Firebase)': [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ],
  'Payments (Razorpay)': ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
  'Canonical URLs & sitemap': ['NEXT_PUBLIC_APP_URL'],
};

let hasReported = false;

/**
 * Logs a readable summary of configuration problems once per process.
 * Never throws.
 */
export function reportEnvStatus() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuild || hasReported) return { missingHard: [], missingFeatures: {} };
  hasReported = true;

  const missingHard = HARD_REQUIRED.filter((name) => !process.env[name]);
  const missingFeatures = {};

  for (const [feature, names] of Object.entries(FEATURE_VARS)) {
    const missing = names.filter((name) => !process.env[name]);
    if (missing.length) missingFeatures[feature] = missing;
  }

  if (missingHard.length) {
    console.error(
      `[env] MISSING REQUIRED: ${missingHard.join(', ')} — database and authentication will not work.`
    );
  }
  for (const [feature, missing] of Object.entries(missingFeatures)) {
    console.warn(`[env] ${feature} disabled — missing: ${missing.join(', ')}`);
  }

  return { missingHard, missingFeatures };
}

/**
 * Call at the top of a feature that cannot work without its variables.
 * Throws a specific, actionable error instead of a generic 500.
 *
 * @param {string} feature Human-readable feature name, used in the message.
 * @param {string[]} names Environment variable names the feature needs.
 */
export function requireEnv(feature, names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(
      `${feature} is not configured. Missing environment variable(s): ${missing.join(', ')}. ` +
        `Add them to .env locally, or under Settings -> Environment Variables in Vercel.`
    );
  }
}

export { HARD_REQUIRED, FEATURE_VARS };
