/**
 * src/lib/format.js
 * Pure formatting helpers — no React dependencies.
 * Centralizes logic previously scattered in ProductCard.js
 */

export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getDiscount(original, current) {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function formatDate(dateStr, opts = {}) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}
