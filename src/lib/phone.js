/**
 * Normalize a phone number to E.164 format (+91XXXXXXXXXX for India).
 * Returns null if normalization is not possible.
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && trimmed.startsWith('+91')) return trimmed;
  if (trimmed.startsWith('+')) return trimmed;
  return null;
}

/**
 * Strict phone comparison: normalize both sides to E.164 and compare exactly.
 * Rejects partial/suffix matches that could allow phone number spoofing.
 */
export function phoneNumbersMatch(phone1, phone2) {
  const p1 = normalizePhone(phone1);
  const p2 = normalizePhone(phone2);
  if (!p1 || !p2) return false;
  return p1 === p2;
}
