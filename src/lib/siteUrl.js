/**
 * src/lib/siteUrl.js
 * The public address of the store, for metadata, link previews and the sitemap.
 *
 * WHY THIS EXISTS
 * ---------------
 * Without NEXT_PUBLIC_APP_URL, the root layout fell back to
 * http://localhost:3000, so pages shared on WhatsApp or Facebook pointed at
 * localhost, while the sitemap fell back to a different hard-coded domain.
 *
 * Order of preference:
 *   1. NEXT_PUBLIC_APP_URL — set this to your real domain in Vercel.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's production domain, provided
 *      automatically on Vercel deployments.
 *   3. VERCEL_URL — the address of this particular deployment.
 *   4. http://localhost:3000 — local development.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.trim().replace(/\/+$/, '');

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionDomain) return `https://${productionDomain}`;

  const deploymentDomain = process.env.VERCEL_URL;
  if (deploymentDomain) return `https://${deploymentDomain}`;

  return 'http://localhost:3000';
}
