/**
 * src/lib/phone.js
 * Phone number normalisation and comparison, in one place.
 *
 * WHY THIS EXISTS
 * ---------------
 * The same normalisation logic was duplicated in the register and verify-otp
 * routes, and the comparison used a loose suffix match:
 *
 *     firebaseDigits.endsWith(inputDigits) || inputDigits.endsWith(firebaseDigits)
 *
 * A short or malformed input made that far too permissive — "1234" would match
 * any number ending in 1234. Phone identity is the whole basis of OTP login,
 * so the comparison is now an exact match on the last 10 digits.
 */

/** Strips everything except digits. */
function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Converts an Indian phone number to E.164 (+91XXXXXXXXXX).
 * Returns null when the input cannot be interpreted as a valid mobile number,
 * so callers can reject it rather than storing something unusable.
 */
export function normalizePhone(input) {
  if (!input) return null;

  const raw = String(input).trim();
  const digits = digitsOnly(raw);

  // 10-digit national number. Indian mobiles start 6-9.
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  // 91XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  // 091XXXXXXXXXX or 0XXXXXXXXXX
  if (digits.length === 13 && digits.startsWith('091')) {
    return `+${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return `+91${digits.slice(1)}`;
  }
  // Already E.164 for some other country — accept but do not reshape.
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/**
 * True when two numbers refer to the same subscriber.
 * Compares the last 10 digits exactly, which handles the +91 / 0 / bare-10-digit
 * variations without the false positives a suffix search allows.
 */
export function phoneNumbersMatch(a, b) {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (da.length < 10 || db.length < 10) return false;
  return da.slice(-10) === db.slice(-10);
}

export { digitsOnly };
