/**
 * Environment variables validation utility.
 * Assures all required production API keys and database credentials are present.
 * Fails fast on server startup/request processing to prevent runtime silent failures.
 */

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

// Note: Razorpay keys can be validated, but we allow fallback in dev
const PRODUCTION_ONLY_VARS = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

export function validateEnv() {
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuildTime) {
    // Skip throwing during build to allow Vercel static pre-rendering
    // without requiring secret environment keys.
    return;
  }

  const missing = [];

  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    for (const name of PRODUCTION_ONLY_VARS) {
      if (!process.env[name]) {
        missing.push(name);
      }
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      missing.push('NEXT_PUBLIC_APP_URL');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `❌ CRITICAL CONFIGURATION ERROR: The following required environment variables are missing:\n${missing.map(m => `   - ${m}`).join('\n')}\nApplication cannot start. Please configure these in your environment variables.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

// Run validation immediately on load if not build time
validateEnv();
