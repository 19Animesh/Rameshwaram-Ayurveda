/**
 * src/lib/phoneAuthClient.js
 * Browser-side helpers for Firebase phone OTP, shared by login and register.
 *
 * WHY THIS EXISTS
 * ---------------
 * 1. Both pages kept the reCAPTCHA verifier on `window`. After moving from the
 *    login page to the register page, the old verifier still pointed at the
 *    login page's (now removed) element, so the register page reused a dead
 *    verifier and sending the OTP failed. Every send now builds a fresh
 *    verifier inside a fresh element.
 * 2. Raw Firebase errors ("Firebase: Error (auth/invalid-verification-code).")
 *    are translated into messages a customer can act on.
 */
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/** Destroys the current reCAPTCHA verifier, if any. Safe to call anytime. */
export function clearRecaptcha() {
  if (typeof window === 'undefined') return;
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch (_) { /* already gone */ }
    window.recaptchaVerifier = null;
  }
}

/** Formats a 10-digit Indian mobile number as +91XXXXXXXXXX, or throws. */
export function toE164(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  throw new Error('Please enter a valid 10-digit mobile number.');
}

/**
 * Sends an OTP and resolves to Firebase's ConfirmationResult.
 * @param {string} phoneE164           e.g. "+919876543210"
 * @param {string} containerId         id of an empty <div> on the page
 */
export async function sendOtp(phoneE164, containerId = 'recaptcha-container') {
  if (!auth) {
    throw new Error('Phone verification is unavailable. Check the NEXT_PUBLIC_FIREBASE_* settings.');
  }

  clearRecaptcha();

  const container = document.getElementById(containerId);
  if (!container) throw new Error('Verification could not start. Please refresh the page.');

  // A brand-new child element avoids "reCAPTCHA has already been rendered in
  // this element" when the verifier is rebuilt for a resend.
  container.innerHTML = '';
  const holder = document.createElement('div');
  container.appendChild(holder);

  window.recaptchaVerifier = new RecaptchaVerifier(auth, holder, {
    size: 'invisible',
    'expired-callback': clearRecaptcha,
  });

  try {
    return await signInWithPhoneNumber(auth, phoneE164, window.recaptchaVerifier);
  } catch (err) {
    clearRecaptcha();
    throw err;
  }
}

const FIREBASE_MESSAGES = {
  'auth/invalid-verification-code': 'That OTP is incorrect. Please check the code and try again.',
  'auth/missing-verification-code': 'Please enter the 6-digit OTP.',
  'auth/code-expired': 'This OTP has expired. Tap “Resend” to get a new one.',
  'auth/session-expired': 'This OTP has expired. Tap “Resend” to get a new one.',
  'auth/invalid-verification-id': 'This OTP session is no longer valid. Please request a new code.',
  'auth/missing-verification-id': 'This OTP session is no longer valid. Please request a new code.',
  'auth/too-many-requests': 'Too many attempts from this device. Please wait a few minutes and try again.',
  'auth/quota-exceeded': 'We cannot send more OTPs right now. Please try again later.',
  'auth/invalid-phone-number': 'Please enter a valid 10-digit mobile number.',
  'auth/missing-phone-number': 'Please enter your mobile number.',
  'auth/captcha-check-failed': 'Security check failed. Please refresh the page and try again.',
  'auth/invalid-app-credential': 'Security check failed. Please refresh the page and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/operation-not-allowed': 'Phone sign-in is turned off in Firebase (Authentication → Sign-in method → Phone).',
  'auth/unauthorized-domain': 'This website address is not authorised in Firebase (Authentication → Settings → Authorised domains).',
  'auth/billing-not-enabled': 'Real SMS needs billing enabled on the Firebase project. Test numbers still work.',
};

/** Turns any auth error (Firebase or our API) into a readable message. */
export function friendlyAuthError(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.code && FIREBASE_MESSAGES[err.code]) return FIREBASE_MESSAGES[err.code];
  if (typeof err?.code === 'string' && err.code.startsWith('auth/')) {
    return `${fallback} (${err.code})`;
  }
  return err?.message || fallback;
}

/**
 * Where to send the user after signing in. Honours ?next= (set by
 * middleware.js) and ?redirect=, accepting only same-site paths so the
 * parameter cannot bounce users to another website. Admins with no explicit
 * destination go straight to the admin panel.
 */
export function postLoginDestination(user) {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('next') || params.get('redirect');
  if (requested && requested.startsWith('/') && !/^\/[\/\\]/.test(requested)) {
    return requested;
  }
  return user?.role === 'admin' ? '/admin' : '/';
}
