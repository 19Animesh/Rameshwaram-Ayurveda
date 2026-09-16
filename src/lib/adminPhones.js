/**
 * src/lib/adminPhones.js
 * Phone numbers that get admin access when they sign in with OTP.
 *
 * ──────────────────────────────────────────────────────────────────────────
 *  TO CHANGE THE ADMIN NUMBER LATER, edit DEFAULT_ADMIN_PHONES below.
 *
 *  Or set ADMIN_PHONE_NUMBERS in .env (and in Vercel → Settings →
 *  Environment Variables). When that variable exists it REPLACES this list.
 *  Separate multiple numbers with commas:
 *      ADMIN_PHONE_NUMBERS="9219188996,9876543210"
 * ──────────────────────────────────────────────────────────────────────────
 *
 * HOW IT WORKS
 * ------------
 * - Admin is granted only after Firebase has proven the person owns the
 *   number (OTP login or OTP registration). The phone stored in the database
 *   is never trusted on its own, because the profile page lets users edit it.
 * - The grant is not written to the database. Sessions issued this way carry
 *   `adminViaPhone: true`, and every request re-checks the number against this
 *   list. Remove a number and its admin access ends on the next request —
 *   no database clean-up needed.
 * - Admins created the old way (role: "admin" set in MongoDB) keep working.
 *
 * This file must stay free of Node-only imports: middleware.js (Edge runtime)
 * imports it.
 */
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';

const DEFAULT_ADMIN_PHONES = ['9219188996'];

/** The active admin list, normalised to +91XXXXXXXXXX. */
export function getAdminPhones() {
  const fromEnv = process.env.ADMIN_PHONE_NUMBERS;
  const source =
    typeof fromEnv === 'string' ? fromEnv.split(',') : DEFAULT_ADMIN_PHONES;

  return source
    .map((entry) => normalizePhone(String(entry).trim()))
    .filter(Boolean);
}

/** True when this number is on the admin list. */
export function isAdminPhone(phone) {
  if (!phone) return false;
  return getAdminPhones().some((adminPhone) => phoneNumbersMatch(adminPhone, phone));
}

/**
 * Role and claims for a session, given the stored user and the phone number
 * Firebase just verified. Only call this from routes that verified the OTP.
 */
export function resolveSessionRole(storedRole, verifiedPhone) {
  if (storedRole === 'admin') {
    return { role: 'admin', adminViaPhone: false };
  }
  if (isAdminPhone(verifiedPhone)) {
    return { role: 'admin', adminViaPhone: true };
  }
  return { role: 'user', adminViaPhone: false };
}

/**
 * Applied to every decoded session token. A token that became admin through
 * the phone list loses admin as soon as its number leaves the list.
 */
export function enforceAdminPhoneList(payload) {
  if (!payload) return payload;
  if (payload.adminViaPhone && !isAdminPhone(payload.phone)) {
    return { ...payload, role: 'user', adminViaPhone: false };
  }
  return payload;
}
