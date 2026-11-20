/**
 * src/app/robots.js  →  served at /robots.txt
 *
 * Generated from getSiteUrl() so the Sitemap line always names the same
 * domain as the sitemap itself, the canonical tags and the link previews.
 * The old static public/robots.txt hard-coded a domain that did not match
 * the deployed site.
 */
import { getSiteUrl } from '@/lib/siteUrl';

export default function robots() {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/checkout', '/account', '/orders', '/cart'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
